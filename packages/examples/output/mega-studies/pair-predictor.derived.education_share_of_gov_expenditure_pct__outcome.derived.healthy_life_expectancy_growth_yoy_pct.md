# Pair Study: Education Share of Government Spending -> Healthy Life Expectancy Growth (YoY %)

- Pair ID: `predictor.derived.education_share_of_gov_expenditure_pct__outcome.derived.healthy_life_expectancy_growth_yoy_pct`
- Lag years: 2
- Duration years: 2
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 15
- Temporal candidates with valid results: 15
- Temporal profile score: 0.3691
- Included subjects: 134
- Skipped subjects: 0
- Total aligned pairs: 2814
- Signal grade: F (very weak)
- Data status: enough data
- Confidence score: 0.475 (lower confidence)
- Signal tag: not enough data
- Direction: neutral
- Uncertainty score: 0.7968 (lower is better)

## Quick Meanings

- `Recommended level`: main value to try first.
- `Data-backed level`: level directly supported by seen data.
- `Backup level`: safer fallback from the middle of the data.
- `Math-only guess`: unconstrained model output for technical comparison.
- `Not enough data`: we cannot safely recommend a level yet.

## Key Numeric Takeaways

- Recommended Education Share of Government Spending level for higher Healthy Life Expectancy Growth (YoY %): 33.378 % of government expenditure (data-backed level).
- Best level directly seen in the grouped data: 33.378 % of government expenditure.
- Backup level check (middle 10-90% of data) suggests 20.911 % of government expenditure.
- Minimum effective level (first consistently positive zone): 19.592 % of government expenditure.
- Diminishing returns likely begin near 21.063 % of government expenditure.
- Could not find a stable flat zone (no_plateau_zone_detected).
- Highest observed mean Healthy Life Expectancy Growth (YoY %) appears when Education Share of Government Spending is in [19.007, 20.477) (mean outcome 0.72473).
- Direction signal is neutral; use caution and rely on the data-backed level.

## Decision Summary

- Interpretation: Early signal only; use this mainly to guide more testing.
- Pattern hint: no clear up/down pattern; use data-backed levels only.
- Signal strength: weak to moderate; avoid strong conclusions from this pair alone.

## Plain-Language Summary

- No strong directional pattern is detected between Education Share of Government Spending and Healthy Life Expectancy Growth (YoY %).
- The estimate uses 134 subjects and 2814 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [19.007, 20.477) (mean outcome 0.72473).
- A minimum effective predictor level appears near 19.592 % of government expenditure in the binned response curve.
- Confidence score is 0.475 (lower confidence); data status is enough data.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Weak significance score (<0.70).
- Some country-level direction scores are unusually high; this can happen with this scoring method.
- Top temporal profiles are close (score delta 0.0000); temporal assumptions are not yet robust.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Forward correlation | -0.0439 |
| Reverse correlation | 0.0337 |
| Direction score (forward - reverse) | -0.0776 |
| Effect size (% change from baseline) | -345.9250 |
| Significance score | 0.2032 |
| Weighted PIS | 0.0793 |
| Value linked with higher outcome | 19.3823 |
| Value linked with lower outcome | 19.4329 |
| Math-only best daily value | 19.3823 |
| Recommended level (reader-facing) | 33.378 % of government expenditure (data-backed level) |
| Math-only guess (technical) | 19.382 % of government expenditure |
| Data-backed level | 33.378 % of government expenditure |
| Data-backed range | [29.476, 66.668] |
| Backup level (middle-data check) | 20.449 % of government expenditure |
| Math-only guess inside seen data range? | yes |
| Math-only guess inside data-backed range? | no |
| Seen data range | [0.0000, 70.8565] |
| Math-only guess outside seen data? | no (within observed range) |
| Math-only guess outside best observed bucket? | no |
| Best observed range | [19.007, 20.477) |
| Best observed range (middle-data check) | [20.190, 21.607) |
| Best observed outcome average | 0.72473 |
| Best observed outcome average (middle-data check) | 0.71658 |
| Backup level (bucket median) | 20.911 % of government expenditure |
| Math-only vs backup difference | 1.529 (+7.9%) |
| Middle-data share kept | 80.1% (2255/2814) |
| Data status | enough data |
| Data-status details | none |
| Confidence score | 0.4748 (lower confidence) |
| Reliability support component | 0.6812 |
| Reliability significance component | 0.2032 |
| Reliability directional component | 0.5173 |
| Reliability temporal-stability component | 0.0016 |
| Reliability robustness component | 1.0000 |
| Signal tag | not enough data |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum useful level | 19.592 % of government expenditure (z=1.51) |
| Point where gains start slowing | 21.063 % of government expenditure (ratio=-1.238) |
| Flat zone range | Not identified (no_plateau_zone_detected) |
| Why this data-backed level was chosen | identified |
| Math-only guess minus data-backed level | -13.996 (-41.9%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 2 | 2 | interpolation | 0.3691 | 0.0000 | 134 | 2814 |
| Runner-up | predictor_default | 2 | 3 | interpolation | 0.3690 | 0.0000 | 134 | 2814 |
| Runner-up | predictor_default | 1 | 5 | interpolation | 0.3682 | 0.0009 | 134 | 2814 |
| Runner-up | predictor_default | 0 | 5 | interpolation | 0.3665 | 0.0025 | 134 | 2814 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.00000, 10.881) | 277 | 30 | 9.0026 | 9.3475 | 0.1289 | 0.2241 |
| 2 | [10.881, 12.907) | 286 | 43 | 11.8884 | 11.9506 | 0.1807 | 0.2750 |
| 3 | [12.907, 14.703) | 272 | 49 | 13.8691 | 13.8994 | -0.2685 | 0.1064 |
| 4 | [14.703, 16.978) | 291 | 54 | 15.8587 | 15.9267 | -0.2797 | 0.0536 |
| 5 | [16.978, 19.007) | 281 | 64 | 17.9213 | 17.8043 | 0.3430 | 0.2801 |
| 6 | [19.007, 20.477) | 281 | 58 | 19.7767 | 19.8273 | 0.7247 | 0.3354 |
| 7 | [20.477, 22.673) | 282 | 63 | 21.4998 | 21.5492 | 0.4252 | 0.4148 |
| 8 | [22.673, 24.744) | 281 | 54 | 23.6594 | 23.6993 | 0.4398 | 0.3164 |
| 9 | [24.744, 28.681) | 281 | 49 | 26.6046 | 26.6326 | 0.2131 | 0.2496 |
| 10 | [28.681, 66.668] | 282 | 35 | 35.7853 | 32.3046 | 0.5678 | 0.6613 |

### Distribution Charts

```text
Predictor Distribution (Education Share of Government Spending)
[0.00000, 5.556) | # 6
[5.556, 11.111) | ########### 313
[11.111, 16.667) | ########################## 755
[16.667, 22.223) | ############################## 857
[22.223, 27.778) | ################### 547
[27.778, 33.334) | ######## 217
[33.334, 38.890) | ### 79
[38.890, 44.446) | # 7
[44.446, 50.001) | # 7
[50.001, 55.557) | # 3
[55.557, 61.113) | # 5
[61.113, 66.668] | # 18
```

```text
Outcome Distribution (Healthy Life Expectancy Growth (YoY %), welfare-aligned)
[-16.329, -13.626) | # 2
[-13.626, -10.924) | # 11
[-10.924, -8.221) | # 17
[-8.221, -5.518) | ## 90
[-5.518, -2.815) | ###### 246
[-2.815, -0.11259) | ################ 679
[-0.11259, 2.590) | ############################## 1277
[2.590, 5.293) | ######## 337
[5.293, 7.996) | ### 114
[7.996, 10.698) | # 30
[10.698, 13.401) | # 7
[13.401, 16.104] | # 4
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| GAB | -0.7162 | -1.3279 | -207.963 | 21 |
| COD | -0.4743 | -1.2512 | -94.991 | 21 |
| IRL | -0.7755 | -1.0510 | -176.508 | 21 |
| KOR | 0.1060 | 0.9072 | 138.774 | 21 |
| TJK | -0.2806 | -0.9027 | -166.732 | 21 |
| BDI | 0.3008 | 0.8739 | 1501.403 | 21 |
| MYS | 0.2355 | 0.8624 | -99.888 | 21 |
| FSM | 0.0105 | 0.8470 | 1237.451 | 21 |
