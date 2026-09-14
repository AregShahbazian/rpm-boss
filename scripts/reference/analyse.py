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
MIN_RATE, MAX_RATE = 5.0, 100.0  # pulses per second, on a four-stroke
# The search reaches a tenth past either end of the dial: a cycle shorter than
# the shortest lag searched cannot be found, and an engine at the top has some.
SEARCH_HEADROOM = 1.1
REVS_PER_PULSE = 2  # 4-stroke single; a two-stroke is 1
# How strong a divisor's own comb teeth must be, next to the ones it shares
# with the tallest peak, to be the period rather than a twice-a-cycle sound.
FUNDAMENTAL_MIN = 0.65
MULTIPLE_SLACK = 0.015


def rate_scale(revs_per_pulse):
    """How many times faster the combustions come than on a four-stroke at the same rpm."""
    return REVS_PER_PULSE / revs_per_pulse

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FIXTURES = os.path.join(ROOT, "test", "fixtures")


def envelope(x, smooth_hz=ENVELOPE_HZ):
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
    smooth = butter(2, smooth_hz, btype="low", fs=SR, output="sos")
    return sosfiltfilt(smooth, np.abs(sosfiltfilt(band, x)))


def windows(env, sr=SR):
    n = int(WINDOW_S * sr)
    for start in range(0, len(env) - n + 1, n):
        yield env[start : start + n]


def tooth(ac, at):
    """The correlation at `at`, or the best within one percent of it."""
    slack = max(2, round(at * 0.01))
    lo, hi = max(1, at - slack), min(len(ac) - 1, at + slack)
    return float(np.max(ac[lo : hi + 1]))


def peaks(ac, lag_min, lag_max):
    """Local maxima that are also the top within a tenth of their own lag."""
    out = []
    for lag in range(max(1, lag_min), lag_max + 1):
        if ac[lag] <= ac[lag - 1] or ac[lag] < ac[lag + 1]:
            continue
        lo, hi = max(1, int(np.floor(lag * 0.9))), min(len(ac) - 1, int(np.ceil(lag * 1.1)))
        if np.max(ac[lo : hi + 1]) > ac[lag]:
            continue
        out.append(lag)
    return out


def fundamental_ratio(ac, lag, k, lag_max):
    """The mean of lag's own comb teeth over the mean of those it shares with k*lag."""
    own, shared = [], []
    j = 1
    while j * lag <= lag_max:
        (shared if j % k == 0 else own).append(tooth(ac, j * lag))
        j += 1
    return float(np.mean(own) / np.mean(shared))


def fundamental(ac, lag_min, lag_max):
    """The period: the tallest peak, or the shortest divisor of it whose comb holds up."""
    cands = peaks(ac, lag_min, lag_max)
    if not cands:
        return None
    tallest = max(cands, key=lambda lag: ac[lag])
    for lag in cands:
        if lag >= tallest:
            break
        k = round(tallest / lag)
        if k < 2 or abs(tallest - k * lag) > MULTIPLE_SLACK * tallest:
            continue
        if fundamental_ratio(ac, lag, k, lag_max) >= FUNDAMENTAL_MIN:
            return lag
    return tallest


def rate_range(revs_per_pulse=REVS_PER_PULSE):
    scale = rate_scale(revs_per_pulse)
    return MIN_RATE / SEARCH_HEADROOM * scale, MAX_RATE * SEARCH_HEADROOM * scale


def window_rate(w, sr=SR, revs_per_pulse=REVS_PER_PULSE):
    """Rate in pulses/s and a confidence, or None if the window is silent."""
    w = w - w.mean()
    if w.std() < 1e-9:
        return None
    ac = np.correlate(w, w, "full")[len(w) - 1 :]
    ac = ac / ac[0]
    min_rate, max_rate = rate_range(revs_per_pulse)
    lag_min, lag_max = int(sr / max_rate), int(sr / min_rate)
    k = fundamental(ac, lag_min, lag_max)
    if k is None:
        return None
    trough = float(np.min(ac[1 : k + 1])) if k > 1 else 0.0
    confidence = float(ac[k]) - trough
    if 0 < k < len(ac) - 1:  # parabolic refinement
        a, b, c = ac[k - 1], ac[k], ac[k + 1]
        d = a - 2 * b + c
        if abs(d) > 1e-12:
            offset = 0.5 * (a - c) / d
            # A true peak refines by under half a sample. Anything wider means
            # these three points are not a maximum, which on degenerate audio
            # used to hand back a negative lag. Kept identical to the port.
            if abs(offset) <= 0.5:
                k = k + offset
    return sr / k, confidence


def autocorr_rate(env, revs_per_pulse=REVS_PER_PULSE):
    got = [r for r in (window_rate(w, SR, revs_per_pulse) for w in windows(env)) if r is not None]
    if not got:
        return None, 0.0
    return float(np.median([r for r, _ in got])), float(np.median([c for _, c in got]))


def peak_rate(env, rate, sr=SR):
    peaks, _ = find_peaks(
        env, distance=max(1, int(0.6 * sr / rate)), prominence=0.5 * env.std()
    )
    return len(peaks) / (len(env) / sr), peaks


def analyse(x, sr=SR, revs_per_pulse=REVS_PER_PULSE):
    """The chain, scaled to how fast this engine fires: a two-stroke is a four-stroke heard at double speed."""
    env = envelope(x.astype(np.float64), ENVELOPE_HZ * rate_scale(revs_per_pulse))
    rate, confidence = autocorr_rate(env, revs_per_pulse)
    if rate is None:
        return None
    peaks_per_s, positions = peak_rate(env, rate, sr)
    return {
        "pulsesPerS": rate,
        "confidence": confidence,
        "peakPulsesPerS": peaks_per_s,
        "rpm": rate * 60 * revs_per_pulse,
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
                        "rateRange": list(rate_range()),
                        "searchHeadroom": SEARCH_HEADROOM,
                        "fundamentalMin": FUNDAMENTAL_MIN,
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
