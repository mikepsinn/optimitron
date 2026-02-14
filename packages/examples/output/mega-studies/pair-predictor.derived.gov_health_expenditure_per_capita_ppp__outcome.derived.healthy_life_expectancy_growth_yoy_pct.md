# Pair Study: Government Health Expenditure Per Capita (PPP) -> Healthy Life Expectancy Growth (YoY %)

- Pair ID: `predictor.derived.gov_health_expenditure_per_capita_ppp__outcome.derived.healthy_life_expectancy_growth_yoy_pct`
- Lag years: 5
- Duration years: 3
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 15
- Temporal candidates with valid results: 15
- Temporal profile score: 0.3714
- Included subjects: 179
- Skipped subjects: 0
- Total aligned pairs: 3759
- Evidence grade: F
- Data sufficiency: sufficient
- Reliability score: 0.351 (low)
- Quality tier: insufficient
- Direction: negative
- Derived uncertainty score: 0.7798 (1 - aggregate significance, not NHST p-value)

## Key Numeric Takeaways

- Estimated best Government Health Expenditure Per Capita (PPP) level for higher Healthy Life Expectancy Growth (YoY %): 506.82 international $/person.
- Observed-support target from binned response curve: 6.995 international $/person.
- Model-derived optimum is within observed support but outside the highest-outcome bin; this reflects smooth objective optimization vs coarse bin averages.
- Best observed bin anchor (median/mean) is 8.075 international $/person; model-optimal minus observed-anchor difference is 498.75 (+6176.3%).
- Robust sensitivity (trimmed 10-90% predictor range) suggests 17.662 international $/person.
- Raw vs robust optimal differs by 96.5%, indicating strong tail influence.
- Minimum effective level not reliably identified (no_consistent_effective_dose_detected).
- No reliable diminishing-returns knee detected (drop_below_detection_threshold).
- Saturation/plateau zone starts around 527.95 international $/person and extends through 2719.9 international $/person.
- Highest observed mean Healthy Life Expectancy Growth (YoY %) appears when Government Health Expenditure Per Capita (PPP) is in [0.25914, 13.927) (mean outcome 1.064).
- Direction is negative in this analysis, so lowering this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Exploratory evidence only; use primarily for hypothesis generation.
- Directional hint: lower Government Health Expenditure Per Capita (PPP) is associated with better Healthy Life Expectancy Growth (YoY %).
- Signal strength: moderate-to-weak; avoid hard policy conclusions from this pair alone.

## Plain-Language Summary

- Higher Government Health Expenditure Per Capita (PPP) tends to align with worse Healthy Life Expectancy Growth (YoY %).
- The estimate uses 179 subjects and 3759 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [0.25914, 13.927) (mean outcome 1.064).
- Reliability score is 0.351 (low); data sufficiency is sufficient.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Weak aggregate significance (<0.70).
- Some subject-level directional scores exceed |1|; this is valid because the score is a difference of two correlations.
- Top temporal profiles are close (score delta 0.0039); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 96.5% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Aggregate forward Pearson | -0.1381 |
| Aggregate reverse Pearson | -0.0878 |
| Aggregate directional score (forward - reverse) | -0.0503 |
| Aggregate effect size (% baseline delta) | -3.9757 |
| Aggregate statistical significance | 0.2202 |
| Weighted average PIS | 0.0981 |
| Aggregate value predicting high outcome | 506.8239 |
| Aggregate value predicting low outcome | 543.5973 |
| Aggregate optimal daily value | 506.8239 |
| Support-constrained optimal value | 6.995 international $/person |
| Support-constrained optimal range | [0.25914, 11.041) |
| Response-curve robust optimal value | 16.995 international $/person |
| Raw model optimal within observed range | yes |
| Raw model optimal within support-constrained range | no |
| Observed predictor range | [0.2591, 8503.2455] |
| Model-derived optimal extrapolative? | no (within observed range) |
| Model-derived optimal outside best observed bin? | yes |
| Raw best observed range | [0.25914, 13.927) |
| Robust best observed range (trimmed) | [13.941, 22.120) |
| Raw best observed outcome mean | 1.064 |
| Robust best observed outcome mean | 0.84445 |
| Robust optimal value (bin median) | 17.662 international $/person |
| Raw vs robust optimal delta | -489.16 (-96.5%) |
| Robustness retained fraction | 80.0% (3007/3759) |
| Data sufficiency status | sufficient |
| Data sufficiency reasons | none |
| Reliability score | 0.3505 (low) |
| Reliability support component | 0.8133 |
| Reliability significance component | 0.2202 |
| Reliability directional component | 0.3355 |
| Reliability temporal-stability component | 0.1286 |
| Reliability robustness component | 0.0387 |
| Quality tier | insufficient |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum effective level (MED) | Not identified (no_consistent_effective_dose_detected) |
| Diminishing-returns knee | Not identified (drop_below_detection_threshold) |
| Saturation / plateau range | [413.50, 5270.6] |
| Support-constrained target reason | identified |
| Raw to support delta | 499.83 (+7145.8%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 5 | 3 | interpolation | 0.3714 | 0.0000 | 179 | 3759 |
| Runner-up | predictor_default | 5 | 5 | interpolation | 0.3675 | 0.0039 | 179 | 3759 |
| Runner-up | predictor_default | 0 | 2 | interpolation | 0.3674 | 0.0040 | 179 | 3759 |
| Runner-up | predictor_default | 0 | 3 | interpolation | 0.3657 | 0.0057 | 179 | 3759 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.25914, 13.927) | 376 | 28 | 7.5203 | 8.0752 | 1.0637 | 0.8860 |
| 2 | [13.927, 25.180) | 376 | 38 | 18.8278 | 18.2369 | 0.8064 | 0.6869 |
| 3 | [25.180, 58.319) | 376 | 44 | 39.4797 | 38.0435 | 0.2204 | 0.2875 |
| 4 | [58.319, 113.56) | 374 | 48 | 84.3429 | 82.3105 | 0.4536 | 0.3456 |
| 5 | [113.56, 182.46) | 377 | 53 | 147.0622 | 145.7171 | -0.0515 | 0.1842 |
| 6 | [182.46, 296.48) | 376 | 56 | 236.4001 | 234.9263 | -0.2676 | 0.0455 |
| 7 | [296.48, 508.77) | 376 | 59 | 387.5767 | 381.9118 | 0.3773 | 0.2236 |
| 8 | [508.77, 940.06) | 376 | 46 | 674.9972 | 661.8250 | -0.1301 | 0.1122 |
| 9 | [940.06, 1764.6) | 376 | 38 | 1336.8005 | 1337.7091 | 0.1585 | 0.2566 |
| 10 | [1764.6, 5270.6] | 376 | 28 | 2715.9495 | 2483.2090 | 0.0354 | 0.1317 |

### Distribution Charts

```text
Predictor Distribution (Government Health Expenditure Per Capita (PPP))
[0.25914, 439.46) | ############################## 2537
[439.46, 878.65) | ##### 444
[878.65, 1317.9) | ## 209
[1317.9, 1757.0) | ## 186
[1757.0, 2196.2) | ## 132
[2196.2, 2635.4) | # 84
[2635.4, 3074.6) | # 60
[3074.6, 3513.8) | # 50
[3513.8, 3953.0) | # 23
[3953.0, 4392.2) | # 16
[4392.2, 4831.4) | # 11
[4831.4, 5270.6] | # 7
```

```text
Outcome Distribution (Healthy Life Expectancy Growth (YoY %), welfare-aligned)
[-33.373, -25.372) | # 1
[-25.372, -17.372) | # 1
[-17.372, -9.372) | # 21
[-9.372, -1.372) | ######## 792
[-1.372, 6.629) | ############################## 2835
[6.629, 14.629) | # 101
[14.629, 22.629) | # 7
[54.630, 62.630] | # 1
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| YEM | 0.7670 | 1.5725 | -223.558 | 21 |
| GNQ | -0.3714 | -1.1588 | -68.590 | 21 |
| COD | -0.2107 | -0.9855 | 38.113 | 21 |
| PAK | -0.3263 | -0.9073 | -171.496 | 21 |
| EGY | -0.4658 | -0.8836 | -569.173 | 21 |
| PNG | -0.5196 | -0.8548 | -121.740 | 21 |
| LKA | -0.2649 | -0.8531 | -190.796 | 21 |
| CPV | 0.3640 | 0.8427 | -127.541 | 21 |
