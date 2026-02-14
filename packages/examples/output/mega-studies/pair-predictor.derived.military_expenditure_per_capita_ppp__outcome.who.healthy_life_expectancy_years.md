# Pair Study: Military Expenditure Per Capita (PPP) -> Healthy Life Expectancy (HALE)

- Pair ID: `predictor.derived.military_expenditure_per_capita_ppp__outcome.who.healthy_life_expectancy_years`
- Lag years: 3
- Duration years: 3
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.7190
- Included subjects: 159
- Skipped subjects: 0
- Total aligned pairs: 10494
- Evidence grade: A
- Data sufficiency: sufficient
- Reliability score: 0.799 (high)
- Quality tier: exploratory
- Direction: positive
- Derived uncertainty score: 0.0670 (1 - aggregate significance, not NHST p-value)

## Key Numeric Takeaways

- Decision-target Military Expenditure Per Capita (PPP) level for higher Healthy Life Expectancy (HALE): 546.11 international $/person (support constrained).
- Observed-support target from binned response curve: 546.11 international $/person.
- Model-derived optimum is within observed support but outside the highest-outcome bin; this reflects smooth objective optimization vs coarse bin averages.
- Best observed bin anchor (median/mean) is 487.80 international $/person; model-optimal minus observed-anchor difference is -99.893 (-20.5%).
- Robust sensitivity (trimmed 10-90% predictor range) suggests 509.10 international $/person.
- Raw vs robust optimal differs by 31.2%, indicating strong tail influence.
- Minimum effective level (first consistently positive zone): 18.849 international $/person.
- Diminishing returns likely begin near 28.250 international $/person.
- Saturation/plateau zone starts around 546.11 international $/person and extends through 2197.4 international $/person.
- Highest observed mean Healthy Life Expectancy (HALE) appears when Military Expenditure Per Capita (PPP) is in [405.15, 641.54) (mean outcome 67.710).
- Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Stronger evidence for directional signal relative to other predictors in this report.
- Directional hint: higher Military Expenditure Per Capita (PPP) is associated with better Healthy Life Expectancy (HALE).
- Signal strength: relatively stronger within this report set.

## Plain-Language Summary

- Higher Military Expenditure Per Capita (PPP) tends to align with better Healthy Life Expectancy (HALE).
- The estimate uses 159 subjects and 10494 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [405.15, 641.54) (mean outcome 67.710).
- A minimum effective predictor level appears near 18.849 international $/person in the binned response curve.
- Reliability score is 0.799 (high); data sufficiency is sufficient.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Forward association sign conflicts with directional score sign; reverse-direction signal may dominate.
- Some subject-level directional scores exceed |1|; this is valid because the score is a difference of two correlations.
- Top temporal profiles are close (score delta 0.0023); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 31.2% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Aggregate forward Pearson | 0.3974 |
| Aggregate reverse Pearson | 0.5398 |
| Aggregate directional score (forward - reverse) | -0.1424 |
| Aggregate effect size (% baseline delta) | 3.1328 |
| Aggregate statistical significance | 0.9330 |
| Weighted average PIS | 0.5124 |
| Aggregate value predicting high outcome | 387.9048 |
| Aggregate value predicting low outcome | 369.1217 |
| Aggregate optimal daily value | 387.9048 |
| Decision target value (reader-facing) | 546.11 international $/person (support constrained) |
| Model-derived optimum (diagnostics) | 387.90 international $/person |
| Support-constrained optimal value | 546.11 international $/person |
| Support-constrained optimal range | [451.65, 771.61) |
| Response-curve robust optimal value | 526.49 international $/person |
| Raw model optimal within observed range | yes |
| Raw model optimal within support-constrained range | no |
| Observed predictor range | [0.0063, 27448.6207] |
| Model-derived optimal extrapolative? | no (within observed range) |
| Model-derived optimal outside best observed bin? | yes |
| Raw best observed range | [405.15, 641.54) |
| Robust best observed range (trimmed) | [432.28, 639.59] |
| Raw best observed outcome mean | 67.710 |
| Robust best observed outcome mean | 68.065 |
| Robust optimal value (bin median) | 509.10 international $/person |
| Raw vs robust optimal delta | 121.19 (+31.2%) |
| Robustness retained fraction | 80.0% (8394/10494) |
| Data sufficiency status | sufficient |
| Data sufficiency reasons | none |
| Reliability score | 0.7991 (high) |
| Reliability support component | 1.0000 |
| Reliability significance component | 0.9330 |
| Reliability directional component | 0.9496 |
| Reliability temporal-stability component | 0.0753 |
| Reliability robustness component | 0.7640 |
| Quality tier | exploratory |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum effective level (MED) | 18.849 international $/person (z=13.43) |
| Diminishing-returns knee | 28.250 international $/person (ratio=0.175) |
| Saturation / plateau range | [451.65, 7414.1] |
| Support-constrained target reason | identified |
| Raw to support delta | -158.21 (-29.0%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 3 | 3 | interpolation | 0.7190 | 0.0000 | 159 | 10494 |
| Runner-up | predictor_default | 3 | 2 | interpolation | 0.7167 | 0.0023 | 159 | 10494 |
| Runner-up | predictor_default | 3 | 1 | interpolation | 0.7046 | 0.0144 | 159 | 10494 |
| Runner-up | predictor_default | 2 | 3 | interpolation | 0.6901 | 0.0289 | 159 | 10494 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.91749, 15.886) | 1050 | 28 | 8.8344 | 8.6644 | 51.2942 | 51.9726 |
| 2 | [15.886, 26.725) | 1047 | 45 | 21.1569 | 20.9348 | 54.5336 | 54.4847 |
| 3 | [26.725, 50.712) | 1050 | 51 | 36.5744 | 35.7525 | 56.5280 | 57.6930 |
| 4 | [50.712, 91.336) | 1050 | 50 | 70.5336 | 70.2979 | 59.7532 | 61.1703 |
| 5 | [91.336, 146.03) | 1050 | 53 | 117.9271 | 119.0695 | 59.7100 | 60.8719 |
| 6 | [146.03, 214.53) | 1047 | 56 | 176.8401 | 175.0091 | 61.5788 | 62.7604 |
| 7 | [214.53, 302.85) | 1050 | 53 | 249.5982 | 244.4464 | 64.2204 | 65.1757 |
| 8 | [302.85, 405.15) | 1050 | 48 | 352.6171 | 351.9885 | 65.5544 | 67.2586 |
| 9 | [405.15, 641.54) | 1050 | 48 | 498.2032 | 487.7983 | 67.7103 | 68.9450 |
| 10 | [641.54, 7414.1] | 1050 | 28 | 2287.9856 | 1984.5579 | 67.3231 | 67.6806 |

### Distribution Charts

```text
Predictor Distribution (Military Expenditure Per Capita (PPP))
[0.91749, 618.68) | ############################## 9384
[618.68, 1236.4) | # 450
[1236.4, 1854.2) | # 99
[1854.2, 2472.0) | # 195
[2472.0, 3089.7) | # 99
[3089.7, 3707.5) | # 60
[3707.5, 4325.3) | # 36
[4325.3, 4943.0) | # 93
[4943.0, 5560.8) | # 36
[5560.8, 6178.5) | # 24
[6178.5, 6796.3) | # 9
[6796.3, 7414.1] | # 9
```

```text
Outcome Distribution (Healthy Life Expectancy (HALE), welfare-aligned)
[31.884, 35.487) | # 2
[35.487, 39.089) | # 49
[39.089, 42.692) | ## 163
[42.692, 46.294) | ##### 382
[46.294, 49.896) | ####### 573
[49.896, 53.499) | ############ 959
[53.499, 57.101) | ############ 991
[57.101, 60.704) | ############## 1117
[60.704, 64.306) | ####################### 1866
[64.306, 67.909) | ############################## 2383
[67.909, 71.511) | ####################### 1857
[71.511, 75.113] | ## 152
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| QAT | -0.3092 | -1.0766 | -1.625 | 66 |
| ARE | -0.4871 | -0.9910 | -1.500 | 66 |
| HRV | -0.2593 | -0.9567 | -1.121 | 66 |
| RWA | -0.4215 | -0.8712 | -8.573 | 66 |
| MEX | -0.1088 | -0.8594 | -0.024 | 66 |
| CYP | -0.6846 | -0.8395 | -2.580 | 66 |
| GTM | -0.2328 | -0.8346 | -1.038 | 66 |
| BIH | -0.2245 | -0.7983 | -0.902 | 66 |
