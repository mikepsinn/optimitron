# Pair Study: Government Expenditure Per Capita (PPP) -> After-Tax Median Income Growth (YoY %)

- Pair ID: `predictor.derived.gov_expenditure_per_capita_ppp__outcome.derived.after_tax_median_income_ppp_growth_yoy_pct`
- Lag years: 2
- Duration years: 2
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.5911
- Included subjects: 175
- Skipped subjects: 0
- Total aligned pairs: 5740
- Evidence grade: C
- Data sufficiency: sufficient
- Reliability score: 0.590 (moderate)
- Quality tier: exploratory
- Direction: positive
- Derived uncertainty score: 0.3050 (1 - aggregate significance, not NHST p-value)

## Key Numeric Takeaways

- Estimated best Government Expenditure Per Capita (PPP) level for higher After-Tax Median Income Growth (YoY %): 4144.5 international $/person.
- Observed-support target from binned response curve: 931.16 international $/person.
- Model-derived optimum is within observed support but outside the highest-outcome bin; this reflects smooth objective optimization vs coarse bin averages.
- Best observed bin anchor (median/mean) is 752.26 international $/person; model-optimal minus observed-anchor difference is 3392.3 (+450.9%).
- Robust sensitivity (trimmed 10-90% predictor range) suggests 974.44 international $/person.
- Raw vs robust optimal differs by 76.5%, indicating strong tail influence.
- Minimum effective level (first consistently positive zone): 1837.8 international $/person.
- Diminishing returns likely begin near 931.16 international $/person.
- Saturation/plateau zone starts around 4886.2 international $/person and extends through 16263.2 international $/person.
- Highest observed mean After-Tax Median Income Growth (YoY %) appears when Government Expenditure Per Capita (PPP) is in [576.55, 979.24) (mean outcome 5.390).
- Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Exploratory evidence only; use primarily for hypothesis generation.
- Directional hint: higher Government Expenditure Per Capita (PPP) is associated with better After-Tax Median Income Growth (YoY %).
- Signal strength: moderate-to-weak; avoid hard policy conclusions from this pair alone.

## Plain-Language Summary

- Higher Government Expenditure Per Capita (PPP) tends to align with better After-Tax Median Income Growth (YoY %).
- The estimate uses 175 subjects and 5740 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [576.55, 979.24) (mean outcome 5.390).
- A minimum effective predictor level appears near 1837.8 international $/person in the binned response curve.
- Reliability score is 0.590 (moderate); data sufficiency is sufficient.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Weak aggregate significance (<0.70).
- Top temporal profiles are close (score delta 0.0005); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 76.5% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Aggregate forward Pearson | 0.0955 |
| Aggregate reverse Pearson | -0.0023 |
| Aggregate directional score (forward - reverse) | 0.0978 |
| Aggregate effect size (% baseline delta) | 49.7617 |
| Aggregate statistical significance | 0.6950 |
| Weighted average PIS | 0.1759 |
| Aggregate value predicting high outcome | 4144.5190 |
| Aggregate value predicting low outcome | 3894.9646 |
| Aggregate optimal daily value | 4144.5190 |
| Support-constrained optimal value | 931.16 international $/person |
| Support-constrained optimal range | [755.20, 1122.2) |
| Response-curve robust optimal value | 850.26 international $/person |
| Raw model optimal within observed range | yes |
| Raw model optimal within support-constrained range | no |
| Observed predictor range | [8.5216, 63562.8926] |
| Model-derived optimal extrapolative? | no (within observed range) |
| Model-derived optimal outside best observed bin? | yes |
| Raw best observed range | [576.55, 979.24) |
| Robust best observed range (trimmed) | [806.31, 1164.4) |
| Raw best observed outcome mean | 5.390 |
| Robust best observed outcome mean | 5.328 |
| Robust optimal value (bin median) | 974.44 international $/person |
| Raw vs robust optimal delta | -3170.1 (-76.5%) |
| Robustness retained fraction | 80.0% (4592/5740) |
| Data sufficiency status | sufficient |
| Data sufficiency reasons | none |
| Reliability score | 0.5903 (moderate) |
| Reliability support component | 0.9783 |
| Reliability significance component | 0.6950 |
| Reliability directional component | 0.6522 |
| Reliability temporal-stability component | 0.0157 |
| Reliability robustness component | 0.2612 |
| Quality tier | exploratory |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum effective level (MED) | 1837.8 international $/person (z=1.30) |
| Diminishing-returns knee | 931.16 international $/person (ratio=-0.190) |
| Saturation / plateau range | [4163.3, 52862.3] |
| Support-constrained target reason | identified |
| Raw to support delta | 3213.4 (+345.1%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 2 | 2 | interpolation | 0.5911 | 0.0000 | 175 | 5740 |
| Runner-up | predictor_default | 2 | 1 | interpolation | 0.5906 | 0.0005 | 175 | 5740 |
| Runner-up | predictor_default | 3 | 1 | interpolation | 0.5870 | 0.0041 | 175 | 5740 |
| Runner-up | predictor_default | 0 | 1 | interpolation | 0.5626 | 0.0285 | 175 | 5740 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [15.672, 269.79) | 574 | 28 | 159.6083 | 153.0826 | 4.1690 | 4.6333 |
| 2 | [269.79, 576.55) | 570 | 50 | 405.4567 | 388.7454 | 4.7892 | 4.7601 |
| 3 | [576.55, 979.24) | 578 | 60 | 763.9379 | 752.2567 | 5.3896 | 5.0627 |
| 4 | [979.24, 1447.9) | 574 | 69 | 1202.7435 | 1203.7000 | 4.4667 | 4.8325 |
| 5 | [1447.9, 2186.1) | 574 | 70 | 1779.9840 | 1776.1705 | 4.7186 | 4.5000 |
| 6 | [2186.1, 3320.4) | 574 | 73 | 2741.7016 | 2691.7226 | 4.8471 | 5.0000 |
| 7 | [3320.4, 4721.7) | 574 | 80 | 3985.4212 | 3979.0739 | 4.1673 | 4.4198 |
| 8 | [4721.7, 7102.5) | 563 | 82 | 5807.4854 | 5730.1915 | 4.5521 | 4.5113 |
| 9 | [7102.5, 11754.6) | 585 | 63 | 9191.4021 | 9092.0325 | 4.7112 | 4.4430 |
| 10 | [11754.6, 52862.3] | 574 | 49 | 17326.0967 | 15466.7074 | 4.4247 | 4.2229 |

### Distribution Charts

```text
Predictor Distribution (Government Expenditure Per Capita (PPP))
[15.672, 4419.6) | ############################## 3907
[4419.6, 8823.4) | ####### 927
[8823.4, 13227.3) | #### 462
[13227.3, 17631.2) | ## 259
[17631.2, 22035.1) | # 98
[22035.1, 26439.0) | # 41
[26439.0, 30842.9) | # 30
[30842.9, 35246.8) | # 5
[35246.8, 39650.7) | # 3
[39650.7, 44054.6) | # 4
[44054.6, 48458.4) | # 2
[48458.4, 52862.3] | # 2
```

```text
Outcome Distribution (After-Tax Median Income Growth (YoY %), welfare-aligned)
[-62.405, -43.867) | # 4
[-43.867, -25.329) | # 22
[-25.329, -6.791) | # 204
[-6.791, 11.747) | ############################## 5039
[11.747, 30.285) | ### 445
[30.285, 48.823) | # 14
[48.823, 67.360) | # 8
[67.360, 85.898) | # 2
[141.51, 160.05] | # 2
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| BOL | 0.1457 | 0.9546 | 52.022 | 33 |
| LBN | -0.5612 | -0.9188 | -94.069 | 33 |
| LDC | 0.2184 | 0.9094 | 15.065 | 33 |
| ALB | 0.2091 | 0.8940 | 18.224 | 33 |
| ECU | 0.3393 | 0.8716 | 54.882 | 33 |
| KGZ | 0.2860 | 0.8113 | 150.303 | 32 |
| GAB | -0.3638 | -0.8068 | -79.553 | 33 |
| MUS | 0.1292 | 0.7967 | 1.132 | 33 |
