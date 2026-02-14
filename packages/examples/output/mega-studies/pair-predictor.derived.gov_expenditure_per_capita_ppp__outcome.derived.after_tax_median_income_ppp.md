# Pair Study: Government Expenditure Per Capita (PPP) -> After-Tax Median Income (PPP)

- Pair ID: `predictor.derived.gov_expenditure_per_capita_ppp__outcome.derived.after_tax_median_income_ppp`
- Lag years: 3
- Duration years: 3
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.5919
- Included subjects: 175
- Skipped subjects: 0
- Total aligned pairs: 5915
- Evidence grade: A
- Data sufficiency: sufficient
- Reliability score: 0.566 (moderate)
- Quality tier: exploratory
- Direction: neutral
- Derived uncertainty score: 0.1002 (1 - aggregate significance, not NHST p-value)

## Key Numeric Takeaways

- Estimated best Government Expenditure Per Capita (PPP) level for higher After-Tax Median Income (PPP): 5310.5 international $/person.
- Observed-support target from binned response curve: 15206.7 international $/person.
- Model-derived optimum is within observed support but outside the highest-outcome bin; this reflects smooth objective optimization vs coarse bin averages.
- Best observed bin anchor (median/mean) is 14374.6 international $/person; model-optimal minus observed-anchor difference is -9064.1 (-63.1%).
- Robust sensitivity (trimmed 10-90% predictor range) suggests 8890.1 international $/person.
- Raw vs robust optimal differs by 67.4%, indicating strong tail influence.
- Minimum effective level (first consistently positive zone): 314.42 international $/person.
- No reliable diminishing-returns knee detected (drop_below_detection_threshold).
- No stable plateau zone detected (no_plateau_zone_detected).
- Highest observed mean After-Tax Median Income (PPP) appears when Government Expenditure Per Capita (PPP) is in [10869.0, 48525.1] (mean outcome 50585.9).
- Directional signal is neutral; use caution when treating the estimated optimal value as prescriptive.

## Decision Summary

- Interpretation: Moderate evidence; plausible signal but still sensitive to model assumptions.
- Directional hint: no stable increase/decrease signal; prioritize observed-support targets.
- Signal strength: relatively stronger within this report set.

## Plain-Language Summary

- No strong directional pattern is detected between Government Expenditure Per Capita (PPP) and After-Tax Median Income (PPP).
- The estimate uses 175 subjects and 5915 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [10869.0, 48525.1] (mean outcome 50585.9).
- A minimum effective predictor level appears near 314.42 international $/person in the binned response curve.
- Reliability score is 0.566 (moderate); data sufficiency is sufficient.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Some subject-level directional scores exceed |1|; this is valid because the score is a difference of two correlations.
- Top temporal profiles are close (score delta 0.0006); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 67.4% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Aggregate forward Pearson | 0.8253 |
| Aggregate reverse Pearson | 0.8522 |
| Aggregate directional score (forward - reverse) | -0.0270 |
| Aggregate effect size (% baseline delta) | 104.3888 |
| Aggregate statistical significance | 0.8998 |
| Weighted average PIS | 0.7829 |
| Aggregate value predicting high outcome | 5310.5064 |
| Aggregate value predicting low outcome | 2896.8634 |
| Aggregate optimal daily value | 5310.5064 |
| Support-constrained optimal value | 15206.7 international $/person |
| Support-constrained optimal range | [11928.9, 48525.1] |
| Response-curve robust optimal value | 9214.8 international $/person |
| Raw model optimal within observed range | yes |
| Raw model optimal within support-constrained range | no |
| Observed predictor range | [8.5216, 63562.8926] |
| Model-derived optimal extrapolative? | no (within observed range) |
| Model-derived optimal outside best observed bin? | yes |
| Raw best observed range | [10869.0, 48525.1] |
| Robust best observed range (trimmed) | [7136.5, 10868.1] |
| Raw best observed outcome mean | 50585.9 |
| Robust best observed outcome mean | 33457.2 |
| Robust optimal value (bin median) | 8890.1 international $/person |
| Raw vs robust optimal delta | 3579.6 (+67.4%) |
| Robustness retained fraction | 80.0% (4731/5915) |
| Data sufficiency status | sufficient |
| Data sufficiency reasons | none |
| Reliability score | 0.5665 (moderate) |
| Reliability support component | 0.9929 |
| Reliability significance component | 0.8998 |
| Reliability directional component | 0.1798 |
| Reliability temporal-stability component | 0.0202 |
| Reliability robustness component | 0.3622 |
| Quality tier | exploratory |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum effective level (MED) | 314.42 international $/person (z=18.74) |
| Diminishing-returns knee | Not identified (drop_below_detection_threshold) |
| Saturation / plateau range | Not identified (no_plateau_zone_detected) |
| Support-constrained target reason | identified |
| Raw to support delta | -9896.2 (-65.1%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 3 | 3 | interpolation | 0.5919 | 0.0000 | 175 | 5915 |
| Runner-up | predictor_default | 3 | 2 | interpolation | 0.5913 | 0.0006 | 175 | 5915 |
| Runner-up | predictor_default | 3 | 1 | interpolation | 0.5902 | 0.0017 | 175 | 5915 |
| Runner-up | predictor_default | 2 | 3 | interpolation | 0.5850 | 0.0069 | 175 | 5915 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [20.664, 250.47) | 592 | 27 | 153.4990 | 138.0197 | 1346.4365 | 1220.0000 |
| 2 | [250.47, 547.92) | 579 | 45 | 380.2848 | 352.7108 | 2837.4661 | 2700.0000 |
| 3 | [547.92, 918.04) | 603 | 53 | 718.8026 | 711.1780 | 4239.6375 | 3910.0000 |
| 4 | [918.04, 1362.7) | 589 | 69 | 1143.9389 | 1156.0324 | 5984.0128 | 5770.0000 |
| 5 | [1362.7, 1987.2) | 594 | 67 | 1658.9596 | 1634.8123 | 7492.5727 | 7367.5573 |
| 6 | [1987.2, 3192.9) | 577 | 72 | 2531.1796 | 2487.7187 | 12634.4173 | 11552.1191 |
| 7 | [3192.9, 4457.7) | 606 | 75 | 3755.5231 | 3785.8651 | 16164.7138 | 14640.5515 |
| 8 | [4457.7, 6737.9) | 592 | 73 | 5415.6689 | 5391.5248 | 25177.8462 | 21199.8622 |
| 9 | [6737.9, 10869.0) | 591 | 58 | 8536.6297 | 8387.7030 | 31412.3743 | 28720.0000 |
| 10 | [10869.0, 48525.1] | 592 | 46 | 16193.7273 | 14374.5759 | 50585.8514 | 47805.0000 |

### Distribution Charts

```text
Predictor Distribution (Government Expenditure Per Capita (PPP))
[20.664, 4062.7) | ############################## 4001
[4062.7, 8104.7) | ####### 989
[8104.7, 12146.8) | ### 455
[12146.8, 16188.8) | ## 268
[16188.8, 20230.8) | # 113
[20230.8, 24272.9) | # 38
[24272.9, 28314.9) | # 21
[28314.9, 32357.0) | # 17
[32357.0, 36399.0) | # 4
[36399.0, 40441.0) | # 4
[40441.0, 44483.1) | # 3
[44483.1, 48525.1] | # 2
```

```text
Outcome Distribution (After-Tax Median Income (PPP), welfare-aligned)
[280.00, 10724.2) | ############################## 3264
[10724.2, 21168.3) | ########### 1158
[21168.3, 31612.5) | ###### 616
[31612.5, 42056.7) | ### 347
[42056.7, 52500.8) | ## 231
[52500.8, 62945.0) | # 121
[62945.0, 73389.2) | # 78
[73389.2, 83833.3) | # 38
[83833.3, 94277.5) | # 28
[94277.5, 104722) | # 21
[104722, 115166) | # 9
[115166, 125610] | # 4
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| AFE | -0.7863 | -1.0863 | -42.026 | 34 |
| GAB | -0.8803 | -0.8589 | -26.069 | 34 |
| NIC | 0.1486 | -0.6915 | 27.404 | 34 |
| SAU | 0.3036 | 0.5570 | 12.920 | 34 |
| CAF | 0.3338 | 0.5544 | 35.769 | 34 |
| TLS | 0.2914 | 0.5280 | 47.480 | 34 |
| MWI | -0.5359 | -0.5174 | -28.903 | 34 |
| SYC | -0.5214 | -0.4727 | -18.565 | 34 |
