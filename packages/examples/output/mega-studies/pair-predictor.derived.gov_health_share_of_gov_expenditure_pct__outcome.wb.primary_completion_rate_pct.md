# Pair Study: Government Health Share of Government Spending -> Primary School Completion Rate

- Pair ID: `predictor.derived.gov_health_share_of_gov_expenditure_pct__outcome.wb.primary_completion_rate_pct`
- Lag years: 5
- Duration years: 5
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 15
- Temporal candidates with valid results: 15
- Temporal profile score: 0.6177
- Included subjects: 152
- Skipped subjects: 0
- Total aligned pairs: 3425
- Signal grade: C (moderate)
- Data status: enough data
- Confidence score: 0.750 (higher confidence)
- Signal tag: not enough data
- Direction: neutral
- Uncertainty score: 0.4197 (lower is better)

## Quick Meanings

- `Recommended level`: main value to try first.
- `Data-backed level`: level directly supported by seen data.
- `Backup level`: safer fallback from the middle of the data.
- `Math-only guess`: unconstrained model output for technical comparison.
- `Not enough data`: we cannot safely recommend a level yet.

## Key Numeric Takeaways

- Recommended Government Health Share of Government Spending level for higher Primary School Completion Rate: 16.250 % of government expenditure (data-backed level).
- Best level directly seen in the grouped data: 16.250 % of government expenditure.
- Math-only guess is inside seen data but outside the best-performing bucket, so we still use the data-backed level.
- Best observed bin anchor (median/mean) is 23.466 % of government expenditure; model-optimal minus observed-anchor difference is -10.605 (-45.2%).
- Backup level check (middle 10-90% of data) suggests 15.991 % of government expenditure.
- Minimum effective level (first consistently positive zone): 9.584 % of government expenditure.
- Diminishing returns likely begin near 9.584 % of government expenditure.
- Saturation/plateau zone starts around 19.238 % of government expenditure and extends through 24.700 % of government expenditure.
- Highest observed mean Primary School Completion Rate appears when Government Health Share of Government Spending is in [20.308, 65.863] (mean outcome 92.607).
- Direction signal is neutral; use caution and rely on the data-backed level.

## Decision Summary

- Interpretation: Early signal only; use this mainly to guide more testing.
- Pattern hint: no clear up/down pattern; use data-backed levels only.
- Signal strength: weak to moderate; avoid strong conclusions from this pair alone.

## Plain-Language Summary

- No strong directional pattern is detected between Government Health Share of Government Spending and Primary School Completion Rate.
- The estimate uses 152 subjects and 3425 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [20.308, 65.863] (mean outcome 92.607).
- A minimum effective predictor level appears near 9.584 % of government expenditure in the binned response curve.
- Confidence score is 0.750 (higher confidence); data status is enough data.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Weak significance score (<0.70).
- Some country-level direction scores are unusually high; this can happen with this scoring method.
- Top temporal profiles are close (score delta 0.0166); temporal assumptions are not yet robust.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Forward correlation | -0.0421 |
| Reverse correlation | 0.1369 |
| Direction score (forward - reverse) | -0.1790 |
| Effect size (% change from baseline) | 0.0000 |
| Significance score | 0.5803 |
| Weighted PIS | 0.3917 |
| Value linked with higher outcome | 12.8611 |
| Value linked with lower outcome | 13.0345 |
| Math-only best daily value | 12.8611 |
| Recommended level (reader-facing) | 16.250 % of government expenditure (data-backed level) |
| Math-only guess (technical) | 12.861 % of government expenditure |
| Data-backed level | 16.250 % of government expenditure |
| Data-backed range | [15.395, 17.804) |
| Backup level (middle-data check) | 16.498 % of government expenditure |
| Math-only guess inside seen data range? | yes |
| Math-only guess inside data-backed range? | no |
| Seen data range | [1.3414, 88.0822] |
| Math-only guess outside seen data? | no (within observed range) |
| Math-only guess outside best observed bucket? | yes |
| Best observed range | [20.308, 65.863] |
| Best observed range (middle-data check) | [15.181, 17.095) |
| Best observed outcome average | 92.607 |
| Best observed outcome average (middle-data check) | 92.425 |
| Backup level (bucket median) | 15.991 % of government expenditure |
| Math-only vs backup difference | 3.130 (+24.3%) |
| Middle-data share kept | 80.0% (2739/3425) |
| Data status | enough data |
| Data-status details | none |
| Confidence score | 0.7504 (higher confidence) |
| Reliability support component | 0.7854 |
| Reliability significance component | 0.5803 |
| Reliability directional component | 1.0000 |
| Reliability temporal-stability component | 0.5526 |
| Reliability robustness component | 0.8407 |
| Signal tag | not enough data |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum useful level | 9.584 % of government expenditure (z=8.28) |
| Point where gains start slowing | 9.584 % of government expenditure (ratio=0.135) |
| Flat zone range | [17.804, 65.863] |
| Why this data-backed level was chosen | identified |
| Math-only guess minus data-backed level | -3.388 (-20.9%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 5 | 5 | interpolation | 0.6177 | 0.0000 | 152 | 3425 |
| Runner-up | predictor_default | 5 | 3 | interpolation | 0.6011 | 0.0166 | 152 | 3425 |
| Runner-up | predictor_default | 5 | 2 | interpolation | 0.5931 | 0.0246 | 152 | 3425 |
| Runner-up | predictor_default | 3 | 5 | interpolation | 0.5755 | 0.0422 | 152 | 3425 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [1.887, 6.100) | 343 | 23 | 4.9383 | 4.9223 | 75.0200 | 73.5851 |
| 2 | [6.100, 8.550) | 342 | 36 | 7.3237 | 7.2373 | 79.6401 | 87.7909 |
| 3 | [8.550, 9.672) | 325 | 42 | 9.0681 | 9.0334 | 79.4076 | 88.9156 |
| 4 | [9.672, 10.901) | 360 | 54 | 10.2840 | 10.3076 | 88.4261 | 93.6964 |
| 5 | [10.901, 11.890) | 342 | 53 | 11.3756 | 11.4225 | 91.3158 | 94.7623 |
| 6 | [11.890, 12.995) | 343 | 55 | 12.5230 | 12.5835 | 89.5358 | 96.7356 |
| 7 | [12.995, 14.766) | 341 | 61 | 13.8803 | 13.8093 | 89.6786 | 96.1884 |
| 8 | [14.766, 16.499) | 344 | 38 | 15.4726 | 15.3949 | 92.2084 | 97.2739 |
| 9 | [16.499, 20.308) | 342 | 36 | 18.3811 | 18.4037 | 91.9050 | 97.6043 |
| 10 | [20.308, 65.863] | 343 | 24 | 25.9868 | 23.4657 | 92.6065 | 98.6217 |

### Distribution Charts

```text
Predictor Distribution (Government Health Share of Government Spending)
[1.887, 7.219) | ########### 513
[7.219, 12.550) | ############################## 1357
[12.550, 17.881) | ###################### 989
[17.881, 23.213) | ######### 393
[23.213, 28.544) | ## 108
[28.544, 33.875) | # 49
[33.875, 39.207) | # 4
[60.532, 65.863] | # 12
```

```text
Outcome Distribution (Primary School Completion Rate, welfare-aligned)
[13.580, 25.388) | # 26
[25.388, 37.196) | ## 71
[37.196, 49.003) | ### 119
[49.003, 60.811) | #### 202
[60.811, 72.619) | ###### 264
[72.619, 84.427) | ####### 323
[84.427, 96.234) | #################### 921
[96.234, 108.04) | ############################## 1392
[108.04, 119.85) | ## 93
[119.85, 131.66) | # 10
[131.66, 143.47) | # 3
[143.47, 155.27] | # 1
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| PSS | -0.5441 | -1.4774 | -3.311 | 34 |
| ARG | -0.7000 | -1.4562 | -4.795 | 29 |
| GBR | 0.8598 | 1.4085 | 1.294 | 9 |
| GTM | -0.5963 | -1.2669 | -13.793 | 25 |
| JAM | -0.5182 | -1.1389 | -4.673 | 21 |
| UKR | 0.4430 | 1.1189 | 7.389 | 20 |
| COG | -0.3464 | -1.0950 | -15.718 | 20 |
| LCA | 0.8190 | 1.0603 | 12.424 | 23 |
