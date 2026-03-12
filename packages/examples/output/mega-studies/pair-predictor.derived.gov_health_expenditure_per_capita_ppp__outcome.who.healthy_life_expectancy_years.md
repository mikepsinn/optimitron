# Pair Study: Government Health Expenditure Per Capita (PPP) -> Healthy Life Expectancy (HALE)

- Pair ID: `predictor.derived.gov_health_expenditure_per_capita_ppp__outcome.who.healthy_life_expectancy_years`
- Lag years: 3
- Duration years: 5
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 15
- Temporal candidates with valid results: 15
- Temporal profile score: 0.7567
- Included subjects: 179
- Skipped subjects: 0
- Total aligned pairs: 11814
- Signal grade: A (very strong)
- Data status: enough data
- Confidence score: 0.691 (medium confidence)
- Signal tag: early signal
- Direction: positive
- Uncertainty score: 0.0743 (lower is better)

## Quick Meanings

- `Recommended level`: main value to try first.
- `Data-backed level`: level directly supported by seen data.
- `Backup level`: safer fallback from the middle of the data.
- `Math-only guess`: unconstrained model output for technical comparison.
- `Not enough data`: we cannot safely recommend a level yet.

## Key Numeric Takeaways

- Recommended Government Health Expenditure Per Capita (PPP) level for higher Healthy Life Expectancy (HALE): 2778.5 international $/person (data-backed level).
- Best level directly seen in the grouped data: 2778.5 international $/person.
- Math-only guess is inside seen data but outside the best-performing bucket, so we still use the data-backed level.
- Best observed bin anchor (median/mean) is 2555.3 international $/person; model-optimal minus observed-anchor difference is -1873.5 (-73.3%).
- Backup level check (middle 10-90% of data) suggests 1459.3 international $/person.
- The math-only guess and backup level differ by 114.0%, which means extreme values may matter a lot.
- Minimum effective level (first consistently positive zone): 16.917 international $/person.
- Diminishing returns likely begin near 28.924 international $/person.
- Saturation/plateau zone starts around 352.60 international $/person and extends through 2778.5 international $/person.
- Highest observed mean Healthy Life Expectancy (HALE) appears when Government Health Expenditure Per Capita (PPP) is in [1819.1, 5486.7] (mean outcome 69.427).
- Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Stronger signal compared with most other predictors in this report.
- Pattern hint: higher Government Health Expenditure Per Capita (PPP) tends to go with better Healthy Life Expectancy (HALE).
- Signal strength: stronger in this report set.

## Plain-Language Summary

- Higher Government Health Expenditure Per Capita (PPP) tends to align with better Healthy Life Expectancy (HALE).
- The estimate uses 179 subjects and 11814 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [1819.1, 5486.7] (mean outcome 69.427).
- A minimum effective predictor level appears near 16.917 international $/person in the binned response curve.
- Confidence score is 0.691 (medium confidence); data status is enough data.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Forward and direction signals disagree; direction may be unstable.
- Some country-level direction scores are unusually high; this can happen with this scoring method.
- Top temporal profiles are close (score delta 0.0020); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 114.0% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Forward correlation | 0.4988 |
| Reverse correlation | 0.6815 |
| Direction score (forward - reverse) | -0.1827 |
| Effect size (% change from baseline) | 4.3111 |
| Significance score | 0.9257 |
| Weighted PIS | 0.5290 |
| Value linked with higher outcome | 681.8493 |
| Value linked with lower outcome | 503.8558 |
| Math-only best daily value | 681.8493 |
| Recommended level (reader-facing) | 2778.5 international $/person (data-backed level) |
| Math-only guess (technical) | 681.85 international $/person |
| Data-backed level | 2778.5 international $/person |
| Data-backed range | [2027.6, 5486.7] |
| Backup level (middle-data check) | 1493.8 international $/person |
| Math-only guess inside seen data range? | yes |
| Math-only guess inside data-backed range? | no |
| Seen data range | [0.2591, 8503.2455] |
| Math-only guess outside seen data? | no (within observed range) |
| Math-only guess outside best observed bucket? | yes |
| Best observed range | [1819.1, 5486.7] |
| Best observed range (middle-data check) | [1115.7, 1819.1] |
| Best observed outcome average | 69.427 |
| Best observed outcome average (middle-data check) | 68.081 |
| Backup level (bucket median) | 1459.3 international $/person |
| Math-only vs backup difference | 777.42 (+114.0%) |
| Middle-data share kept | 80.0% (9453/11814) |
| Data status | enough data |
| Data-status details | none |
| Confidence score | 0.6913 (medium confidence) |
| Reliability support component | 1.0000 |
| Reliability significance component | 0.9257 |
| Reliability directional component | 1.0000 |
| Reliability temporal-stability component | 0.0660 |
| Reliability robustness component | 0.0000 |
| Signal tag | early signal |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum useful level | 16.917 international $/person (z=15.63) |
| Point where gains start slowing | 28.924 international $/person (ratio=0.074) |
| Flat zone range | [282.91, 5486.7] |
| Why this data-backed level was chosen | identified |
| Math-only guess minus data-backed level | -2096.7 (-75.5%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 3 | 5 | interpolation | 0.7567 | 0.0000 | 179 | 11814 |
| Runner-up | predictor_default | 2 | 5 | interpolation | 0.7547 | 0.0020 | 179 | 11814 |
| Runner-up | predictor_default | 1 | 5 | interpolation | 0.7533 | 0.0035 | 179 | 11814 |
| Runner-up | predictor_default | 0 | 5 | interpolation | 0.7508 | 0.0059 | 179 | 11814 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.25914, 14.463) | 1182 | 29 | 7.8820 | 8.2941 | 50.2368 | 50.0406 |
| 2 | [14.463, 25.949) | 1173 | 40 | 19.2266 | 18.6374 | 53.6563 | 53.7980 |
| 3 | [25.949, 61.669) | 1188 | 43 | 40.9436 | 39.6918 | 57.0899 | 57.9709 |
| 4 | [61.669, 117.32) | 1176 | 45 | 86.8501 | 85.9958 | 58.7722 | 59.9784 |
| 5 | [117.32, 189.79) | 1188 | 52 | 152.0087 | 152.8431 | 61.3315 | 62.6783 |
| 6 | [189.79, 308.00) | 1179 | 55 | 245.4423 | 242.7781 | 62.0658 | 63.6392 |
| 7 | [308.00, 526.08) | 1182 | 55 | 405.1940 | 393.1789 | 63.9257 | 65.1082 |
| 8 | [526.08, 989.64) | 1182 | 48 | 705.3052 | 692.4276 | 65.6918 | 65.9506 |
| 9 | [989.64, 1819.1) | 1173 | 41 | 1372.2964 | 1381.6538 | 67.7941 | 68.1142 |
| 10 | [1819.1, 5486.7] | 1191 | 29 | 2782.5940 | 2555.3004 | 69.4273 | 69.7069 |

### Distribution Charts

```text
Predictor Distribution (Government Health Expenditure Per Capita (PPP))
[0.25914, 457.46) | ############################## 7965
[457.46, 914.66) | ##### 1368
[914.66, 1371.9) | ### 687
[1371.9, 1829.1) | ## 618
[1829.1, 2286.3) | ## 408
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
| SDN | 0.7571 | 1.1594 | 4.833 | 66 |
| MEX | -0.1112 | -1.0107 | -0.024 | 66 |
| PER | -0.1216 | -0.9832 | 0.772 | 66 |
| PRY | -0.2124 | -0.8324 | -0.498 | 66 |
| USA | -0.1110 | -0.8262 | -0.098 | 66 |
| TKM | 0.1352 | -0.8155 | 2.494 | 66 |
