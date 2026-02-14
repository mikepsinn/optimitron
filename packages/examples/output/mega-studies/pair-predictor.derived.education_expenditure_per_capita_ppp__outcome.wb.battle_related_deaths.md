# Pair Study: Education Expenditure Per Capita (PPP) -> Battle-Related Deaths

- Pair ID: `predictor.derived.education_expenditure_per_capita_ppp__outcome.wb.battle_related_deaths`
- Lag years: 0
- Duration years: 3
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 15
- Temporal candidates with valid results: 15
- Temporal profile score: 0.4728
- Included subjects: 49
- Skipped subjects: 0
- Total aligned pairs: 983
- Signal grade: C (moderate)
- Data status: not enough data
- Confidence score: 0.477 (lower confidence)
- Signal tag: not enough data
- Direction: negative
- Uncertainty score: 0.3712 (lower is better)

## Quick Meanings

- `Recommended level`: main value to try first.
- `Data-backed level`: level directly supported by seen data.
- `Backup level`: safer fallback from the middle of the data.
- `Math-only guess`: unconstrained model output for technical comparison.
- `Not enough data`: we cannot safely recommend a level yet.

## Key Numeric Takeaways

- No recommended level is shown for Education Expenditure Per Capita (PPP) -> Battle-Related Deaths because there is not enough data.
- Why: aligned-pair support below minimum (983 < 2000).
- Observed support in this run: 49 subjects, 983 aligned pairs, 10 predictor bins, 15 temporal candidates with valid results.
- Use this pair for background learning only until we have enough data.

## Decision Summary

- Interpretation: not enough data for a safe recommendation.
- Recommendation status: no recommended level until data improves.
- Why: aligned-pair support below minimum (983 < 2000).

## Plain-Language Summary

- Higher Education Expenditure Per Capita (PPP) tends to align with worse Battle-Related Deaths.
- The estimate uses 49 subjects and 983 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [22.224, 42.265) (mean outcome -1313.1).
- Confidence score is 0.477 (lower confidence); data status is not enough data.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Low aligned-pair count (<1000); confidence is limited.
- Weak significance score (<0.70).
- Some country-level direction scores are unusually high; this can happen with this scoring method.
- Top temporal profiles are close (score delta 0.0057); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 81.8% from raw optimal; tail observations materially influence target.
- Data status warning: aligned-pair support below minimum (983 < 2000)

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Forward correlation | -0.0747 |
| Reverse correlation | 0.0922 |
| Direction score (forward - reverse) | -0.1669 |
| Effect size (% change from baseline) | 268.6496 |
| Significance score | 0.6288 |
| Weighted PIS | 0.3816 |
| Value linked with higher outcome | 257.0083 |
| Value linked with lower outcome | 233.3339 |
| Math-only best daily value | 257.0083 |
| Recommended level (reader-facing) | N/A (not enough data) |
| Math-only guess (technical) | 257.01 international $/person |
| Data-backed level | 44.502 international $/person |
| Data-backed range | [35.297, 53.415) |
| Backup level (middle-data check) | 42.120 international $/person |
| Math-only guess inside seen data range? | yes |
| Math-only guess inside data-backed range? | no |
| Seen data range | [0.0000, 4046.8485] |
| Math-only guess outside seen data? | no (within observed range) |
| Math-only guess outside best observed bucket? | yes |
| Best observed range | [22.224, 42.265) |
| Best observed range (middle-data check) | [36.693, 55.953) |
| Best observed outcome average | -1313.1 |
| Best observed outcome average (middle-data check) | -906.50 |
| Backup level (bucket median) | 46.669 international $/person |
| Math-only vs backup difference | -210.34 (-81.8%) |
| Middle-data share kept | 79.9% (785/983) |
| Data status | not enough data |
| Data-status details | aligned-pair support below minimum (983 < 2000) |
| Confidence score | 0.4774 (lower confidence) |
| Reliability support component | 0.2452 |
| Reliability significance component | 0.6288 |
| Reliability directional component | 1.0000 |
| Reliability temporal-stability component | 0.1907 |
| Reliability robustness component | 0.2018 |
| Signal tag | not enough data |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum useful level | Not identified (no_consistent_effective_dose_detected) |
| Point where gains start slowing | 44.502 international $/person (ratio=-0.815) |
| Flat zone range | Not identified (no_plateau_zone_detected) |
| Why this data-backed level was chosen | identified |
| Math-only guess minus data-backed level | 212.51 (+477.5%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 0 | 3 | interpolation | 0.4728 | 0.0000 | 49 | 983 |
| Runner-up | predictor_default | 0 | 5 | interpolation | 0.4671 | 0.0057 | 49 | 983 |
| Runner-up | predictor_default | 1 | 2 | interpolation | 0.4653 | 0.0075 | 49 | 983 |
| Runner-up | predictor_default | 1 | 3 | interpolation | 0.4541 | 0.0187 | 49 | 983 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.00000, 22.224) | 99 | 12 | 14.1234 | 14.4119 | -2011.4545 | -274.0000 |
| 2 | [22.224, 42.265) | 98 | 17 | 31.3304 | 28.8955 | -1313.0714 | -373.0000 |
| 3 | [42.265, 61.431) | 81 | 17 | 51.7737 | 51.2804 | -1321.2099 | -274.0000 |
| 4 | [61.431, 91.255) | 115 | 19 | 71.5940 | 69.6592 | -2162.2348 | -805.0000 |
| 5 | [91.255, 122.44) | 97 | 21 | 103.6229 | 101.4481 | -5958.4330 | -726.0000 |
| 6 | [122.44, 171.23) | 99 | 22 | 146.6662 | 146.5405 | -9533.5657 | -504.0000 |
| 7 | [171.23, 263.49) | 99 | 21 | 209.9784 | 204.7529 | -8449.2727 | -504.0000 |
| 8 | [263.49, 367.71) | 98 | 17 | 308.3074 | 308.0386 | -13806.5306 | -1167.5000 |
| 9 | [367.71, 635.88) | 98 | 15 | 504.7319 | 508.5829 | -9812.3571 | -211.5000 |
| 10 | [635.88, 3660.3] | 99 | 11 | 1415.0126 | 1098.9375 | -2520.4747 | -117.0000 |

### Distribution Charts

```text
Predictor Distribution (Education Expenditure Per Capita (PPP))
[0.00000, 305.03) | ############################## 732
[305.03, 610.05) | ###### 142
[610.05, 915.08) | ## 48
[915.08, 1220.1) | # 21
[1220.1, 1525.1) | # 13
[1525.1, 1830.2) | # 8
[1830.2, 2135.2) | # 1
[2135.2, 2440.2) | # 1
[2440.2, 2745.2) | # 2
[2745.2, 3050.3) | # 3
[3050.3, 3355.3) | # 7
[3355.3, 3660.3] | # 5
```

```text
Outcome Distribution (Battle-Related Deaths, welfare-aligned)
[-274411, -251543) | # 1
[-205808, -182941) | # 1
[-182941, -160073) | # 2
[-160073, -137206) | # 1
[-137206, -114338) | # 1
[-114338, -91470.3) | # 7
[-91470.3, -68602.8) | # 9
[-68602.8, -45735.2) | # 19
[-45735.2, -22867.6) | # 16
[-22867.6, 0.00000] | ############################## 926
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| UKR | -0.7627 | -1.4455 | 2852.641 | 10 |
| EGY | -0.6667 | -1.2710 | 333.931 | 15 |
| DZA | 0.4105 | 0.9589 | -85.619 | 29 |
| FCS | -0.8095 | -0.8263 | 139.437 | 14 |
| MOZ | 0.5415 | 0.8084 | -70.641 | 12 |
| NPL | -0.4438 | -0.7648 | 906.706 | 11 |
| LKA | -0.0666 | 0.6067 | -8.891 | 18 |
| TUR | 0.3402 | -0.5304 | -68.965 | 33 |
