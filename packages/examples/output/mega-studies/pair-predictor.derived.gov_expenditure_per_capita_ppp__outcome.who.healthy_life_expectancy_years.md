# Pair Study: Government Expenditure Per Capita (PPP) -> Healthy Life Expectancy (HALE)

- Pair ID: `predictor.derived.gov_expenditure_per_capita_ppp__outcome.who.healthy_life_expectancy_years`
- Lag years: 3
- Duration years: 3
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.7459
- Included subjects: 147
- Skipped subjects: 0
- Total aligned pairs: 9702
- Evidence grade: A
- Data sufficiency: sufficient
- Reliability score: 0.690 (moderate)
- Quality tier: exploratory
- Direction: positive
- Derived uncertainty score: 0.0675 (1 - aggregate significance, not NHST p-value)

## Key Numeric Takeaways

- Estimated best Government Expenditure Per Capita (PPP) level for higher Healthy Life Expectancy (HALE): 5074.0 international $/person.
- Observed-support target from binned response curve: 16474.4 international $/person.
- Model-derived optimum is within observed support but outside the highest-outcome bin; this reflects smooth objective optimization vs coarse bin averages.
- Best observed bin anchor (median/mean) is 15541.4 international $/person; model-optimal minus observed-anchor difference is -10467.3 (-67.4%).
- Robust sensitivity (trimmed 10-90% predictor range) suggests 10258.3 international $/person.
- Raw vs robust optimal differs by 102.2%, indicating strong tail influence.
- Minimum effective level (first consistently positive zone): 302.76 international $/person.
- Diminishing returns likely begin near 596.04 international $/person.
- Saturation/plateau zone starts around 4796.0 international $/person and extends through 16474.4 international $/person.
- Highest observed mean Healthy Life Expectancy (HALE) appears when Government Expenditure Per Capita (PPP) is in [12137.9, 43487.5] (mean outcome 68.988).
- Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Stronger evidence for directional signal relative to other predictors in this report.
- Directional hint: higher Government Expenditure Per Capita (PPP) is associated with better Healthy Life Expectancy (HALE).
- Signal strength: relatively stronger within this report set.

## Plain-Language Summary

- Higher Government Expenditure Per Capita (PPP) tends to align with better Healthy Life Expectancy (HALE).
- The estimate uses 147 subjects and 9702 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [12137.9, 43487.5] (mean outcome 68.988).
- A minimum effective predictor level appears near 302.76 international $/person in the binned response curve.
- Reliability score is 0.690 (moderate); data sufficiency is sufficient.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Forward association sign conflicts with directional score sign; reverse-direction signal may dominate.
- Some subject-level directional scores exceed |1|; this is valid because the score is a difference of two correlations.
- Top temporal profiles are close (score delta 0.0019); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 102.2% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Aggregate forward Pearson | 0.5240 |
| Aggregate reverse Pearson | 0.6935 |
| Aggregate directional score (forward - reverse) | -0.1695 |
| Aggregate effect size (% baseline delta) | 4.3178 |
| Aggregate statistical significance | 0.9325 |
| Weighted average PIS | 0.5553 |
| Aggregate value predicting high outcome | 5074.0132 |
| Aggregate value predicting low outcome | 3906.7314 |
| Aggregate optimal daily value | 5074.0132 |
| Support-constrained optimal value | 16474.4 international $/person |
| Support-constrained optimal range | [13037.0, 43487.5] |
| Response-curve robust optimal value | 10653.8 international $/person |
| Raw model optimal within observed range | yes |
| Raw model optimal within support-constrained range | no |
| Observed predictor range | [8.5216, 63562.8926] |
| Model-derived optimal extrapolative? | no (within observed range) |
| Model-derived optimal outside best observed bin? | yes |
| Raw best observed range | [12137.9, 43487.5] |
| Robust best observed range (trimmed) | [8614.8, 12137.9] |
| Raw best observed outcome mean | 68.988 |
| Robust best observed outcome mean | 68.331 |
| Robust optimal value (bin median) | 10258.3 international $/person |
| Raw vs robust optimal delta | 5184.3 (+102.2%) |
| Robustness retained fraction | 80.6% (7815/9702) |
| Data sufficiency status | sufficient |
| Data sufficiency reasons | none |
| Reliability score | 0.6902 (moderate) |
| Reliability support component | 0.9900 |
| Reliability significance component | 0.9325 |
| Reliability directional component | 1.0000 |
| Reliability temporal-stability component | 0.0637 |
| Reliability robustness component | 0.0000 |
| Quality tier | exploratory |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum effective level (MED) | 302.76 international $/person (z=11.04) |
| Diminishing-returns knee | 596.04 international $/person (ratio=0.113) |
| Saturation / plateau range | [4055.1, 43487.5] |
| Support-constrained target reason | identified |
| Raw to support delta | -11400.4 (-69.2%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 3 | 3 | interpolation | 0.7459 | 0.0000 | 147 | 9702 |
| Runner-up | predictor_default | 3 | 2 | interpolation | 0.7440 | 0.0019 | 147 | 9702 |
| Runner-up | predictor_default | 3 | 1 | interpolation | 0.7375 | 0.0084 | 147 | 9702 |
| Runner-up | predictor_default | 2 | 3 | interpolation | 0.7250 | 0.0209 | 147 | 9702 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [20.664, 235.66) | 918 | 19 | 144.1916 | 135.3459 | 50.8583 | 51.3564 |
| 2 | [235.66, 576.55) | 987 | 36 | 389.1286 | 372.3200 | 55.5347 | 56.5239 |
| 3 | [576.55, 974.44) | 1005 | 43 | 758.0427 | 742.4996 | 57.6074 | 58.7963 |
| 4 | [974.44, 1454.9) | 969 | 52 | 1204.2949 | 1197.9501 | 60.4456 | 62.2117 |
| 5 | [1454.9, 2104.1) | 972 | 53 | 1760.6043 | 1746.6288 | 61.8537 | 63.2352 |
| 6 | [2104.1, 3170.3) | 969 | 53 | 2611.1363 | 2569.1700 | 62.8946 | 64.6878 |
| 7 | [3170.3, 4647.9) | 960 | 48 | 3876.7828 | 3813.0622 | 64.1787 | 65.2958 |
| 8 | [4647.9, 7845.9) | 981 | 45 | 6075.8038 | 5901.9616 | 66.8368 | 66.9449 |
| 9 | [7845.9, 12137.9) | 969 | 41 | 9936.6900 | 9917.4424 | 68.1672 | 68.6811 |
| 10 | [12137.9, 43487.5] | 972 | 32 | 17465.7288 | 15541.3605 | 68.9884 | 69.7712 |

### Distribution Charts

```text
Predictor Distribution (Government Expenditure Per Capita (PPP))
[20.664, 3642.9) | ############################## 6156
[3642.9, 7265.1) | ####### 1458
[7265.1, 10887.4) | #### 873
[10887.4, 14509.6) | ### 618
[14509.6, 18131.9) | # 297
[18131.9, 21754.1) | # 150
[21754.1, 25376.3) | # 57
[25376.3, 28998.6) | # 27
[28998.6, 32620.8) | # 39
[32620.8, 36243.0) | # 9
[36243.0, 39865.3) | # 9
[39865.3, 43487.5] | # 9
```

```text
Outcome Distribution (Healthy Life Expectancy (HALE), welfare-aligned)
[36.729, 39.928) | # 71
[39.928, 43.126) | ## 148
[43.126, 46.325) | #### 238
[46.325, 49.524) | ##### 324
[49.524, 52.723) | ######## 505
[52.723, 55.921) | ########## 695
[55.921, 59.120) | ############# 886
[59.120, 62.319) | #################### 1324
[62.319, 65.517) | ############################ 1890
[65.517, 68.716) | ############################## 1995
[68.716, 71.915) | ####################### 1520
[71.915, 75.113] | ## 106
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| MWI | -0.7737 | -1.2788 | -17.373 | 66 |
| PRY | -0.2080 | -1.0775 | -0.324 | 66 |
| PER | 0.0389 | -0.9044 | 1.065 | 66 |
| PAN | 0.0499 | -0.8815 | 0.869 | 66 |
| MEX | -0.0520 | -0.8732 | 0.070 | 66 |
| FJI | 0.0036 | -0.8729 | 0.182 | 66 |
| CPV | -0.1556 | -0.8285 | 0.417 | 66 |
| VCT | 0.0779 | -0.8073 | 0.138 | 66 |
