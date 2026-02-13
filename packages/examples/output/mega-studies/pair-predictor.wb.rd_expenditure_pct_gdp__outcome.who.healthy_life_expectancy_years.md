# Pair Study: R&D Expenditure (% GDP) -> Healthy Life Expectancy (HALE)

- Pair ID: `predictor.wb.rd_expenditure_pct_gdp__outcome.who.healthy_life_expectancy_years`
- Lag years: 1
- Duration years: 3
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 16
- Temporal candidates with valid results: 16
- Temporal profile score: 0.6446
- Included subjects: 97
- Skipped subjects: 0
- Total aligned pairs: 6402
- Evidence grade: A
- Direction: negative
- Derived uncertainty score: 0.0724 (1 - aggregate significance, not NHST p-value)

## Actionable Takeaway

- Estimated best R&D Expenditure (% GDP) level for higher Healthy Life Expectancy (HALE): 0.98499 % GDP.
- Approximate per-capita PPP equivalent of that best level: 164.11 international $/person (using median GDP per-capita PPP in-sample).
- Highest observed mean Healthy Life Expectancy (HALE) appears when R&D Expenditure (% GDP) is in [2.405, 5.347] (mean outcome 69.663).
- PPP per-capita equivalent in that best observed bin (p10-p90): [851.10, 1825.7].
- Direction is negative in this analysis, so lowering this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Moderate evidence; plausible signal but still sensitive to model assumptions.
- Practical direction: decrease R&D Expenditure (% GDP) toward the estimated best level, then monitor Healthy Life Expectancy (HALE).
- Signal strength: relatively stronger within this report set.

## Plain-Language Summary

- Higher R&D Expenditure (% GDP) tends to align with worse Healthy Life Expectancy (HALE).
- The estimate uses 97 subjects and 6402 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [2.405, 5.347] (mean outcome 69.663).
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Top temporal profiles are close (score delta 0.0057); temporal assumptions are not yet robust.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Aggregate forward Pearson | 0.1353 |
| Aggregate reverse Pearson | 0.2340 |
| Aggregate directional score (forward - reverse) | -0.0987 |
| Aggregate effect size (% baseline delta) | 0.3582 |
| Aggregate statistical significance | 0.9276 |
| Weighted average PIS | 0.4202 |
| Aggregate value predicting high outcome | 0.9850 |
| Aggregate value predicting low outcome | 0.9002 |
| Aggregate optimal daily value | 0.9850 |
| Observed predictor range | [0.0126, 6.0192] |
| Estimated best level (PPP per-capita equivalent) | 164.11 international $/person |
| Best observed PPP per-capita range (p10-p90) | [851.10, 1825.7] |
| Median GDP per-capita PPP (context) | 16661.0 international $ |
| Pairs with PPP conversion | 6336 |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 1 | 3 | interpolation | 0.6446 | 0.0000 | 97 | 6402 |
| Runner-up | predictor_default | 1 | 5 | interpolation | 0.6389 | 0.0057 | 97 | 6402 |
| Runner-up | predictor_default | 2 | 2 | interpolation | 0.6343 | 0.0104 | 97 | 6402 |
| Runner-up | predictor_default | 1 | 2 | interpolation | 0.6328 | 0.0118 | 97 | 6402 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.01269, 0.09920) | 639 | 20 | 0.0566 | 0.0546 | 62.1625 | 61.9198 |
| 2 | [0.09920, 0.16340) | 642 | 24 | 0.1281 | 0.1228 | 62.2055 | 62.8881 |
| 3 | [0.16340, 0.25020) | 639 | 30 | 0.2069 | 0.2091 | 62.0133 | 63.1229 |
| 4 | [0.25020, 0.38331) | 639 | 36 | 0.3130 | 0.3114 | 62.9443 | 64.5854 |
| 5 | [0.38331, 0.53744) | 642 | 33 | 0.4560 | 0.4606 | 65.4667 | 65.9572 |
| 6 | [0.53744, 0.74098) | 639 | 33 | 0.6386 | 0.6422 | 63.7794 | 65.1819 |
| 7 | [0.74098, 1.097) | 639 | 32 | 0.9061 | 0.8992 | 64.3301 | 65.2959 |
| 8 | [1.097, 1.622) | 642 | 23 | 1.3285 | 1.2939 | 67.8414 | 68.5290 |
| 9 | [1.622, 2.405) | 639 | 19 | 2.0022 | 2.0077 | 69.4695 | 69.6215 |
| 10 | [2.405, 5.347] | 642 | 14 | 3.0987 | 2.9997 | 69.6625 | 69.8459 |

### Distribution Charts

```text
Predictor Distribution (R&D Expenditure (% GDP))
[0.01269, 0.45726) | ############################## 2862
[0.45726, 0.90182) | ############## 1302
[0.90182, 1.346) | ####### 699
[1.346, 1.791) | #### 384
[1.791, 2.236) | #### 408
[2.236, 2.680) | ### 249
[2.680, 3.125) | ## 234
[3.125, 3.569) | ## 159
[3.569, 4.014) | # 54
[4.014, 4.458) | # 33
[4.458, 4.903) | # 12
[4.903, 5.347] | # 6
```

```text
Outcome Distribution (Healthy Life Expectancy (HALE), welfare-aligned)
[41.561, 44.357) | # 9
[44.357, 47.153) | # 39
[47.153, 49.949) | # 33
[49.949, 52.745) | # 69
[52.745, 55.541) | ### 183
[55.541, 58.337) | ##### 286
[58.337, 61.133) | ########### 597
[61.133, 63.929) | #################### 1042
[63.929, 66.725) | ########################### 1418
[66.725, 69.521) | ############################## 1602
[69.521, 72.317) | #################### 1046
[72.317, 75.113] | # 78
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| HND | -0.1840 | -0.9971 | -0.216 | 66 |
| ARE | 0.0697 | -0.7940 | 0.787 | 66 |
| BGR | 0.2110 | -0.6686 | 1.557 | 66 |
| GEO | -0.0371 | -0.6444 | -0.316 | 66 |
| HRV | -0.2506 | -0.5998 | -1.388 | 66 |
| LTU | 0.3259 | -0.5978 | 3.696 | 66 |
| UGA | -0.7267 | -0.5789 | -10.964 | 66 |
| MYS | 0.3092 | -0.5613 | 0.804 | 66 |
