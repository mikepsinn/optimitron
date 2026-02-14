# Pair Study: Education Expenditure Per Capita (PPP) -> Healthy Life Expectancy Growth (YoY %)

- Pair ID: `predictor.derived.education_expenditure_per_capita_ppp__outcome.derived.healthy_life_expectancy_growth_yoy_pct`
- Lag years: 0
- Duration years: 3
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 15
- Temporal candidates with valid results: 15
- Temporal profile score: 0.3767
- Included subjects: 165
- Skipped subjects: 0
- Total aligned pairs: 3465
- Evidence grade: F
- Data sufficiency: sufficient
- Reliability score: 0.413 (low)
- Quality tier: insufficient
- Direction: negative
- Derived uncertainty score: 0.8150 (1 - aggregate significance, not NHST p-value)

## Key Numeric Takeaways

- Decision-target Education Expenditure Per Capita (PPP) level for higher Healthy Life Expectancy Growth (YoY %): 30.522 international $/person (support constrained).
- Observed-support target from binned response curve: 30.522 international $/person.
- Model-derived optimum is within observed support but outside the highest-outcome bin; this reflects smooth objective optimization vs coarse bin averages.
- Best observed bin anchor (median/mean) is 33.103 international $/person; model-optimal minus observed-anchor difference is 711.21 (+2148.5%).
- Robust sensitivity (trimmed 10-90% predictor range) suggests 62.367 international $/person.
- Raw vs robust optimal differs by 91.6%, indicating strong tail influence.
- Minimum effective level not reliably identified (no_consistent_effective_dose_detected).
- No reliable diminishing-returns knee detected (drop_below_detection_threshold).
- Saturation/plateau zone starts around 1899.3 international $/person and extends through 2949.8 international $/person.
- Highest observed mean Healthy Life Expectancy Growth (YoY %) appears when Education Expenditure Per Capita (PPP) is in [9.238, 48.180) (mean outcome 1.097).
- Direction is negative in this analysis, so lowering this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Exploratory evidence only; use primarily for hypothesis generation.
- Directional hint: lower Education Expenditure Per Capita (PPP) is associated with better Healthy Life Expectancy Growth (YoY %).
- Signal strength: moderate-to-weak; avoid hard policy conclusions from this pair alone.

## Plain-Language Summary

- Higher Education Expenditure Per Capita (PPP) tends to align with worse Healthy Life Expectancy Growth (YoY %).
- The estimate uses 165 subjects and 3465 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [9.238, 48.180) (mean outcome 1.097).
- Reliability score is 0.413 (low); data sufficiency is sufficient.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Weak aggregate significance (<0.70).
- Forward association sign conflicts with directional score sign; reverse-direction signal may dominate.
- Top temporal profiles are close (score delta 0.0111); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 91.6% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Aggregate forward Pearson | -0.1324 |
| Aggregate reverse Pearson | -0.2078 |
| Aggregate directional score (forward - reverse) | 0.0753 |
| Aggregate effect size (% baseline delta) | -96.6542 |
| Aggregate statistical significance | 0.1850 |
| Weighted average PIS | 0.0669 |
| Aggregate value predicting high outcome | 744.3105 |
| Aggregate value predicting low outcome | 783.1643 |
| Aggregate optimal daily value | 744.3105 |
| Decision target value (reader-facing) | 30.522 international $/person (support constrained) |
| Model-derived optimum (diagnostics) | 744.31 international $/person |
| Support-constrained optimal value | 30.522 international $/person |
| Support-constrained optimal range | [9.238, 42.945) |
| Response-curve robust optimal value | 60.488 international $/person |
| Raw model optimal within observed range | yes |
| Raw model optimal within support-constrained range | no |
| Observed predictor range | [0.0000, 7006.1701] |
| Model-derived optimal extrapolative? | no (within observed range) |
| Model-derived optimal outside best observed bin? | yes |
| Raw best observed range | [9.238, 48.180) |
| Robust best observed range (trimmed) | [48.249, 82.428) |
| Raw best observed outcome mean | 1.097 |
| Robust best observed outcome mean | 0.59262 |
| Robust optimal value (bin median) | 62.367 international $/person |
| Raw vs robust optimal delta | -681.94 (-91.6%) |
| Robustness retained fraction | 80.0% (2771/3465) |
| Data sufficiency status | sufficient |
| Data sufficiency reasons | none |
| Reliability score | 0.4135 (low) |
| Reliability support component | 0.7888 |
| Reliability significance component | 0.1850 |
| Reliability directional component | 0.5023 |
| Reliability temporal-stability component | 0.3707 |
| Reliability robustness component | 0.0931 |
| Quality tier | insufficient |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum effective level (MED) | Not identified (no_consistent_effective_dose_detected) |
| Diminishing-returns knee | Not identified (drop_below_detection_threshold) |
| Saturation / plateau range | [1489.8, 6748.5] |
| Support-constrained target reason | identified |
| Raw to support delta | 713.79 (+2338.6%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 0 | 3 | interpolation | 0.3767 | 0.0000 | 165 | 3465 |
| Runner-up | predictor_default | 0 | 2 | interpolation | 0.3656 | 0.0111 | 165 | 3465 |
| Runner-up | predictor_default | 5 | 3 | interpolation | 0.3615 | 0.0152 | 165 | 3465 |
| Runner-up | predictor_default | 0 | 5 | interpolation | 0.3613 | 0.0154 | 165 | 3465 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [9.238, 48.180) | 347 | 34 | 31.3061 | 33.1032 | 1.0972 | 0.8549 |
| 2 | [48.180, 97.226) | 346 | 46 | 68.9218 | 67.7947 | 0.5429 | 0.5217 |
| 3 | [97.226, 189.92) | 347 | 58 | 142.6699 | 144.5609 | 0.3111 | 0.3639 |
| 4 | [189.92, 288.15) | 346 | 54 | 238.7348 | 241.5524 | 0.1395 | 0.1730 |
| 5 | [288.15, 419.48) | 346 | 67 | 346.9482 | 347.3066 | -0.2223 | 0.2041 |
| 6 | [419.48, 562.72) | 347 | 61 | 497.1832 | 500.3409 | 0.1077 | 0.1656 |
| 7 | [562.72, 874.88) | 346 | 58 | 697.8663 | 693.2735 | 0.1465 | 0.2009 |
| 8 | [874.88, 1286.7) | 347 | 49 | 1062.2493 | 1051.1284 | -0.0829 | 0.1144 |
| 9 | [1286.7, 2107.7) | 346 | 43 | 1664.4297 | 1623.4717 | 0.0810 | 0.2487 |
| 10 | [2107.7, 6748.5] | 347 | 30 | 3035.7235 | 2835.2890 | 0.1262 | 0.1584 |

### Distribution Charts

```text
Predictor Distribution (Education Expenditure Per Capita (PPP))
[9.238, 570.85) | ############################## 2096
[570.85, 1132.5) | ######## 555
[1132.5, 1694.1) | #### 313
[1694.1, 2255.7) | ### 200
[2255.7, 2817.3) | ## 125
[2817.3, 3378.9) | # 90
[3378.9, 3940.5) | # 41
[3940.5, 4502.1) | # 22
[4502.1, 5063.7) | # 13
[5063.7, 5625.3) | # 3
[5625.3, 6186.9) | # 5
[6186.9, 6748.5] | # 2
```

```text
Outcome Distribution (Healthy Life Expectancy Growth (YoY %), welfare-aligned)
[-33.373, -25.372) | # 1
[-25.372, -17.372) | # 1
[-17.372, -9.372) | # 20
[-9.372, -1.372) | ######## 738
[-1.372, 6.629) | ############################## 2610
[6.629, 14.629) | # 90
[14.629, 22.629) | # 4
[54.630, 62.630] | # 1
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| LUX | 0.0732 | 0.9265 | -214.706 | 21 |
| AUS | 0.1056 | -0.8912 | -59.581 | 21 |
| EGY | 0.0386 | -0.8483 | -321.243 | 21 |
| SUR | -0.2100 | -0.8348 | 214.822 | 21 |
| OMN | 0.0210 | 0.8094 | -86.221 | 21 |
| NOR | -0.0789 | -0.8056 | 13.263 | 21 |
| TUR | -0.0819 | 0.8029 | -87.909 | 21 |
| GBR | 0.0146 | -0.7511 | -62.569 | 21 |
