# Pair Study: R&D Share of Government Spending -> Healthy Life Expectancy Growth (YoY %)

- Pair ID: `predictor.derived.rd_share_of_gov_expenditure_pct__outcome.derived.healthy_life_expectancy_growth_yoy_pct`
- Lag years: 5
- Duration years: 8
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 16
- Temporal candidates with valid results: 16
- Temporal profile score: 0.3639
- Included subjects: 82
- Skipped subjects: 0
- Total aligned pairs: 1722
- Signal grade: F (very weak)
- Data status: not enough data
- Confidence score: 0.446 (lower confidence)
- Signal tag: not enough data
- Direction: neutral
- Uncertainty score: 0.7879 (lower is better)

## Quick Meanings

- `Recommended level`: main value to try first.
- `Data-backed level`: level directly supported by seen data.
- `Backup level`: safer fallback from the middle of the data.
- `Math-only guess`: unconstrained model output for technical comparison.
- `Not enough data`: we cannot safely recommend a level yet.

## Key Numeric Takeaways

- No recommended level is shown for R&D Share of Government Spending -> Healthy Life Expectancy Growth (YoY %) because there is not enough data.
- Why: aligned-pair support below minimum (1722 < 2000).
- Observed support in this run: 82 subjects, 1722 aligned pairs, 10 predictor bins, 16 temporal candidates with valid results.
- Use this pair for background learning only until we have enough data.

## Decision Summary

- Interpretation: not enough data for a safe recommendation.
- Recommendation status: no recommended level until data improves.
- Why: aligned-pair support below minimum (1722 < 2000).

## Plain-Language Summary

- No strong directional pattern is detected between R&D Share of Government Spending and Healthy Life Expectancy Growth (YoY %).
- The estimate uses 82 subjects and 1722 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [9.525, 20.356] (mean outcome 0.53447).
- Confidence score is 0.446 (lower confidence); data status is not enough data.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Weak significance score (<0.70).
- Some country-level direction scores are unusually high; this can happen with this scoring method.
- Top temporal profiles are close (score delta 0.0061); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 60.1% from raw optimal; tail observations materially influence target.
- Data status warning: aligned-pair support below minimum (1722 < 2000)

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Forward correlation | -0.0051 |
| Reverse correlation | -0.1491 |
| Direction score (forward - reverse) | 0.1441 |
| Effect size (% change from baseline) | -596.7575 |
| Significance score | 0.2121 |
| Weighted PIS | 0.0864 |
| Value linked with higher outcome | 3.4867 |
| Value linked with lower outcome | 3.5401 |
| Math-only best daily value | 3.4867 |
| Recommended level (reader-facing) | N/A (not enough data) |
| Math-only guess (technical) | 3.487 % of government expenditure |
| Data-backed level | 1.375 % of government expenditure |
| Data-backed range | [1.205, 1.504) |
| Backup level (middle-data check) | 4.323 % of government expenditure |
| Math-only guess inside seen data range? | yes |
| Math-only guess inside data-backed range? | no |
| Seen data range | [0.0487, 35.0684] |
| Math-only guess outside seen data? | no (within observed range) |
| Math-only guess outside best observed bucket? | yes |
| Best observed range | [9.525, 20.356] |
| Best observed range (middle-data check) | [1.266, 1.513) |
| Best observed outcome average | 0.53447 |
| Best observed outcome average (middle-data check) | 0.59245 |
| Backup level (bucket median) | 1.390 % of government expenditure |
| Math-only vs backup difference | -2.096 (-60.1%) |
| Middle-data share kept | 79.9% (1376/1722) |
| Data status | not enough data |
| Data-status details | aligned-pair support below minimum (1722 < 2000) |
| Confidence score | 0.4462 (lower confidence) |
| Reliability support component | 0.4168 |
| Reliability significance component | 0.2121 |
| Reliability directional component | 0.9606 |
| Reliability temporal-stability component | 0.2025 |
| Reliability robustness component | 0.4430 |
| Signal tag | not enough data |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum useful level | Not identified (no_consistent_effective_dose_detected) |
| Point where gains start slowing | 1.375 % of government expenditure (ratio=-0.432) |
| Flat zone range | [3.618, 20.356] |
| Why this data-backed level was chosen | identified |
| Math-only guess minus data-backed level | 2.112 (+153.6%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 5 | 8 | interpolation | 0.3639 | 0.0000 | 82 | 1722 |
| Runner-up | predictor_default | 5 | 5 | interpolation | 0.3578 | 0.0061 | 82 | 1722 |
| Runner-up | predictor_default | 5 | 3 | interpolation | 0.3125 | 0.0514 | 82 | 1722 |
| Runner-up | predictor_default | 3 | 8 | interpolation | 0.3079 | 0.0560 | 82 | 1722 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.06241, 0.67640) | 173 | 13 | 0.4154 | 0.4445 | -0.1017 | 0.0336 |
| 2 | [0.67640, 0.99311) | 172 | 18 | 0.8277 | 0.8021 | 0.1850 | 0.2220 |
| 3 | [0.99311, 1.392) | 172 | 27 | 1.1943 | 1.2058 | 0.4884 | 0.3796 |
| 4 | [1.392, 1.750) | 163 | 25 | 1.5505 | 1.5385 | -0.3433 | 0.1236 |
| 5 | [1.750, 2.211) | 181 | 31 | 1.9643 | 1.9515 | 0.0851 | 0.1452 |
| 6 | [2.211, 2.952) | 172 | 21 | 2.5341 | 2.5010 | -0.2367 | 0.1288 |
| 7 | [2.952, 3.973) | 172 | 20 | 3.4756 | 3.5838 | 0.0157 | 0.2824 |
| 8 | [3.973, 4.711) | 171 | 16 | 4.4125 | 4.4787 | 0.3796 | 0.2689 |
| 9 | [4.711, 9.525) | 173 | 17 | 6.7981 | 6.8821 | 0.1035 | 0.2268 |
| 10 | [9.525, 20.356] | 173 | 11 | 13.4376 | 12.6047 | 0.5345 | 0.2608 |

### Distribution Charts

```text
Predictor Distribution (R&D Share of Government Spending)
[0.06241, 1.754) | ############################## 692
[1.754, 3.445) | ################# 403
[3.445, 5.136) | ############## 323
[5.136, 6.827) | ## 42
[6.827, 8.518) | ### 60
[8.518, 10.209) | ## 55
[10.209, 11.900) | ## 36
[11.900, 13.591) | ## 47
[13.591, 15.283) | # 10
[15.283, 16.974) | # 23
[16.974, 18.665) | # 22
[18.665, 20.356] | # 9
```

```text
Outcome Distribution (Healthy Life Expectancy Growth (YoY %), welfare-aligned)
[-16.329, -13.626) | # 2
[-13.626, -10.924) | # 11
[-10.924, -8.221) | # 14
[-8.221, -5.518) | ## 58
[-5.518, -2.815) | ###### 161
[-2.815, -0.11259) | ################# 423
[-0.11259, 2.590) | ############################## 759
[2.590, 5.293) | ####### 186
[5.293, 7.996) | ### 75
[7.996, 10.698) | # 24
[10.698, 13.401) | # 5
[13.401, 16.104] | # 4
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| ZAF | 0.7441 | 1.5442 | -241.632 | 21 |
| EGY | -0.5581 | -1.4700 | -345.061 | 21 |
| RUS | 0.5321 | 1.4275 | -89.416 | 21 |
| MDG | 0.6225 | 1.4210 | 1706.194 | 21 |
| PHL | -0.3392 | -1.2234 | -142.643 | 21 |
| BGR | -0.3185 | -1.1661 | -5852.026 | 21 |
| IRN | 0.1488 | 1.0815 | -102.361 | 21 |
| SVK | -0.2989 | -1.0772 | 762.089 | 21 |
