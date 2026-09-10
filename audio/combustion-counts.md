# Combustion counts (single-cylinder 4-stroke: rpm = combustions/s x 2 x 60)

Method A = pulse peak count over whole file / duration.
Method B = autocorrelation of exhaust envelope in 1 s windows (median, min-max); robust to missed/double peaks.

| file | was | dur s | pulses | A: comb/s | A: rpm | B: comb/s | B: rpm | B rpm range |
|---|---|---|---|---|---|---|---|---|
| sample-1.m4a | Standard recording 1 | 11.2 | 148 | 13.2 | 1586 | 13.4 | 1609 | 1557-1672 |
| sample-2.m4a | Standard recording 2 | 9.5 | 126 | 13.3 | 1593 | 13.2 | 1585 | 1565-1671 |
| sample-3.m4a | Standard recording 5 | 9.8 | 144 | 14.7 | 1769 | 15.0 | 1797 | 1770-1829 |
| sample-4.m4a | after cold | 6.4 | 75 | 11.7 | 1406 | 12.1 | 1448 | 1415-1462 |
| sample-5.m4a | after hot | 6.6 | 77 | 11.6 | 1397 | 11.8 | 1420 | 1407-1440 |
| sample-6.m4a | before cold clutch | 15.9 | 212 | 13.3 | 1599 | 13.4 | 1607 | 1566-1671 |
| sample-7.m4a | before cold | 8.1 | 96 | 11.8 | 1414 | 12.0 | 1446 | 1410-1469 |
