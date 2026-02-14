# Pair Study: R&D Share of Government Spending -> Healthy Life Expectancy (HALE)

- Pair ID: `predictor.derived.rd_share_of_gov_expenditure_pct__outcome.who.healthy_life_expectancy_years`
- Lag years: 5
- Duration years: 8
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 16
- Temporal candidates with valid results: 16
- Temporal profile score: 0.6517
- Included subjects: 82
- Skipped subjects: 0
- Total aligned pairs: 5412
- Evidence grade: A
- Data sufficiency: sufficient
- Reliability score: 0.749 (moderate)
- Quality tier: exploratory
- Direction: positive
- Derived uncertainty score: 0.0816 (1 - aggregate significance, not NHST p-value)

## Key Numeric Takeaways

- Decision-target R&D Share of Government Spending level for higher Healthy Life Expectancy (HALE): 13.185 % of government expenditure (support constrained).
- Observed-support target from binned response curve: 13.185 % of government expenditure.
- Model-derived optimum is within observed support but outside the highest-outcome bin; this reflects smooth objective optimization vs coarse bin averages.
- Best observed bin anchor (median/mean) is 12.605 % of government expenditure; model-optimal minus observed-anchor difference is -8.785 (-69.7%).
- Robust sensitivity (trimmed 10-90% predictor range) suggests 7.223 % of government expenditure.
- Raw vs robust optimal differs by 89.1%, indicating strong tail influence.
- Minimum effective level (first consistently positive zone): 4.042 % of government expenditure.
- No reliable diminishing-returns knee detected (drop_below_detection_threshold).
- No stable plateau zone detected (no_plateau_zone_detected).
- Highest observed mean Healthy Life Expectancy (HALE) appears when R&D Share of Government Spending is in [9.390, 20.356] (mean outcome 69.965).
- Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Moderate evidence; plausible signal but still sensitive to model assumptions.
- Directional hint: higher R&D Share of Government Spending is associated with better Healthy Life Expectancy (HALE).
- Signal strength: relatively stronger within this report set.

## Plain-Language Summary

- Higher R&D Share of Government Spending tends to align with better Healthy Life Expectancy (HALE).
- The estimate uses 82 subjects and 5412 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [9.390, 20.356] (mean outcome 69.965).
- A minimum effective predictor level appears near 4.042 % of government expenditure in the binned response curve.
- Reliability score is 0.749 (moderate); data sufficiency is sufficient.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Some subject-level directional scores exceed |1|; this is valid because the score is a difference of two correlations.
- Robustness check: trimmed-range optimal differs by 89.1% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Aggregate forward Pearson | 0.1700 |
| Aggregate reverse Pearson | 0.0422 |
| Aggregate directional score (forward - reverse) | 0.1277 |
| Aggregate effect size (% baseline delta) | 0.5810 |
| Aggregate statistical significance | 0.9184 |
| Weighted average PIS | 0.4176 |
| Aggregate value predicting high outcome | 3.8196 |
| Aggregate value predicting low outcome | 3.5621 |
| Aggregate optimal daily value | 3.8196 |
| Decision target value (reader-facing) | 13.185 % of government expenditure (support constrained) |
| Model-derived optimum (diagnostics) | 3.820 % of government expenditure |
| Support-constrained optimal value | 13.185 % of government expenditure |
| Support-constrained optimal range | [10.299, 20.356] |
| Response-curve robust optimal value | 7.449 % of government expenditure |
| Raw model optimal within observed range | yes |
| Raw model optimal within support-constrained range | no |
| Observed predictor range | [0.0487, 35.0684] |
| Model-derived optimal extrapolative? | no (within observed range) |
| Model-derived optimal outside best observed bin? | yes |
| Raw best observed range | [9.390, 20.356] |
| Robust best observed range (trimmed) | [5.019, 9.390] |
| Raw best observed outcome mean | 69.965 |
| Robust best observed outcome mean | 68.730 |
| Robust optimal value (bin median) | 7.223 % of government expenditure |
| Raw vs robust optimal delta | 3.403 (+89.1%) |
| Robustness retained fraction | 80.0% (4332/5412) |
| Data sufficiency status | sufficient |
| Data sufficiency reasons | none |
| Reliability score | 0.7492 (moderate) |
| Reliability support component | 0.7243 |
| Reliability significance component | 0.9184 |
| Reliability directional component | 0.8516 |
| Reliability temporal-stability component | 1.0000 |
| Reliability robustness component | 0.1211 |
| Quality tier | exploratory |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum effective level (MED) | 4.042 % of government expenditure (z=9.53) |
| Diminishing-returns knee | Not identified (drop_below_detection_threshold) |
| Saturation / plateau range | Not identified (no_plateau_zone_detected) |
| Support-constrained target reason | identified |
| Raw to support delta | -9.365 (-71.0%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 5 | 8 | interpolation | 0.6517 | 0.0000 | 82 | 5412 |
| Runner-up | predictor_default | 5 | 5 | interpolation | 0.6154 | 0.0363 | 82 | 5412 |
| Runner-up | predictor_default | 5 | 3 | interpolation | 0.6024 | 0.0492 | 82 | 5412 |
| Runner-up | predictor_default | 3 | 8 | interpolation | 0.6019 | 0.0497 | 82 | 5412 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.06241, 0.67475) | 540 | 11 | 0.4143 | 0.4461 | 64.8933 | 65.0508 |
| 2 | [0.67475, 0.99176) | 543 | 18 | 0.8246 | 0.8021 | 64.5862 | 65.0339 |
| 3 | [0.99176, 1.390) | 540 | 27 | 1.1897 | 1.2030 | 63.8395 | 64.0798 |
| 4 | [1.390, 1.750) | 525 | 25 | 1.5477 | 1.5371 | 64.0601 | 64.5740 |
| 5 | [1.750, 2.203) | 546 | 31 | 1.9566 | 1.9418 | 64.1062 | 65.1791 |
| 6 | [2.203, 2.960) | 552 | 21 | 2.5233 | 2.4839 | 64.2814 | 65.5762 |
| 7 | [2.960, 3.932) | 540 | 19 | 3.4659 | 3.5763 | 64.9133 | 66.8395 |
| 8 | [3.932, 4.701) | 543 | 16 | 4.4019 | 4.4604 | 67.8636 | 69.0305 |
| 9 | [4.701, 9.390) | 540 | 17 | 6.7391 | 6.8133 | 67.6220 | 69.1913 |
| 10 | [9.390, 20.356] | 543 | 11 | 13.3988 | 12.6047 | 69.9654 | 70.2491 |

### Distribution Charts

```text
Predictor Distribution (R&D Share of Government Spending)
[0.06241, 1.754) | ############################## 2187
[1.754, 3.445) | ################# 1257
[3.445, 5.136) | ############## 1017
[5.136, 6.827) | ## 141
[6.827, 8.518) | ### 186
[8.518, 10.209) | ## 168
[10.209, 11.900) | # 108
[11.900, 13.591) | ## 150
[13.591, 15.283) | # 30
[15.283, 16.974) | # 69
[16.974, 18.665) | # 72
[18.665, 20.356] | # 27
```

```text
Outcome Distribution (Healthy Life Expectancy (HALE), welfare-aligned)
[44.403, 46.962) | # 31
[46.962, 49.521) | # 23
[49.521, 52.081) | # 35
[52.081, 54.640) | ## 80
[54.640, 57.199) | #### 172
[57.199, 59.758) | ##### 227
[59.758, 62.317) | ########### 535
[62.317, 64.877) | ################# 834
[64.877, 67.436) | ######################### 1210
[67.436, 69.995) | ############################## 1440
[69.995, 72.554) | ################ 761
[72.554, 75.113] | # 64
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| IND | 0.7836 | 1.3893 | 5.277 | 66 |
| UZB | 0.5326 | 1.3687 | 8.405 | 66 |
| GBR | -0.5375 | -1.2438 | -1.686 | 66 |
| CAN | 0.6492 | 1.2012 | 1.513 | 66 |
| MEX | 0.2219 | 1.1587 | 0.700 | 66 |
| TUN | 0.4867 | 1.1195 | 1.401 | 66 |
| FIN | 0.5730 | 1.1068 | 2.905 | 66 |
| ARE | -0.1160 | -1.0573 | -0.117 | 66 |
