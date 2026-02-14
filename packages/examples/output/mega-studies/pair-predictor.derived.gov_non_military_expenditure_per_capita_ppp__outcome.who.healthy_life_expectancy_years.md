# Pair Study: Civilian Government Expenditure Per Capita (PPP) -> Healthy Life Expectancy (HALE)

- Pair ID: `predictor.derived.gov_non_military_expenditure_per_capita_ppp__outcome.who.healthy_life_expectancy_years`
- Lag years: 3
- Duration years: 3
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.7619
- Included subjects: 126
- Skipped subjects: 0
- Total aligned pairs: 8316
- Evidence grade: A
- Data sufficiency: sufficient
- Reliability score: 0.700 (moderate)
- Quality tier: exploratory
- Direction: positive
- Derived uncertainty score: 0.0625 (1 - aggregate significance, not NHST p-value)

## Key Numeric Takeaways

- Decision-target Civilian Government Expenditure Per Capita (PPP) level for higher Healthy Life Expectancy (HALE): 16280.7 international $/person (support constrained).
- Observed-support target from binned response curve: 16280.7 international $/person.
- Model-derived optimum is within observed support but outside the highest-outcome bin; this reflects smooth objective optimization vs coarse bin averages.
- Best observed bin anchor (median/mean) is 15216.7 international $/person; model-optimal minus observed-anchor difference is -10122.7 (-66.5%).
- Robust sensitivity (trimmed 10-90% predictor range) suggests 9966.4 international $/person.
- Raw vs robust optimal differs by 95.6%, indicating strong tail influence.
- Minimum effective level (first consistently positive zone): 237.92 international $/person.
- Diminishing returns likely begin near 516.72 international $/person.
- Saturation/plateau zone starts around 1778.8 international $/person and extends through 2493.8 international $/person.
- Highest observed mean Healthy Life Expectancy (HALE) appears when Civilian Government Expenditure Per Capita (PPP) is in [11484.0, 42959.9] (mean outcome 69.705).
- Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Stronger evidence for directional signal relative to other predictors in this report.
- Directional hint: higher Civilian Government Expenditure Per Capita (PPP) is associated with better Healthy Life Expectancy (HALE).
- Signal strength: relatively stronger within this report set.

## Plain-Language Summary

- Higher Civilian Government Expenditure Per Capita (PPP) tends to align with better Healthy Life Expectancy (HALE).
- The estimate uses 126 subjects and 8316 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [11484.0, 42959.9] (mean outcome 69.705).
- A minimum effective predictor level appears near 237.92 international $/person in the binned response curve.
- Reliability score is 0.700 (moderate); data sufficiency is sufficient.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Forward association sign conflicts with directional score sign; reverse-direction signal may dominate.
- Some subject-level directional scores exceed |1|; this is valid because the score is a difference of two correlations.
- Top temporal profiles are close (score delta 0.0057); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 95.6% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Aggregate forward Pearson | 0.5571 |
| Aggregate reverse Pearson | 0.7409 |
| Aggregate directional score (forward - reverse) | -0.1838 |
| Aggregate effect size (% baseline delta) | 4.5550 |
| Aggregate statistical significance | 0.9375 |
| Weighted average PIS | 0.5688 |
| Aggregate value predicting high outcome | 5094.0578 |
| Aggregate value predicting low outcome | 3754.3314 |
| Aggregate optimal daily value | 5094.0578 |
| Decision target value (reader-facing) | 16280.7 international $/person (support constrained) |
| Model-derived optimum (diagnostics) | 5094.1 international $/person |
| Support-constrained optimal value | 16280.7 international $/person |
| Support-constrained optimal range | [12244.6, 42959.9] |
| Response-curve robust optimal value | 10205.7 international $/person |
| Raw model optimal within observed range | yes |
| Raw model optimal within support-constrained range | no |
| Observed predictor range | [7.6041, 62399.1940] |
| Model-derived optimal extrapolative? | no (within observed range) |
| Model-derived optimal outside best observed bin? | yes |
| Raw best observed range | [11484.0, 42959.9] |
| Robust best observed range (trimmed) | [8814.1, 11484.0] |
| Raw best observed outcome mean | 69.705 |
| Robust best observed outcome mean | 68.009 |
| Robust optimal value (bin median) | 9966.4 international $/person |
| Raw vs robust optimal delta | 4872.3 (+95.6%) |
| Robustness retained fraction | 80.0% (6654/8316) |
| Data sufficiency status | sufficient |
| Data sufficiency reasons | none |
| Reliability score | 0.7001 (moderate) |
| Reliability support component | 0.9200 |
| Reliability significance component | 0.9375 |
| Reliability directional component | 1.0000 |
| Reliability temporal-stability component | 0.1897 |
| Reliability robustness component | 0.0484 |
| Quality tier | exploratory |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum effective level (MED) | 237.92 international $/person (z=5.91) |
| Diminishing-returns knee | 516.72 international $/person (ratio=0.159) |
| Saturation / plateau range | [1571.3, 3063.2) |
| Support-constrained target reason | identified |
| Raw to support delta | -11186.6 (-68.7%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 3 | 3 | interpolation | 0.7619 | 0.0000 | 126 | 8316 |
| Runner-up | predictor_default | 3 | 2 | interpolation | 0.7562 | 0.0057 | 126 | 8316 |
| Runner-up | predictor_default | 3 | 1 | interpolation | 0.7462 | 0.0157 | 126 | 8316 |
| Runner-up | predictor_default | 2 | 3 | interpolation | 0.7343 | 0.0276 | 126 | 8316 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [7.604, 207.94) | 831 | 19 | 116.2883 | 112.1479 | 51.6229 | 52.4201 |
| 2 | [207.94, 511.72) | 804 | 32 | 316.0200 | 293.6527 | 54.3901 | 54.9433 |
| 3 | [511.72, 911.00) | 858 | 35 | 679.6758 | 659.6264 | 57.5540 | 58.8582 |
| 4 | [911.00, 1439.3) | 831 | 44 | 1126.5011 | 1125.1411 | 60.5454 | 62.2469 |
| 5 | [1439.3, 2096.4) | 834 | 47 | 1751.2399 | 1750.6701 | 61.8401 | 63.6802 |
| 6 | [2096.4, 3354.9) | 831 | 42 | 2624.0346 | 2577.8652 | 62.4837 | 64.4544 |
| 7 | [3354.9, 4986.1) | 831 | 41 | 3991.1704 | 3907.4672 | 64.4671 | 65.1646 |
| 8 | [4986.1, 7927.4) | 831 | 38 | 6378.3486 | 6429.0399 | 67.1908 | 67.4311 |
| 9 | [7927.4, 11484.0) | 831 | 35 | 9685.8321 | 9551.4014 | 68.0294 | 68.4373 |
| 10 | [11484.0, 42959.9] | 834 | 27 | 17011.2237 | 15216.7145 | 69.7046 | 69.8612 |

### Distribution Charts

```text
Predictor Distribution (Civilian Government Expenditure Per Capita (PPP))
[7.604, 3587.0) | ############################## 5241
[3587.0, 7166.3) | ####### 1221
[7166.3, 10745.7) | ##### 876
[10745.7, 14325.0) | ### 486
[14325.0, 17904.4) | # 204
[17904.4, 21483.8) | # 159
[21483.8, 25063.1) | # 57
[25063.1, 28642.5) | # 39
[28642.5, 32221.8) | # 6
[32221.8, 35801.2) | # 9
[35801.2, 39380.5) | # 9
[39380.5, 42959.9] | # 9
```

```text
Outcome Distribution (Healthy Life Expectancy (HALE), welfare-aligned)
[36.729, 39.928) | # 71
[39.928, 43.126) | ## 121
[43.126, 46.325) | #### 231
[46.325, 49.524) | ##### 316
[49.524, 52.723) | ######## 456
[52.723, 55.921) | ########## 591
[55.921, 59.120) | ########### 651
[59.120, 62.319) | ################## 1064
[62.319, 65.517) | ########################### 1576
[65.517, 68.716) | ############################## 1760
[68.716, 71.915) | ####################### 1373
[71.915, 75.113] | ## 106
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| MWI | -0.7773 | -1.2819 | -17.373 | 66 |
| PRY | -0.2125 | -1.0826 | -0.324 | 66 |
| PER | 0.0366 | -0.9034 | 1.065 | 66 |
| FJI | -0.0023 | -0.8743 | 0.182 | 66 |
| MEX | -0.0514 | -0.8735 | 0.070 | 66 |
| CPV | -0.1626 | -0.8307 | 0.417 | 66 |
| USA | -0.0152 | -0.7637 | 0.085 | 66 |
| HND | 0.0452 | -0.7342 | -0.121 | 66 |
