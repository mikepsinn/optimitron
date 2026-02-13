# Pair Study: Education Expenditure (% GDP) -> After-Tax Median Income (PPP)

- Pair ID: `predictor.wb.education_expenditure_pct_gdp__outcome.derived.after_tax_median_income_ppp`
- Lag years: 3
- Duration years: 5
- Temporal profile source: pair_override
- Filling strategy: interpolation
- Temporal candidates evaluated: 1
- Temporal candidates with valid results: 1
- Temporal profile score: 0.6682
- Included subjects: 218
- Skipped subjects: 0
- Total aligned pairs: 7173
- Evidence grade: A
- Direction: positive
- Derived uncertainty score: 0.1357 (1 - aggregate significance, not NHST p-value)

## Actionable Takeaway

- Estimated best Education Expenditure (% GDP) level for higher After-Tax Median Income (PPP): 4.353 % GDP.
- Approximate per-capita PPP equivalent of that best level: 321.40 international $/person (using median GDP per-capita PPP in-sample).
- Highest observed mean After-Tax Median Income (PPP) appears when Education Expenditure (% GDP) is in [4.863, 5.432) (mean outcome 23684.7).
- PPP per-capita equivalent in that best observed bin (p10-p90): [176.97, 2325.3].
- Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Moderate evidence; plausible signal but still sensitive to model assumptions.
- Practical direction: increase Education Expenditure (% GDP) toward the estimated best level, then monitor After-Tax Median Income (PPP).
- Signal strength: relatively stronger within this report set.

## Plain-Language Summary

- Higher Education Expenditure (% GDP) tends to align with better After-Tax Median Income (PPP).
- The estimate uses 218 subjects and 7173 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [4.863, 5.432) (mean outcome 23684.7).
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Some subject-level directional scores exceed |1|; this is valid because the score is a difference of two correlations.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Aggregate forward Pearson | 0.2943 |
| Aggregate reverse Pearson | 0.1786 |
| Aggregate directional score (forward - reverse) | 0.1157 |
| Aggregate effect size (% baseline delta) | 47.2055 |
| Aggregate statistical significance | 0.8643 |
| Weighted average PIS | 0.5592 |
| Aggregate value predicting high outcome | 4.3529 |
| Aggregate value predicting low outcome | 4.1341 |
| Aggregate optimal daily value | 4.3529 |
| Observed predictor range | [0.0000, 44.3340] |
| Estimated best level (PPP per-capita equivalent) | 321.40 international $/person |
| Best observed PPP per-capita range (p10-p90) | [176.97, 2325.3] |
| Median GDP per-capita PPP (context) | 7383.7 international $ |
| Pairs with PPP conversion | 7173 |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | pair_override | 3 | 5 | interpolation | 0.6682 | 0.0000 | 218 | 7173 |
| Runner-up | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.00000, 2.233) | 707 | 51 | 1.6931 | 1.7017 | 5326.5868 | 2370.0000 |
| 2 | [2.233, 2.721) | 726 | 73 | 2.4704 | 2.4768 | 10483.7070 | 2900.4852 |
| 3 | [2.721, 3.241) | 719 | 100 | 2.9676 | 2.9640 | 12067.5534 | 5689.1274 |
| 4 | [3.241, 3.601) | 717 | 106 | 3.4185 | 3.4214 | 14779.4385 | 7710.0000 |
| 5 | [3.601, 3.935) | 717 | 109 | 3.7778 | 3.7851 | 15248.7649 | 8870.0000 |
| 6 | [3.935, 4.359) | 718 | 108 | 4.1145 | 4.1104 | 14927.0953 | 10890.0000 |
| 7 | [4.359, 4.863) | 717 | 106 | 4.6208 | 4.6207 | 20394.5289 | 17228.6144 |
| 8 | [4.863, 5.432) | 717 | 98 | 5.1119 | 5.0923 | 23684.7344 | 19740.0000 |
| 9 | [5.432, 6.289) | 717 | 78 | 5.7921 | 5.7537 | 17092.4415 | 10500.0000 |
| 10 | [6.289, 44.334] | 718 | 51 | 8.4431 | 7.1308 | 16528.0901 | 7175.0000 |

### Distribution Charts

```text
Predictor Distribution (Education Expenditure (% GDP))
[0.00000, 3.694) | ######################## 3052
[3.694, 7.389) | ############################## 3798
[7.389, 11.083) | ## 238
[11.083, 14.778) | # 49
[14.778, 18.472) | # 23
[18.472, 22.167) | # 2
[22.167, 25.861) | # 1
[25.861, 29.556) | # 2
[29.556, 33.250) | # 2
[33.250, 36.945) | # 3
[36.945, 40.639) | # 1
[40.639, 44.334] | # 2
```

```text
Outcome Distribution (After-Tax Median Income (PPP), welfare-aligned)
[280.00, 14356.7) | ############################## 4750
[14356.7, 28433.3) | ######## 1257
[28433.3, 42510.0) | #### 585
[42510.0, 56586.7) | ## 288
[56586.7, 70663.3) | # 144
[70663.3, 84740.0) | # 82
[84740.0, 98816.7) | # 31
[98816.7, 112893) | # 16
[112893, 126970) | # 15
[126970, 141047) | # 1
[141047, 155123) | # 1
[155123, 169200] | # 3
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| SLE | -0.7000 | -1.3592 | -33.360 | 34 |
| MAC | -0.7849 | -1.2852 | -55.734 | 34 |
| HTI | 0.9278 | 1.1861 | 34.329 | 34 |
| CUW | 0.6969 | 1.0864 | 7.447 | 19 |
| GEO | -0.5163 | -0.9904 | -72.186 | 34 |
| GHA | 0.3133 | 0.9864 | 49.746 | 34 |
| IDB | 0.7607 | 0.9685 | 33.008 | 16 |
| KAZ | -0.6526 | -0.9371 | -51.358 | 31 |
