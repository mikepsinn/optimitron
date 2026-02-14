# Pair Study: R&D Expenditure Per Capita (PPP) -> Healthy Life Expectancy Growth (YoY %)

- Pair ID: `predictor.derived.rd_expenditure_per_capita_ppp__outcome.derived.healthy_life_expectancy_growth_yoy_pct`
- Lag years: 3
- Duration years: 2
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 16
- Temporal candidates with valid results: 16
- Temporal profile score: 0.4405
- Included subjects: 95
- Skipped subjects: 0
- Total aligned pairs: 1995
- Evidence grade: F
- Data sufficiency: insufficient_data
- Reliability score: 0.399 (low)
- Quality tier: insufficient
- Direction: negative
- Derived uncertainty score: 0.7094 (1 - aggregate significance, not NHST p-value)

## Key Numeric Takeaways

- Estimated best R&D Expenditure Per Capita (PPP) level for higher Healthy Life Expectancy Growth (YoY %): 228.03 international $/person.
- Observed-support target from binned response curve: 1.894 international $/person.
- Model-derived optimum is within observed support but outside the highest-outcome bin; this reflects smooth objective optimization vs coarse bin averages.
- Best observed bin anchor (median/mean) is 2.254 international $/person; model-optimal minus observed-anchor difference is 225.77 (+10014.4%).
- Robust sensitivity (trimmed 10-90% predictor range) suggests 492.19 international $/person.
- Raw vs robust optimal differs by 115.8%, indicating strong tail influence.
- Minimum effective level not reliably identified (no_consistent_effective_dose_detected).
- No reliable diminishing-returns knee detected (drop_below_detection_threshold).
- Saturation/plateau zone starts around 142.65 international $/person and extends through 1340.2 international $/person.
- Highest observed mean Healthy Life Expectancy Growth (YoY %) appears when R&D Expenditure Per Capita (PPP) is in [0.19723, 4.621) (mean outcome 0.64005).
- Direction is negative in this analysis, so lowering this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Exploratory evidence only; use primarily for hypothesis generation.
- Directional hint: lower R&D Expenditure Per Capita (PPP) is associated with better Healthy Life Expectancy Growth (YoY %).
- Signal strength: moderate-to-weak; avoid hard policy conclusions from this pair alone.

## Plain-Language Summary

- Higher R&D Expenditure Per Capita (PPP) tends to align with worse Healthy Life Expectancy Growth (YoY %).
- The estimate uses 95 subjects and 1995 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [0.19723, 4.621) (mean outcome 0.64005).
- Reliability score is 0.399 (low); data sufficiency is insufficient_data.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Weak aggregate significance (<0.70).
- Some subject-level directional scores exceed |1|; this is valid because the score is a difference of two correlations.
- Top temporal profiles are close (score delta 0.0010); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 115.8% from raw optimal; tail observations materially influence target.
- Data sufficiency warning: aligned-pair support below minimum (1995 < 2000)

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Aggregate forward Pearson | -0.1693 |
| Aggregate reverse Pearson | 0.0008 |
| Aggregate directional score (forward - reverse) | -0.1701 |
| Aggregate effect size (% baseline delta) | 90.9776 |
| Aggregate statistical significance | 0.2906 |
| Weighted average PIS | 0.1519 |
| Aggregate value predicting high outcome | 228.0252 |
| Aggregate value predicting low outcome | 264.2399 |
| Aggregate optimal daily value | 228.0252 |
| Support-constrained optimal value | 1.894 international $/person |
| Support-constrained optimal range | [0.19723, 3.816) |
| Response-curve robust optimal value | 119.44 international $/person |
| Raw model optimal within observed range | yes |
| Raw model optimal within support-constrained range | no |
| Observed predictor range | [0.1972, 3227.4604] |
| Model-derived optimal extrapolative? | no (within observed range) |
| Model-derived optimal outside best observed bin? | yes |
| Raw best observed range | [0.19723, 4.621) |
| Robust best observed range (trimmed) | [392.51, 642.18) |
| Raw best observed outcome mean | 0.64005 |
| Robust best observed outcome mean | 0.33103 |
| Robust optimal value (bin median) | 492.19 international $/person |
| Raw vs robust optimal delta | 264.16 (+115.8%) |
| Robustness retained fraction | 80.0% (1596/1995) |
| Data sufficiency status | insufficient_data |
| Data sufficiency reasons | aligned-pair support below minimum (1995 < 2000) |
| Reliability score | 0.3986 (low) |
| Reliability support component | 0.4829 |
| Reliability significance component | 0.2906 |
| Reliability directional component | 1.0000 |
| Reliability temporal-stability component | 0.0345 |
| Reliability robustness component | 0.0000 |
| Quality tier | insufficient |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum effective level (MED) | Not identified (no_consistent_effective_dose_detected) |
| Diminishing-returns knee | Not identified (drop_below_detection_threshold) |
| Saturation / plateau range | [107.26, 2098.3] |
| Support-constrained target reason | identified |
| Raw to support delta | 226.13 (+11941.0%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 3 | 2 | interpolation | 0.4405 | 0.0000 | 95 | 1995 |
| Runner-up | predictor_default | 3 | 3 | interpolation | 0.4394 | 0.0010 | 95 | 1995 |
| Runner-up | predictor_default | 2 | 5 | interpolation | 0.4391 | 0.0013 | 95 | 1995 |
| Runner-up | predictor_default | 3 | 5 | interpolation | 0.4112 | 0.0293 | 95 | 1995 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.19723, 4.621) | 200 | 18 | 2.4093 | 2.2545 | 0.6400 | 0.2831 |
| 2 | [4.621, 10.927) | 198 | 22 | 7.5196 | 7.5725 | -0.1634 | 0.2003 |
| 3 | [10.927, 24.213) | 201 | 31 | 16.9576 | 16.0071 | 0.0419 | 0.2759 |
| 4 | [24.213, 43.038) | 199 | 38 | 32.9584 | 33.1264 | -0.2801 | 0.1866 |
| 5 | [43.038, 71.252) | 199 | 34 | 57.0674 | 56.5983 | -0.2710 | 0.1939 |
| 6 | [71.252, 119.44) | 199 | 35 | 90.7725 | 88.7695 | 0.3735 | 0.2619 |
| 7 | [119.44, 272.52) | 200 | 30 | 181.2684 | 171.9265 | -0.0194 | 0.2249 |
| 8 | [272.52, 578.82) | 200 | 31 | 413.4445 | 421.5797 | 0.3655 | 0.2522 |
| 9 | [578.82, 983.99) | 198 | 25 | 769.8673 | 760.1254 | 0.0732 | 0.1976 |
| 10 | [983.99, 2098.3] | 201 | 19 | 1323.4435 | 1287.9744 | 0.1403 | 0.1631 |

### Distribution Charts

```text
Predictor Distribution (R&D Expenditure Per Capita (PPP))
[0.19723, 175.04) | ############################## 1304
[175.04, 349.88) | ### 147
[349.88, 524.72) | ### 120
[524.72, 699.56) | ## 87
[699.56, 874.41) | ## 86
[874.41, 1049.2) | ## 78
[1049.2, 1224.1) | # 55
[1224.1, 1398.9) | # 52
[1398.9, 1573.8) | # 32
[1573.8, 1748.6) | # 20
[1748.6, 1923.5) | # 8
[1923.5, 2098.3] | # 6
```

```text
Outcome Distribution (Healthy Life Expectancy Growth (YoY %), welfare-aligned)
[-18.191, -14.967) | # 3
[-14.967, -11.743) | # 7
[-11.743, -8.519) | # 20
[-8.519, -5.296) | ## 84
[-5.296, -2.072) | ####### 267
[-2.072, 1.152) | ############################## 1072
[1.152, 4.376) | ########### 387
[4.376, 7.600) | ### 110
[7.600, 10.824) | # 31
[10.824, 14.048) | # 8
[14.048, 17.272) | # 5
[17.272, 20.496] | # 1
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| HND | -0.7964 | -1.4497 | -315.155 | 21 |
| UGA | -0.2253 | -0.9391 | -48.839 | 21 |
| ARE | -0.2212 | -0.8907 | 10.698 | 21 |
| GEO | 0.2205 | 0.7569 | -120.399 | 21 |
| AUS | 0.0171 | -0.7451 | 566.073 | 21 |
| TTO | -0.5369 | -0.7328 | -314.790 | 21 |
| SAU | -0.6977 | -0.7253 | -157.834 | 21 |
| BGR | -0.1729 | -0.6830 | -1359.081 | 21 |
