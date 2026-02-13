# Pair Study: Tax Revenue (% GDP) -> After-Tax Median Income (PPP)

- Pair ID: `predictor.wb.tax_revenue_pct_gdp__outcome.derived.after_tax_median_income_ppp`
- Lag years: 3
- Duration years: 3
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.6934
- Included subjects: 182
- Skipped subjects: 0
- Total aligned pairs: 6157
- Evidence grade: A
- Direction: positive
- Derived uncertainty score: 0.1316 (1 - aggregate significance, not NHST p-value)

## Actionable Takeaway

- Estimated best Tax Revenue (% GDP) level for higher After-Tax Median Income (PPP): 2.694 % GDP.
- Approximate per-capita PPP equivalent of that best level: 212.76 international $/person (using median GDP per-capita PPP in-sample).
- Highest observed mean After-Tax Median Income (PPP) appears when Tax Revenue (% GDP) is in [2.28e-5, 0.00513) (mean outcome 21150.6).
- PPP per-capita equivalent in that best observed bin (p10-p90): [6.64e-4, 0.01500].
- Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Moderate evidence; plausible signal but still sensitive to model assumptions.
- Practical direction: increase Tax Revenue (% GDP) toward the estimated best level, then monitor After-Tax Median Income (PPP).
- Signal strength: relatively stronger within this report set.

## Plain-Language Summary

- Higher Tax Revenue (% GDP) tends to align with better After-Tax Median Income (PPP).
- The estimate uses 182 subjects and 6157 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [2.28e-5, 0.00513) (mean outcome 21150.6).
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Some subject-level directional scores exceed |1|; this is valid because the score is a difference of two correlations.
- Top temporal profiles are close (score delta 0.0198); temporal assumptions are not yet robust.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Aggregate forward Pearson | 0.2664 |
| Aggregate reverse Pearson | 0.1270 |
| Aggregate directional score (forward - reverse) | 0.1394 |
| Aggregate effect size (% baseline delta) | 50.2813 |
| Aggregate statistical significance | 0.8684 |
| Weighted average PIS | 0.5590 |
| Aggregate value predicting high outcome | 2.6942 |
| Aggregate value predicting low outcome | 2.8301 |
| Aggregate optimal daily value | 2.6942 |
| Observed predictor range | [0.0000, 73.2262] |
| Estimated best level (PPP per-capita equivalent) | 212.76 international $/person |
| Best observed PPP per-capita range (p10-p90) | [6.64e-4, 0.01500] |
| Median GDP per-capita PPP (context) | 7896.9 international $ |
| Pairs with PPP conversion | 6157 |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 3 | 3 | interpolation | 0.6934 | 0.0000 | 182 | 6157 |
| Runner-up | predictor_default | 3 | 2 | interpolation | 0.6736 | 0.0198 | 182 | 6157 |
| Runner-up | predictor_default | 2 | 3 | interpolation | 0.6671 | 0.0262 | 182 | 6157 |
| Runner-up | predictor_default | 3 | 1 | interpolation | 0.6470 | 0.0464 | 182 | 6157 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [4.82e-12, 9.74e-6) | 2463 | 82 | 0.0000 | 0.0000 | 15848.6033 | 7520.0000 |
| 2 | [9.74e-6, 1.52e-5) | 615 | 44 | 0.0000 | 0.0000 | 14166.3252 | 7250.0000 |
| 3 | [1.52e-5, 1.87e-5) | 616 | 51 | 0.0000 | 0.0000 | 12756.3312 | 9380.0000 |
| 4 | [1.87e-5, 2.28e-5) | 616 | 52 | 0.0000 | 0.0000 | 17113.4740 | 12370.0000 |
| 5 | [2.28e-5, 0.00513) | 615 | 39 | 0.0002 | 0.0000 | 21150.5854 | 13910.0000 |
| 6 | [0.00513, 11.948) | 616 | 21 | 7.9750 | 10.0252 | 7894.9368 | 4264.3637 |
| 7 | [11.948, 73.226] | 616 | 22 | 17.9508 | 17.0438 | 17334.9399 | 14372.8207 |

### Distribution Charts

```text
Predictor Distribution (Tax Revenue (% GDP))
[4.82e-12, 6.102) | ############################## 5069
[6.102, 12.204) | ### 496
[12.204, 18.307) | ## 364
[18.307, 24.409) | # 213
[42.715, 48.817) | # 1
[67.124, 73.226] | # 14
```

```text
Outcome Distribution (After-Tax Median Income (PPP), welfare-aligned)
[280.00, 10724.2) | ############################## 3449
[10724.2, 21168.3) | ########### 1238
[21168.3, 31612.5) | ##### 612
[31612.5, 42056.7) | ### 336
[42056.7, 52500.8) | ## 224
[52500.8, 62945.0) | # 120
[62945.0, 73389.2) | # 78
[73389.2, 83833.3) | # 38
[83833.3, 94277.5) | # 28
[94277.5, 104722) | # 21
[104722, 115166) | # 9
[115166, 125610] | # 4
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| TEA | 0.5656 | 1.2900 | 140.409 | 34 |
| EAP | 0.5654 | 1.2900 | 140.485 | 34 |
| CHN | 0.5557 | 1.2874 | 166.189 | 34 |
| PSS | 0.6841 | 1.2359 | 64.391 | 34 |
| IBD | 0.6318 | 1.2353 | 126.726 | 34 |
| EAS | 0.5265 | 1.2318 | 103.652 | 34 |
| IBT | 0.6572 | 1.2304 | 118.406 | 34 |
| LAO | 0.4255 | 1.1291 | 125.015 | 34 |
