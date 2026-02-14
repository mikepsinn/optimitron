# Pair Study: Civilian Government Expenditure Per Capita (PPP) -> Battle-Related Deaths

- Pair ID: `predictor.derived.gov_non_military_expenditure_per_capita_ppp__outcome.wb.battle_related_deaths`
- Lag years: 2
- Duration years: 2
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.4239
- Included subjects: 39
- Skipped subjects: 0
- Total aligned pairs: 806
- Signal grade: C (moderate)
- Data status: not enough data
- Confidence score: 0.443 (lower confidence)
- Signal tag: not enough data
- Direction: neutral
- Uncertainty score: 0.3465 (lower is better)

## Quick Meanings

- `Recommended level`: main value to try first.
- `Data-backed level`: level directly supported by seen data.
- `Backup level`: safer fallback from the middle of the data.
- `Math-only guess`: unconstrained model output for technical comparison.
- `Not enough data`: we cannot safely recommend a level yet.

## Key Numeric Takeaways

- No recommended level is shown for Civilian Government Expenditure Per Capita (PPP) -> Battle-Related Deaths because there is not enough data.
- Why: subject coverage below minimum (39 < 40); aligned-pair support below minimum (806 < 2000).
- Observed support in this run: 39 subjects, 806 aligned pairs, 10 predictor bins, 12 temporal candidates with valid results.
- Use this pair for background learning only until we have enough data.

## Decision Summary

- Interpretation: not enough data for a safe recommendation.
- Recommendation status: no recommended level until data improves.
- Why: subject coverage below minimum (39 < 40); aligned-pair support below minimum (806 < 2000).

## Plain-Language Summary

- No strong directional pattern is detected between Civilian Government Expenditure Per Capita (PPP) and Battle-Related Deaths.
- The estimate uses 39 subjects and 806 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [74.691, 148.81) (mean outcome -792.16).
- Confidence score is 0.443 (lower confidence); data status is not enough data.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Low aligned-pair count (<1000); confidence is limited.
- Weak significance score (<0.70).
- Some country-level direction scores are unusually high; this can happen with this scoring method.
- Top temporal profiles are close (score delta 0.0124); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 103.2% from raw optimal; tail observations materially influence target.
- Data status warning: subject coverage below minimum (39 < 40); aligned-pair support below minimum (806 < 2000)

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Forward correlation | 0.0199 |
| Reverse correlation | 0.1462 |
| Direction score (forward - reverse) | -0.1263 |
| Effect size (% change from baseline) | 0.0000 |
| Significance score | 0.6535 |
| Weighted PIS | 0.3956 |
| Value linked with higher outcome | 1438.0178 |
| Value linked with lower outcome | 1314.4538 |
| Math-only best daily value | 1438.0178 |
| Recommended level (reader-facing) | N/A (not enough data) |
| Math-only guess (technical) | 1438.0 international $/person |
| Data-backed level | 3108.2 international $/person |
| Data-backed range | [2447.5, 4402.5) |
| Backup level (middle-data check) | 3037.1 international $/person |
| Math-only guess inside seen data range? | yes |
| Math-only guess inside data-backed range? | no |
| Seen data range | [7.6041, 17683.3068] |
| Math-only guess outside seen data? | no (within observed range) |
| Math-only guess outside best observed bucket? | yes |
| Best observed range | [74.691, 148.81) |
| Best observed range (middle-data check) | [2182.1, 3620.5] |
| Best observed outcome average | -792.16 |
| Best observed outcome average (middle-data check) | -377.51 |
| Backup level (bucket median) | 2922.2 international $/person |
| Math-only vs backup difference | 1484.2 (+103.2%) |
| Middle-data share kept | 79.9% (644/806) |
| Data status | not enough data |
| Data-status details | subject coverage below minimum (39 < 40); aligned-pair support below minimum (806 < 2000) |
| Confidence score | 0.4433 (lower confidence) |
| Reliability support component | 0.1972 |
| Reliability significance component | 0.6535 |
| Reliability directional component | 0.8420 |
| Reliability temporal-stability component | 0.4147 |
| Reliability robustness component | 0.0000 |
| Signal tag | not enough data |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum useful level | Not identified (no_consistent_effective_dose_detected) |
| Point where gains start slowing | 154.20 international $/person (ratio=-0.319) |
| Flat zone range | [2447.5, 15154.4] |
| Why this data-backed level was chosen | identified |
| Math-only guess minus data-backed level | -1670.2 (-53.7%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 2 | 2 | interpolation | 0.4239 | 0.0000 | 39 | 806 |
| Runner-up | predictor_default | 2 | 1 | interpolation | 0.4115 | 0.0124 | 39 | 806 |
| Runner-up | predictor_default | 2 | 3 | interpolation | 0.4031 | 0.0208 | 39 | 806 |
| Runner-up | predictor_default | 1 | 3 | interpolation | 0.3928 | 0.0312 | 39 | 806 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [13.662, 74.691) | 81 | 6 | 42.5187 | 47.2881 | -2261.4198 | -215.0000 |
| 2 | [74.691, 148.81) | 80 | 12 | 97.9517 | 93.2097 | -792.1625 | -274.0000 |
| 3 | [148.81, 209.58) | 66 | 9 | 181.3284 | 185.1851 | -6473.5152 | -1252.0000 |
| 4 | [209.58, 344.29) | 93 | 14 | 250.1243 | 228.2940 | -2176.1398 | -1185.0000 |
| 5 | [344.29, 555.42) | 83 | 17 | 453.4751 | 465.6677 | -3738.7952 | -406.0000 |
| 6 | [555.42, 750.32) | 80 | 17 | 648.4246 | 649.6602 | -1410.0500 | -515.5000 |
| 7 | [750.32, 1088.1) | 73 | 18 | 896.2888 | 894.0231 | -3299.6164 | -348.0000 |
| 8 | [1088.1, 1857.0) | 88 | 15 | 1389.0692 | 1315.6204 | -2511.1818 | -202.5000 |
| 9 | [1857.0, 3635.6) | 81 | 13 | 2726.7715 | 2855.7297 | -4750.2346 | -133.0000 |
| 10 | [3635.6, 15154.4] | 81 | 9 | 7173.6987 | 7021.2664 | -2632.1358 | -113.0000 |

### Distribution Charts

```text
Predictor Distribution (Civilian Government Expenditure Per Capita (PPP))
[13.662, 1275.4) | ############################## 591
[1275.4, 2537.1) | #### 82
[2537.1, 3798.9) | ### 59
[3798.9, 5060.6) | # 20
[5060.6, 6322.3) | # 10
[6322.3, 7584.0) | # 7
[7584.0, 8845.8) | # 9
[8845.8, 10107.5) | # 18
[10107.5, 11369.2) | # 6
[11369.2, 12631.0) | # 2
[12631.0, 13892.7) | # 1
[13892.7, 15154.4] | # 1
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
[-14236.5, 0.00000] | ############################## 778
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| UKR | -0.8350 | -1.5590 | 3047.406 | 10 |
| MOZ | 0.4042 | 1.1611 | -52.641 | 12 |
| IDN | 0.1069 | 0.8156 | -26.038 | 18 |
| ETH | -0.4590 | -0.7125 | 293.715 | 31 |
| CAF | -0.3194 | -0.6978 | 73.873 | 17 |
| SAU | -0.2348 | -0.5818 | 90.685 | 13 |
| EAR | -0.5514 | -0.5729 | 287.617 | 24 |
| THA | 0.1940 | 0.5172 | -43.388 | 26 |
