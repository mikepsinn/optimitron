# Pair Study: Civilian Government Expenditure Per Capita (PPP) -> Healthy Life Expectancy Growth (YoY %)

- Pair ID: `predictor.derived.gov_non_military_expenditure_per_capita_ppp__outcome.derived.healthy_life_expectancy_growth_yoy_pct`
- Lag years: 1
- Duration years: 3
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.3521
- Included subjects: 126
- Skipped subjects: 0
- Total aligned pairs: 2646
- Evidence grade: F
- Data sufficiency: sufficient
- Reliability score: 0.367 (low)
- Quality tier: insufficient
- Direction: negative
- Derived uncertainty score: 0.8093 (1 - aggregate significance, not NHST p-value)

## Key Numeric Takeaways

- Estimated best Civilian Government Expenditure Per Capita (PPP) level for higher Healthy Life Expectancy Growth (YoY %): 4471.6 international $/person.
- Observed-support target from binned response curve: 112.66 international $/person.
- Model-derived optimum is within observed support but outside the highest-outcome bin; this reflects smooth objective optimization vs coarse bin averages.
- Best observed bin anchor (median/mean) is 121.97 international $/person; model-optimal minus observed-anchor difference is 4349.6 (+3566.0%).
- Robust sensitivity (trimmed 10-90% predictor range) suggests 305.21 international $/person.
- Raw vs robust optimal differs by 93.2%, indicating strong tail influence.
- Minimum effective level not reliably identified (no_consistent_effective_dose_detected).
- No reliable diminishing-returns knee detected (drop_below_detection_threshold).
- Saturation/plateau zone starts around 11484.8 international $/person and extends through 18150.6 international $/person.
- Highest observed mean Healthy Life Expectancy Growth (YoY %) appears when Civilian Government Expenditure Per Capita (PPP) is in [7.604, 214.06) (mean outcome 1.110).
- Direction is negative in this analysis, so lowering this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Exploratory evidence only; use primarily for hypothesis generation.
- Directional hint: lower Civilian Government Expenditure Per Capita (PPP) is associated with better Healthy Life Expectancy Growth (YoY %).
- Signal strength: moderate-to-weak; avoid hard policy conclusions from this pair alone.

## Plain-Language Summary

- Higher Civilian Government Expenditure Per Capita (PPP) tends to align with worse Healthy Life Expectancy Growth (YoY %).
- The estimate uses 126 subjects and 2646 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [7.604, 214.06) (mean outcome 1.110).
- Reliability score is 0.367 (low); data sufficiency is sufficient.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Weak aggregate significance (<0.70).
- Forward association sign conflicts with directional score sign; reverse-direction signal may dominate.
- Some subject-level directional scores exceed |1|; this is valid because the score is a difference of two correlations.
- Top temporal profiles are close (score delta 0.0111); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 93.2% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Aggregate forward Pearson | -0.0957 |
| Aggregate reverse Pearson | -0.1649 |
| Aggregate directional score (forward - reverse) | 0.0692 |
| Aggregate effect size (% baseline delta) | -414.8887 |
| Aggregate statistical significance | 0.1907 |
| Weighted average PIS | 0.0729 |
| Aggregate value predicting high outcome | 4471.5583 |
| Aggregate value predicting low outcome | 4689.7395 |
| Aggregate optimal daily value | 4471.5583 |
| Support-constrained optimal value | 112.66 international $/person |
| Support-constrained optimal range | [7.604, 198.09) |
| Response-curve robust optimal value | 287.83 international $/person |
| Raw model optimal within observed range | yes |
| Raw model optimal within support-constrained range | no |
| Observed predictor range | [7.6041, 62399.1940] |
| Model-derived optimal extrapolative? | no (within observed range) |
| Model-derived optimal outside best observed bin? | yes |
| Raw best observed range | [7.604, 214.06) |
| Robust best observed range (trimmed) | [214.06, 506.71) |
| Raw best observed outcome mean | 1.110 |
| Robust best observed outcome mean | 0.74985 |
| Robust optimal value (bin median) | 305.21 international $/person |
| Raw vs robust optimal delta | -4166.3 (-93.2%) |
| Robustness retained fraction | 80.2% (2122/2646) |
| Data sufficiency status | sufficient |
| Data sufficiency reasons | none |
| Reliability score | 0.3671 (low) |
| Reliability support component | 0.6405 |
| Reliability significance component | 0.1907 |
| Reliability directional component | 0.4612 |
| Reliability temporal-stability component | 0.3714 |
| Reliability robustness component | 0.0758 |
| Quality tier | insufficient |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum effective level (MED) | Not identified (no_consistent_effective_dose_detected) |
| Diminishing-returns knee | Not identified (drop_below_detection_threshold) |
| Saturation / plateau range | [9932.7, 47874.3] |
| Support-constrained target reason | identified |
| Raw to support delta | 4358.9 (+3869.0%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 1 | 3 | interpolation | 0.3521 | 0.0000 | 126 | 2646 |
| Runner-up | predictor_default | 1 | 2 | interpolation | 0.3409 | 0.0111 | 126 | 2646 |
| Runner-up | predictor_default | 0 | 3 | interpolation | 0.3344 | 0.0177 | 126 | 2646 |
| Runner-up | predictor_default | 0 | 2 | interpolation | 0.3294 | 0.0227 | 126 | 2646 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [7.604, 214.06) | 259 | 18 | 129.0571 | 121.9722 | 1.1101 | 1.0995 |
| 2 | [214.06, 561.44) | 267 | 30 | 362.8853 | 336.3062 | 0.6752 | 0.7367 |
| 3 | [561.44, 984.46) | 268 | 39 | 776.4976 | 767.4314 | 0.3978 | 0.3469 |
| 4 | [984.46, 1617.2) | 264 | 40 | 1289.0387 | 1253.4625 | -0.2064 | 0.2181 |
| 5 | [1617.2, 2373.1) | 265 | 45 | 1982.7335 | 1982.4192 | -0.0023 | 0.1257 |
| 6 | [2373.1, 3524.6) | 264 | 44 | 2994.0109 | 3015.0753 | -0.0576 | 0.1897 |
| 7 | [3524.6, 5517.1) | 265 | 41 | 4413.0004 | 4345.5155 | 0.3745 | 0.2759 |
| 8 | [5517.1, 8935.4) | 264 | 40 | 7216.9090 | 7134.7532 | 0.0583 | 0.2158 |
| 9 | [8935.4, 12629.5) | 265 | 38 | 10598.2488 | 10523.7403 | -0.1183 | 0.1762 |
| 10 | [12629.5, 47874.3] | 265 | 30 | 18490.5332 | 16692.5460 | 0.0741 | 0.1812 |

### Distribution Charts

```text
Predictor Distribution (Civilian Government Expenditure Per Capita (PPP))
[7.604, 3996.5) | ############################## 1671
[3996.5, 7985.4) | ####### 377
[7985.4, 11974.3) | ##### 299
[11974.3, 15963.2) | ### 151
[15963.2, 19952.0) | # 73
[19952.0, 23940.9) | # 41
[23940.9, 27929.8) | # 21
[27929.8, 31918.7) | # 2
[31918.7, 35907.6) | # 3
[35907.6, 39896.5) | # 3
[39896.5, 43885.4) | # 3
[43885.4, 47874.3] | # 2
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
| EGY | -0.2487 | -1.1813 | -637.814 | 21 |
| NPL | -0.4491 | -0.9702 | 21.070 | 21 |
| MWI | 0.7864 | 0.7873 | -275.414 | 21 |
| GBR | -0.0439 | -0.7867 | -81.125 | 21 |
| TJK | -0.1810 | 0.7722 | -103.739 | 21 |
| NOR | -0.0927 | -0.7609 | -36.490 | 21 |
| ARG | -0.1265 | -0.7556 | -81.363 | 21 |
| LUX | 0.0766 | 0.7497 | -214.706 | 21 |
