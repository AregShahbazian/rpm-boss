"""The scipy baseline the TypeScript DSP is ported from.

Reproduces audio/combustion-counts.md from test/fixtures/*.wav. Run it to
regenerate test/fixtures/reference.json, which the TS test suite is checked
against:

    python3 scripts/reference/analyse.py --write

Requires numpy and scipy; not part of the app or the npm test run.
"""

import argparse
import json
import os

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, find_peaks, sosfiltfilt

SR = 16000
BAND_LOW_HZ, BAND_HIGH_HZ = 60, 2000
ENVELOPE_HZ = 150
WINDOW_S = 1.0
MIN_RATE, MAX_RATE = 8.0, 100.0  # pulses per second
REVS_PER_PULSE = 2  # 4-stroke single

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FIXTURES = os.path.join(ROOT, "test", "fixtures")


def envelope(x):
    """Bandpass, rectify, smooth — the same three sections the app applies.

    The band is a 2nd-order highpass cascaded with a 2nd-order lowpass rather
    than `butter(2, [low, high], btype="band")`. The two agree to 0.06 rpm
    across the fixtures (the band spans a factor of 33, so the skirts never
    interact), and the cascade is what src/dsp/envelope.ts ships. They are kept
    identical on purpose: this file is the baseline the TypeScript is graded
    against, so it has to grade the chain that actually runs, not a near
    neighbour of it.
    """
    band = np.vstack(
        [
            butter(2, BAND_LOW_HZ, btype="high", fs=SR, output="sos"),
            butter(2, BAND_HIGH_HZ, btype="low", fs=SR, output="sos"),
        ]
    )
    smooth = butter(2, ENVELOPE_HZ, btype="low", fs=SR, output="sos")
    return sosfiltfilt(smooth, np.abs(sosfiltfilt(band, x)))


def windows(env, sr=SR):
    n = int(WINDOW_S * sr)
    for start in range(0, len(env) - n + 1, n):
        yield env[start : start + n]


def window_rate(w, sr=SR):
    """Rate in pulses/s and a confidence, or None if the window is silent."""
    w = w - w.mean()
    if w.std() < 1e-9:
        return None
    ac = np.correlate(w, w, "full")[len(w) - 1 :]
    ac = ac / ac[0]
    lag_min, lag_max = int(sr / MAX_RATE), int(sr / MIN_RATE)
    k = int(np.argmax(ac[lag_min : lag_max + 1])) + lag_min
    trough = float(np.min(ac[1 : k + 1])) if k > 1 else 0.0
    confidence = float(ac[k]) - trough
    if 0 < k < len(ac) - 1:  # parabolic refinement
        a, b, c = ac[k - 1], ac[k], ac[k + 1]
        d = a - 2 * b + c
        if abs(d) > 1e-12:
            k = k + 0.5 * (a - c) / d
    return sr / k, confidence


def autocorr_rate(env):
    got = [r for r in (window_rate(w) for w in windows(env)) if r is not None]
    if not got:
        return None, 0.0
    return float(np.median([r for r, _ in got])), float(np.median([c for _, c in got]))


def peak_rate(env, rate, sr=SR):
    peaks, _ = find_peaks(
        env, distance=max(1, int(0.6 * sr / rate)), prominence=0.5 * env.std()
    )
    return len(peaks) / (len(env) / sr), peaks


def analyse(x, sr=SR):
    env = envelope(x.astype(np.float64))
    rate, confidence = autocorr_rate(env)
    if rate is None:
        return None
    peaks_per_s, positions = peak_rate(env, rate, sr)
    return {
        "pulsesPerS": rate,
        "confidence": confidence,
        "peakPulsesPerS": peaks_per_s,
        "rpm": rate * 60 * REVS_PER_PULSE,
        "peakCount": len(positions),
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true", help="rewrite reference.json")
    args = ap.parse_args()

    expected = json.load(open(os.path.join(FIXTURES, "expected.json")))
    out = {}
    print(f"{'file':26} {'B c/s':>7} {'B rpm':>6} {'A c/s':>7} {'conf':>5} {'exp':>5} {'ok':>5}")
    for f in expected["fixtures"]:
        _, data = wavfile.read(os.path.join(FIXTURES, f["file"]))
        got = analyse(data.astype(np.float64) / 32768)
        ok = abs(got["rpm"] - f["expectedRpm"]) <= f["toleranceRpm"]
        out[f["file"]] = {
            "pulsesPerS": round(got["pulsesPerS"], 4),
            "peakPulsesPerS": round(got["peakPulsesPerS"], 4),
            "confidence": round(got["confidence"], 4),
        }
        print(
            f"{f['file']:26} {got['pulsesPerS']:7.3f} {got['rpm']:6.0f} "
            f"{got['peakPulsesPerS']:7.3f} {got['confidence']:5.2f} "
            f"{f['expectedRpm']:5d} {str(ok):>5}"
        )

    if args.write:
        path = os.path.join(FIXTURES, "reference.json")
        with open(path, "w") as fh:
            json.dump(
                {
                    "_note": "Produced by scripts/reference/analyse.py. The scipy "
                    "baseline the TypeScript port is checked against.",
                    "params": {
                        "sampleRate": SR,
                        "bandHz": [BAND_LOW_HZ, BAND_HIGH_HZ],
                        "envelopeHz": ENVELOPE_HZ,
                        "windowS": WINDOW_S,
                        "rateRange": [MIN_RATE, MAX_RATE],
                    },
                    "fixtures": out,
                },
                fh,
                indent=2,
            )
            fh.write("\n")
        print(f"\nwrote {path}")


if __name__ == "__main__":
    main()
