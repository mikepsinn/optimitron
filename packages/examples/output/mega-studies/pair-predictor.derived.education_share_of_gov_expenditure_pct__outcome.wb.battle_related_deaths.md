# Pair Study: Education Share of Government Spending -> Battle-Related Deaths

- Pair ID: `predictor.derived.education_share_of_gov_expenditure_pct__outcome.wb.battle_related_deaths`
- Lag years: 3
- Duration years: 3
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 15
- Temporal candidates with valid results: 15
- Temporal profile score: 0.4385
- Included subjects: 37
- Skipped subjects: 0
- Total aligned pairs: 759
- Signal grade: D (weak)
- Data status: not enough data
- Confidence score: 0.490 (lower confidence)
- Signal tag: not enough data
- Direction: neutral
- Uncertainty score: 0.4668 (lower is better)

## Quick Meanings

- `Recommended level`: main value to try first.
- `Data-backed level`: level directly supported by seen data.
- `Backup level`: safer fallback from the middle of the data.
- `Math-only guess`: unconstrained model output for technical comparison.
- `Not enough data`: we cannot safely recommend a level yet.

## Key Numeric Takeaways

- No recommended level is shown for Education Share of Government Spending -> Battle-Related Deaths because there is not enough data.
- Why: subject coverage below minimum (37 < 40); aligned-pair support below minimum (759 < 2000).
- Observed support in this run: 37 subjects, 759 aligned pairs, 10 predictor bins, 15 temporal candidates with valid results.
- Use this pair for background learning only until we have enough data.

## Decision Summary

- Interpretation: not enough data for a safe recommendation.
- Recommendation status: no recommended level until data improves.
- Why: subject coverage below minimum (37 < 40); aligned-pair support below minimum (759 < 2000).

## Plain-Language Summary

- No strong directional pattern is detected between Education Share of Government Spending and Battle-Related Deaths.
- The estimate uses 37 subjects and 759 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [12.746, 15.191) (mean outcome -1135.9).
- A minimum effective predictor level appears near 11.353 % of government expenditure in the binned response curve.
- Confidence score is 0.490 (lower confidence); data status is not enough data.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Low aligned-pair count (<1000); confidence is limited.
- Weak significance score (<0.70).
- Some country-level direction scores are unusually high; this can happen with this scoring method.
- Top temporal profiles are close (score delta 0.0125); temporal assumptions are not yet robust.
- Data status warning: subject coverage below minimum (37 < 40); aligned-pair support below minimum (759 < 2000)

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Forward correlation | -0.0499 |
| Reverse correlation | 0.1368 |
| Direction score (forward - reverse) | -0.1867 |
| Effect size (% change from baseline) | 0.0000 |
| Significance score | 0.5332 |
| Weighted PIS | 0.2058 |
| Value linked with higher outcome | 17.5500 |
| Value linked with lower outcome | 17.6979 |
| Math-only best daily value | 17.5500 |
| Recommended level (reader-facing) | N/A (not enough data) |
| Math-only guess (technical) | 17.550 % of government expenditure |
| Data-backed level | 25.730 % of government expenditure |
| Data-backed range | [24.093, 28.880) |
| Backup level (middle-data check) | 25.497 % of government expenditure |
| Math-only guess inside seen data range? | yes |
| Math-only guess inside data-backed range? | no |
| Seen data range | [0.0000, 70.8565] |
| Math-only guess outside seen data? | no (within observed range) |
| Math-only guess outside best observed bucket? | yes |
| Best observed range | [12.746, 15.191) |
| Best observed range (middle-data check) | [20.150, 21.417) |
| Best observed outcome average | -1135.9 |
| Best observed outcome average (middle-data check) | -904.25 |
| Backup level (bucket median) | 20.413 % of government expenditure |
| Math-only vs backup difference | 2.863 (+16.3%) |
| Middle-data share kept | 80.0% (607/759) |
| Data status | not enough data |
| Data-status details | subject coverage below minimum (37 < 40); aligned-pair support below minimum (759 < 2000) |
| Confidence score | 0.4900 (lower confidence) |
| Reliability support component | 0.1866 |
| Reliability significance component | 0.5332 |
| Reliability directional component | 1.0000 |
| Reliability temporal-stability component | 0.4151 |
| Reliability robustness component | 0.9298 |
| Signal tag | not enough data |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum useful level | 11.353 % of government expenditure (z=2.53) |
| Point where gains start slowing | 21.731 % of government expenditure (ratio=-1.051) |
| Flat zone range | [12.328, 15.872) |
| Why this data-backed level was chosen | identified |
| Math-only guess minus data-backed level | -8.180 (-31.8%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 3 | 3 | interpolation | 0.4385 | 0.0000 | 37 | 759 |
| Runner-up | predictor_default | 2 | 5 | interpolation | 0.4261 | 0.0125 | 37 | 759 |
| Runner-up | predictor_default | 1 | 5 | interpolation | 0.4245 | 0.0140 | 37 | 759 |
| Runner-up | predictor_default | 3 | 2 | interpolation | 0.4226 | 0.0160 | 37 | 759 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.00000, 10.316) | 76 | 7 | 7.6347 | 6.9237 | -3726.4474 | -590.5000 |
| 2 | [10.316, 12.746) | 76 | 14 | 11.8802 | 11.9447 | -2465.4211 | -524.0000 |
| 3 | [12.746, 15.191) | 76 | 12 | 14.1881 | 14.3652 | -1135.8816 | -293.5000 |
| 4 | [15.191, 17.550) | 76 | 17 | 16.2913 | 16.2453 | -3180.8289 | -222.5000 |
| 5 | [17.550, 18.869) | 75 | 14 | 18.1998 | 18.2922 | -9619.3733 | -766.0000 |
| 6 | [18.869, 20.327) | 66 | 14 | 19.5701 | 19.5631 | -2597.2273 | -436.0000 |
| 7 | [20.327, 21.731) | 85 | 17 | 20.8987 | 20.6910 | -1207.5529 | -626.0000 |
| 8 | [21.731, 23.027) | 67 | 14 | 22.4003 | 22.3753 | -1350.9254 | -112.0000 |
| 9 | [23.027, 27.579) | 86 | 13 | 24.6935 | 24.2665 | -1495.3953 | -219.0000 |
| 10 | [27.579, 64.280] | 76 | 12 | 34.5162 | 31.8159 | -4333.3421 | -109.0000 |

### Distribution Charts

```text
Predictor Distribution (Education Share of Government Spending)
[0.00000, 5.357) | # 7
[5.357, 10.713) | ######### 75
[10.713, 16.070) | ##################### 173
[16.070, 21.427) | ############################## 246
[21.427, 26.783) | ##################### 175
[26.783, 32.140) | ###### 47
[32.140, 37.497) | ### 23
[37.497, 42.853) | # 2
[42.853, 48.210) | # 3
[48.210, 53.567) | # 4
[53.567, 58.923) | # 3
[58.923, 64.280] | # 1
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
[-14236.5, 0.00000] | ############################## 731
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| TUR | -0.4451 | -1.3591 | 328.497 | 33 |
| AZE | 0.2284 | 1.0837 | -42.185 | 18 |
| IDN | 0.3742 | 1.0267 | -77.973 | 18 |
| MOZ | -0.1543 | -0.9652 | 9.481 | 12 |
| KHM | 0.4892 | 0.9206 | -97.421 | 10 |
| COD | 0.1406 | 0.8395 | -18.513 | 27 |
| KEN | -0.3854 | -0.7825 | -34.181 | 16 |
| LBN | -0.1033 | -0.7141 | 191.359 | 17 |
