# Pair Study: Civilian Government Expenditure Per Capita (PPP) -> Healthy Life Expectancy (HALE)

- Pair ID: `predictor.derived.gov_non_military_expenditure_per_capita_ppp__outcome.who.healthy_life_expectancy_years`
- Lag years: 3
- Duration years: 3
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.7486
- Included subjects: 126
- Skipped subjects: 0
- Total aligned pairs: 8316
- Signal grade: A (very strong)
- Data status: enough data
- Confidence score: 0.701 (medium confidence)
- Signal tag: early signal
- Direction: positive
- Uncertainty score: 0.0625 (lower is better)

## Quick Meanings

- `Recommended level`: main value to try first.
- `Data-backed level`: level directly supported by seen data.
- `Backup level`: safer fallback from the middle of the data.
- `Math-only guess`: unconstrained model output for technical comparison.
- `Not enough data`: we cannot safely recommend a level yet.

## Key Numeric Takeaways

- Recommended Civilian Government Expenditure Per Capita (PPP) level for higher Healthy Life Expectancy (HALE): 16280.7 international $/person (data-backed level).
- Best level directly seen in the grouped data: 16280.7 international $/person.
- Math-only guess is inside seen data but outside the best-performing bucket, so we still use the data-backed level.
- Best observed bin anchor (median/mean) is 15216.7 international $/person; model-optimal minus observed-anchor difference is -10097.9 (-66.4%).
- Backup level check (middle 10-90% of data) suggests 9993.2 international $/person.
- The math-only guess and backup level differ by 95.2%, which means extreme values may matter a lot.
- Minimum effective level (first consistently positive zone): 237.92 international $/person.
- Diminishing returns likely begin near 516.72 international $/person.
- Saturation/plateau zone starts around 1800.2 international $/person and extends through 3587.5 international $/person.
- Highest observed mean Healthy Life Expectancy (HALE) appears when Civilian Government Expenditure Per Capita (PPP) is in [11499.3, 42959.9] (mean outcome 69.733).
- Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Stronger signal compared with most other predictors in this report.
- Pattern hint: higher Civilian Government Expenditure Per Capita (PPP) tends to go with better Healthy Life Expectancy (HALE).
- Signal strength: stronger in this report set.

## Plain-Language Summary

- Higher Civilian Government Expenditure Per Capita (PPP) tends to align with better Healthy Life Expectancy (HALE).
- The estimate uses 126 subjects and 8316 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [11499.3, 42959.9] (mean outcome 69.733).
- A minimum effective predictor level appears near 237.92 international $/person in the binned response curve.
- Confidence score is 0.701 (medium confidence); data status is enough data.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Forward and direction signals disagree; direction may be unstable.
- Some country-level direction scores are unusually high; this can happen with this scoring method.
- Top temporal profiles are close (score delta 0.0057); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 95.2% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Forward correlation | 0.5572 |
| Reverse correlation | 0.7277 |
| Direction score (forward - reverse) | -0.1705 |
| Effect size (% change from baseline) | 4.5549 |
| Significance score | 0.9375 |
| Weighted PIS | 0.5689 |
| Value linked with higher outcome | 5118.8102 |
| Value linked with lower outcome | 3765.3969 |
| Math-only best daily value | 5118.8102 |
| Recommended level (reader-facing) | 16280.7 international $/person (data-backed level) |
| Math-only guess (technical) | 5118.8 international $/person |
| Data-backed level | 16280.7 international $/person |
| Data-backed range | [12375.9, 42959.9] |
| Backup level (middle-data check) | 10229.2 international $/person |
| Math-only guess inside seen data range? | yes |
| Math-only guess inside data-backed range? | no |
| Seen data range | [7.6041, 62399.1940] |
| Math-only guess outside seen data? | no (within observed range) |
| Math-only guess outside best observed bucket? | yes |
| Best observed range | [11499.3, 42959.9] |
| Best observed range (middle-data check) | [8819.9, 11499.3] |
| Best observed outcome average | 69.733 |
| Best observed outcome average (middle-data check) | 68.016 |
| Backup level (bucket median) | 9993.2 international $/person |
| Math-only vs backup difference | 4874.4 (+95.2%) |
| Middle-data share kept | 80.0% (6654/8316) |
| Data status | enough data |
| Data-status details | none |
| Confidence score | 0.7006 (medium confidence) |
| Reliability support component | 0.9200 |
| Reliability significance component | 0.9375 |
| Reliability directional component | 1.0000 |
| Reliability temporal-stability component | 0.1884 |
| Reliability robustness component | 0.0530 |
| Signal tag | early signal |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum useful level | 237.92 international $/person (z=5.91) |
| Point where gains start slowing | 516.72 international $/person (ratio=0.159) |
| Flat zone range | [1571.3, 4269.1) |
| Why this data-backed level was chosen | identified |
| Math-only guess minus data-backed level | -11161.9 (-68.6%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 3 | 3 | interpolation | 0.7486 | 0.0000 | 126 | 8316 |
| Runner-up | predictor_default | 3 | 2 | interpolation | 0.7429 | 0.0057 | 126 | 8316 |
| Runner-up | predictor_default | 3 | 1 | interpolation | 0.7343 | 0.0143 | 126 | 8316 |
| Runner-up | predictor_default | 2 | 3 | interpolation | 0.7243 | 0.0243 | 126 | 8316 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [7.604, 207.94) | 831 | 19 | 116.2883 | 112.1479 | 51.6229 | 52.4201 |
| 2 | [207.94, 511.72) | 804 | 32 | 316.0200 | 293.6527 | 54.3901 | 54.9433 |
| 3 | [511.72, 911.00) | 858 | 35 | 679.5996 | 659.6264 | 57.5540 | 58.8582 |
| 4 | [911.00, 1439.3) | 831 | 44 | 1127.2898 | 1125.1411 | 60.5454 | 62.2469 |
| 5 | [1439.3, 2140.5) | 834 | 46 | 1756.7189 | 1749.9259 | 61.7472 | 63.6245 |
| 6 | [2140.5, 3372.3) | 831 | 42 | 2638.7721 | 2585.5899 | 62.5657 | 64.4640 |
| 7 | [3372.3, 4996.6) | 831 | 41 | 4025.8640 | 3933.9218 | 64.4894 | 65.1819 |
| 8 | [4996.6, 7972.3) | 831 | 38 | 6415.1682 | 6476.6987 | 67.1968 | 67.4375 |
| 9 | [7972.3, 11499.3) | 831 | 36 | 9724.6004 | 9624.7296 | 67.9833 | 68.3799 |
| 10 | [11499.3, 42959.9] | 834 | 26 | 17060.3906 | 15216.7145 | 69.7334 | 69.8857 |

### Distribution Charts

```text
Predictor Distribution (Civilian Government Expenditure Per Capita (PPP))
[7.604, 3587.0) | ############################## 5196
[3587.0, 7166.3) | ####### 1260
[7166.3, 10745.7) | ##### 873
[10745.7, 14325.0) | ### 489
[14325.0, 17904.4) | # 210
[17904.4, 21483.8) | # 159
[21483.8, 25063.1) | # 57
[25063.1, 28642.5) | # 39
[28642.5, 32221.8) | # 6
[32221.8, 35801.2) | # 9
[35801.2, 39380.5) | # 9
[39380.5, 42959.9] | # 9
```

```text
Outcome Distribution (Healthy Life Expectancy (HALE), welfare-aligned)
[36.729, 39.928) | # 71
[39.928, 43.126) | ## 121
[43.126, 46.325) | #### 231
[46.325, 49.524) | ##### 316
[49.524, 52.723) | ######## 456
[52.723, 55.921) | ########## 591
[55.921, 59.120) | ########### 651
[59.120, 62.319) | ################## 1064
[62.319, 65.517) | ########################### 1576
[65.517, 68.716) | ############################## 1760
[68.716, 71.915) | ####################### 1373
[71.915, 75.113] | ## 106
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| MWI | -0.7773 | -1.2819 | -17.373 | 66 |
| PRY | -0.2125 | -1.0826 | -0.324 | 66 |
| PER | 0.0366 | -0.9034 | 1.065 | 66 |
| MEX | -0.0514 | -0.8735 | 0.070 | 66 |
| CPV | -0.1626 | -0.8307 | 0.417 | 66 |
| USA | -0.0152 | -0.7637 | 0.085 | 66 |
| HND | 0.0452 | -0.7342 | -0.121 | 66 |
| ARM | 0.2098 | -0.7220 | 2.139 | 66 |
