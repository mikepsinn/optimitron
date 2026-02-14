# Pair Study: Government Health Expenditure Per Capita (PPP) -> After-Tax Median Income Growth (YoY %)

- Pair ID: `predictor.derived.gov_health_expenditure_per_capita_ppp__outcome.derived.after_tax_median_income_ppp_growth_yoy_pct`
- Lag years: 2
- Duration years: 2
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.6192
- Included subjects: 229
- Skipped subjects: 0
- Total aligned pairs: 7356
- Evidence grade: C
- Data sufficiency: sufficient
- Reliability score: 0.633 (moderate)
- Quality tier: exploratory
- Direction: positive
- Derived uncertainty score: 0.3180 (1 - aggregate significance, not NHST p-value)

## Key Numeric Takeaways

- Decision-target Government Health Expenditure Per Capita (PPP) level for higher After-Tax Median Income Growth (YoY %): 361.49 international $/person (support constrained).
- Observed-support target from binned response curve: 361.49 international $/person.
- Model-derived optimum is within observed support but outside the highest-outcome bin; this reflects smooth objective optimization vs coarse bin averages.
- Best observed bin anchor (median/mean) is 46.636 international $/person; model-optimal minus observed-anchor difference is 538.26 (+1154.2%).
- Robust sensitivity (trimmed 10-90% predictor range) suggests 37.036 international $/person.
- Raw vs robust optimal differs by 93.7%, indicating strong tail influence.
- Minimum effective level (first consistently positive zone): 35.834 international $/person.
- Diminishing returns likely begin near 35.834 international $/person.
- Saturation/plateau zone starts around 903.60 international $/person and extends through 2793.6 international $/person.
- Highest observed mean After-Tax Median Income Growth (YoY %) appears when Government Health Expenditure Per Capita (PPP) is in [34.371, 71.973) (mean outcome 5.158).
- Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Exploratory evidence only; use primarily for hypothesis generation.
- Directional hint: higher Government Health Expenditure Per Capita (PPP) is associated with better After-Tax Median Income Growth (YoY %).
- Signal strength: moderate-to-weak; avoid hard policy conclusions from this pair alone.

## Plain-Language Summary

- Higher Government Health Expenditure Per Capita (PPP) tends to align with better After-Tax Median Income Growth (YoY %).
- The estimate uses 229 subjects and 7356 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [34.371, 71.973) (mean outcome 5.158).
- A minimum effective predictor level appears near 35.834 international $/person in the binned response curve.
- Reliability score is 0.633 (moderate); data sufficiency is sufficient.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Weak aggregate significance (<0.70).
- Top temporal profiles are close (score delta 0.0056); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 93.7% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Aggregate forward Pearson | 0.0985 |
| Aggregate reverse Pearson | -0.0320 |
| Aggregate directional score (forward - reverse) | 0.1305 |
| Aggregate effect size (% baseline delta) | 108.1561 |
| Aggregate statistical significance | 0.6820 |
| Weighted average PIS | 0.1837 |
| Aggregate value predicting high outcome | 584.8956 |
| Aggregate value predicting low outcome | 558.2327 |
| Aggregate optimal daily value | 584.8956 |
| Decision target value (reader-facing) | 361.49 international $/person (support constrained) |
| Model-derived optimum (diagnostics) | 584.90 international $/person |
| Support-constrained optimal value | 361.49 international $/person |
| Support-constrained optimal range | [290.77, 429.10) |
| Response-curve robust optimal value | 88.305 international $/person |
| Raw model optimal within observed range | yes |
| Raw model optimal within support-constrained range | no |
| Observed predictor range | [0.2591, 8503.2455] |
| Model-derived optimal extrapolative? | no (within observed range) |
| Model-derived optimal outside best observed bin? | yes |
| Raw best observed range | [34.371, 71.973) |
| Robust best observed range (trimmed) | [27.900, 52.150) |
| Raw best observed outcome mean | 5.158 |
| Robust best observed outcome mean | 5.448 |
| Robust optimal value (bin median) | 37.036 international $/person |
| Raw vs robust optimal delta | -547.86 (-93.7%) |
| Robustness retained fraction | 80.1% (5895/7356) |
| Data sufficiency status | sufficient |
| Data sufficiency reasons | none |
| Reliability score | 0.6329 (moderate) |
| Reliability support component | 1.0000 |
| Reliability significance component | 0.6820 |
| Reliability directional component | 0.8697 |
| Reliability temporal-stability component | 0.1857 |
| Reliability robustness component | 0.0704 |
| Quality tier | exploratory |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum effective level (MED) | 35.834 international $/person (z=2.36) |
| Diminishing-returns knee | 35.834 international $/person (ratio=-0.028) |
| Saturation / plateau range | [660.26, 7046.4] |
| Support-constrained target reason | identified |
| Raw to support delta | 223.41 (+61.8%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 2 | 2 | interpolation | 0.6192 | 0.0000 | 229 | 7356 |
| Runner-up | predictor_default | 3 | 5 | interpolation | 0.6136 | 0.0056 | 229 | 7356 |
| Runner-up | predictor_default | 3 | 2 | interpolation | 0.6045 | 0.0147 | 229 | 7356 |
| Runner-up | predictor_default | 3 | 3 | interpolation | 0.6032 | 0.0159 | 229 | 7356 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.25914, 16.696) | 725 | 38 | 9.2346 | 9.1744 | 3.9030 | 4.3478 |
| 2 | [16.696, 34.371) | 746 | 59 | 23.0983 | 22.1919 | 4.4561 | 4.6186 |
| 3 | [34.371, 71.973) | 735 | 67 | 49.5645 | 46.6361 | 5.1579 | 4.5070 |
| 4 | [71.973, 125.91) | 736 | 72 | 96.8725 | 96.2316 | 5.0635 | 5.0445 |
| 5 | [125.91, 212.54) | 730 | 77 | 168.0951 | 165.1033 | 4.3921 | 4.5059 |
| 6 | [212.54, 315.50) | 731 | 91 | 256.1248 | 256.3404 | 4.4768 | 4.4870 |
| 7 | [315.50, 515.31) | 746 | 94 | 403.4852 | 397.6217 | 5.1340 | 5.4006 |
| 8 | [515.31, 951.90) | 735 | 82 | 685.7724 | 660.2362 | 4.5894 | 4.8509 |
| 9 | [951.90, 1767.6) | 736 | 66 | 1339.7332 | 1379.7371 | 3.9307 | 4.0695 |
| 10 | [1767.6, 7046.4] | 736 | 50 | 2903.1890 | 2591.1084 | 4.3465 | 4.0894 |

### Distribution Charts

```text
Predictor Distribution (Government Health Expenditure Per Capita (PPP))
[0.25914, 587.44) | ############################## 5383
[587.44, 1174.6) | #### 726
[1174.6, 1761.8) | ### 494
[1761.8, 2349.0) | ## 316
[2349.0, 2936.2) | # 158
[2936.2, 3523.3) | # 108
[3523.3, 4110.5) | # 71
[4110.5, 4697.7) | # 43
[4697.7, 5284.9) | # 35
[5284.9, 5872.0) | # 11
[5872.0, 6459.2) | # 7
[6459.2, 7046.4] | # 4
```

```text
Outcome Distribution (After-Tax Median Income Growth (YoY %), welfare-aligned)
[-62.405, -43.867) | # 5
[-43.867, -25.329) | # 29
[-25.329, -6.791) | # 265
[-6.791, 11.747) | ############################## 6459
[11.747, 30.285) | ### 564
[30.285, 48.823) | # 19
[48.823, 67.360) | # 9
[67.360, 85.898) | # 4
[141.51, 160.05] | # 2
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| LBN | -0.5432 | -0.9711 | -113.983 | 33 |
| WSM | 0.1395 | 0.8005 | 14.812 | 33 |
| NRU | -0.4213 | -0.7690 | -144.111 | 33 |
| HTI | -0.2396 | -0.7619 | -74.434 | 33 |
| PHL | 0.3607 | 0.6988 | 38.203 | 33 |
| SDN | -0.1634 | -0.6754 | -97.582 | 33 |
| CSS | 0.0571 | 0.6692 | -29.528 | 33 |
| SOM | -0.0654 | 0.6528 | -84.072 | 32 |
