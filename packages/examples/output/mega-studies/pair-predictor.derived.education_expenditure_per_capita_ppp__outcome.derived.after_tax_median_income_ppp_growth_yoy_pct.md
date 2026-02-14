# Pair Study: Education Expenditure Per Capita (PPP) -> After-Tax Median Income Growth (YoY %)

- Pair ID: `predictor.derived.education_expenditure_per_capita_ppp__outcome.derived.after_tax_median_income_ppp_growth_yoy_pct`
- Lag years: 0
- Duration years: 2
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.5575
- Included subjects: 216
- Skipped subjects: 0
- Total aligned pairs: 6924
- Evidence grade: C
- Data sufficiency: sufficient
- Reliability score: 0.720 (moderate)
- Quality tier: exploratory
- Direction: positive
- Derived uncertainty score: 0.3147 (1 - aggregate significance, not NHST p-value)

## Key Numeric Takeaways

- Estimated best Education Expenditure Per Capita (PPP) level for higher After-Tax Median Income Growth (YoY %): 685.87 international $/person.
- Observed-support target from binned response curve: 413.14 international $/person.
- Robust sensitivity (trimmed 10-90% predictor range) suggests 544.13 international $/person.
- Minimum effective level (first consistently positive zone): 55.100 international $/person.
- Diminishing returns likely begin near 100.74 international $/person.
- Saturation/plateau zone starts around 229.25 international $/person and extends through 2736.7 international $/person.
- Highest observed mean After-Tax Median Income Growth (YoY %) appears when Education Expenditure Per Capita (PPP) is in [510.99, 751.14) (mean outcome 5.154).
- Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Exploratory evidence only; use primarily for hypothesis generation.
- Directional hint: higher Education Expenditure Per Capita (PPP) is associated with better After-Tax Median Income Growth (YoY %).
- Signal strength: moderate-to-weak; avoid hard policy conclusions from this pair alone.

## Plain-Language Summary

- Higher Education Expenditure Per Capita (PPP) tends to align with better After-Tax Median Income Growth (YoY %).
- The estimate uses 216 subjects and 6924 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [510.99, 751.14) (mean outcome 5.154).
- A minimum effective predictor level appears near 55.100 international $/person in the binned response curve.
- Reliability score is 0.720 (moderate); data sufficiency is sufficient.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Weak aggregate significance (<0.70).
- Forward association sign conflicts with directional score sign; reverse-direction signal may dominate.
- Top temporal profiles are close (score delta 0.0153); temporal assumptions are not yet robust.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Aggregate forward Pearson | 0.1155 |
| Aggregate reverse Pearson | 0.1832 |
| Aggregate directional score (forward - reverse) | -0.0676 |
| Aggregate effect size (% baseline delta) | 112.8001 |
| Aggregate statistical significance | 0.6853 |
| Weighted average PIS | 0.1846 |
| Aggregate value predicting high outcome | 685.8691 |
| Aggregate value predicting low outcome | 659.3175 |
| Aggregate optimal daily value | 685.8691 |
| Support-constrained optimal value | 413.14 international $/person |
| Support-constrained optimal range | [352.67, 486.04) |
| Response-curve robust optimal value | 395.61 international $/person |
| Raw model optimal within observed range | yes |
| Raw model optimal within support-constrained range | no |
| Observed predictor range | [0.0000, 7006.1701] |
| Model-derived optimal extrapolative? | no (within observed range) |
| Model-derived optimal outside best observed bin? | no |
| Raw best observed range | [510.99, 751.14) |
| Robust best observed range (trimmed) | [478.16, 631.39) |
| Raw best observed outcome mean | 5.154 |
| Robust best observed outcome mean | 4.995 |
| Robust optimal value (bin median) | 544.13 international $/person |
| Raw vs robust optimal delta | -141.74 (-20.7%) |
| Robustness retained fraction | 80.0% (5539/6924) |
| Data sufficiency status | sufficient |
| Data sufficiency reasons | none |
| Reliability score | 0.7202 (moderate) |
| Reliability support component | 1.0000 |
| Reliability significance component | 0.6853 |
| Reliability directional component | 0.4510 |
| Reliability temporal-stability component | 0.5097 |
| Reliability robustness component | 0.8815 |
| Quality tier | exploratory |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum effective level (MED) | 55.100 international $/person (z=1.87) |
| Diminishing-returns knee | 100.74 international $/person (ratio=0.054) |
| Saturation / plateau range | [192.60, 6745.6] |
| Support-constrained target reason | identified |
| Raw to support delta | 272.73 (+66.0%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 0 | 2 | interpolation | 0.5575 | 0.0000 | 216 | 6924 |
| Runner-up | predictor_default | 2 | 2 | interpolation | 0.5422 | 0.0153 | 216 | 6924 |
| Runner-up | predictor_default | 0 | 5 | interpolation | 0.5418 | 0.0157 | 216 | 6924 |
| Runner-up | predictor_default | 0 | 3 | interpolation | 0.5398 | 0.0177 | 216 | 6924 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.00000, 44.993) | 692 | 47 | 28.1039 | 29.9621 | 3.7391 | 4.1325 |
| 2 | [44.993, 94.522) | 690 | 69 | 67.0651 | 64.8688 | 4.4657 | 4.3879 |
| 3 | [94.522, 163.52) | 694 | 85 | 129.6439 | 130.5410 | 4.8119 | 4.7394 |
| 4 | [163.52, 251.51) | 694 | 98 | 206.2603 | 205.4828 | 4.8510 | 5.0126 |
| 5 | [251.51, 352.67) | 692 | 106 | 302.3362 | 301.6991 | 4.7416 | 4.9507 |
| 6 | [352.67, 510.99) | 683 | 106 | 427.3049 | 428.8031 | 4.8155 | 4.9435 |
| 7 | [510.99, 751.14) | 702 | 102 | 612.0057 | 600.8034 | 5.1544 | 4.9815 |
| 8 | [751.14, 1129.0) | 692 | 97 | 926.1229 | 917.0542 | 4.2162 | 4.4933 |
| 9 | [1129.0, 1867.5) | 692 | 75 | 1439.6066 | 1416.1866 | 4.6250 | 4.3936 |
| 10 | [1867.5, 6745.6] | 693 | 48 | 2799.0856 | 2574.6710 | 4.0612 | 3.7817 |

### Distribution Charts

```text
Predictor Distribution (Education Expenditure Per Capita (PPP))
[0.00000, 562.13) | ############################## 4388
[562.13, 1124.3) | ######## 1145
[1124.3, 1686.4) | #### 590
[1686.4, 2248.5) | ## 343
[2248.5, 2810.7) | # 186
[2810.7, 3372.8) | # 134
[3372.8, 3934.9) | # 71
[3934.9, 4497.1) | # 27
[4497.1, 5059.2) | # 19
[5059.2, 5621.3) | # 13
[5621.3, 6183.4) | # 4
[6183.4, 6745.6] | # 4
```

```text
Outcome Distribution (After-Tax Median Income Growth (YoY %), welfare-aligned)
[-62.405, -43.867) | # 4
[-43.867, -25.329) | # 26
[-25.329, -6.791) | # 225
[-6.791, 11.747) | ############################## 6131
[11.747, 30.285) | ### 512
[30.285, 48.823) | # 15
[48.823, 67.360) | # 6
[67.360, 85.898) | # 4
[141.51, 160.05] | # 1
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| GUY | 0.1521 | 0.9117 | 32.633 | 33 |
| NRU | -0.4963 | -0.7198 | -163.801 | 33 |
| BIH | 0.0173 | -0.6199 | -14.183 | 33 |
| UZB | 0.1042 | -0.6042 | 18.842 | 33 |
| ATG | 0.0913 | -0.5941 | 49.118 | 33 |
| PRI | -0.0575 | -0.5851 | -25.603 | 33 |
| MDV | 0.0072 | -0.5479 | -33.782 | 33 |
| BWA | 0.0054 | 0.5442 | 35.271 | 33 |
