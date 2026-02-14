# Pair Study: Government Health Expenditure Per Capita (PPP) -> Healthy Life Expectancy (HALE)

- Pair ID: `predictor.derived.gov_health_expenditure_per_capita_ppp__outcome.who.healthy_life_expectancy_years`
- Lag years: 3
- Duration years: 5
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 15
- Temporal candidates with valid results: 15
- Temporal profile score: 0.7677
- Included subjects: 179
- Skipped subjects: 0
- Total aligned pairs: 11814
- Evidence grade: A
- Data sufficiency: sufficient
- Reliability score: 0.692 (moderate)
- Quality tier: exploratory
- Direction: positive
- Derived uncertainty score: 0.0743 (1 - aggregate significance, not NHST p-value)

## Key Numeric Takeaways

- Decision-target Government Health Expenditure Per Capita (PPP) level for higher Healthy Life Expectancy (HALE): 2778.5 international $/person (support constrained).
- Observed-support target from binned response curve: 2778.5 international $/person.
- Model-derived optimum is within observed support but outside the highest-outcome bin; this reflects smooth objective optimization vs coarse bin averages.
- Best observed bin anchor (median/mean) is 2555.3 international $/person; model-optimal minus observed-anchor difference is -1875.6 (-73.4%).
- Robust sensitivity (trimmed 10-90% predictor range) suggests 1454.7 international $/person.
- Raw vs robust optimal differs by 114.0%, indicating strong tail influence.
- Minimum effective level (first consistently positive zone): 16.917 international $/person.
- Diminishing returns likely begin near 28.924 international $/person.
- Saturation/plateau zone starts around 352.56 international $/person and extends through 2778.5 international $/person.
- Highest observed mean Healthy Life Expectancy (HALE) appears when Government Health Expenditure Per Capita (PPP) is in [1819.1, 5486.7] (mean outcome 69.427).
- Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Stronger evidence for directional signal relative to other predictors in this report.
- Directional hint: higher Government Health Expenditure Per Capita (PPP) is associated with better Healthy Life Expectancy (HALE).
- Signal strength: relatively stronger within this report set.

## Plain-Language Summary

- Higher Government Health Expenditure Per Capita (PPP) tends to align with better Healthy Life Expectancy (HALE).
- The estimate uses 179 subjects and 11814 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [1819.1, 5486.7] (mean outcome 69.427).
- A minimum effective predictor level appears near 16.917 international $/person in the binned response curve.
- Reliability score is 0.692 (moderate); data sufficiency is sufficient.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Forward association sign conflicts with directional score sign; reverse-direction signal may dominate.
- Some subject-level directional scores exceed |1|; this is valid because the score is a difference of two correlations.
- Top temporal profiles are close (score delta 0.0021); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 114.0% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Aggregate forward Pearson | 0.4986 |
| Aggregate reverse Pearson | 0.6923 |
| Aggregate directional score (forward - reverse) | -0.1937 |
| Aggregate effect size (% baseline delta) | 4.3093 |
| Aggregate statistical significance | 0.9257 |
| Weighted average PIS | 0.5289 |
| Aggregate value predicting high outcome | 679.7403 |
| Aggregate value predicting low outcome | 502.8319 |
| Aggregate optimal daily value | 679.7403 |
| Decision target value (reader-facing) | 2778.5 international $/person (support constrained) |
| Model-derived optimum (diagnostics) | 679.74 international $/person |
| Support-constrained optimal value | 2778.5 international $/person |
| Support-constrained optimal range | [2025.7, 5486.7] |
| Response-curve robust optimal value | 1493.8 international $/person |
| Raw model optimal within observed range | yes |
| Raw model optimal within support-constrained range | no |
| Observed predictor range | [0.2591, 8503.2455] |
| Model-derived optimal extrapolative? | no (within observed range) |
| Model-derived optimal outside best observed bin? | yes |
| Raw best observed range | [1819.1, 5486.7] |
| Robust best observed range (trimmed) | [1114.6, 1819.1] |
| Raw best observed outcome mean | 69.427 |
| Robust best observed outcome mean | 68.092 |
| Robust optimal value (bin median) | 1454.7 international $/person |
| Raw vs robust optimal delta | 774.95 (+114.0%) |
| Robustness retained fraction | 80.0% (9453/11814) |
| Data sufficiency status | sufficient |
| Data sufficiency reasons | none |
| Reliability score | 0.6920 (moderate) |
| Reliability support component | 1.0000 |
| Reliability significance component | 0.9257 |
| Reliability directional component | 1.0000 |
| Reliability temporal-stability component | 0.0708 |
| Reliability robustness component | 0.0000 |
| Quality tier | exploratory |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum effective level (MED) | 16.917 international $/person (z=15.63) |
| Diminishing-returns knee | 28.924 international $/person (ratio=0.074) |
| Saturation / plateau range | [282.90, 5486.7] |
| Support-constrained target reason | identified |
| Raw to support delta | -2098.8 (-75.5%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 3 | 5 | interpolation | 0.7677 | 0.0000 | 179 | 11814 |
| Runner-up | predictor_default | 5 | 5 | interpolation | 0.7655 | 0.0021 | 179 | 11814 |
| Runner-up | predictor_default | 5 | 2 | interpolation | 0.7617 | 0.0060 | 179 | 11814 |
| Runner-up | predictor_default | 5 | 3 | interpolation | 0.7605 | 0.0072 | 179 | 11814 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.25914, 14.463) | 1182 | 29 | 7.8820 | 8.2941 | 50.2368 | 50.0406 |
| 2 | [14.463, 25.949) | 1173 | 40 | 19.2266 | 18.6374 | 53.6563 | 53.7980 |
| 3 | [25.949, 61.669) | 1188 | 43 | 40.9436 | 39.6918 | 57.0899 | 57.9709 |
| 4 | [61.669, 117.32) | 1179 | 45 | 86.9266 | 85.9958 | 58.7882 | 60.0121 |
| 5 | [117.32, 189.79) | 1185 | 52 | 151.9839 | 152.8431 | 61.3220 | 62.6708 |
| 6 | [189.79, 306.96) | 1179 | 55 | 244.9953 | 242.4576 | 62.0874 | 63.6461 |
| 7 | [306.96, 525.38) | 1182 | 56 | 403.5288 | 390.4001 | 63.8983 | 65.0898 |
| 8 | [525.38, 977.06) | 1182 | 48 | 696.8331 | 661.8733 | 65.6874 | 65.9597 |
| 9 | [977.06, 1819.1) | 1173 | 39 | 1367.8847 | 1375.2282 | 67.8044 | 68.1142 |
| 10 | [1819.1, 5486.7] | 1191 | 29 | 2781.5845 | 2555.3004 | 69.4273 | 69.7069 |

### Distribution Charts

```text
Predictor Distribution (Government Health Expenditure Per Capita (PPP))
[0.25914, 457.46) | ############################## 7971
[457.46, 914.66) | ##### 1383
[914.66, 1371.9) | ### 675
[1371.9, 1829.1) | ## 612
[1829.1, 2286.3) | ## 405
[2286.3, 2743.5) | # 261
[2743.5, 3200.7) | # 183
[3200.7, 3657.9) | # 156
[3657.9, 4115.1) | # 69
[4115.1, 4572.3) | # 48
[4572.3, 5029.5) | # 42
[5029.5, 5486.7] | # 9
```

```text
Outcome Distribution (Healthy Life Expectancy (HALE), welfare-aligned)
[31.884, 35.487) | # 2
[35.487, 39.089) | # 49
[39.089, 42.692) | ## 163
[42.692, 46.294) | #### 373
[46.294, 49.896) | ###### 550
[49.896, 53.499) | ########### 971
[53.499, 57.101) | ############# 1190
[57.101, 60.704) | ################ 1392
[60.704, 64.306) | ########################## 2310
[64.306, 67.909) | ############################## 2671
[67.909, 71.511) | ###################### 1991
[71.511, 75.113] | ## 152
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| BRB | 0.6161 | 1.2185 | 0.959 | 66 |
| CAF | -0.8863 | -1.1982 | -9.071 | 66 |
| SDN | 0.7571 | 1.1463 | 4.833 | 66 |
| MEX | -0.1112 | -1.0107 | -0.024 | 66 |
| PER | -0.1216 | -0.9832 | 0.772 | 66 |
| ERI | -0.7512 | -0.9286 | -7.595 | 66 |
| FJI | -0.0894 | -0.8834 | 0.278 | 66 |
| PRY | -0.2124 | -0.8324 | -0.498 | 66 |
