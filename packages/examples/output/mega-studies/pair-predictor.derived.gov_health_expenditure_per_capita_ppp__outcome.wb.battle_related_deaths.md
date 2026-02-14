# Pair Study: Government Health Expenditure Per Capita (PPP) -> Battle-Related Deaths

- Pair ID: `predictor.derived.gov_health_expenditure_per_capita_ppp__outcome.wb.battle_related_deaths`
- Lag years: 0
- Duration years: 3
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 15
- Temporal candidates with valid results: 15
- Temporal profile score: 0.4014
- Included subjects: 55
- Skipped subjects: 0
- Total aligned pairs: 1140
- Signal grade: C (moderate)
- Data status: not enough data
- Confidence score: 0.417 (lower confidence)
- Signal tag: early signal
- Direction: neutral
- Uncertainty score: 0.3591 (lower is better)

## Quick Meanings

- `Recommended level`: main value to try first.
- `Data-backed level`: level directly supported by seen data.
- `Backup level`: safer fallback from the middle of the data.
- `Math-only guess`: unconstrained model output for technical comparison.
- `Not enough data`: we cannot safely recommend a level yet.

## Key Numeric Takeaways

- No recommended level is shown for Government Health Expenditure Per Capita (PPP) -> Battle-Related Deaths because there is not enough data.
- Why: aligned-pair support below minimum (1140 < 2000).
- Observed support in this run: 55 subjects, 1140 aligned pairs, 10 predictor bins, 15 temporal candidates with valid results.
- Use this pair for background learning only until we have enough data.

## Decision Summary

- Interpretation: not enough data for a safe recommendation.
- Recommendation status: no recommended level until data improves.
- Why: aligned-pair support below minimum (1140 < 2000).

## Plain-Language Summary

- No strong directional pattern is detected between Government Health Expenditure Per Capita (PPP) and Battle-Related Deaths.
- The estimate uses 55 subjects and 1140 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [0.25914, 6.399) (mean outcome -1509.6).
- Confidence score is 0.417 (lower confidence); data status is not enough data.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Weak significance score (<0.70).
- Some country-level direction scores are unusually high; this can happen with this scoring method.
- Top temporal profiles are close (score delta 0.0087); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 78.0% from raw optimal; tail observations materially influence target.
- Data status warning: aligned-pair support below minimum (1140 < 2000)

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Forward correlation | 0.0119 |
| Reverse correlation | 0.0917 |
| Direction score (forward - reverse) | -0.0798 |
| Effect size (% change from baseline) | 244.7519 |
| Significance score | 0.6409 |
| Weighted PIS | 0.3535 |
| Value linked with higher outcome | 164.4344 |
| Value linked with lower outcome | 142.9710 |
| Math-only best daily value | 164.4344 |
| Recommended level (reader-facing) | N/A (not enough data) |
| Math-only guess (technical) | 164.43 international $/person |
| Data-backed level | 36.194 international $/person |
| Data-backed range | [31.142, 43.298) |
| Backup level (middle-data check) | 48.998 international $/person |
| Math-only guess inside seen data range? | yes |
| Math-only guess inside data-backed range? | no |
| Seen data range | [0.2591, 3165.1400] |
| Math-only guess outside seen data? | no (within observed range) |
| Math-only guess outside best observed bucket? | yes |
| Best observed range | [0.25914, 6.399) |
| Best observed range (middle-data check) | [31.447, 43.067) |
| Best observed outcome average | -1509.6 |
| Best observed outcome average (middle-data check) | -1482.5 |
| Backup level (bucket median) | 36.194 international $/person |
| Math-only vs backup difference | -128.24 (-78.0%) |
| Middle-data share kept | 80.2% (914/1140) |
| Data status | not enough data |
| Data-status details | aligned-pair support below minimum (1140 < 2000) |
| Confidence score | 0.4166 (lower confidence) |
| Reliability support component | 0.2783 |
| Reliability significance component | 0.6409 |
| Reliability directional component | 0.5321 |
| Reliability temporal-stability component | 0.2916 |
| Reliability robustness component | 0.2446 |
| Signal tag | early signal |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum useful level | Not identified (no_consistent_effective_dose_detected) |
| Point where gains start slowing | Not identified (drop_below_detection_threshold) |
| Flat zone range | [112.43, 2992.4] |
| Why this data-backed level was chosen | identified |
| Math-only guess minus data-backed level | 128.24 (+354.3%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 0 | 3 | interpolation | 0.4014 | 0.0000 | 55 | 1140 |
| Runner-up | predictor_default | 0 | 2 | interpolation | 0.3926 | 0.0087 | 55 | 1140 |
| Runner-up | predictor_default | 5 | 2 | interpolation | 0.3897 | 0.0117 | 55 | 1140 |
| Runner-up | predictor_default | 1 | 2 | interpolation | 0.3879 | 0.0135 | 55 | 1140 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.25914, 6.399) | 112 | 7 | 2.6875 | 2.5067 | -1509.6250 | -799.0000 |
| 2 | [6.399, 13.738) | 116 | 14 | 8.9859 | 8.5533 | -2612.9569 | -270.0000 |
| 3 | [13.738, 18.005) | 114 | 17 | 16.5090 | 16.6962 | -2350.1228 | -708.0000 |
| 4 | [18.005, 29.814) | 112 | 24 | 22.8921 | 22.2877 | -4278.0000 | -200.0000 |
| 5 | [29.814, 43.298) | 116 | 22 | 34.9719 | 34.7013 | -1776.8017 | -973.5000 |
| 6 | [43.298, 81.462) | 114 | 18 | 58.0191 | 56.3852 | -10256.6140 | -517.5000 |
| 7 | [81.462, 149.26) | 114 | 19 | 102.9593 | 96.2316 | -6161.1754 | -561.0000 |
| 8 | [149.26, 256.34) | 109 | 16 | 199.0712 | 201.5715 | -12701.5688 | -947.0000 |
| 9 | [256.34, 493.91) | 119 | 14 | 330.5165 | 302.8915 | -8343.5462 | -397.0000 |
| 10 | [493.91, 2992.4] | 114 | 11 | 1021.8287 | 809.1207 | -1953.4825 | -111.5000 |

### Distribution Charts

```text
Predictor Distribution (Government Health Expenditure Per Capita (PPP))
[0.25914, 249.61) | ############################## 905
[249.61, 498.95) | #### 122
[498.95, 748.30) | ## 47
[748.30, 997.64) | # 18
[997.64, 1247.0) | # 25
[1247.0, 1496.3) | # 7
[1496.3, 1745.7) | # 1
[1745.7, 1995.0) | # 3
[1995.0, 2244.4) | # 6
[2244.4, 2493.7) | # 3
[2493.7, 2743.1) | # 2
[2743.1, 2992.4] | # 1
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
[-45735.2, -22867.6) | # 18
[-22867.6, 0.00000] | ############################## 1081
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| UKR | -0.8275 | -1.6073 | 4383.990 | 10 |
| MOZ | 0.3690 | 0.9534 | -40.034 | 12 |
| NPL | -0.3627 | -0.7101 | 782.359 | 11 |
| AZE | -0.0686 | 0.5691 | 72.964 | 18 |
| PER | 0.3601 | -0.5367 | -93.464 | 15 |
| SOM | -0.3543 | 0.5206 | 82.020 | 29 |
| IDB | 0.1820 | 0.4073 | -40.678 | 15 |
| TUR | 0.4415 | 0.3407 | -68.965 | 33 |
