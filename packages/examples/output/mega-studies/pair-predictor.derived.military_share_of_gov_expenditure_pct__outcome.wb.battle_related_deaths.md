# Pair Study: Military Share of Government Spending -> Battle-Related Deaths

- Pair ID: `predictor.derived.military_share_of_gov_expenditure_pct__outcome.wb.battle_related_deaths`
- Lag years: 3
- Duration years: 2
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.4860
- Included subjects: 39
- Skipped subjects: 0
- Total aligned pairs: 806
- Signal grade: C (moderate)
- Data status: not enough data
- Confidence score: 0.490 (lower confidence)
- Signal tag: not enough data
- Direction: negative
- Uncertainty score: 0.3549 (lower is better)

## Quick Meanings

- `Recommended level`: main value to try first.
- `Data-backed level`: level directly supported by seen data.
- `Backup level`: safer fallback from the middle of the data.
- `Math-only guess`: unconstrained model output for technical comparison.
- `Not enough data`: we cannot safely recommend a level yet.

## Key Numeric Takeaways

- No recommended level is shown for Military Share of Government Spending -> Battle-Related Deaths because there is not enough data.
- Why: subject coverage below minimum (39 < 40); aligned-pair support below minimum (806 < 2000).
- Observed support in this run: 39 subjects, 806 aligned pairs, 10 predictor bins, 12 temporal candidates with valid results.
- Use this pair for background learning only until we have enough data.

## Decision Summary

- Interpretation: not enough data for a safe recommendation.
- Recommendation status: no recommended level until data improves.
- Why: subject coverage below minimum (39 < 40); aligned-pair support below minimum (806 < 2000).

## Plain-Language Summary

- Higher Military Share of Government Spending tends to align with worse Battle-Related Deaths.
- The estimate uses 39 subjects and 806 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [15.133, 16.171) (mean outcome -528.03).
- A minimum effective predictor level appears near 6.972 % of government expenditure in the binned response curve.
- Confidence score is 0.490 (lower confidence); data status is not enough data.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Low aligned-pair count (<1000); confidence is limited.
- Weak significance score (<0.70).
- Some country-level direction scores are unusually high; this can happen with this scoring method.
- Robustness check: trimmed-range optimal differs by 59.7% from raw optimal; tail observations materially influence target.
- Data status warning: subject coverage below minimum (39 < 40); aligned-pair support below minimum (806 < 2000)

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Forward correlation | -0.2721 |
| Reverse correlation | -0.0807 |
| Direction score (forward - reverse) | -0.1914 |
| Effect size (% change from baseline) | 0.0000 |
| Significance score | 0.6451 |
| Weighted PIS | 0.3968 |
| Value linked with higher outcome | 17.7231 |
| Value linked with lower outcome | 18.7488 |
| Math-only best daily value | 17.7231 |
| Recommended level (reader-facing) | N/A (not enough data) |
| Math-only guess (technical) | 17.723 % of government expenditure |
| Data-backed level | 15.520 % of government expenditure |
| Data-backed range | [15.133, 16.009) |
| Backup level (middle-data check) | 15.460 % of government expenditure |
| Math-only guess inside seen data range? | yes |
| Math-only guess inside data-backed range? | no |
| Seen data range | [2.1783, 88.2063] |
| Math-only guess outside seen data? | no (within observed range) |
| Math-only guess outside best observed bucket? | yes |
| Best observed range | [15.133, 16.171) |
| Best observed range (middle-data check) | [6.607, 8.332) |
| Best observed outcome average | -528.03 |
| Best observed outcome average (middle-data check) | -446.38 |
| Backup level (bucket median) | 7.136 % of government expenditure |
| Math-only vs backup difference | -10.587 (-59.7%) |
| Middle-data share kept | 80.4% (648/806) |
| Data status | not enough data |
| Data-status details | subject coverage below minimum (39 < 40); aligned-pair support below minimum (806 < 2000) |
| Confidence score | 0.4900 (lower confidence) |
| Reliability support component | 0.1972 |
| Reliability significance component | 0.6451 |
| Reliability directional component | 1.0000 |
| Reliability temporal-stability component | 1.0000 |
| Reliability robustness component | 0.4474 |
| Signal tag | not enough data |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum useful level | 6.972 % of government expenditure (z=2.16) |
| Point where gains start slowing | 8.746 % of government expenditure (ratio=-0.310) |
| Flat zone range | [21.147, 88.206] |
| Why this data-backed level was chosen | identified |
| Math-only guess minus data-backed level | 2.203 (+14.2%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 3 | 2 | interpolation | 0.4860 | 0.0000 | 39 | 806 |
| Runner-up | predictor_default | 3 | 3 | interpolation | 0.4399 | 0.0462 | 39 | 806 |
| Runner-up | predictor_default | 3 | 1 | interpolation | 0.4179 | 0.0681 | 39 | 806 |
| Runner-up | predictor_default | 2 | 3 | interpolation | 0.3768 | 0.1093 | 39 | 806 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [2.294, 6.607) | 79 | 13 | 5.0953 | 5.6922 | -6737.1772 | -245.0000 |
| 2 | [6.607, 8.746) | 82 | 14 | 7.6420 | 7.8425 | -606.6951 | -197.0000 |
| 3 | [8.746, 10.289) | 81 | 15 | 9.4034 | 9.2148 | -1637.3827 | -626.0000 |
| 4 | [10.289, 12.885) | 80 | 21 | 11.5704 | 11.4875 | -8804.7875 | -182.0000 |
| 5 | [12.885, 15.133) | 81 | 22 | 14.2164 | 14.3556 | -1227.8889 | -253.0000 |
| 6 | [15.133, 16.171) | 79 | 17 | 15.6145 | 15.5865 | -528.0253 | -217.0000 |
| 7 | [16.171, 17.435) | 81 | 18 | 16.6950 | 16.6898 | -2744.2346 | -504.0000 |
| 8 | [17.435, 19.391) | 81 | 18 | 18.1652 | 18.0856 | -2463.5556 | -1320.0000 |
| 9 | [19.391, 29.446) | 79 | 20 | 23.3678 | 22.3429 | -3196.2405 | -526.0000 |
| 10 | [29.446, 88.206] | 83 | 9 | 53.5719 | 52.7945 | -1501.5542 | -193.0000 |

### Distribution Charts

```text
Predictor Distribution (Military Share of Government Spending)
[2.294, 9.454) | ###################### 218
[9.454, 16.613) | ############################## 297
[16.613, 23.772) | ################## 178
[23.772, 30.932) | #### 42
[30.932, 38.091) | ## 20
[38.091, 45.250) | # 6
[45.250, 52.410) | # 3
[52.410, 59.569) | # 7
[59.569, 66.728) | # 5
[66.728, 73.888) | ## 17
[81.047, 88.206] | # 13
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
| UKR | -0.6285 | -1.3015 | 1947.155 | 10 |
| EAR | 0.4324 | 0.9953 | -64.844 | 24 |
| RUS | -0.8166 | -0.7700 | 256.176 | 30 |
| ETH | 0.2236 | 0.7457 | -71.007 | 31 |
| COD | -0.4709 | -0.7319 | 126.857 | 27 |
| LBN | -0.1159 | -0.6266 | 221.826 | 17 |
| TJK | -0.4380 | -0.6260 | 1647.475 | 15 |
| PER | -0.3116 | 0.6044 | 1430.000 | 15 |
