# Pair Study: Education Expenditure Per Capita (PPP) -> Healthy Life Expectancy (HALE)

- Pair ID: `predictor.derived.education_expenditure_per_capita_ppp__outcome.who.healthy_life_expectancy_years`
- Lag years: 0
- Duration years: 5
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 15
- Temporal candidates with valid results: 15
- Temporal profile score: 0.7072
- Included subjects: 165
- Skipped subjects: 0
- Total aligned pairs: 10890
- Signal grade: A (very strong)
- Data status: enough data
- Confidence score: 0.688 (medium confidence)
- Signal tag: early signal
- Direction: positive
- Uncertainty score: 0.0646 (lower is better)

## Quick Meanings

- `Recommended level`: main value to try first.
- `Data-backed level`: level directly supported by seen data.
- `Backup level`: safer fallback from the middle of the data.
- `Math-only guess`: unconstrained model output for technical comparison.
- `Not enough data`: we cannot safely recommend a level yet.

## Key Numeric Takeaways

- Recommended Education Expenditure Per Capita (PPP) level for higher Healthy Life Expectancy (HALE): 2912.6 international $/person (data-backed level).
- Best level directly seen in the grouped data: 2912.6 international $/person.
- Math-only guess is inside seen data but outside the best-performing bucket, so we still use the data-backed level.
- Best observed bin anchor (median/mean) is 2705.9 international $/person; model-optimal minus observed-anchor difference is -1860.4 (-68.8%).
- Backup level check (middle 10-90% of data) suggests 1632.1 international $/person.
- The math-only guess and backup level differ by 93.0%, which means extreme values may matter a lot.
- Minimum effective level (first consistently positive zone): 52.790 international $/person.
- Diminishing returns likely begin near 92.581 international $/person.
- Saturation/plateau zone starts around 864.65 international $/person and extends through 2912.6 international $/person.
- Highest observed mean Healthy Life Expectancy (HALE) appears when Education Expenditure Per Capita (PPP) is in [2075.9, 6496.0] (mean outcome 69.100).
- Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Stronger signal compared with most other predictors in this report.
- Pattern hint: higher Education Expenditure Per Capita (PPP) tends to go with better Healthy Life Expectancy (HALE).
- Signal strength: stronger in this report set.

## Plain-Language Summary

- Higher Education Expenditure Per Capita (PPP) tends to align with better Healthy Life Expectancy (HALE).
- The estimate uses 165 subjects and 10890 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [2075.9, 6496.0] (mean outcome 69.100).
- A minimum effective predictor level appears near 52.790 international $/person in the binned response curve.
- Confidence score is 0.688 (medium confidence); data status is enough data.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Forward and direction signals disagree; direction may be unstable.
- Top temporal profiles are close (score delta 0.0039); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 93.0% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Forward correlation | 0.5121 |
| Reverse correlation | 0.6419 |
| Direction score (forward - reverse) | -0.1298 |
| Effect size (% change from baseline) | 4.3472 |
| Significance score | 0.9354 |
| Weighted PIS | 0.5578 |
| Value linked with higher outcome | 845.4475 |
| Value linked with lower outcome | 659.4960 |
| Math-only best daily value | 845.4475 |
| Recommended level (reader-facing) | 2912.6 international $/person (data-backed level) |
| Math-only guess (technical) | 845.45 international $/person |
| Data-backed level | 2912.6 international $/person |
| Data-backed range | [2220.6, 6496.0] |
| Backup level (middle-data check) | 1715.2 international $/person |
| Math-only guess inside seen data range? | yes |
| Math-only guess inside data-backed range? | no |
| Seen data range | [0.0000, 7006.1701] |
| Math-only guess outside seen data? | no (within observed range) |
| Math-only guess outside best observed bucket? | yes |
| Best observed range | [2075.9, 6496.0] |
| Best observed range (middle-data check) | [1328.6, 2075.5] |
| Best observed outcome average | 69.100 |
| Best observed outcome average (middle-data check) | 68.617 |
| Backup level (bucket median) | 1632.1 international $/person |
| Math-only vs backup difference | 786.61 (+93.0%) |
| Middle-data share kept | 80.0% (8712/10890) |
| Data status | enough data |
| Data-status details | none |
| Confidence score | 0.6878 (medium confidence) |
| Reliability support component | 1.0000 |
| Reliability significance component | 0.9354 |
| Reliability directional component | 0.8651 |
| Reliability temporal-stability component | 0.1288 |
| Reliability robustness component | 0.0773 |
| Signal tag | early signal |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum useful level | 52.790 international $/person (z=21.51) |
| Point where gains start slowing | 92.581 international $/person (ratio=0.086) |
| Flat zone range | [701.07, 6496.0] |
| Why this data-backed level was chosen | identified |
| Math-only guess minus data-backed level | -2067.1 (-71.0%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 0 | 5 | interpolation | 0.7072 | 0.0000 | 165 | 10890 |
| Runner-up | predictor_default | 1 | 5 | interpolation | 0.7033 | 0.0039 | 165 | 10890 |
| Runner-up | predictor_default | 2 | 5 | interpolation | 0.7015 | 0.0056 | 165 | 10890 |
| Runner-up | predictor_default | 3 | 2 | interpolation | 0.7013 | 0.0059 | 165 | 10890 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.00000, 44.242) | 1089 | 34 | 28.9348 | 31.2704 | 50.1030 | 50.5494 |
| 2 | [44.242, 88.416) | 1089 | 45 | 63.5704 | 61.4310 | 54.9875 | 55.0608 |
| 3 | [88.416, 176.42) | 1089 | 58 | 131.0782 | 132.0090 | 57.9348 | 58.6578 |
| 4 | [176.42, 273.76) | 1089 | 56 | 225.6957 | 227.3281 | 59.8432 | 61.2670 |
| 5 | [273.76, 393.86) | 1089 | 68 | 330.1970 | 332.5590 | 61.9990 | 62.7229 |
| 6 | [393.86, 546.86) | 1089 | 59 | 473.6655 | 479.4038 | 62.0763 | 63.7850 |
| 7 | [546.86, 823.91) | 1089 | 59 | 657.8667 | 638.6056 | 63.7028 | 64.6759 |
| 8 | [823.91, 1229.9) | 1089 | 52 | 1020.8003 | 1005.6732 | 65.0742 | 66.1124 |
| 9 | [1229.9, 2075.9) | 1089 | 45 | 1594.1025 | 1535.5536 | 68.2099 | 68.8079 |
| 10 | [2075.9, 6496.0] | 1089 | 28 | 2949.0430 | 2705.8562 | 69.1004 | 69.7836 |

### Distribution Charts

```text
Predictor Distribution (Education Expenditure Per Capita (PPP))
[0.00000, 541.33) | ############################## 6495
[541.33, 1082.7) | ######### 1842
[1082.7, 1624.0) | ##### 1020
[1624.0, 2165.3) | ### 579
[2165.3, 2706.6) | ## 411
[2706.6, 3248.0) | # 255
[3248.0, 3789.3) | # 132
[3789.3, 4330.6) | # 81
[4330.6, 4872.0) | # 36
[4872.0, 5413.3) | # 15
[5413.3, 5954.6) | # 9
[5954.6, 6496.0] | # 15
```

```text
Outcome Distribution (Healthy Life Expectancy (HALE), welfare-aligned)
[31.884, 35.487) | # 2
[35.487, 39.089) | # 48
[39.089, 42.692) | ## 152
[42.692, 46.294) | #### 320
[46.294, 49.896) | ###### 477
[49.896, 53.499) | ########## 842
[53.499, 57.101) | ############ 1044
[57.101, 60.704) | ############### 1216
[60.704, 64.306) | ########################## 2157
[64.306, 67.909) | ############################## 2512
[67.909, 71.511) | ####################### 1966
[71.511, 75.113] | ## 154
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| DZA | 0.6549 | 0.9245 | 2.464 | 66 |
| GAB | -0.6315 | -0.8005 | -5.340 | 66 |
| SUR | -0.0931 | -0.7393 | -0.724 | 66 |
| LBN | 0.1674 | -0.7160 | 0.560 | 66 |
| VNM | 0.2249 | -0.7120 | 1.653 | 66 |
| JOR | 0.4825 | 0.6897 | 2.693 | 66 |
| BRN | -0.3215 | -0.6705 | -0.646 | 66 |
| CRI | 0.1472 | -0.6509 | 0.620 | 66 |
