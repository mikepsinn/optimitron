# Pair Study: Government Health Share of Government Spending -> Battle-Related Deaths

- Pair ID: `predictor.derived.gov_health_share_of_gov_expenditure_pct__outcome.wb.battle_related_deaths`
- Lag years: 1
- Duration years: 5
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 15
- Temporal candidates with valid results: 15
- Temporal profile score: 0.4219
- Included subjects: 37
- Skipped subjects: 0
- Total aligned pairs: 773
- Signal grade: C (moderate)
- Data status: not enough data
- Confidence score: 0.490 (lower confidence)
- Signal tag: not enough data
- Direction: positive
- Uncertainty score: 0.3935 (lower is better)

## Quick Meanings

- `Recommended level`: main value to try first.
- `Data-backed level`: level directly supported by seen data.
- `Backup level`: safer fallback from the middle of the data.
- `Math-only guess`: unconstrained model output for technical comparison.
- `Not enough data`: we cannot safely recommend a level yet.

## Key Numeric Takeaways

- No recommended level is shown for Government Health Share of Government Spending -> Battle-Related Deaths because there is not enough data.
- Why: subject coverage below minimum (37 < 40); aligned-pair support below minimum (773 < 2000).
- Observed support in this run: 37 subjects, 773 aligned pairs, 10 predictor bins, 15 temporal candidates with valid results.
- Use this pair for background learning only until we have enough data.

## Decision Summary

- Interpretation: not enough data for a safe recommendation.
- Recommendation status: no recommended level until data improves.
- Why: subject coverage below minimum (37 < 40); aligned-pair support below minimum (773 < 2000).

## Plain-Language Summary

- Higher Government Health Share of Government Spending tends to align with better Battle-Related Deaths.
- The estimate uses 37 subjects and 773 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [5.884, 7.036) (mean outcome -339.51).
- A minimum effective predictor level appears near 4.556 % of government expenditure in the binned response curve.
- Confidence score is 0.490 (lower confidence); data status is not enough data.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Low aligned-pair count (<1000); confidence is limited.
- Weak significance score (<0.70).
- Forward and direction signals disagree; direction may be unstable.
- Some country-level direction scores are unusually high; this can happen with this scoring method.
- Top temporal profiles are close (score delta 0.0194); temporal assumptions are not yet robust.
- Data status warning: subject coverage below minimum (37 < 40); aligned-pair support below minimum (773 < 2000)

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Forward correlation | 0.1121 |
| Reverse correlation | 0.2561 |
| Direction score (forward - reverse) | -0.1440 |
| Effect size (% change from baseline) | 0.0000 |
| Significance score | 0.6065 |
| Weighted PIS | 0.2987 |
| Value linked with higher outcome | 8.6798 |
| Value linked with lower outcome | 8.7852 |
| Math-only best daily value | 8.6798 |
| Recommended level (reader-facing) | N/A (not enough data) |
| Math-only guess (technical) | 8.680 % of government expenditure |
| Data-backed level | 6.924 % of government expenditure |
| Data-backed range | [6.095, 7.136) |
| Backup level (middle-data check) | 7.036 % of government expenditure |
| Math-only guess inside seen data range? | yes |
| Math-only guess inside data-backed range? | no |
| Seen data range | [0.8069, 24.8045] |
| Math-only guess outside seen data? | no (within observed range) |
| Math-only guess outside best observed bucket? | yes |
| Best observed range | [5.884, 7.036) |
| Best observed range (middle-data check) | [6.201, 7.158) |
| Best observed outcome average | -339.51 |
| Best observed outcome average (middle-data check) | -381.71 |
| Backup level (bucket median) | 6.970 % of government expenditure |
| Math-only vs backup difference | -1.710 (-19.7%) |
| Middle-data share kept | 79.8% (617/773) |
| Data status | not enough data |
| Data-status details | subject coverage below minimum (37 < 40); aligned-pair support below minimum (773 < 2000) |
| Confidence score | 0.4900 (lower confidence) |
| Reliability support component | 0.1878 |
| Reliability significance component | 0.6065 |
| Reliability directional component | 0.9603 |
| Reliability temporal-stability component | 0.6459 |
| Reliability robustness component | 0.8922 |
| Signal tag | not enough data |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum useful level | 4.556 % of government expenditure (z=4.13) |
| Point where gains start slowing | 12.582 % of government expenditure (ratio=-3.328) |
| Flat zone range | [8.637, 10.819) |
| Why this data-backed level was chosen | identified |
| Math-only guess minus data-backed level | 1.756 (+25.4%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 1 | 5 | interpolation | 0.4219 | 0.0000 | 37 | 773 |
| Runner-up | predictor_default | 0 | 3 | interpolation | 0.4025 | 0.0194 | 37 | 773 |
| Runner-up | predictor_default | 2 | 5 | interpolation | 0.3943 | 0.0276 | 37 | 773 |
| Runner-up | predictor_default | 1 | 2 | interpolation | 0.3897 | 0.0322 | 37 | 773 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.93053, 4.434) | 78 | 6 | 2.8357 | 2.4193 | -4420.5385 | -1422.0000 |
| 2 | [4.434, 5.231) | 76 | 12 | 4.8162 | 4.7528 | -1719.0921 | -734.0000 |
| 3 | [5.231, 5.884) | 78 | 11 | 5.5029 | 5.4597 | -2325.2821 | -1104.5000 |
| 4 | [5.884, 7.036) | 70 | 15 | 6.3391 | 6.2377 | -339.5143 | -191.0000 |
| 5 | [7.036, 8.637) | 73 | 13 | 7.6556 | 7.6514 | -2351.7945 | -217.0000 |
| 6 | [8.637, 9.864) | 89 | 11 | 9.2037 | 9.2683 | -2917.6292 | -350.0000 |
| 7 | [9.864, 11.279) | 68 | 12 | 10.6065 | 10.5841 | -2690.8971 | -119.5000 |
| 8 | [11.279, 12.582) | 70 | 13 | 11.6588 | 11.4890 | -11324.7714 | -222.5000 |
| 9 | [12.582, 14.069) | 93 | 11 | 13.0642 | 12.7075 | -2295.4624 | -165.0000 |
| 10 | [14.069, 24.804] | 78 | 10 | 17.5433 | 15.8770 | -580.2692 | -196.0000 |

### Distribution Charts

```text
Predictor Distribution (Government Health Share of Government Spending)
[0.93053, 2.920) | ######## 43
[2.920, 4.910) | ############### 81
[4.910, 6.899) | ############################## 165
[6.899, 8.889) | ################### 104
[8.889, 10.878) | ####################### 124
[10.878, 12.868) | ######################### 135
[12.868, 14.857) | ############ 66
[14.857, 16.846) | #### 24
[16.846, 18.836) | ## 9
[18.836, 20.825) | # 8
[22.815, 24.804] | ### 14
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
[-14236.5, 0.00000] | ############################## 745
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| UKR | -0.6960 | -1.0123 | 1947.155 | 10 |
| TUR | -0.3142 | -0.7670 | 145.490 | 33 |
| SAU | 0.4115 | 0.7175 | -78.053 | 13 |
| AZE | 0.6000 | 0.5664 | -88.864 | 18 |
| NPL | 0.0000 | -0.5085 | 0.000 | 11 |
| COL | -0.6413 | -0.4313 | 301.035 | 33 |
| THA | 0.0289 | 0.3546 | -7.667 | 26 |
| CAF | 0.0088 | 0.3418 | 35.486 | 17 |
