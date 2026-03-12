# Pair Study: R&D Expenditure Per Capita (PPP) -> Healthy Life Expectancy Growth (YoY %)

- Pair ID: `predictor.derived.rd_expenditure_per_capita_ppp__outcome.derived.healthy_life_expectancy_growth_yoy_pct`
- Lag years: 3
- Duration years: 3
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 16
- Temporal candidates with valid results: 16
- Temporal profile score: 0.4146
- Included subjects: 95
- Skipped subjects: 0
- Total aligned pairs: 1995
- Signal grade: F (very weak)
- Data status: not enough data
- Confidence score: 0.475 (lower confidence)
- Signal tag: not enough data
- Direction: negative
- Uncertainty score: 0.7199 (lower is better)

## Quick Meanings

- `Recommended level`: main value to try first.
- `Data-backed level`: level directly supported by seen data.
- `Backup level`: safer fallback from the middle of the data.
- `Math-only guess`: unconstrained model output for technical comparison.
- `Not enough data`: we cannot safely recommend a level yet.

## Key Numeric Takeaways

- No recommended level is shown for R&D Expenditure Per Capita (PPP) -> Healthy Life Expectancy Growth (YoY %) because there is not enough data.
- Why: aligned-pair support below minimum (1995 < 2000).
- Observed support in this run: 95 subjects, 1995 aligned pairs, 10 predictor bins, 16 temporal candidates with valid results.
- Use this pair for background learning only until we have enough data.

## Decision Summary

- Interpretation: not enough data for a safe recommendation.
- Recommendation status: no recommended level until data improves.
- Why: aligned-pair support below minimum (1995 < 2000).

## Plain-Language Summary

- Higher R&D Expenditure Per Capita (PPP) tends to align with worse Healthy Life Expectancy Growth (YoY %).
- The estimate uses 95 subjects and 1995 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [10.891, 23.896) (mean outcome 0.38895).
- Confidence score is 0.475 (lower confidence); data status is not enough data.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Weak significance score (<0.70).
- Some country-level direction scores are unusually high; this can happen with this scoring method.
- Top temporal profiles are close (score delta 0.0141); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 90.1% from raw optimal; tail observations materially influence target.
- Data status warning: aligned-pair support below minimum (1995 < 2000)

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Forward correlation | -0.1470 |
| Reverse correlation | 0.0009 |
| Direction score (forward - reverse) | -0.1480 |
| Effect size (% change from baseline) | -472.0089 |
| Significance score | 0.2801 |
| Weighted PIS | 0.1450 |
| Value linked with higher outcome | 241.9726 |
| Value linked with lower outcome | 269.3978 |
| Math-only best daily value | 241.9726 |
| Recommended level (reader-facing) | N/A (not enough data) |
| Math-only guess (technical) | 241.97 international $/person |
| Data-backed level | 23.035 international $/person |
| Data-backed range | [15.667, 29.095) |
| Backup level (middle-data check) | 362.27 international $/person |
| Math-only guess inside seen data range? | yes |
| Math-only guess inside data-backed range? | no |
| Seen data range | [0.1972, 3227.4604] |
| Math-only guess outside seen data? | no (within observed range) |
| Math-only guess outside best observed bucket? | yes |
| Best observed range | [10.891, 23.896) |
| Best observed range (middle-data check) | [17.323, 30.207) |
| Best observed outcome average | 0.38895 |
| Best observed outcome average (middle-data check) | 0.44429 |
| Backup level (bucket median) | 23.907 international $/person |
| Math-only vs backup difference | -218.07 (-90.1%) |
| Middle-data share kept | 79.9% (1595/1995) |
| Data status | not enough data |
| Data-status details | aligned-pair support below minimum (1995 < 2000) |
| Confidence score | 0.4750 (lower confidence) |
| Reliability support component | 0.4829 |
| Reliability significance component | 0.2801 |
| Reliability directional component | 0.9865 |
| Reliability temporal-stability component | 0.4703 |
| Reliability robustness component | 0.1098 |
| Signal tag | not enough data |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum useful level | Not identified (no_consistent_effective_dose_detected) |
| Point where gains start slowing | Not identified (drop_below_detection_threshold) |
| Flat zone range | [194.14, 2098.3] |
| Why this data-backed level was chosen | identified |
| Math-only guess minus data-backed level | 218.94 (+950.5%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 3 | 3 | interpolation | 0.4146 | 0.0000 | 95 | 1995 |
| Runner-up | predictor_default | 3 | 2 | interpolation | 0.4005 | 0.0141 | 95 | 1995 |
| Runner-up | predictor_default | 2 | 5 | interpolation | 0.3944 | 0.0202 | 95 | 1995 |
| Runner-up | predictor_default | 5 | 2 | interpolation | 0.3762 | 0.0384 | 95 | 1995 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.19730, 4.610) | 200 | 18 | 2.3585 | 2.1064 | 0.3016 | 0.2485 |
| 2 | [4.610, 10.891) | 199 | 20 | 7.3491 | 7.3069 | 0.2101 | 0.3180 |
| 3 | [10.891, 23.896) | 200 | 29 | 16.6725 | 15.6670 | 0.3889 | 0.4189 |
| 4 | [23.896, 42.829) | 199 | 36 | 32.3331 | 31.8642 | 0.0261 | 0.2182 |
| 5 | [42.829, 70.239) | 199 | 32 | 56.2976 | 56.5983 | -0.3479 | 0.2052 |
| 6 | [70.239, 118.19) | 200 | 36 | 89.1433 | 87.1363 | 0.3550 | 0.2820 |
| 7 | [118.19, 263.86) | 199 | 30 | 176.8364 | 168.9516 | -0.4461 | -0.0133 |
| 8 | [263.86, 565.39) | 200 | 32 | 402.2961 | 415.5602 | 0.3735 | 0.2748 |
| 9 | [565.39, 964.85) | 199 | 26 | 751.5557 | 748.4144 | 0.2086 | 0.1830 |
| 10 | [964.85, 2098.3] | 200 | 19 | 1299.3488 | 1265.2551 | 0.2221 | 0.2047 |

### Distribution Charts

```text
Predictor Distribution (R&D Expenditure Per Capita (PPP))
[0.19730, 175.04) | ############################## 1305
[175.04, 349.88) | ### 152
[349.88, 524.72) | ### 122
[524.72, 699.57) | ## 92
[699.57, 874.41) | ## 86
[874.41, 1049.2) | ## 74
[1049.2, 1224.1) | # 52
[1224.1, 1398.9) | # 49
[1398.9, 1573.8) | # 35
[1573.8, 1748.6) | # 17
[1748.6, 1923.5) | # 7
[1923.5, 2098.3] | # 4
```

```text
Outcome Distribution (Healthy Life Expectancy Growth (YoY %), welfare-aligned)
[-16.329, -13.572) | # 2
[-13.572, -10.814) | # 11
[-10.814, -8.057) | # 18
[-8.057, -5.299) | ### 73
[-5.299, -2.542) | ######### 219
[-2.542, 0.21548) | ########################### 654
[0.21548, 2.973) | ############################## 728
[2.973, 5.730) | ######## 191
[5.730, 8.488) | ### 73
[8.488, 11.245) | # 17
[11.245, 14.003) | # 5
[14.003, 16.760] | # 4
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| ARE | -0.3604 | -1.0985 | -100.131 | 21 |
| BFA | -0.3736 | -1.0138 | -141.290 | 21 |
| PRY | -0.4753 | -0.9153 | -361.672 | 21 |
| MMR | 0.0389 | -0.8864 | 61.114 | 21 |
| MDG | 0.7614 | 0.8825 | -896.128 | 21 |
| UGA | -0.1831 | -0.8755 | -91.212 | 21 |
| MYS | -0.1144 | -0.8424 | 3723.519 | 21 |
| SAU | -0.5460 | -0.8406 | -112.018 | 21 |
