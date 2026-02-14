# Pair Study: Military Share of Government Spending -> Healthy Life Expectancy Growth (YoY %)

- Pair ID: `predictor.derived.military_share_of_gov_expenditure_pct__outcome.derived.healthy_life_expectancy_growth_yoy_pct`
- Lag years: 3
- Duration years: 1
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.3396
- Included subjects: 126
- Skipped subjects: 0
- Total aligned pairs: 2646
- Evidence grade: F
- Data sufficiency: sufficient
- Reliability score: 0.474 (low)
- Quality tier: insufficient
- Direction: positive
- Derived uncertainty score: 0.8070 (1 - aggregate significance, not NHST p-value)

## Key Numeric Takeaways

- Estimated best Military Share of Government Spending level for higher Healthy Life Expectancy Growth (YoY %): 9.048 % of government expenditure.
- Observed-support target from binned response curve: 9.950 % of government expenditure.
- Model-derived optimum is within observed support but outside the highest-outcome bin; this reflects smooth objective optimization vs coarse bin averages.
- Best observed bin anchor (median/mean) is 20.806 % of government expenditure; model-optimal minus observed-anchor difference is -11.758 (-56.5%).
- Robust sensitivity (trimmed 10-90% predictor range) suggests 9.883 % of government expenditure.
- Minimum effective level not reliably identified (no_consistent_effective_dose_detected).
- Diminishing returns likely begin near 9.950 % of government expenditure.
- No stable plateau zone detected (no_plateau_zone_detected).
- Highest observed mean Healthy Life Expectancy Growth (YoY %) appears when Military Share of Government Spending is in [16.650, 88.206] (mean outcome 0.63575).
- Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Exploratory evidence only; use primarily for hypothesis generation.
- Directional hint: higher Military Share of Government Spending is associated with better Healthy Life Expectancy Growth (YoY %).
- Signal strength: moderate-to-weak; avoid hard policy conclusions from this pair alone.

## Plain-Language Summary

- Higher Military Share of Government Spending tends to align with better Healthy Life Expectancy Growth (YoY %).
- The estimate uses 126 subjects and 2646 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [16.650, 88.206] (mean outcome 0.63575).
- Reliability score is 0.474 (low); data sufficiency is sufficient.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Weak aggregate significance (<0.70).
- Some subject-level directional scores exceed |1|; this is valid because the score is a difference of two correlations.
- Top temporal profiles are close (score delta 0.0082); temporal assumptions are not yet robust.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Aggregate forward Pearson | 0.0889 |
| Aggregate reverse Pearson | 0.0329 |
| Aggregate directional score (forward - reverse) | 0.0560 |
| Aggregate effect size (% baseline delta) | -552.9297 |
| Aggregate statistical significance | 0.1930 |
| Weighted average PIS | 0.0716 |
| Aggregate value predicting high outcome | 9.0483 |
| Aggregate value predicting low outcome | 8.7013 |
| Aggregate optimal daily value | 9.0483 |
| Support-constrained optimal value | 9.950 % of government expenditure |
| Support-constrained optimal range | [9.169, 11.285) |
| Response-curve robust optimal value | 10.572 % of government expenditure |
| Raw model optimal within observed range | yes |
| Raw model optimal within support-constrained range | no |
| Observed predictor range | [0.4821, 100.9768] |
| Model-derived optimal extrapolative? | no (within observed range) |
| Model-derived optimal outside best observed bin? | yes |
| Raw best observed range | [16.650, 88.206] |
| Robust best observed range (trimmed) | [9.079, 10.774) |
| Raw best observed outcome mean | 0.63575 |
| Robust best observed outcome mean | 0.78124 |
| Robust optimal value (bin median) | 9.883 % of government expenditure |
| Raw vs robust optimal delta | 0.83424 (+9.2%) |
| Robustness retained fraction | 80.0% (2116/2646) |
| Data sufficiency status | sufficient |
| Data sufficiency reasons | none |
| Reliability score | 0.4737 (low) |
| Reliability support component | 0.6405 |
| Reliability significance component | 0.1930 |
| Reliability directional component | 0.3731 |
| Reliability temporal-stability component | 0.2717 |
| Reliability robustness component | 1.0000 |
| Quality tier | insufficient |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum effective level (MED) | Not identified (no_consistent_effective_dose_detected) |
| Diminishing-returns knee | 9.950 % of government expenditure (ratio=-0.783) |
| Saturation / plateau range | Not identified (no_plateau_zone_detected) |
| Support-constrained target reason | identified |
| Raw to support delta | -0.90161 (-9.1%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 3 | 1 | interpolation | 0.3396 | 0.0000 | 126 | 2646 |
| Runner-up | predictor_default | 2 | 2 | interpolation | 0.3315 | 0.0082 | 126 | 2646 |
| Runner-up | predictor_default | 2 | 3 | interpolation | 0.3169 | 0.0228 | 126 | 2646 |
| Runner-up | predictor_default | 3 | 2 | interpolation | 0.3111 | 0.0285 | 126 | 2646 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.65224, 2.597) | 265 | 22 | 1.7667 | 1.8505 | 0.2848 | 0.2701 |
| 2 | [2.597, 3.656) | 264 | 41 | 3.2136 | 3.2319 | -0.1400 | 0.1208 |
| 3 | [3.656, 4.372) | 265 | 50 | 4.0318 | 4.0587 | 0.2451 | 0.2231 |
| 4 | [4.372, 5.221) | 264 | 50 | 4.7352 | 4.7344 | -0.0091 | 0.2623 |
| 5 | [5.221, 6.317) | 265 | 56 | 5.7622 | 5.7392 | -0.1795 | 0.2086 |
| 6 | [6.317, 7.610) | 264 | 52 | 6.8978 | 6.8270 | 0.1832 | 0.2409 |
| 7 | [7.610, 9.891) | 265 | 47 | 8.7699 | 8.7483 | 0.4807 | 0.4017 |
| 8 | [9.891, 12.985) | 258 | 45 | 11.2438 | 11.1943 | 0.4137 | 0.7033 |
| 9 | [12.985, 16.650) | 271 | 37 | 14.7278 | 14.8348 | 0.3786 | 0.2914 |
| 10 | [16.650, 88.206] | 265 | 28 | 26.2985 | 20.8058 | 0.6357 | 0.4686 |

### Distribution Charts

```text
Predictor Distribution (Military Share of Government Spending)
[0.65224, 7.948) | ############################## 1619
[7.948, 15.245) | ############ 657
[15.245, 22.541) | ##### 260
[22.541, 29.837) | # 37
[29.837, 37.133) | # 37
[37.133, 44.429) | # 16
[44.429, 51.725) | # 6
[51.725, 59.022) | # 5
[59.022, 66.318) | # 1
[66.318, 73.614) | # 6
[80.910, 88.206] | # 2
```

```text
Outcome Distribution (Healthy Life Expectancy Growth (YoY %), welfare-aligned)
[-18.191, -14.967) | # 3
[-14.967, -11.743) | # 7
[-11.743, -8.519) | # 20
[-8.519, -5.296) | ## 95
[-5.296, -2.072) | ####### 325
[-2.072, 1.152) | ############################## 1384
[1.152, 4.376) | ############## 625
[4.376, 7.600) | ### 134
[7.600, 10.824) | # 39
[10.824, 14.048) | # 8
[14.048, 17.272) | # 5
[17.272, 20.496] | # 1
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| NPL | 0.7899 | 1.0888 | -322.330 | 21 |
| UGA | -0.4771 | -0.9570 | -172.041 | 21 |
| RUS | 0.5098 | 0.9089 | -101.595 | 21 |
| EGY | 0.1792 | 0.8740 | -124.355 | 21 |
| COD | 0.3273 | 0.8350 | 43.860 | 21 |
| KGZ | -0.0722 | 0.7364 | -86.587 | 21 |
| CHL | -0.0145 | 0.7327 | 504.208 | 21 |
| TUR | 0.1358 | -0.7286 | -116.179 | 21 |
