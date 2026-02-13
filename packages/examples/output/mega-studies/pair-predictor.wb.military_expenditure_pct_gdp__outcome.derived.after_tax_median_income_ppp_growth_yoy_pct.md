# Pair Study: Military Expenditure (% GDP) -> After-Tax Median Income Growth (YoY %)

- Pair ID: `predictor.wb.military_expenditure_pct_gdp__outcome.derived.after_tax_median_income_ppp_growth_yoy_pct`
- Lag years: 0
- Duration years: 3
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.5482
- Included subjects: 202
- Skipped subjects: 0
- Total aligned pairs: 6439
- Evidence grade: C
- Direction: positive
- Derived uncertainty score: 0.3100 (1 - aggregate significance, not NHST p-value)

## Actionable Takeaway

- Estimated best Military Expenditure (% GDP) level for higher After-Tax Median Income Growth (YoY %): 2.105 % GDP.
- Approximate per-capita PPP equivalent of that best level: 174.70 international $/person (using median GDP per-capita PPP in-sample).
- Highest observed mean After-Tax Median Income Growth (YoY %) appears when Military Expenditure (% GDP) is in [1.479, 1.704) (mean outcome 5.770).
- PPP per-capita equivalent in that best observed bin (p10-p90): [27.612, 491.77].
- Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Exploratory evidence only; use primarily for hypothesis generation.
- Practical direction: increase Military Expenditure (% GDP) toward the estimated best level, then monitor After-Tax Median Income Growth (YoY %).
- Signal strength: moderate-to-weak; avoid hard policy conclusions from this pair alone.

## Plain-Language Summary

- Higher Military Expenditure (% GDP) tends to align with better After-Tax Median Income Growth (YoY %).
- The estimate uses 202 subjects and 6439 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [1.479, 1.704) (mean outcome 5.770).
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Weak aggregate significance (<0.70).
- Some subject-level directional scores exceed |1|; this is valid because the score is a difference of two correlations.
- Top temporal profiles are close (score delta 0.0011); temporal assumptions are not yet robust.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Aggregate forward Pearson | -0.0980 |
| Aggregate reverse Pearson | -0.1548 |
| Aggregate directional score (forward - reverse) | 0.0567 |
| Aggregate effect size (% baseline delta) | 0.0000 |
| Aggregate statistical significance | 0.6900 |
| Weighted average PIS | 0.2003 |
| Aggregate value predicting high outcome | 2.1046 |
| Aggregate value predicting low outcome | 2.2512 |
| Aggregate optimal daily value | 2.1046 |
| Observed predictor range | [0.0004, 117.3498] |
| Estimated best level (PPP per-capita equivalent) | 174.70 international $/person |
| Best observed PPP per-capita range (p10-p90) | [27.612, 491.77] |
| Median GDP per-capita PPP (context) | 8300.6 international $ |
| Pairs with PPP conversion | 6439 |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 0 | 3 | interpolation | 0.5482 | 0.0000 | 202 | 6439 |
| Runner-up | predictor_default | 0 | 2 | interpolation | 0.5471 | 0.0011 | 202 | 6439 |
| Runner-up | predictor_default | 1 | 3 | interpolation | 0.5400 | 0.0082 | 202 | 6439 |
| Runner-up | predictor_default | 1 | 2 | interpolation | 0.5376 | 0.0106 | 202 | 6439 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [3.66e-4, 0.71297) | 644 | 42 | 0.4602 | 0.4753 | 4.3762 | 4.6367 |
| 2 | [0.71297, 1.034) | 644 | 76 | 0.8895 | 0.9032 | 4.7357 | 4.5726 |
| 3 | [1.034, 1.282) | 644 | 98 | 1.1658 | 1.1702 | 4.6676 | 4.4165 |
| 4 | [1.282, 1.479) | 644 | 103 | 1.3819 | 1.3771 | 4.5924 | 4.6148 |
| 5 | [1.479, 1.704) | 643 | 117 | 1.5942 | 1.5950 | 5.7698 | 5.0428 |
| 6 | [1.704, 1.959) | 644 | 113 | 1.8282 | 1.8287 | 5.4037 | 5.1008 |
| 7 | [1.959, 2.364) | 644 | 119 | 2.1568 | 2.1571 | 5.1285 | 5.0413 |
| 8 | [2.364, 2.921) | 644 | 105 | 2.6187 | 2.6215 | 4.9797 | 4.8242 |
| 9 | [2.921, 3.986) | 644 | 86 | 3.3833 | 3.3350 | 4.2340 | 4.0393 |
| 10 | [3.986, 82.934] | 644 | 55 | 7.0238 | 5.4967 | 2.5681 | 3.0862 |

### Distribution Charts

```text
Predictor Distribution (Military Expenditure (% GDP))
[3.66e-4, 6.911) | ############################## 6262
[6.911, 13.823) | # 145
[13.823, 20.734) | # 9
[20.734, 27.645) | # 18
[27.645, 34.556) | # 2
[48.378, 55.289) | # 1
[62.200, 69.111) | # 1
[76.022, 82.934] | # 1
```

```text
Outcome Distribution (After-Tax Median Income Growth (YoY %), welfare-aligned)
[-62.405, -43.867) | # 5
[-43.867, -25.329) | # 26
[-25.329, -6.791) | # 210
[-6.791, 11.747) | ############################## 5678
[11.747, 30.285) | ### 488
[30.285, 48.823) | # 17
[48.823, 67.360) | # 9
[67.360, 85.898) | # 4
[141.51, 160.05] | # 2
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| LBR | 0.1183 | 1.0008 | -120.935 | 33 |
| BIH | 0.2938 | 0.6837 | 86.807 | 33 |
| SOM | -0.0120 | 0.6515 | 58.804 | 32 |
| KWT | 0.1770 | 0.6178 | 1556.855 | 33 |
| QAT | 0.0683 | 0.5958 | 1208.814 | 33 |
| GHA | -0.2215 | -0.5735 | -20.355 | 33 |
| NZL | -0.1642 | 0.4852 | -10.641 | 33 |
| TLS | 0.2072 | -0.4851 | 208.100 | 33 |
