# Pair Study: Military Expenditure Per Capita (PPP) -> After-Tax Median Income Growth (YoY %)

- Pair ID: `predictor.derived.military_expenditure_per_capita_ppp__outcome.derived.after_tax_median_income_ppp_growth_yoy_pct`
- Lag years: 0
- Duration years: 2
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.5957
- Included subjects: 201
- Skipped subjects: 0
- Total aligned pairs: 6429
- Evidence grade: C
- Data sufficiency: sufficient
- Reliability score: 0.675 (moderate)
- Quality tier: exploratory
- Direction: positive
- Derived uncertainty score: 0.3073 (1 - aggregate significance, not NHST p-value)

## Key Numeric Takeaways

- Decision-target Military Expenditure Per Capita (PPP) level for higher After-Tax Median Income Growth (YoY %): 175.38 international $/person (support constrained).
- Observed-support target from binned response curve: 175.38 international $/person.
- Model-derived optimum is within observed support but outside the highest-outcome bin; this reflects smooth objective optimization vs coarse bin averages.
- Best observed bin anchor (median/mean) is 179.67 international $/person; model-optimal minus observed-anchor difference is 207.48 (+115.5%).
- Robust sensitivity (trimmed 10-90% predictor range) suggests 174.77 international $/person.
- Raw vs robust optimal differs by 54.9%, indicating strong tail influence.
- Minimum effective level (first consistently positive zone): 54.457 international $/person.
- Diminishing returns likely begin near 54.457 international $/person.
- Saturation/plateau zone starts around 598.81 international $/person and extends through 2012.4 international $/person.
- Highest observed mean After-Tax Median Income Growth (YoY %) appears when Military Expenditure Per Capita (PPP) is in [151.11, 211.92) (mean outcome 5.249).
- Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Exploratory evidence only; use primarily for hypothesis generation.
- Directional hint: higher Military Expenditure Per Capita (PPP) is associated with better After-Tax Median Income Growth (YoY %).
- Signal strength: moderate-to-weak; avoid hard policy conclusions from this pair alone.

## Plain-Language Summary

- Higher Military Expenditure Per Capita (PPP) tends to align with better After-Tax Median Income Growth (YoY %).
- The estimate uses 201 subjects and 6429 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [151.11, 211.92) (mean outcome 5.249).
- A minimum effective predictor level appears near 54.457 international $/person in the binned response curve.
- Reliability score is 0.675 (moderate); data sufficiency is sufficient.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Weak aggregate significance (<0.70).
- Forward association sign conflicts with directional score sign; reverse-direction signal may dominate.
- Top temporal profiles are close (score delta 0.0079); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 54.9% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Aggregate forward Pearson | 0.0770 |
| Aggregate reverse Pearson | 0.1802 |
| Aggregate directional score (forward - reverse) | -0.1032 |
| Aggregate effect size (% baseline delta) | 8.6680 |
| Aggregate statistical significance | 0.6927 |
| Weighted average PIS | 0.1881 |
| Aggregate value predicting high outcome | 387.1499 |
| Aggregate value predicting low outcome | 388.4027 |
| Aggregate optimal daily value | 387.1499 |
| Decision target value (reader-facing) | 175.38 international $/person (support constrained) |
| Model-derived optimum (diagnostics) | 387.15 international $/person |
| Support-constrained optimal value | 175.38 international $/person |
| Support-constrained optimal range | [151.11, 201.77) |
| Response-curve robust optimal value | 170.64 international $/person |
| Raw model optimal within observed range | yes |
| Raw model optimal within support-constrained range | no |
| Observed predictor range | [0.0063, 27448.6207] |
| Model-derived optimal extrapolative? | no (within observed range) |
| Model-derived optimal outside best observed bin? | yes |
| Raw best observed range | [151.11, 211.92) |
| Robust best observed range (trimmed) | [151.11, 199.11) |
| Raw best observed outcome mean | 5.249 |
| Robust best observed outcome mean | 5.400 |
| Robust optimal value (bin median) | 174.77 international $/person |
| Raw vs robust optimal delta | -212.38 (-54.9%) |
| Robustness retained fraction | 80.0% (5143/6429) |
| Data sufficiency status | sufficient |
| Data sufficiency reasons | none |
| Reliability score | 0.6753 (moderate) |
| Reliability support component | 1.0000 |
| Reliability significance component | 0.6927 |
| Reliability directional component | 0.6882 |
| Reliability temporal-stability component | 0.2617 |
| Reliability robustness component | 0.5016 |
| Quality tier | exploratory |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum effective level (MED) | 54.457 international $/person (z=1.26) |
| Diminishing-returns knee | 54.457 international $/person (ratio=-0.055) |
| Saturation / plateau range | [489.38, 21187.0] |
| Support-constrained target reason | identified |
| Raw to support delta | 211.77 (+120.8%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 0 | 2 | interpolation | 0.5957 | 0.0000 | 201 | 6429 |
| Runner-up | predictor_default | 0 | 1 | interpolation | 0.5878 | 0.0079 | 201 | 6429 |
| Runner-up | predictor_default | 0 | 3 | interpolation | 0.5835 | 0.0122 | 201 | 6429 |
| Runner-up | predictor_default | 1 | 1 | interpolation | 0.5754 | 0.0203 | 201 | 6429 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.00630, 18.983) | 643 | 40 | 10.6678 | 10.6485 | 4.3220 | 4.4643 |
| 2 | [18.983, 35.208) | 642 | 67 | 26.3600 | 25.5431 | 3.8781 | 4.2489 |
| 3 | [35.208, 56.795) | 644 | 75 | 45.0700 | 44.4551 | 4.9735 | 4.7601 |
| 4 | [56.795, 95.993) | 643 | 88 | 75.3199 | 75.4277 | 5.2297 | 5.2392 |
| 5 | [95.993, 151.11) | 641 | 83 | 123.2264 | 123.3264 | 4.9788 | 5.0584 |
| 6 | [151.11, 211.92) | 644 | 90 | 180.2625 | 179.6677 | 5.2495 | 4.9138 |
| 7 | [211.92, 297.06) | 643 | 81 | 248.1962 | 245.0208 | 5.1312 | 4.7213 |
| 8 | [297.06, 428.00) | 643 | 74 | 357.4636 | 355.3724 | 4.6373 | 4.6229 |
| 9 | [428.00, 717.81) | 643 | 69 | 541.7689 | 527.8310 | 4.5575 | 4.4212 |
| 10 | [717.81, 21187.0] | 643 | 52 | 2254.2303 | 1659.5121 | 3.4543 | 3.6045 |

### Distribution Charts

```text
Predictor Distribution (Military Expenditure Per Capita (PPP))
[0.00630, 1765.6) | ############################## 6124
[1765.6, 3531.2) | # 183
[3531.2, 5296.8) | # 82
[5296.8, 7062.3) | # 32
[7062.3, 8827.9) | # 6
[17655.8, 19421.4) | # 1
[19421.4, 21187.0] | # 1
```

```text
Outcome Distribution (After-Tax Median Income Growth (YoY %), welfare-aligned)
[-62.405, -43.867) | # 5
[-43.867, -25.329) | # 26
[-25.329, -6.791) | # 210
[-6.791, 11.747) | ############################## 5669
[11.747, 30.285) | ### 487
[30.285, 48.823) | # 17
[48.823, 67.360) | # 9
[67.360, 85.898) | # 4
[141.51, 160.05] | # 2
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| LBR | -0.0553 | 0.7563 | -67.211 | 33 |
| NGA | 0.2768 | 0.6908 | 91.037 | 15 |
| COD | -0.4694 | -0.5892 | -223.717 | 33 |
| GNQ | -0.2489 | -0.5149 | 12.570 | 33 |
| VEN | 0.1544 | -0.5120 | 82.447 | 21 |
| PRE | -0.2437 | -0.5081 | -44.671 | 15 |
| SOM | -0.0847 | 0.4919 | 58.804 | 32 |
| KWT | 0.1505 | 0.4694 | 2922.996 | 33 |
