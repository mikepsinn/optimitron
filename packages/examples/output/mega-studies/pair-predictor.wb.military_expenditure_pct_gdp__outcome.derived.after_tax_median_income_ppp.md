# Pair Study: Military Expenditure (% GDP) -> After-Tax Median Income (PPP)

- Pair ID: `predictor.wb.military_expenditure_pct_gdp__outcome.derived.after_tax_median_income_ppp`
- Lag years: 3
- Duration years: 3
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.7120
- Included subjects: 202
- Skipped subjects: 0
- Total aligned pairs: 6641
- Evidence grade: A
- Direction: negative
- Derived uncertainty score: 0.1225 (1 - aggregate significance, not NHST p-value)

## Actionable Takeaway

- Estimated best Military Expenditure (% GDP) level for higher After-Tax Median Income (PPP): 1.921 % GDP.
- Approximate per-capita PPP equivalent of that best level: 136.86 international $/person (using median GDP per-capita PPP in-sample).
- Highest observed mean After-Tax Median Income (PPP) appears when Military Expenditure (% GDP) is in [4.221, 82.934] (mean outcome 24601.2).
- PPP per-capita equivalent in that best observed bin (p10-p90): [87.795, 5050.7].
- Direction is negative in this analysis, so lowering this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Moderate evidence; plausible signal but still sensitive to model assumptions.
- Practical direction: decrease Military Expenditure (% GDP) toward the estimated best level, then monitor After-Tax Median Income (PPP).
- Signal strength: relatively stronger within this report set.

## Plain-Language Summary

- Higher Military Expenditure (% GDP) tends to align with worse After-Tax Median Income (PPP).
- The estimate uses 202 subjects and 6641 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [4.221, 82.934] (mean outcome 24601.2).
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Some subject-level directional scores exceed |1|; this is valid because the score is a difference of two correlations.
- Top temporal profiles are close (score delta 0.0215); temporal assumptions are not yet robust.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Aggregate forward Pearson | -0.4755 |
| Aggregate reverse Pearson | -0.3205 |
| Aggregate directional score (forward - reverse) | -0.1549 |
| Aggregate effect size (% baseline delta) | 0.0000 |
| Aggregate statistical significance | 0.8775 |
| Weighted average PIS | 0.6028 |
| Aggregate value predicting high outcome | 1.9207 |
| Aggregate value predicting low outcome | 2.7583 |
| Aggregate optimal daily value | 1.9207 |
| Observed predictor range | [0.0004, 117.3498] |
| Estimated best level (PPP per-capita equivalent) | 136.86 international $/person |
| Best observed PPP per-capita range (p10-p90) | [87.795, 5050.7] |
| Median GDP per-capita PPP (context) | 7125.8 international $ |
| Pairs with PPP conversion | 6641 |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 3 | 3 | interpolation | 0.7120 | 0.0000 | 202 | 6641 |
| Runner-up | predictor_default | 3 | 2 | interpolation | 0.6906 | 0.0215 | 202 | 6641 |
| Runner-up | predictor_default | 2 | 3 | interpolation | 0.6782 | 0.0338 | 202 | 6641 |
| Runner-up | predictor_default | 3 | 1 | interpolation | 0.6605 | 0.0516 | 202 | 6641 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [3.66e-4, 0.73032) | 664 | 45 | 0.4577 | 0.4640 | 12273.8949 | 5615.0000 |
| 2 | [0.73032, 1.062) | 664 | 73 | 0.9030 | 0.9114 | 14021.4686 | 7350.0000 |
| 3 | [1.062, 1.324) | 664 | 100 | 1.1982 | 1.2042 | 15413.3886 | 7942.5645 |
| 4 | [1.324, 1.534) | 664 | 106 | 1.4236 | 1.4215 | 16211.4981 | 10505.0000 |
| 5 | [1.534, 1.780) | 655 | 116 | 1.6572 | 1.6633 | 13480.2062 | 9690.3661 |
| 6 | [1.780, 2.092) | 673 | 116 | 1.9204 | 1.9126 | 14887.0053 | 9370.0000 |
| 7 | [2.092, 2.500) | 664 | 114 | 2.2973 | 2.3102 | 12758.9642 | 8250.0000 |
| 8 | [2.500, 3.136) | 664 | 101 | 2.7827 | 2.7724 | 11871.9948 | 6955.0000 |
| 9 | [3.136, 4.221) | 664 | 82 | 3.5983 | 3.5642 | 14133.6990 | 6760.0000 |
| 10 | [4.221, 82.934] | 665 | 50 | 7.7871 | 5.9055 | 24601.1680 | 12150.4823 |

### Distribution Charts

```text
Predictor Distribution (Military Expenditure (% GDP))
[3.66e-4, 6.911) | ############################## 6408
[6.911, 13.823) | # 188
[13.823, 20.734) | # 18
[20.734, 27.645) | # 17
[27.645, 34.556) | # 3
[48.378, 55.289) | # 5
[62.200, 69.111) | # 1
[76.022, 82.934] | # 1
```

```text
Outcome Distribution (After-Tax Median Income (PPP), welfare-aligned)
[280.00, 14356.7) | ############################## 4473
[14356.7, 28433.3) | ####### 1087
[28433.3, 42510.0) | ### 512
[42510.0, 56586.7) | ## 280
[56586.7, 70663.3) | # 138
[70663.3, 84740.0) | # 77
[84740.0, 98816.7) | # 43
[98816.7, 112893) | # 16
[112893, 126970) | # 10
[126970, 141047) | # 1
[141047, 155123) | # 1
[155123, 169200] | # 3
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| TLS | 0.6754 | 1.2696 | 96.703 | 34 |
| LBY | -0.6562 | -0.9828 | -30.978 | 34 |
| BFA | -0.4513 | -0.9049 | -28.193 | 34 |
| CIV | 0.4511 | 0.8398 | 42.065 | 34 |
| FCS | -0.3496 | -0.8213 | -10.006 | 16 |
| POL | -0.5392 | -0.7956 | -49.533 | 34 |
| TEC | -0.6298 | -0.7881 | -66.698 | 34 |
| MOZ | -0.6305 | -0.7572 | -53.539 | 33 |
