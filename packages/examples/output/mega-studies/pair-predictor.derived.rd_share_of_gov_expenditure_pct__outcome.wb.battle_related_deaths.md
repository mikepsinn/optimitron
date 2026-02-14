# Pair Study: R&D Share of Government Spending -> Battle-Related Deaths

- Pair ID: `predictor.derived.rd_share_of_gov_expenditure_pct__outcome.wb.battle_related_deaths`
- Lag years: 5
- Duration years: 3
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 16
- Temporal candidates with valid results: 16
- Temporal profile score: 0.5767
- Included subjects: 18
- Skipped subjects: 0
- Total aligned pairs: 430
- Signal grade: C (moderate)
- Data status: not enough data
- Confidence score: 0.490 (lower confidence)
- Signal tag: not enough data
- Direction: positive
- Uncertainty score: 0.3925 (lower is better)

## Quick Meanings

- `Recommended level`: main value to try first.
- `Data-backed level`: level directly supported by seen data.
- `Backup level`: safer fallback from the middle of the data.
- `Math-only guess`: unconstrained model output for technical comparison.
- `Not enough data`: we cannot safely recommend a level yet.

## Key Numeric Takeaways

- No recommended level is shown for R&D Share of Government Spending -> Battle-Related Deaths because there is not enough data.
- Why: subject coverage below minimum (18 < 40); aligned-pair support below minimum (430 < 2000).
- Observed support in this run: 18 subjects, 430 aligned pairs, 10 predictor bins, 16 temporal candidates with valid results.
- Use this pair for background learning only until we have enough data.

## Decision Summary

- Interpretation: not enough data for a safe recommendation.
- Recommendation status: no recommended level until data improves.
- Why: subject coverage below minimum (18 < 40); aligned-pair support below minimum (430 < 2000).

## Plain-Language Summary

- Higher R&D Share of Government Spending tends to align with better Battle-Related Deaths.
- The estimate uses 18 subjects and 430 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [0.81670, 1.231) (mean outcome -626.89).
- Confidence score is 0.490 (lower confidence); data status is not enough data.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Low country coverage (<30); results may change a lot as more data is added.
- Low aligned-pair count (<1000); confidence is limited.
- Weak significance score (<0.70).
- Some country-level direction scores are unusually high; this can happen with this scoring method.
- Top temporal profiles are close (score delta 0.0261); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 49.8% from raw optimal; tail observations materially influence target.
- Data status warning: subject coverage below minimum (18 < 40); aligned-pair support below minimum (430 < 2000)

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Forward correlation | 0.2159 |
| Reverse correlation | -0.1150 |
| Direction score (forward - reverse) | 0.3309 |
| Effect size (% change from baseline) | 31.4186 |
| Significance score | 0.6075 |
| Weighted PIS | 0.2029 |
| Value linked with higher outcome | 3.1431 |
| Value linked with lower outcome | 3.1053 |
| Math-only best daily value | 3.1431 |
| Recommended level (reader-facing) | N/A (not enough data) |
| Math-only guess (technical) | 3.143 % of government expenditure |
| Data-backed level | 0.61675 % of government expenditure |
| Data-backed range | [0.50284, 0.73494) |
| Backup level (middle-data check) | 1.066 % of government expenditure |
| Math-only guess inside seen data range? | yes |
| Math-only guess inside data-backed range? | no |
| Seen data range | [0.3086, 17.0779] |
| Math-only guess outside seen data? | no (within observed range) |
| Math-only guess outside best observed bucket? | yes |
| Best observed range | [0.81670, 1.231) |
| Best observed range (middle-data check) | [1.489, 2.049) |
| Best observed outcome average | -626.89 |
| Best observed outcome average (middle-data check) | -338.53 |
| Backup level (bucket median) | 1.578 % of government expenditure |
| Math-only vs backup difference | -1.565 (-49.8%) |
| Middle-data share kept | 80.0% (344/430) |
| Data status | not enough data |
| Data-status details | subject coverage below minimum (18 < 40); aligned-pair support below minimum (430 < 2000) |
| Confidence score | 0.4900 (lower confidence) |
| Reliability support component | 0.0958 |
| Reliability significance component | 0.6075 |
| Reliability directional component | 1.0000 |
| Reliability temporal-stability component | 0.8709 |
| Reliability robustness component | 0.5577 |
| Signal tag | not enough data |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum useful level | Not identified (no_consistent_effective_dose_detected) |
| Point where gains start slowing | 0.81670 % of government expenditure (ratio=-0.739) |
| Flat zone range | [4.742, 13.457] |
| Why this data-backed level was chosen | identified |
| Math-only guess minus data-backed level | 2.526 (+409.6%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 5 | 3 | interpolation | 0.5767 | 0.0000 | 18 | 430 |
| Runner-up | predictor_default | 5 | 5 | interpolation | 0.5506 | 0.0261 | 18 | 430 |
| Runner-up | predictor_default | 5 | 2 | interpolation | 0.4712 | 0.1055 | 18 | 430 |
| Runner-up | predictor_default | 1 | 8 | interpolation | 0.4593 | 0.1174 | 18 | 430 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.50284, 0.75954) | 43 | 4 | 0.6502 | 0.7018 | -1381.6279 | -470.0000 |
| 2 | [0.75954, 0.81670) | 33 | 4 | 0.7795 | 0.7740 | -776.2121 | -503.0000 |
| 3 | [0.81670, 1.231) | 53 | 7 | 0.9505 | 0.9228 | -626.8868 | -154.0000 |
| 4 | [1.231, 1.861) | 43 | 7 | 1.5078 | 1.4887 | -4131.6047 | -148.0000 |
| 5 | [1.861, 2.846) | 43 | 7 | 2.3009 | 2.3291 | -883.2558 | -386.0000 |
| 6 | [2.846, 3.385) | 43 | 5 | 3.1401 | 3.2106 | -17405.4651 | -4255.0000 |
| 7 | [3.385, 4.303) | 33 | 6 | 3.8119 | 3.8090 | -1607.9394 | -101.0000 |
| 8 | [4.303, 4.567) | 52 | 4 | 4.4088 | 4.3466 | -3065.2885 | -2893.0000 |
| 9 | [4.567, 5.120) | 44 | 5 | 4.8244 | 4.7935 | -2269.7955 | -1055.5000 |
| 10 | [5.120, 13.457] | 43 | 5 | 7.3344 | 6.2508 | -960.4186 | -385.0000 |

### Distribution Charts

```text
Predictor Distribution (R&D Share of Government Spending)
[0.50284, 1.582) | ############################## 163
[1.582, 2.662) | ######### 49
[2.662, 3.741) | ########### 59
[3.741, 4.821) | ################## 97
[4.821, 5.901) | ####### 36
[5.901, 6.980) | ## 11
[6.980, 8.060) | # 1
[8.060, 9.139) | # 2
[9.139, 10.219) | # 5
[10.219, 11.298) | # 3
[11.298, 12.378) | # 1
[12.378, 13.457] | # 3
```

```text
Outcome Distribution (Battle-Related Deaths, welfare-aligned)
[-170838, -156602) | # 1
[-156602, -142365) | # 1
[-99655.5, -85419.0) | # 1
[-85419.0, -71182.5) | # 1
[-71182.5, -56946.0) | # 1
[-56946.0, -42709.5) | # 2
[-42709.5, -28473.0) | # 4
[-28473.0, -14236.5) | # 4
[-14236.5, 0.00000] | ############################## 415
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| SAU | -0.5056 | -1.3369 | 922.222 | 13 |
| UKR | 0.6323 | 1.2119 | -95.115 | 10 |
| AZE | 0.1603 | 1.0425 | -42.185 | 18 |
| RUS | 0.2399 | 0.9581 | -48.055 | 30 |
| IND | 0.3106 | 0.8089 | -31.689 | 34 |
| LKA | -0.5843 | -0.7667 | 6.774 | 18 |
| THA | 0.2135 | 0.7530 | -60.594 | 26 |
| ARM | 0.0684 | 0.6611 | -6.087 | 11 |
