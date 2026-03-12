# Pair Study: Military Expenditure Per Capita (PPP) -> Battle-Related Deaths

- Pair ID: `predictor.derived.military_expenditure_per_capita_ppp__outcome.wb.battle_related_deaths`
- Lag years: 3
- Duration years: 3
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.4691
- Included subjects: 56
- Skipped subjects: 0
- Total aligned pairs: 1151
- Signal grade: C (moderate)
- Data status: not enough data
- Confidence score: 0.472 (lower confidence)
- Signal tag: early signal
- Direction: negative
- Uncertainty score: 0.3685 (lower is better)

## Quick Meanings

- `Recommended level`: main value to try first.
- `Data-backed level`: level directly supported by seen data.
- `Backup level`: safer fallback from the middle of the data.
- `Math-only guess`: unconstrained model output for technical comparison.
- `Not enough data`: we cannot safely recommend a level yet.

## Key Numeric Takeaways

- No recommended level is shown for Military Expenditure Per Capita (PPP) -> Battle-Related Deaths because there is not enough data.
- Why: aligned-pair support below minimum (1151 < 2000).
- Observed support in this run: 56 subjects, 1151 aligned pairs, 10 predictor bins, 12 temporal candidates with valid results.
- Use this pair for background learning only until we have enough data.

## Decision Summary

- Interpretation: not enough data for a safe recommendation.
- Recommendation status: no recommended level until data improves.
- Why: aligned-pair support below minimum (1151 < 2000).

## Plain-Language Summary

- Higher Military Expenditure Per Capita (PPP) tends to align with worse Battle-Related Deaths.
- The estimate uses 56 subjects and 1151 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [0.00630, 12.107) (mean outcome -1471.8).
- Confidence score is 0.472 (lower confidence); data status is not enough data.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Weak significance score (<0.70).
- Some country-level direction scores are unusually high; this can happen with this scoring method.
- Top temporal profiles are close (score delta 0.0084); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 98.7% from raw optimal; tail observations materially influence target.
- Data status warning: aligned-pair support below minimum (1151 < 2000)

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Forward correlation | -0.0768 |
| Reverse correlation | 0.0725 |
| Direction score (forward - reverse) | -0.1493 |
| Effect size (% change from baseline) | 153.7844 |
| Significance score | 0.6315 |
| Weighted PIS | 0.3653 |
| Value linked with higher outcome | 178.7563 |
| Value linked with lower outcome | 170.7803 |
| Math-only best daily value | 178.7563 |
| Recommended level (reader-facing) | N/A (not enough data) |
| Math-only guess (technical) | 178.76 international $/person |
| Data-backed level | 7.153 international $/person |
| Data-backed range | [0.00630, 10.761) |
| Backup level (middle-data check) | 370.26 international $/person |
| Math-only guess inside seen data range? | yes |
| Math-only guess inside data-backed range? | no |
| Seen data range | [0.0063, 7023.3244] |
| Math-only guess outside seen data? | no (within observed range) |
| Math-only guess outside best observed bucket? | yes |
| Best observed range | [0.00630, 12.107) |
| Best observed range (middle-data check) | [297.06, 443.23] |
| Best observed outcome average | -1471.8 |
| Best observed outcome average (middle-data check) | -960.67 |
| Backup level (bucket median) | 355.21 international $/person |
| Math-only vs backup difference | 176.46 (+98.7%) |
| Middle-data share kept | 80.0% (921/1151) |
| Data status | not enough data |
| Data-status details | aligned-pair support below minimum (1151 < 2000) |
| Confidence score | 0.4718 (lower confidence) |
| Reliability support component | 0.2826 |
| Reliability significance component | 0.6315 |
| Reliability directional component | 0.9953 |
| Reliability temporal-stability component | 0.2802 |
| Reliability robustness component | 0.0143 |
| Signal tag | early signal |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum useful level | Not identified (no_consistent_effective_dose_detected) |
| Point where gains start slowing | Not identified (drop_below_detection_threshold) |
| Flat zone range | [25.764, 61.749) |
| Why this data-backed level was chosen | identified |
| Math-only guess minus data-backed level | 171.60 (+2399.2%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 3 | 3 | interpolation | 0.4691 | 0.0000 | 56 | 1151 |
| Runner-up | predictor_default | 3 | 2 | interpolation | 0.4607 | 0.0084 | 56 | 1151 |
| Runner-up | predictor_default | 2 | 3 | interpolation | 0.4512 | 0.0179 | 56 | 1151 |
| Runner-up | predictor_default | 2 | 2 | interpolation | 0.3987 | 0.0704 | 56 | 1151 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.00630, 12.107) | 115 | 11 | 7.2706 | 7.8082 | -1471.8000 | -356.0000 |
| 2 | [12.107, 22.360) | 115 | 19 | 17.1858 | 17.0037 | -3361.8522 | -229.0000 |
| 3 | [22.360, 33.756) | 115 | 19 | 27.0276 | 25.7491 | -2762.3391 | -516.0000 |
| 4 | [33.756, 56.025) | 115 | 15 | 42.2022 | 40.0157 | -2287.5739 | -788.0000 |
| 5 | [56.025, 93.225) | 115 | 16 | 73.2769 | 71.0075 | -11009.2609 | -1099.0000 |
| 6 | [93.225, 125.44) | 115 | 22 | 108.5297 | 106.5196 | -4922.1913 | -501.0000 |
| 7 | [125.44, 166.80) | 115 | 20 | 145.7273 | 146.2801 | -2090.8435 | -586.0000 |
| 8 | [166.80, 260.48) | 115 | 22 | 211.0803 | 214.6655 | -14453.3913 | -1118.0000 |
| 9 | [260.48, 443.23) | 115 | 15 | 343.9541 | 335.8312 | -1790.9565 | -236.0000 |
| 10 | [443.23, 6481.2] | 116 | 15 | 1492.5511 | 727.4579 | -7115.7241 | -122.5000 |

### Distribution Charts

```text
Predictor Distribution (Military Expenditure Per Capita (PPP))
[0.00630, 540.11) | ############################## 1058
[540.11, 1080.2) | # 45
[1080.2, 1620.3) | # 16
[1620.3, 2160.4) | # 14
[2160.4, 2700.5) | # 4
[2700.5, 3240.6) | # 1
[3780.7, 4320.8) | # 1
[4320.8, 4860.9) | # 2
[4860.9, 5401.0) | # 5
[5401.0, 5941.1) | # 2
[5941.1, 6481.2] | # 3
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
[-22867.6, 0.00000] | ############################## 1092
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| UKR | -0.7436 | -1.4709 | 1947.155 | 10 |
| KHM | -0.8275 | -1.4637 | 190.625 | 10 |
| THA | 0.5210 | 0.9785 | -43.388 | 26 |
| SSD | -0.3740 | -0.9524 | 163.177 | 11 |
| CAF | -0.0854 | -0.8722 | 23.944 | 17 |
| IDB | 0.3300 | 0.8033 | -31.548 | 15 |
| EGY | -0.7848 | -0.7361 | 333.931 | 15 |
| LKA | 0.2049 | 0.7265 | -8.891 | 18 |
