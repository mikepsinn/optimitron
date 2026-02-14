# Pair Study: Government Expenditure Per Capita (PPP) -> Battle-Related Deaths

- Pair ID: `predictor.derived.gov_expenditure_per_capita_ppp__outcome.wb.battle_related_deaths`
- Lag years: 2
- Duration years: 2
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.4022
- Included subjects: 40
- Skipped subjects: 0
- Total aligned pairs: 839
- Signal grade: C (moderate)
- Data status: not enough data
- Confidence score: 0.391 (lower confidence)
- Signal tag: not enough data
- Direction: neutral
- Uncertainty score: 0.3171 (lower is better)

## Quick Meanings

- `Recommended level`: main value to try first.
- `Data-backed level`: level directly supported by seen data.
- `Backup level`: safer fallback from the middle of the data.
- `Math-only guess`: unconstrained model output for technical comparison.
- `Not enough data`: we cannot safely recommend a level yet.

## Key Numeric Takeaways

- No recommended level is shown for Government Expenditure Per Capita (PPP) -> Battle-Related Deaths because there is not enough data.
- Why: aligned-pair support below minimum (839 < 2000).
- Observed support in this run: 40 subjects, 839 aligned pairs, 10 predictor bins, 12 temporal candidates with valid results.
- Use this pair for background learning only until we have enough data.

## Decision Summary

- Interpretation: not enough data for a safe recommendation.
- Recommendation status: no recommended level until data improves.
- Why: aligned-pair support below minimum (839 < 2000).

## Plain-Language Summary

- No strong directional pattern is detected between Government Expenditure Per Capita (PPP) and Battle-Related Deaths.
- The estimate uses 40 subjects and 839 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [99.193, 197.65) (mean outcome -1203.0).
- Confidence score is 0.391 (lower confidence); data status is not enough data.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Low aligned-pair count (<1000); confidence is limited.
- Weak significance score (<0.70).
- Some country-level direction scores are unusually high; this can happen with this scoring method.
- Top temporal profiles are close (score delta 0.0073); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 93.8% from raw optimal; tail observations materially influence target.
- Data status warning: aligned-pair support below minimum (839 < 2000)

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Forward correlation | -0.0334 |
| Reverse correlation | 0.0588 |
| Direction score (forward - reverse) | -0.0922 |
| Effect size (% change from baseline) | 0.0000 |
| Significance score | 0.6829 |
| Weighted PIS | 0.4070 |
| Value linked with higher outcome | 1891.6318 |
| Value linked with lower outcome | 2273.1336 |
| Math-only best daily value | 1891.6318 |
| Recommended level (reader-facing) | N/A (not enough data) |
| Math-only guess (technical) | 1891.6 international $/person |
| Data-backed level | 109.25 international $/person |
| Data-backed range | [90.433, 139.93) |
| Backup level (middle-data check) | 114.61 international $/person |
| Math-only guess inside seen data range? | yes |
| Math-only guess inside data-backed range? | no |
| Seen data range | [8.5216, 20654.1671] |
| Math-only guess outside seen data? | no (within observed range) |
| Math-only guess outside best observed bucket? | yes |
| Best observed range | [99.193, 197.65) |
| Best observed range (middle-data check) | [99.434, 187.67) |
| Best observed outcome average | -1203.0 |
| Best observed outcome average (middle-data check) | -461.38 |
| Backup level (bucket median) | 118.05 international $/person |
| Math-only vs backup difference | -1773.6 (-93.8%) |
| Middle-data share kept | 80.0% (671/839) |
| Data status | not enough data |
| Data-status details | aligned-pair support below minimum (839 < 2000) |
| Confidence score | 0.3915 (lower confidence) |
| Reliability support component | 0.2032 |
| Reliability significance component | 0.6829 |
| Reliability directional component | 0.6147 |
| Reliability temporal-stability component | 0.2441 |
| Reliability robustness component | 0.0693 |
| Signal tag | not enough data |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum useful level | Not identified (no_consistent_effective_dose_detected) |
| Point where gains start slowing | 235.66 international $/person (ratio=-0.019) |
| Flat zone range | [1163.3, 18784.7] |
| Why this data-backed level was chosen | identified |
| Math-only guess minus data-backed level | 1782.4 (+1631.5%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 2 | 2 | interpolation | 0.4022 | 0.0000 | 40 | 839 |
| Runner-up | predictor_default | 3 | 1 | interpolation | 0.3949 | 0.0073 | 40 | 839 |
| Runner-up | predictor_default | 2 | 1 | interpolation | 0.3928 | 0.0094 | 40 | 839 |
| Runner-up | predictor_default | 2 | 3 | interpolation | 0.3879 | 0.0143 | 40 | 839 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [25.622, 99.193) | 84 | 6 | 63.4995 | 64.5149 | -2246.8452 | -257.5000 |
| 2 | [99.193, 197.65) | 84 | 15 | 137.1666 | 128.7824 | -1202.9762 | -303.5000 |
| 3 | [197.65, 249.89) | 83 | 12 | 226.7662 | 230.8530 | -5501.4337 | -833.0000 |
| 4 | [249.89, 463.61) | 85 | 16 | 361.2281 | 374.2417 | -1609.3176 | -726.0000 |
| 5 | [463.61, 689.95) | 82 | 18 | 581.1104 | 575.4984 | -3896.9756 | -473.0000 |
| 6 | [689.95, 895.06) | 85 | 16 | 768.7465 | 759.8941 | -1582.3647 | -521.0000 |
| 7 | [895.06, 1323.9) | 80 | 18 | 1074.3426 | 1075.0826 | -2733.2500 | -227.0000 |
| 8 | [1323.9, 2448.0) | 88 | 13 | 1789.2129 | 1797.9666 | -6565.5455 | -219.5000 |
| 9 | [2448.0, 5315.6) | 84 | 12 | 3584.3193 | 3459.0611 | -1466.5238 | -137.5000 |
| 10 | [5315.6, 18784.7] | 84 | 7 | 11241.2558 | 10539.9412 | -1845.2619 | -194.5000 |

### Distribution Charts

```text
Predictor Distribution (Government Expenditure Per Capita (PPP))
[25.622, 1588.9) | ############################## 617
[1588.9, 3152.1) | #### 77
[3152.1, 4715.4) | ### 54
[4715.4, 6278.7) | # 19
[6278.7, 7841.9) | # 13
[7841.9, 9405.2) | # 6
[9405.2, 10968.4) | # 14
[10968.4, 12531.7) | # 5
[12531.7, 14094.9) | # 4
[14094.9, 15658.2) | # 10
[15658.2, 17221.5) | # 17
[17221.5, 18784.7] | # 3
```

```text
Outcome Distribution (Battle-Related Deaths, welfare-aligned)
[-170838, -156602) | # 2
[-156602, -142365) | # 1
[-128129, -113892) | # 1
[-99655.5, -85419.0) | # 1
[-85419.0, -71182.5) | # 1
[-71182.5, -56946.0) | # 1
[-56946.0, -42709.5) | # 4
[-42709.5, -28473.0) | # 7
[-28473.0, -14236.5) | # 10
[-14236.5, 0.00000] | ############################## 811
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| UKR | -0.8620 | -1.6328 | 3047.406 | 10 |
| MOZ | 0.3664 | 1.1098 | -31.021 | 12 |
| IDN | 0.1184 | 0.8248 | -26.038 | 18 |
| CAF | -0.3299 | -0.7239 | 73.873 | 17 |
| ETH | -0.4796 | -0.6885 | 293.715 | 31 |
| SAU | -0.3949 | -0.5714 | 90.685 | 13 |
| EAR | -0.5518 | -0.5635 | 287.617 | 24 |
| THA | 0.2062 | 0.5278 | -36.259 | 26 |
