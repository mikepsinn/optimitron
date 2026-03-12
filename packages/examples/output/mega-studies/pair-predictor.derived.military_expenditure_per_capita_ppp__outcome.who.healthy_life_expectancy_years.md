# Pair Study: Military Expenditure Per Capita (PPP) -> Healthy Life Expectancy (HALE)

- Pair ID: `predictor.derived.military_expenditure_per_capita_ppp__outcome.who.healthy_life_expectancy_years`
- Lag years: 3
- Duration years: 3
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.6998
- Included subjects: 159
- Skipped subjects: 0
- Total aligned pairs: 10494
- Signal grade: A (very strong)
- Data status: enough data
- Confidence score: 0.766 (higher confidence)
- Signal tag: early signal
- Direction: positive
- Uncertainty score: 0.0653 (lower is better)

## Quick Meanings

- `Recommended level`: main value to try first.
- `Data-backed level`: level directly supported by seen data.
- `Backup level`: safer fallback from the middle of the data.
- `Math-only guess`: unconstrained model output for technical comparison.
- `Not enough data`: we cannot safely recommend a level yet.

## Key Numeric Takeaways

- Recommended Military Expenditure Per Capita (PPP) level for higher Healthy Life Expectancy (HALE): 553.78 international $/person (data-backed level).
- Best level directly seen in the grouped data: 553.78 international $/person.
- Math-only guess is inside seen data but outside the best-performing bucket, so we still use the data-backed level.
- Best observed bin anchor (median/mean) is 489.34 international $/person; model-optimal minus observed-anchor difference is -101.32 (-20.7%).
- Backup level check (middle 10-90% of data) suggests 511.45 international $/person.
- The math-only guess and backup level differ by 31.8%, which means extreme values may matter a lot.
- Minimum effective level (first consistently positive zone): 18.849 international $/person.
- Diminishing returns likely begin near 28.250 international $/person.
- Saturation/plateau zone starts around 553.78 international $/person and extends through 2197.4 international $/person.
- Highest observed mean Healthy Life Expectancy (HALE) appears when Military Expenditure Per Capita (PPP) is in [406.30, 641.54) (mean outcome 67.750).
- Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Stronger signal compared with most other predictors in this report.
- Pattern hint: higher Military Expenditure Per Capita (PPP) tends to go with better Healthy Life Expectancy (HALE).
- Signal strength: stronger in this report set.

## Plain-Language Summary

- Higher Military Expenditure Per Capita (PPP) tends to align with better Healthy Life Expectancy (HALE).
- The estimate uses 159 subjects and 10494 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [406.30, 641.54) (mean outcome 67.750).
- A minimum effective predictor level appears near 18.849 international $/person in the binned response curve.
- Confidence score is 0.766 (higher confidence); data status is enough data.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Forward and direction signals disagree; direction may be unstable.
- Some country-level direction scores are unusually high; this can happen with this scoring method.
- Top temporal profiles are close (score delta 0.0011); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 31.8% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Forward correlation | 0.3987 |
| Reverse correlation | 0.5214 |
| Direction score (forward - reverse) | -0.1226 |
| Effect size (% change from baseline) | 3.1411 |
| Significance score | 0.9347 |
| Weighted PIS | 0.5120 |
| Value linked with higher outcome | 388.0225 |
| Value linked with lower outcome | 368.8817 |
| Math-only best daily value | 388.0225 |
| Recommended level (reader-facing) | 553.78 international $/person (data-backed level) |
| Math-only guess (technical) | 388.02 international $/person |
| Data-backed level | 553.78 international $/person |
| Data-backed range | [451.65, 769.63) |
| Backup level (middle-data check) | 528.05 international $/person |
| Math-only guess inside seen data range? | yes |
| Math-only guess inside data-backed range? | no |
| Seen data range | [0.0063, 27448.6207] |
| Math-only guess outside seen data? | no (within observed range) |
| Math-only guess outside best observed bucket? | yes |
| Best observed range | [406.30, 641.54) |
| Best observed range (middle-data check) | [433.08, 639.59] |
| Best observed outcome average | 67.750 |
| Best observed outcome average (middle-data check) | 68.045 |
| Backup level (bucket median) | 511.45 international $/person |
| Math-only vs backup difference | 123.42 (+31.8%) |
| Middle-data share kept | 80.0% (8394/10494) |
| Data status | enough data |
| Data-status details | none |
| Confidence score | 0.7665 (higher confidence) |
| Reliability support component | 1.0000 |
| Reliability significance component | 0.9347 |
| Reliability directional component | 0.8176 |
| Reliability temporal-stability component | 0.0375 |
| Reliability robustness component | 0.7577 |
| Signal tag | early signal |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum useful level | 18.849 international $/person (z=13.43) |
| Point where gains start slowing | 28.250 international $/person (ratio=0.175) |
| Flat zone range | [451.65, 7414.1] |
| Why this data-backed level was chosen | identified |
| Math-only guess minus data-backed level | -165.76 (-29.9%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 3 | 3 | interpolation | 0.6998 | 0.0000 | 159 | 10494 |
| Runner-up | predictor_default | 3 | 2 | interpolation | 0.6987 | 0.0011 | 159 | 10494 |
| Runner-up | predictor_default | 3 | 1 | interpolation | 0.6871 | 0.0126 | 159 | 10494 |
| Runner-up | predictor_default | 2 | 3 | interpolation | 0.6745 | 0.0253 | 159 | 10494 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.91749, 15.886) | 1050 | 28 | 8.8344 | 8.6644 | 51.2942 | 51.9726 |
| 2 | [15.886, 26.725) | 1047 | 45 | 21.1569 | 20.9348 | 54.5336 | 54.4847 |
| 3 | [26.725, 50.712) | 1050 | 51 | 36.5709 | 35.7525 | 56.5280 | 57.6930 |
| 4 | [50.712, 91.416) | 1050 | 49 | 70.5706 | 70.2979 | 59.7198 | 61.1291 |
| 5 | [91.416, 148.23) | 1050 | 53 | 118.3570 | 119.6053 | 59.6726 | 60.8583 |
| 6 | [148.23, 217.32) | 1047 | 56 | 178.1369 | 176.2437 | 61.5781 | 62.6697 |
| 7 | [217.32, 302.86) | 1050 | 52 | 251.8288 | 247.3973 | 64.3092 | 65.2837 |
| 8 | [302.86, 406.30) | 1050 | 48 | 353.3578 | 352.9016 | 65.4971 | 67.2160 |
| 9 | [406.30, 641.54) | 1050 | 48 | 499.7657 | 489.3411 | 67.7501 | 68.9575 |
| 10 | [641.54, 7414.1] | 1050 | 28 | 2287.8858 | 1984.5579 | 67.3231 | 67.6806 |

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
| HRV | -0.2236 | -0.9315 | -0.661 | 66 |
| RWA | -0.4215 | -0.8712 | -8.573 | 66 |
| MEX | -0.1088 | -0.8594 | -0.024 | 66 |
| CYP | -0.6312 | -0.8381 | -1.476 | 66 |
| ZAF | 0.5603 | 0.8183 | 8.832 | 66 |
| HTI | -0.2298 | -0.7920 | -0.630 | 66 |
