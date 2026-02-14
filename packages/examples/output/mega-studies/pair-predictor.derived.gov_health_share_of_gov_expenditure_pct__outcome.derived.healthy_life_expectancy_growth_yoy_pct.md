# Pair Study: Government Health Share of Government Spending -> Healthy Life Expectancy Growth (YoY %)

- Pair ID: `predictor.derived.gov_health_share_of_gov_expenditure_pct__outcome.derived.healthy_life_expectancy_growth_yoy_pct`
- Lag years: 3
- Duration years: 5
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 15
- Temporal candidates with valid results: 15
- Temporal profile score: 0.4258
- Included subjects: 141
- Skipped subjects: 0
- Total aligned pairs: 2961
- Evidence grade: F
- Data sufficiency: sufficient
- Reliability score: 0.663 (moderate)
- Quality tier: insufficient
- Direction: negative
- Derived uncertainty score: 0.7727 (1 - aggregate significance, not NHST p-value)

## Key Numeric Takeaways

- Estimated best Government Health Share of Government Spending level for higher Healthy Life Expectancy Growth (YoY %): 13.024 % of government expenditure.
- Observed-support target from binned response curve: 15.035 % of government expenditure.
- Model-derived optimum is within observed support but outside the highest-outcome bin; this reflects smooth objective optimization vs coarse bin averages.
- Best observed bin anchor (median/mean) is 4.793 % of government expenditure; model-optimal minus observed-anchor difference is 8.231 (+171.7%).
- Robust sensitivity (trimmed 10-90% predictor range) suggests 14.852 % of government expenditure.
- Minimum effective level not reliably identified (no_consistent_effective_dose_detected).
- Diminishing returns likely begin near 15.035 % of government expenditure.
- No stable plateau zone detected (no_plateau_zone_detected).
- Highest observed mean Healthy Life Expectancy Growth (YoY %) appears when Government Health Share of Government Spending is in [0.93053, 5.930) (mean outcome 0.57112).
- Direction is negative in this analysis, so lowering this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Exploratory evidence only; use primarily for hypothesis generation.
- Directional hint: lower Government Health Share of Government Spending is associated with better Healthy Life Expectancy Growth (YoY %).
- Signal strength: moderate-to-weak; avoid hard policy conclusions from this pair alone.

## Plain-Language Summary

- Higher Government Health Share of Government Spending tends to align with worse Healthy Life Expectancy Growth (YoY %).
- The estimate uses 141 subjects and 2961 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [0.93053, 5.930) (mean outcome 0.57112).
- Reliability score is 0.663 (moderate); data sufficiency is sufficient.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Weak aggregate significance (<0.70).
- Some subject-level directional scores exceed |1|; this is valid because the score is a difference of two correlations.
- Top temporal profiles are close (score delta 0.0241); temporal assumptions are not yet robust.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Aggregate forward Pearson | -0.0971 |
| Aggregate reverse Pearson | 0.0251 |
| Aggregate directional score (forward - reverse) | -0.1222 |
| Aggregate effect size (% baseline delta) | 22.7521 |
| Aggregate statistical significance | 0.2273 |
| Weighted average PIS | 0.0975 |
| Aggregate value predicting high outcome | 13.0235 |
| Aggregate value predicting low outcome | 13.1650 |
| Aggregate optimal daily value | 13.0235 |
| Support-constrained optimal value | 15.035 % of government expenditure |
| Support-constrained optimal range | [14.399, 15.673) |
| Response-curve robust optimal value | 12.659 % of government expenditure |
| Raw model optimal within observed range | yes |
| Raw model optimal within support-constrained range | no |
| Observed predictor range | [0.8069, 88.0822] |
| Model-derived optimal extrapolative? | no (within observed range) |
| Model-derived optimal outside best observed bin? | yes |
| Raw best observed range | [0.93053, 5.930) |
| Robust best observed range (trimmed) | [14.275, 15.542) |
| Raw best observed outcome mean | 0.57112 |
| Robust best observed outcome mean | 0.53983 |
| Robust optimal value (bin median) | 14.852 % of government expenditure |
| Raw vs robust optimal delta | 1.828 (+14.0%) |
| Robustness retained fraction | 80.0% (2369/2961) |
| Data sufficiency status | sufficient |
| Data sufficiency reasons | none |
| Reliability score | 0.6627 (moderate) |
| Reliability support component | 0.7167 |
| Reliability significance component | 0.2273 |
| Reliability directional component | 0.8148 |
| Reliability temporal-stability component | 0.8028 |
| Reliability robustness component | 0.9551 |
| Quality tier | insufficient |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum effective level (MED) | Not identified (no_consistent_effective_dose_detected) |
| Diminishing-returns knee | 15.035 % of government expenditure (ratio=-5.978) |
| Saturation / plateau range | Not identified (no_plateau_zone_detected) |
| Support-constrained target reason | identified |
| Raw to support delta | -2.011 (-13.4%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 3 | 5 | interpolation | 0.4258 | 0.0000 | 141 | 2961 |
| Runner-up | predictor_default | 2 | 5 | interpolation | 0.4017 | 0.0241 | 141 | 2961 |
| Runner-up | predictor_default | 3 | 3 | interpolation | 0.4001 | 0.0257 | 141 | 2961 |
| Runner-up | predictor_default | 3 | 2 | interpolation | 0.3680 | 0.0578 | 141 | 2961 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.93053, 5.930) | 296 | 23 | 4.5853 | 4.7926 | 0.5711 | 0.5469 |
| 2 | [5.930, 8.339) | 296 | 35 | 7.1478 | 7.0359 | 0.3492 | 0.3745 |
| 3 | [8.339, 9.745) | 296 | 41 | 9.1167 | 9.1152 | 0.1267 | 0.3246 |
| 4 | [9.745, 11.058) | 296 | 51 | 10.4477 | 10.4681 | 0.1956 | 0.2371 |
| 5 | [11.058, 12.398) | 296 | 57 | 11.7183 | 11.6755 | -0.0411 | 0.2447 |
| 6 | [12.398, 13.377) | 296 | 58 | 12.8078 | 12.7480 | 0.4113 | 0.3076 |
| 7 | [13.377, 14.852) | 296 | 57 | 14.1019 | 14.0656 | 0.2534 | 0.2443 |
| 8 | [14.852, 16.534) | 296 | 44 | 15.6818 | 15.6676 | 0.2442 | 0.2349 |
| 9 | [16.534, 20.378) | 296 | 38 | 18.4266 | 18.4682 | 0.1463 | 0.2124 |
| 10 | [20.378, 65.863] | 297 | 25 | 29.8911 | 24.9673 | -0.0854 | 0.1013 |

### Distribution Charts

```text
Predictor Distribution (Government Health Share of Government Spending)
[0.93053, 6.342) | ########## 350
[6.342, 11.753) | ############################ 1001
[11.753, 17.164) | ############################## 1073
[17.164, 22.575) | ########## 343
[22.575, 27.986) | ## 79
[27.986, 33.397) | ## 55
[33.397, 38.808) | # 17
[38.808, 44.219) | # 15
[44.219, 49.630) | # 3
[49.630, 55.041) | # 4
[60.452, 65.863] | # 21
```

```text
Outcome Distribution (Healthy Life Expectancy Growth (YoY %), welfare-aligned)
[-18.191, -14.967) | # 3
[-14.967, -11.743) | # 7
[-11.743, -8.519) | # 20
[-8.519, -5.296) | ## 110
[-5.296, -2.072) | ####### 373
[-2.072, 1.152) | ############################## 1555
[1.152, 4.376) | ############# 682
[4.376, 7.600) | ### 154
[7.600, 10.824) | # 43
[10.824, 14.048) | # 8
[14.048, 17.272) | # 5
[17.272, 20.496] | # 1
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| EGY | 0.2059 | 1.0534 | -118.594 | 21 |
| BRB | -0.3260 | -1.0027 | -237.954 | 21 |
| RWA | 0.1751 | 0.9772 | 231.645 | 21 |
| BLR | -0.3170 | -0.9725 | -289.602 | 21 |
| PSE | -0.3708 | -0.9232 | -87.259 | 21 |
| PHL | -0.0623 | -0.8624 | 397.292 | 21 |
| POL | -0.4617 | -0.8510 | -225.832 | 21 |
| BRA | 0.4513 | 0.8268 | -6853.264 | 21 |
