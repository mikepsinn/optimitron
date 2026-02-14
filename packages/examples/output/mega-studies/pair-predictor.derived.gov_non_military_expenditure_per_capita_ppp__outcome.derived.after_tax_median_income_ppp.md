# Pair Study: Civilian Government Expenditure Per Capita (PPP) -> After-Tax Median Income (PPP)

- Pair ID: `predictor.derived.gov_non_military_expenditure_per_capita_ppp__outcome.derived.after_tax_median_income_ppp`
- Lag years: 3
- Duration years: 3
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.5881
- Included subjects: 148
- Skipped subjects: 0
- Total aligned pairs: 5001
- Evidence grade: A
- Data sufficiency: sufficient
- Reliability score: 0.547 (low)
- Quality tier: exploratory
- Direction: neutral
- Derived uncertainty score: 0.0998 (1 - aggregate significance, not NHST p-value)

## Key Numeric Takeaways

- Decision-target Civilian Government Expenditure Per Capita (PPP) level for higher After-Tax Median Income (PPP): 14637.5 international $/person (support constrained).
- Observed-support target from binned response curve: 14637.5 international $/person.
- Model-derived optimum is within observed support but outside the highest-outcome bin; this reflects smooth objective optimization vs coarse bin averages.
- Best observed bin anchor (median/mean) is 13696.7 international $/person; model-optimal minus observed-anchor difference is -8483.4 (-61.9%).
- Robust sensitivity (trimmed 10-90% predictor range) suggests 8929.0 international $/person.
- Raw vs robust optimal differs by 71.3%, indicating strong tail influence.
- Minimum effective level (first consistently positive zone): 246.50 international $/person.
- No reliable diminishing-returns knee detected (drop_below_detection_threshold).
- No stable plateau zone detected (no_plateau_zone_detected).
- Highest observed mean After-Tax Median Income (PPP) appears when Civilian Government Expenditure Per Capita (PPP) is in [10279.3, 47874.3] (mean outcome 50214.8).
- Directional signal is neutral; use caution when treating the estimated optimal value as prescriptive.

## Decision Summary

- Interpretation: Stronger evidence for directional signal relative to other predictors in this report.
- Directional hint: no stable increase/decrease signal; prioritize observed-support targets.
- Signal strength: relatively stronger within this report set.

## Plain-Language Summary

- No strong directional pattern is detected between Civilian Government Expenditure Per Capita (PPP) and After-Tax Median Income (PPP).
- The estimate uses 148 subjects and 5001 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [10279.3, 47874.3] (mean outcome 50214.8).
- A minimum effective predictor level appears near 246.50 international $/person in the binned response curve.
- Reliability score is 0.547 (low); data sufficiency is sufficient.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Some subject-level directional scores exceed |1|; this is valid because the score is a difference of two correlations.
- Top temporal profiles are close (score delta 0.0032); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 71.3% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Aggregate forward Pearson | 0.8436 |
| Aggregate reverse Pearson | 0.8666 |
| Aggregate directional score (forward - reverse) | -0.0231 |
| Aggregate effect size (% baseline delta) | 107.9927 |
| Aggregate statistical significance | 0.9002 |
| Weighted average PIS | 0.7997 |
| Aggregate value predicting high outcome | 5213.3706 |
| Aggregate value predicting low outcome | 2660.3716 |
| Aggregate optimal daily value | 5213.3706 |
| Decision target value (reader-facing) | 14637.5 international $/person (support constrained) |
| Model-derived optimum (diagnostics) | 5213.4 international $/person |
| Support-constrained optimal value | 14637.5 international $/person |
| Support-constrained optimal range | [11104.4, 47874.3] |
| Response-curve robust optimal value | 9175.3 international $/person |
| Raw model optimal within observed range | yes |
| Raw model optimal within support-constrained range | no |
| Observed predictor range | [7.6041, 62399.1940] |
| Model-derived optimal extrapolative? | no (within observed range) |
| Model-derived optimal outside best observed bin? | yes |
| Raw best observed range | [10279.3, 47874.3] |
| Robust best observed range (trimmed) | [7202.5, 10279.3] |
| Raw best observed outcome mean | 50214.8 |
| Robust best observed outcome mean | 35832.3 |
| Robust optimal value (bin median) | 8929.0 international $/person |
| Raw vs robust optimal delta | 3715.7 (+71.3%) |
| Robustness retained fraction | 80.4% (4019/5001) |
| Data sufficiency status | sufficient |
| Data sufficiency reasons | none |
| Reliability score | 0.5470 (low) |
| Reliability support component | 0.9101 |
| Reliability significance component | 0.9002 |
| Reliability directional component | 0.1538 |
| Reliability temporal-stability component | 0.1051 |
| Reliability robustness component | 0.3192 |
| Quality tier | exploratory |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum effective level (MED) | 246.50 international $/person (z=11.39) |
| Diminishing-returns knee | Not identified (drop_below_detection_threshold) |
| Saturation / plateau range | Not identified (no_plateau_zone_detected) |
| Support-constrained target reason | identified |
| Raw to support delta | -9424.1 (-64.4%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 3 | 3 | interpolation | 0.5881 | 0.0000 | 148 | 5001 |
| Runner-up | predictor_default | 3 | 2 | interpolation | 0.5850 | 0.0032 | 148 | 5001 |
| Runner-up | predictor_default | 3 | 1 | interpolation | 0.5815 | 0.0066 | 148 | 5001 |
| Runner-up | predictor_default | 2 | 3 | interpolation | 0.5766 | 0.0115 | 148 | 5001 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [7.604, 208.35) | 482 | 21 | 112.1199 | 104.8715 | 1291.0174 | 1160.0000 |
| 2 | [208.35, 435.58) | 518 | 38 | 291.2491 | 285.0898 | 2575.7031 | 2370.0000 |
| 3 | [435.58, 787.92) | 500 | 45 | 591.9147 | 581.5755 | 4338.9913 | 3860.0000 |
| 4 | [787.92, 1176.2) | 492 | 59 | 987.4203 | 968.5864 | 6156.8984 | 5909.5321 |
| 5 | [1176.2, 1913.3) | 508 | 58 | 1545.7130 | 1564.6194 | 8246.5561 | 7992.4863 |
| 6 | [1913.3, 3080.2) | 477 | 60 | 2478.5799 | 2412.5586 | 12234.2639 | 11690.0000 |
| 7 | [3080.2, 4292.3) | 523 | 68 | 3635.7349 | 3590.6432 | 15357.5435 | 14650.3394 |
| 8 | [4292.3, 6669.7) | 500 | 65 | 5292.7728 | 5141.9361 | 24393.0413 | 21568.3500 |
| 9 | [6669.7, 10279.3) | 500 | 54 | 8441.1003 | 8494.4286 | 34537.7064 | 30294.4029 |
| 10 | [10279.3, 47874.3] | 501 | 43 | 15551.1837 | 13696.7368 | 50214.7706 | 46720.0000 |

### Distribution Charts

```text
Predictor Distribution (Civilian Government Expenditure Per Capita (PPP))
[7.604, 3996.5) | ############################## 3415
[3996.5, 7985.4) | ####### 780
[7985.4, 11974.3) | #### 460
[11974.3, 15963.2) | ## 179
[15963.2, 19952.0) | # 83
[19952.0, 23940.9) | # 50
[23940.9, 27929.8) | # 21
[27929.8, 31918.7) | # 2
[31918.7, 35907.6) | # 3
[35907.6, 39896.5) | # 3
[39896.5, 43885.4) | # 3
[43885.4, 47874.3] | # 2
```

```text
Outcome Distribution (After-Tax Median Income (PPP), welfare-aligned)
[280.00, 10724.2) | ############################## 2692
[10724.2, 21168.3) | ########### 985
[21168.3, 31612.5) | ###### 541
[31612.5, 42056.7) | #### 319
[42056.7, 52500.8) | ### 227
[52500.8, 62945.0) | # 112
[62945.0, 73389.2) | # 70
[73389.2, 83833.3) | # 29
[83833.3, 94277.5) | # 13
[94277.5, 104722) | # 8
[104722, 115166) | # 3
[115166, 125610] | # 2
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| AFE | -0.7873 | -1.0862 | -42.026 | 34 |
| SAU | 0.4000 | 1.0676 | 14.645 | 34 |
| KWT | -0.1894 | -0.5957 | -8.506 | 34 |
| GAB | -0.7776 | -0.5902 | -28.121 | 34 |
| CAF | 0.2814 | 0.5544 | 35.769 | 34 |
| GNQ | 0.2586 | -0.5479 | 34.860 | 34 |
| TLS | 0.2947 | 0.5255 | 47.480 | 34 |
| MWI | -0.5415 | -0.5227 | -28.903 | 34 |
