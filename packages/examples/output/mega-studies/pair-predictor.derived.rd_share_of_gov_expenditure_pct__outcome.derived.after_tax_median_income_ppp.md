# Pair Study: R&D Share of Government Spending -> After-Tax Median Income (PPP)

- Pair ID: `predictor.derived.rd_share_of_gov_expenditure_pct__outcome.derived.after_tax_median_income_ppp`
- Lag years: 3
- Duration years: 8
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.6419
- Included subjects: 100
- Skipped subjects: 0
- Total aligned pairs: 3380
- Evidence grade: A
- Data sufficiency: sufficient
- Reliability score: 0.638 (moderate)
- Quality tier: exploratory
- Direction: positive
- Derived uncertainty score: 0.1237 (1 - aggregate significance, not NHST p-value)

## Key Numeric Takeaways

- Decision-target R&D Share of Government Spending level for higher After-Tax Median Income (PPP): 12.690 % of government expenditure (support constrained).
- Observed-support target from binned response curve: 12.690 % of government expenditure.
- Model-derived optimum is within observed support but outside the highest-outcome bin; this reflects smooth objective optimization vs coarse bin averages.
- Best observed bin anchor (median/mean) is 12.055 % of government expenditure; model-optimal minus observed-anchor difference is -8.013 (-66.5%).
- Robust sensitivity (trimmed 10-90% predictor range) suggests 7.495 % of government expenditure.
- Raw vs robust optimal differs by 85.4%, indicating strong tail influence.
- Minimum effective level (first consistently positive zone): 3.602 % of government expenditure.
- No reliable diminishing-returns knee detected (drop_below_detection_threshold).
- No stable plateau zone detected (no_plateau_zone_detected).
- Highest observed mean After-Tax Median Income (PPP) appears when R&D Share of Government Spending is in [8.637, 26.042] (mean outcome 49865.4).
- Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Moderate evidence; plausible signal but still sensitive to model assumptions.
- Directional hint: higher R&D Share of Government Spending is associated with better After-Tax Median Income (PPP).
- Signal strength: relatively stronger within this report set.

## Plain-Language Summary

- Higher R&D Share of Government Spending tends to align with better After-Tax Median Income (PPP).
- The estimate uses 100 subjects and 3380 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [8.637, 26.042] (mean outcome 49865.4).
- A minimum effective predictor level appears near 3.602 % of government expenditure in the binned response curve.
- Reliability score is 0.638 (moderate); data sufficiency is sufficient.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Some subject-level directional scores exceed |1|; this is valid because the score is a difference of two correlations.
- Top temporal profiles are close (score delta 0.0146); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 85.4% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Aggregate forward Pearson | 0.2550 |
| Aggregate reverse Pearson | 0.1293 |
| Aggregate directional score (forward - reverse) | 0.1257 |
| Aggregate effect size (% baseline delta) | 46.2772 |
| Aggregate statistical significance | 0.8763 |
| Weighted average PIS | 0.6375 |
| Aggregate value predicting high outcome | 4.0427 |
| Aggregate value predicting low outcome | 3.6182 |
| Aggregate optimal daily value | 4.0427 |
| Decision target value (reader-facing) | 12.690 % of government expenditure (support constrained) |
| Model-derived optimum (diagnostics) | 4.043 % of government expenditure |
| Support-constrained optimal value | 12.690 % of government expenditure |
| Support-constrained optimal range | [9.823, 26.042] |
| Response-curve robust optimal value | 5.028 % of government expenditure |
| Raw model optimal within observed range | yes |
| Raw model optimal within support-constrained range | no |
| Observed predictor range | [0.0487, 35.0684] |
| Model-derived optimal extrapolative? | no (within observed range) |
| Model-derived optimal outside best observed bin? | yes |
| Raw best observed range | [8.637, 26.042] |
| Robust best observed range (trimmed) | [5.623, 8.636] |
| Raw best observed outcome mean | 49865.4 |
| Robust best observed outcome mean | 32376.4 |
| Robust optimal value (bin median) | 7.495 % of government expenditure |
| Raw vs robust optimal delta | 3.452 (+85.4%) |
| Robustness retained fraction | 80.0% (2704/3380) |
| Data sufficiency status | sufficient |
| Data sufficiency reasons | none |
| Reliability score | 0.6377 (moderate) |
| Reliability support component | 0.6150 |
| Reliability significance component | 0.8763 |
| Reliability directional component | 0.8381 |
| Reliability temporal-stability component | 0.4862 |
| Reliability robustness component | 0.1623 |
| Quality tier | exploratory |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum effective level (MED) | 3.602 % of government expenditure (z=1.44) |
| Diminishing-returns knee | Not identified (drop_below_detection_threshold) |
| Saturation / plateau range | Not identified (no_plateau_zone_detected) |
| Support-constrained target reason | identified |
| Raw to support delta | -8.648 (-68.1%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 3 | 8 | interpolation | 0.6419 | 0.0000 | 100 | 3380 |
| Runner-up | predictor_default | 2 | 8 | interpolation | 0.6273 | 0.0146 | 100 | 3380 |
| Runner-up | predictor_default | 1 | 8 | interpolation | 0.6198 | 0.0221 | 100 | 3380 |
| Runner-up | predictor_default | 3 | 5 | interpolation | 0.6143 | 0.0276 | 100 | 3380 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.06241, 0.70236) | 338 | 17 | 0.4436 | 0.4822 | 20889.3491 | 10975.0000 |
| 2 | [0.70236, 1.053) | 338 | 24 | 0.8840 | 0.8999 | 11084.2012 | 7515.0000 |
| 3 | [1.053, 1.513) | 321 | 31 | 1.3237 | 1.3439 | 13765.9502 | 10220.0000 |
| 4 | [1.513, 2.042) | 345 | 34 | 1.7745 | 1.7639 | 14351.9920 | 13240.0000 |
| 5 | [2.042, 2.753) | 340 | 36 | 2.3336 | 2.3203 | 15694.5133 | 13865.0000 |
| 6 | [2.753, 3.356) | 341 | 29 | 3.0243 | 3.0247 | 15964.6396 | 12270.0000 |
| 7 | [3.356, 4.303) | 327 | 22 | 3.7784 | 3.7557 | 26585.8573 | 22050.0000 |
| 8 | [4.303, 5.044) | 354 | 21 | 4.5966 | 4.6044 | 27638.2126 | 26994.0018 |
| 9 | [5.044, 8.637) | 338 | 26 | 7.0072 | 7.1884 | 32964.2171 | 28595.0000 |
| 10 | [8.637, 26.042] | 338 | 16 | 12.9798 | 12.0553 | 49865.4252 | 45180.0000 |

### Distribution Charts

```text
Predictor Distribution (R&D Share of Government Spending)
[0.06241, 2.227) | ############################## 1472
[2.227, 4.392) | ################### 940
[4.392, 6.557) | ######## 401
[6.557, 8.722) | ##### 236
[8.722, 10.887) | ## 97
[10.887, 13.052) | ## 118
[13.052, 15.217) | # 28
[15.217, 17.382) | # 39
[17.382, 19.547) | # 40
[19.547, 21.712) | # 7
[23.877, 26.042] | # 2
```

```text
Outcome Distribution (After-Tax Median Income (PPP), welfare-aligned)
[570.00, 10990.0) | ############################## 1183
[10990.0, 21410.0) | ##################### 830
[21410.0, 31830.0) | ############## 537
[31830.0, 42250.0) | ######## 327
[42250.0, 52670.0) | ##### 210
[52670.0, 63090.0) | ### 117
[63090.0, 73510.0) | ## 76
[73510.0, 83930.0) | # 38
[83930.0, 94350.0) | # 29
[94350.0, 104770) | # 20
[104770, 115190) | # 9
[115190, 125610] | # 4
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| ZAF | 0.6496 | 1.4005 | 37.174 | 34 |
| ECA | -0.5431 | -1.2834 | -40.511 | 34 |
| CRI | 0.8377 | 1.2322 | 139.543 | 34 |
| PAN | -0.4740 | -1.1062 | -57.046 | 34 |
| RUS | 0.1536 | 1.0508 | 9.688 | 34 |
| KWT | 0.1041 | 1.0160 | 0.799 | 34 |
| FIN | 0.6949 | 1.0103 | 58.120 | 34 |
| CAN | 0.7998 | 0.9768 | 81.703 | 34 |
