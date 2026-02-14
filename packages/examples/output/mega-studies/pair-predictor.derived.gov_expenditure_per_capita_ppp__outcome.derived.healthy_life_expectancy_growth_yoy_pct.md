# Pair Study: Government Expenditure Per Capita (PPP) -> Healthy Life Expectancy Growth (YoY %)

- Pair ID: `predictor.derived.gov_expenditure_per_capita_ppp__outcome.derived.healthy_life_expectancy_growth_yoy_pct`
- Lag years: 1
- Duration years: 3
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.3555
- Included subjects: 147
- Skipped subjects: 0
- Total aligned pairs: 3087
- Evidence grade: F
- Data sufficiency: sufficient
- Reliability score: 0.407 (low)
- Quality tier: insufficient
- Direction: negative
- Derived uncertainty score: 0.8151 (1 - aggregate significance, not NHST p-value)

## Key Numeric Takeaways

- Estimated best Government Expenditure Per Capita (PPP) level for higher Healthy Life Expectancy Growth (YoY %): 4531.5 international $/person.
- Observed-support target from binned response curve: 138.29 international $/person.
- Model-derived optimum is within observed support but outside the highest-outcome bin; this reflects smooth objective optimization vs coarse bin averages.
- Best observed bin anchor (median/mean) is 162.53 international $/person; model-optimal minus observed-anchor difference is 4369.0 (+2688.1%).
- Robust sensitivity (trimmed 10-90% predictor range) suggests 716.19 international $/person.
- Raw vs robust optimal differs by 84.2%, indicating strong tail influence.
- Minimum effective level not reliably identified (no_consistent_effective_dose_detected).
- No reliable diminishing-returns knee detected (drop_below_detection_threshold).
- Saturation/plateau zone starts around 8422.5 international $/person and extends through 17825.6 international $/person.
- Highest observed mean Healthy Life Expectancy Growth (YoY %) appears when Government Expenditure Per Capita (PPP) is in [20.664, 260.72) (mean outcome 1.070).
- Direction is negative in this analysis, so lowering this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Exploratory evidence only; use primarily for hypothesis generation.
- Directional hint: lower Government Expenditure Per Capita (PPP) is associated with better Healthy Life Expectancy Growth (YoY %).
- Signal strength: moderate-to-weak; avoid hard policy conclusions from this pair alone.

## Plain-Language Summary

- Higher Government Expenditure Per Capita (PPP) tends to align with worse Healthy Life Expectancy Growth (YoY %).
- The estimate uses 147 subjects and 3087 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [20.664, 260.72) (mean outcome 1.070).
- Reliability score is 0.407 (low); data sufficiency is sufficient.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Weak aggregate significance (<0.70).
- Forward association sign conflicts with directional score sign; reverse-direction signal may dominate.
- Some subject-level directional scores exceed |1|; this is valid because the score is a difference of two correlations.
- Top temporal profiles are close (score delta 0.0126); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 84.2% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Aggregate forward Pearson | -0.0877 |
| Aggregate reverse Pearson | -0.1513 |
| Aggregate directional score (forward - reverse) | 0.0636 |
| Aggregate effect size (% baseline delta) | -357.3362 |
| Aggregate statistical significance | 0.1849 |
| Weighted average PIS | 0.0671 |
| Aggregate value predicting high outcome | 4531.5144 |
| Aggregate value predicting low outcome | 4726.0129 |
| Aggregate optimal daily value | 4531.5144 |
| Support-constrained optimal value | 138.29 international $/person |
| Support-constrained optimal range | [20.664, 230.93) |
| Response-curve robust optimal value | 4477.5 international $/person |
| Raw model optimal within observed range | yes |
| Raw model optimal within support-constrained range | no |
| Observed predictor range | [8.5216, 63562.8926] |
| Model-derived optimal extrapolative? | no (within observed range) |
| Model-derived optimal outside best observed bin? | yes |
| Raw best observed range | [20.664, 260.72) |
| Robust best observed range (trimmed) | [576.55, 888.95) |
| Raw best observed outcome mean | 1.070 |
| Robust best observed outcome mean | 0.56265 |
| Robust optimal value (bin median) | 716.19 international $/person |
| Raw vs robust optimal delta | -3815.3 (-84.2%) |
| Robustness retained fraction | 80.0% (2469/3087) |
| Data sufficiency status | sufficient |
| Data sufficiency reasons | none |
| Reliability score | 0.4072 (low) |
| Reliability support component | 0.7472 |
| Reliability significance component | 0.1849 |
| Reliability directional component | 0.4240 |
| Reliability temporal-stability component | 0.4206 |
| Reliability robustness component | 0.1756 |
| Quality tier | insufficient |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum effective level (MED) | Not identified (no_consistent_effective_dose_detected) |
| Diminishing-returns knee | Not identified (drop_below_detection_threshold) |
| Saturation / plateau range | [6752.2, 48525.1] |
| Support-constrained target reason | identified |
| Raw to support delta | 4393.2 (+3176.8%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 1 | 3 | interpolation | 0.3555 | 0.0000 | 147 | 3087 |
| Runner-up | predictor_default | 0 | 3 | interpolation | 0.3429 | 0.0126 | 147 | 3087 |
| Runner-up | predictor_default | 1 | 2 | interpolation | 0.3423 | 0.0132 | 147 | 3087 |
| Runner-up | predictor_default | 0 | 2 | interpolation | 0.3356 | 0.0199 | 147 | 3087 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [20.664, 260.72) | 309 | 22 | 162.3044 | 162.5313 | 1.0697 | 1.0170 |
| 2 | [260.72, 643.52) | 309 | 36 | 452.4421 | 446.8952 | 0.3365 | 0.4656 |
| 3 | [643.52, 1059.6) | 308 | 45 | 847.3049 | 851.5018 | 0.6483 | 0.4870 |
| 4 | [1059.6, 1634.8) | 303 | 47 | 1330.7248 | 1306.5140 | -0.0037 | 0.2548 |
| 5 | [1634.8, 2380.0) | 306 | 52 | 1973.9505 | 1947.3846 | -0.1648 | 0.1131 |
| 6 | [2380.0, 3535.3) | 317 | 52 | 2932.7353 | 2927.9997 | -0.1079 | 0.0741 |
| 7 | [3535.3, 5116.8) | 309 | 46 | 4221.2400 | 4164.8297 | 0.4279 | 0.2763 |
| 8 | [5116.8, 8860.5) | 308 | 49 | 6792.2630 | 6752.1526 | -0.0846 | 0.1510 |
| 9 | [8860.5, 13160.0) | 309 | 41 | 10922.6572 | 10878.4908 | 0.0116 | 0.2270 |
| 10 | [13160.0, 48525.1] | 309 | 33 | 18765.2626 | 16543.9196 | 0.0662 | 0.1622 |

### Distribution Charts

```text
Predictor Distribution (Government Expenditure Per Capita (PPP))
[20.664, 4062.7) | ############################## 1988
[4062.7, 8104.7) | ####### 431
[8104.7, 12146.8) | #### 294
[12146.8, 16188.8) | ### 207
[16188.8, 20230.8) | # 88
[20230.8, 24272.9) | # 36
[24272.9, 28314.9) | # 17
[28314.9, 32357.0) | # 15
[32357.0, 36399.0) | # 3
[36399.0, 40441.0) | # 3
[40441.0, 44483.1) | # 3
[44483.1, 48525.1] | # 2
```

```text
Outcome Distribution (Healthy Life Expectancy Growth (YoY %), welfare-aligned)
[-18.191, -14.967) | # 3
[-14.967, -11.743) | # 7
[-11.743, -8.519) | # 20
[-8.519, -5.296) | ## 113
[-5.296, -2.072) | ####### 381
[-2.072, 1.152) | ############################## 1633
[1.152, 4.376) | ############# 718
[4.376, 7.600) | ### 155
[7.600, 10.824) | # 43
[10.824, 14.048) | # 8
[14.048, 17.272) | # 5
[17.272, 20.496] | # 1
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| EGY | -0.2517 | -1.1850 | -637.814 | 21 |
| NPL | -0.4409 | -0.9512 | 21.070 | 21 |
| GBR | -0.0418 | -0.7850 | -81.125 | 21 |
| TJK | -0.1799 | 0.7779 | -103.739 | 21 |
| MWI | 0.7776 | 0.7770 | -275.414 | 21 |
| LKA | -0.1474 | -0.7646 | -211.664 | 21 |
| UZB | -0.0599 | 0.7625 | 16.956 | 21 |
| NOR | -0.0923 | -0.7555 | -36.490 | 21 |
