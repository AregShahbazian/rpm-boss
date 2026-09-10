"""Window-length sweep behind the MIN_CLIP_S decision in the phase 4 design.

Truncates every fixture to each candidate window length, at every start offset
in 0.5 s steps, and reports the worst rpm error over all positions.

    python3 scripts/reference/sweep.py
"""

import json
import os

import numpy as np
from scipy.io import wavfile

from analyse import FIXTURES, REVS_PER_PULSE, SR, autocorr_rate, envelope

LENGTHS_S = [1.0, 1.5, 2.0, 3.0, 5.0]


def main():
    expected = json.load(open(os.path.join(FIXTURES, "expected.json")))
    header = " ".join(f"{length:>7.1f}s" for length in LENGTHS_S)
    print(f"{'file':26} {'exp':>5} {'tol':>4} {header}")

    worst = {length: 0.0 for length in LENGTHS_S}
    failing = {length: 0 for length in LENGTHS_S}

    for f in expected["fixtures"]:
        _, data = wavfile.read(os.path.join(FIXTURES, f["file"]))
        x = data.astype(np.float64) / 32768
        cells = []
        for length in LENGTHS_S:
            n = int(length * SR)
            if len(x) < n:
                cells.append("   --  ")
                continue
            errors = []
            for offset in range(0, len(x) - n + 1, SR // 2):
                rate, _ = autocorr_rate(envelope(x[offset : offset + n]))
                rpm = rate * 60 * REVS_PER_PULSE if rate else 0
                errors.append(abs(rpm - f["expectedRpm"]))
            error = max(errors)
            worst[length] = max(worst[length], error)
            over = error > f["toleranceRpm"]
            failing[length] += 1 if over else 0
            cells.append(f"{error:6.0f}{'!' if over else ' '}")
        print(f"{f['file']:26} {f['expectedRpm']:5d} {f['toleranceRpm']:4d} " + " ".join(cells))

    print("\nworst rpm error over every window position:")
    for length in LENGTHS_S:
        print(f"  {length:>4.1f} s   worst {worst[length]:6.0f} rpm   failing: {failing[length]}/7")


if __name__ == "__main__":
    main()
