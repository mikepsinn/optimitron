# Pair Study: Education Share of Government Spending -> Healthy Life Expectancy Growth (YoY %)

- Pair ID: `predictor.derived.education_share_of_gov_expenditure_pct__outcome.derived.healthy_life_expectancy_growth_yoy_pct`
- Lag years: 2
- Duration years: 2
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 15
- Temporal candidates with valid results: 15
- Temporal profile score: 0.3504
- Included subjects: 134
- Skipped subjects: 0
- Total aligned pairs: 2814
- Evidence grade: F
- Data sufficiency: sufficient
- Reliability score: 0.508 (low)
- Quality tier: insufficient
- Direction: positive
- Derived uncertainty score: 0.8064 (1 - aggregate significance, not NHST p-value)

## Key Numeric Takeaways

- Decision-target Education Share of Government Spending level for higher Healthy Life Expectancy Growth (YoY %): 33.378 % of government expenditure (support constrained).
- Observed-support target from binned response curve: 33.378 % of government expenditure.
- Model-derived optimum is within observed support but outside the highest-outcome bin; this reflects smooth objective optimization vs coarse bin averages.
- Best observed bin anchor (median/mean) is 32.305 % of government expenditure; model-optimal minus observed-anchor difference is -12.865 (-39.8%).
- Robust sensitivity (trimmed 10-90% predictor range) suggests 20.911 % of government expenditure.
- Minimum effective level (first consistently positive zone): 19.592 % of government expenditure.
- Diminishing returns likely begin near 21.063 % of government expenditure.
- No stable plateau zone detected (no_plateau_zone_detected).
- Highest observed mean Healthy Life Expectancy Growth (YoY %) appears when Education Share of Government Spending is in [28.681, 66.668] (mean outcome 0.72663).
- Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Exploratory evidence only; use primarily for hypothesis generation.
- Directional hint: higher Education Share of Government Spending is associated with better Healthy Life Expectancy Growth (YoY %).
- Signal strength: moderate-to-weak; avoid hard policy conclusions from this pair alone.

## Plain-Language Summary

- Higher Education Share of Government Spending tends to align with better Healthy Life Expectancy Growth (YoY %).
- The estimate uses 134 subjects and 2814 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [28.681, 66.668] (mean outcome 0.72663).
- A minimum effective predictor level appears near 19.592 % of government expenditure in the binned response curve.
- Reliability score is 0.508 (low); data sufficiency is sufficient.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Weak aggregate significance (<0.70).
- Some subject-level directional scores exceed |1|; this is valid because the score is a difference of two correlations.
- Top temporal profiles are close (score delta 0.0112); temporal assumptions are not yet robust.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Aggregate forward Pearson | 0.0570 |
| Aggregate reverse Pearson | -0.0053 |
| Aggregate directional score (forward - reverse) | 0.0623 |
| Aggregate effect size (% baseline delta) | -509.3767 |
| Aggregate statistical significance | 0.1936 |
| Weighted average PIS | 0.0687 |
| Aggregate value predicting high outcome | 19.4401 |
| Aggregate value predicting low outcome | 19.2136 |
| Aggregate optimal daily value | 19.4401 |
| Decision target value (reader-facing) | 33.378 % of government expenditure (support constrained) |
| Model-derived optimum (diagnostics) | 19.440 % of government expenditure |
| Support-constrained optimal value | 33.378 % of government expenditure |
| Support-constrained optimal range | [29.476, 66.668] |
| Response-curve robust optimal value | 20.449 % of government expenditure |
| Raw model optimal within observed range | yes |
| Raw model optimal within support-constrained range | no |
| Observed predictor range | [0.0000, 70.8565] |
| Model-derived optimal extrapolative? | no (within observed range) |
| Model-derived optimal outside best observed bin? | yes |
| Raw best observed range | [28.681, 66.668] |
| Robust best observed range (trimmed) | [20.190, 21.607) |
| Raw best observed outcome mean | 0.72663 |
| Robust best observed outcome mean | 0.76818 |
| Robust optimal value (bin median) | 20.911 % of government expenditure |
| Raw vs robust optimal delta | 1.471 (+7.6%) |
| Robustness retained fraction | 80.1% (2255/2814) |
| Data sufficiency status | sufficient |
| Data sufficiency reasons | none |
| Reliability score | 0.5077 (low) |
| Reliability support component | 0.6812 |
| Reliability significance component | 0.1936 |
| Reliability directional component | 0.4151 |
| Reliability temporal-stability component | 0.3733 |
| Reliability robustness component | 1.0000 |
| Quality tier | insufficient |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum effective level (MED) | 19.592 % of government expenditure (z=1.44) |
| Diminishing-returns knee | 21.063 % of government expenditure (ratio=-1.124) |
| Saturation / plateau range | Not identified (no_plateau_zone_detected) |
| Support-constrained target reason | identified |
| Raw to support delta | -13.938 (-41.8%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 2 | 2 | interpolation | 0.3504 | 0.0000 | 134 | 2814 |
| Runner-up | predictor_default | 2 | 5 | interpolation | 0.3392 | 0.0112 | 134 | 2814 |
| Runner-up | predictor_default | 1 | 3 | interpolation | 0.3319 | 0.0185 | 134 | 2814 |
| Runner-up | predictor_default | 5 | 3 | interpolation | 0.3218 | 0.0286 | 134 | 2814 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.00000, 10.881) | 277 | 30 | 9.0026 | 9.3475 | -0.0661 | 0.2304 |
| 2 | [10.881, 12.907) | 286 | 43 | 11.8884 | 11.9506 | 0.4449 | 0.3423 |
| 3 | [12.907, 14.703) | 272 | 49 | 13.8691 | 13.8994 | -0.3293 | 0.1486 |
| 4 | [14.703, 16.978) | 291 | 54 | 15.8587 | 15.9267 | -0.1493 | 0.1070 |
| 5 | [16.978, 19.007) | 281 | 64 | 17.9213 | 17.8043 | -0.0426 | 0.1838 |
| 6 | [19.007, 20.477) | 281 | 58 | 19.7767 | 19.8273 | 0.6146 | 0.2562 |
| 7 | [20.477, 22.673) | 282 | 63 | 21.4998 | 21.5492 | 0.2393 | 0.3195 |
| 8 | [22.673, 24.744) | 281 | 54 | 23.6594 | 23.6993 | 0.3374 | 0.2407 |
| 9 | [24.744, 28.681) | 281 | 49 | 26.6046 | 26.6326 | 0.2862 | 0.3477 |
| 10 | [28.681, 66.668] | 282 | 35 | 35.7853 | 32.3046 | 0.7266 | 0.7571 |

### Distribution Charts

```text
Predictor Distribution (Education Share of Government Spending)
[0.00000, 5.556) | # 6
[5.556, 11.111) | ########### 313
[11.111, 16.667) | ########################## 755
[16.667, 22.223) | ############################## 857
[22.223, 27.778) | ################### 547
[27.778, 33.334) | ######## 217
[33.334, 38.890) | ### 79
[38.890, 44.446) | # 7
[44.446, 50.001) | # 7
[50.001, 55.557) | # 3
[55.557, 61.113) | # 5
[61.113, 66.668] | # 18
```

```text
Outcome Distribution (Healthy Life Expectancy Growth (YoY %), welfare-aligned)
[-18.191, -14.967) | # 3
[-14.967, -11.743) | # 7
[-11.743, -8.519) | # 19
[-8.519, -5.296) | ## 108
[-5.296, -2.072) | ####### 361
[-2.072, 1.152) | ############################## 1459
[1.152, 4.376) | ############# 651
[4.376, 7.600) | ### 150
[7.600, 10.824) | # 43
[10.824, 14.048) | # 8
[14.048, 17.272) | # 4
[17.272, 20.496] | # 1
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| COD | -0.5549 | -1.1124 | -73.931 | 21 |
| ROU | 0.4322 | 0.7607 | -184.985 | 21 |
| PNG | -0.3721 | -0.7603 | -313.567 | 21 |
| LAO | -0.5250 | -0.7335 | -126.279 | 21 |
| NPL | 0.1990 | 0.7214 | 2.305 | 21 |
| BDI | 0.3017 | 0.6941 | 158.824 | 21 |
| AUS | -0.0944 | 0.6919 | 147.408 | 21 |
| PHL | -0.1465 | -0.6829 | 64.948 | 21 |
