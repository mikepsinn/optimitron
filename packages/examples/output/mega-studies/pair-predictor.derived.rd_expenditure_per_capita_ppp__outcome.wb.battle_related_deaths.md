# Pair Study: R&D Expenditure Per Capita (PPP) -> Battle-Related Deaths

- Pair ID: `predictor.derived.rd_expenditure_per_capita_ppp__outcome.wb.battle_related_deaths`
- Lag years: 2
- Duration years: 8
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 16
- Temporal candidates with valid results: 16
- Temporal profile score: 0.4988
- Included subjects: 24
- Skipped subjects: 0
- Total aligned pairs: 583
- Signal grade: C (moderate)
- Data status: not enough data
- Confidence score: 0.490 (lower confidence)
- Signal tag: not enough data
- Direction: positive
- Uncertainty score: 0.3044 (lower is better)

## Quick Meanings

- `Recommended level`: main value to try first.
- `Data-backed level`: level directly supported by seen data.
- `Backup level`: safer fallback from the middle of the data.
- `Math-only guess`: unconstrained model output for technical comparison.
- `Not enough data`: we cannot safely recommend a level yet.

## Key Numeric Takeaways

- No recommended level is shown for R&D Expenditure Per Capita (PPP) -> Battle-Related Deaths because there is not enough data.
- Why: subject coverage below minimum (24 < 40); aligned-pair support below minimum (583 < 2000).
- Observed support in this run: 24 subjects, 583 aligned pairs, 10 predictor bins, 16 temporal candidates with valid results.
- Use this pair for background learning only until we have enough data.

## Decision Summary

- Interpretation: not enough data for a safe recommendation.
- Recommendation status: no recommended level until data improves.
- Why: subject coverage below minimum (24 < 40); aligned-pair support below minimum (583 < 2000).

## Plain-Language Summary

- Higher R&D Expenditure Per Capita (PPP) tends to align with better Battle-Related Deaths.
- The estimate uses 24 subjects and 583 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [0.33670, 3.140) (mean outcome -427.65).
- Confidence score is 0.490 (lower confidence); data status is not enough data.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Low country coverage (<30); results may change a lot as more data is added.
- Low aligned-pair count (<1000); confidence is limited.
- Weak significance score (<0.70).
- Forward and direction signals disagree; direction may be unstable.
- Some country-level direction scores are unusually high; this can happen with this scoring method.
- Top temporal profiles are close (score delta 0.0201); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 92.4% from raw optimal; tail observations materially influence target.
- Data status warning: subject coverage below minimum (24 < 40); aligned-pair support below minimum (583 < 2000)

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Forward correlation | 0.1618 |
| Reverse correlation | 0.3726 |
| Direction score (forward - reverse) | -0.2108 |
| Effect size (% change from baseline) | 52.2159 |
| Significance score | 0.6956 |
| Weighted PIS | 0.3721 |
| Value linked with higher outcome | 49.0075 |
| Value linked with lower outcome | 48.8605 |
| Math-only best daily value | 49.0075 |
| Recommended level (reader-facing) | N/A (not enough data) |
| Math-only guess (technical) | 49.007 international $/person |
| Data-backed level | 3.733 international $/person |
| Data-backed range | [3.062, 4.419) |
| Backup level (middle-data check) | 3.295 international $/person |
| Math-only guess inside seen data range? | yes |
| Math-only guess inside data-backed range? | no |
| Seen data range | [0.2535, 3227.4604] |
| Math-only guess outside seen data? | no (within observed range) |
| Math-only guess outside best observed bucket? | yes |
| Best observed range | [0.33670, 3.140) |
| Best observed range (middle-data check) | [3.140, 4.441) |
| Best observed outcome average | -427.65 |
| Best observed outcome average (middle-data check) | -332.40 |
| Backup level (bucket median) | 3.733 international $/person |
| Math-only vs backup difference | -45.275 (-92.4%) |
| Middle-data share kept | 81.1% (473/583) |
| Data status | not enough data |
| Data-status details | subject coverage below minimum (24 < 40); aligned-pair support below minimum (583 < 2000) |
| Confidence score | 0.4900 (lower confidence) |
| Reliability support component | 0.1286 |
| Reliability significance component | 0.6956 |
| Reliability directional component | 1.0000 |
| Reliability temporal-stability component | 0.6708 |
| Reliability robustness component | 0.0846 |
| Signal tag | not enough data |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum useful level | Not identified (no_consistent_effective_dose_detected) |
| Point where gains start slowing | Not identified (drop_below_detection_threshold) |
| Flat zone range | [62.656, 1981.5] |
| Why this data-backed level was chosen | identified |
| Math-only guess minus data-backed level | 45.275 (+1213.0%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 2 | 8 | interpolation | 0.4988 | 0.0000 | 24 | 583 |
| Runner-up | predictor_default | 2 | 5 | interpolation | 0.4787 | 0.0201 | 24 | 583 |
| Runner-up | predictor_default | 1 | 8 | interpolation | 0.4723 | 0.0265 | 24 | 583 |
| Runner-up | predictor_default | 3 | 8 | interpolation | 0.4418 | 0.0570 | 24 | 583 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.33670, 3.140) | 51 | 5 | 1.3546 | 1.0195 | -427.6471 | -213.0000 |
| 2 | [3.140, 4.645) | 64 | 8 | 3.9410 | 4.0497 | -552.1563 | -256.0000 |
| 3 | [4.645, 5.664) | 55 | 5 | 4.8519 | 4.8037 | -1990.7091 | -514.0000 |
| 4 | [5.664, 9.958) | 62 | 9 | 7.6987 | 7.8921 | -1670.7903 | -996.5000 |
| 5 | [9.958, 13.748) | 59 | 10 | 11.2934 | 10.8302 | -2878.4068 | -2863.0000 |
| 6 | [13.748, 21.789) | 59 | 11 | 17.8651 | 18.1220 | -5599.3729 | -1382.0000 |
| 7 | [21.789, 34.154) | 58 | 11 | 28.1460 | 28.4465 | -910.9655 | -405.0000 |
| 8 | [34.154, 56.420) | 58 | 10 | 44.8332 | 44.5427 | -2700.8448 | -450.5000 |
| 9 | [56.420, 130.43) | 58 | 7 | 71.4685 | 67.6205 | -10240.2759 | -210.0000 |
| 10 | [130.43, 1981.5] | 59 | 5 | 565.3781 | 439.8656 | -688.3220 | -84.0000 |

### Distribution Charts

```text
Predictor Distribution (R&D Expenditure Per Capita (PPP))
[0.33670, 165.43) | ############################## 530
[165.43, 330.53) | # 21
[330.53, 495.63) | # 3
[495.63, 660.73) | # 12
[660.73, 825.82) | # 4
[825.82, 990.92) | # 3
[990.92, 1156.0) | # 4
[1156.0, 1321.1) | # 1
[1321.1, 1486.2) | # 2
[1651.3, 1816.4) | # 1
[1816.4, 1981.5] | # 2
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
[-28473.0, -14236.5) | # 5
[-14236.5, 0.00000] | ############################## 567
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| MMR | -0.6980 | -1.0934 | 114.375 | 34 |
| THA | 0.3350 | 0.7689 | -60.594 | 26 |
| ARM | -0.0339 | -0.7605 | 6.481 | 11 |
| UGA | -0.2133 | -0.7081 | 131.371 | 19 |
| UKR | 0.5990 | 0.6549 | -95.115 | 10 |
| AZE | -0.1364 | -0.4602 | 72.964 | 18 |
| ISR | -0.5091 | 0.4011 | 1445.553 | 26 |
| TJK | 0.3564 | -0.3812 | -93.608 | 15 |
