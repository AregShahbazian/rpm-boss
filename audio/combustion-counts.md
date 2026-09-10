# Combustion counts (single-cylinder 4-stroke: rpm = combustions/s x 2 x 60)

Method A = pulse peak count over whole file / duration.
Method B = autocorrelation of exhaust envelope in 1 s windows (median, min-max); robust to missed/double peaks.

| file | dur s | pulses | A: comb/s | A: rpm | B: comb/s | B: rpm | B rpm range |
|---|---|---|---|---|---|---|---|
| Standard recording 1.aac | 11.2 | 148 | 13.2 | 1586 | 13.4 | 1609 | 1557-1672 |
| Standard recording 2.aac | 9.5 | 126 | 13.3 | 1593 | 13.2 | 1585 | 1565-1671 |
| Standard recording 5.aac | 9.8 | 144 | 14.7 | 1769 | 15.0 | 1797 | 1770-1829 |
| after cold.aac | 6.4 | 75 | 11.7 | 1406 | 12.1 | 1448 | 1415-1462 |
| after hot.aac | 6.6 | 77 | 11.6 | 1397 | 11.8 | 1420 | 1407-1440 |
| before cold clutch.aac | 15.9 | 212 | 13.3 | 1599 | 13.4 | 1607 | 1566-1671 |
| before cold.aac | 8.1 | 96 | 11.8 | 1414 | 12.0 | 1446 | 1410-1469 |
