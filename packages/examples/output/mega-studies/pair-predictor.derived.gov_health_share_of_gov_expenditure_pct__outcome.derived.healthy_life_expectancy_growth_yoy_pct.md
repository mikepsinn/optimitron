# Pair Study: Government Health Share of Government Spending -> Healthy Life Expectancy Growth (YoY %)

- Pair ID: `predictor.derived.gov_health_share_of_gov_expenditure_pct__outcome.derived.healthy_life_expectancy_growth_yoy_pct`
- Lag years: 5
- Duration years: 5
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 15
- Temporal candidates with valid results: 15
- Temporal profile score: 0.3981
- Included subjects: 141
- Skipped subjects: 0
- Total aligned pairs: 2961
- Signal grade: F (very weak)
- Data status: enough data
- Confidence score: 0.540 (lower confidence)
- Signal tag: not enough data
- Direction: negative
- Uncertainty score: 0.8334 (lower is better)

## Quick Meanings

- `Recommended level`: main value to try first.
- `Data-backed level`: level directly supported by seen data.
- `Backup level`: safer fallback from the middle of the data.
- `Math-only guess`: unconstrained model output for technical comparison.
- `Not enough data`: we cannot safely recommend a level yet.

## Key Numeric Takeaways

- Recommended Government Health Share of Government Spending level for higher Healthy Life Expectancy Growth (YoY %): 9.584 % of government expenditure (data-backed level).
- Best level directly seen in the grouped data: 9.584 % of government expenditure.
- Math-only guess is inside seen data but outside the best-performing bucket, so we still use the data-backed level.
- Best observed bin anchor (median/mean) is 4.769 % of government expenditure; model-optimal minus observed-anchor difference is 8.427 (+176.7%).
- Backup level check (middle 10-90% of data) suggests 9.672 % of government expenditure.
- The math-only guess and backup level differ by 26.7%, which means extreme values may matter a lot.
- Could not find a clear minimum useful level (no_consistent_effective_dose_detected).
- Diminishing returns likely begin near 9.584 % of government expenditure.
- Saturation/plateau zone starts around 19.201 % of government expenditure and extends through 26.295 % of government expenditure.
- Highest observed mean Healthy Life Expectancy Growth (YoY %) appears when Government Health Share of Government Spending is in [0.93053, 5.892) (mean outcome 0.54984).
- Direction is negative in this analysis, so lowering this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Early signal only; use this mainly to guide more testing.
- Pattern hint: lower Government Health Share of Government Spending tends to go with better Healthy Life Expectancy Growth (YoY %).
- Signal strength: weak to moderate; avoid strong conclusions from this pair alone.

## Plain-Language Summary

- Higher Government Health Share of Government Spending tends to align with worse Healthy Life Expectancy Growth (YoY %).
- The estimate uses 141 subjects and 2961 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [0.93053, 5.892) (mean outcome 0.54984).
- Confidence score is 0.540 (lower confidence); data status is enough data.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Weak significance score (<0.70).
- Some country-level direction scores are unusually high; this can happen with this scoring method.
- Top temporal profiles are close (score delta 0.0085); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 26.7% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Forward correlation | -0.0517 |
| Reverse correlation | 0.0641 |
| Direction score (forward - reverse) | -0.1158 |
| Effect size (% change from baseline) | -685.9442 |
| Significance score | 0.1666 |
| Weighted PIS | 0.0464 |
| Value linked with higher outcome | 13.1955 |
| Value linked with lower outcome | 13.3041 |
| Math-only best daily value | 13.1955 |
| Recommended level (reader-facing) | 9.584 % of government expenditure (data-backed level) |
| Math-only guess (technical) | 13.195 % of government expenditure |
| Data-backed level | 9.584 % of government expenditure |
| Data-backed range | [9.109, 10.212) |
| Backup level (middle-data check) | 15.373 % of government expenditure |
| Math-only guess inside seen data range? | yes |
| Math-only guess inside data-backed range? | no |
| Seen data range | [0.8069, 88.0822] |
| Math-only guess outside seen data? | no (within observed range) |
| Math-only guess outside best observed bucket? | yes |
| Best observed range | [0.93053, 5.892) |
| Best observed range (middle-data check) | [9.217, 10.275) |
| Best observed outcome average | 0.54984 |
| Best observed outcome average (middle-data check) | 0.50091 |
| Backup level (bucket median) | 9.672 % of government expenditure |
| Math-only vs backup difference | -3.523 (-26.7%) |
| Middle-data share kept | 80.2% (2375/2961) |
| Data status | enough data |
| Data-status details | none |
| Confidence score | 0.5397 (lower confidence) |
| Reliability support component | 0.7167 |
| Reliability significance component | 0.1666 |
| Reliability directional component | 0.7717 |
| Reliability temporal-stability component | 0.2824 |
| Reliability robustness component | 0.8144 |
| Signal tag | not enough data |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum useful level | Not identified (no_consistent_effective_dose_detected) |
| Point where gains start slowing | 9.584 % of government expenditure (ratio=-0.692) |
| Flat zone range | [17.552, 65.863] |
| Why this data-backed level was chosen | identified |
| Math-only guess minus data-backed level | 3.612 (+37.7%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 5 | 5 | interpolation | 0.3981 | 0.0000 | 141 | 2961 |
| Runner-up | predictor_default | 5 | 2 | interpolation | 0.3896 | 0.0085 | 141 | 2961 |
| Runner-up | predictor_default | 2 | 5 | interpolation | 0.3860 | 0.0121 | 141 | 2961 |
| Runner-up | predictor_default | 3 | 5 | interpolation | 0.3855 | 0.0126 | 141 | 2961 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.93053, 5.892) | 290 | 23 | 4.4970 | 4.7686 | 0.5498 | 0.5559 |
| 2 | [5.892, 8.333) | 302 | 33 | 7.0345 | 7.0270 | 0.4290 | 0.4578 |
| 3 | [8.333, 9.673) | 296 | 36 | 9.0569 | 9.1087 | 0.0750 | 0.3857 |
| 4 | [9.673, 10.965) | 296 | 46 | 10.3659 | 10.3783 | 0.3691 | 0.2697 |
| 5 | [10.965, 12.367) | 296 | 54 | 11.6448 | 11.5621 | 0.1445 | 0.2451 |
| 6 | [12.367, 13.297) | 296 | 55 | 12.7432 | 12.7043 | 0.4250 | 0.2885 |
| 7 | [13.297, 14.792) | 296 | 53 | 14.0651 | 14.0469 | 0.2069 | 0.2435 |
| 8 | [14.792, 16.394) | 292 | 40 | 15.6123 | 15.6100 | 0.4248 | 0.2832 |
| 9 | [16.394, 20.250) | 300 | 38 | 18.1966 | 18.1683 | 0.0735 | 0.1761 |
| 10 | [20.250, 65.863] | 297 | 24 | 29.5052 | 24.8078 | -0.0859 | 0.1417 |

### Distribution Charts

```text
Predictor Distribution (Government Health Share of Government Spending)
[0.93053, 6.342) | ########## 362
[6.342, 11.753) | ############################ 1003
[11.753, 17.164) | ############################## 1076
[17.164, 22.575) | ######### 328
[22.575, 27.986) | ## 82
[27.986, 33.397) | ## 56
[33.397, 38.808) | # 15
[38.808, 44.219) | # 13
[44.219, 49.630) | # 3
[49.630, 55.041) | # 2
[60.452, 65.863] | # 21
```

```text
Outcome Distribution (Healthy Life Expectancy Growth (YoY %), welfare-aligned)
[-16.329, -13.572) | # 2
[-13.572, -10.814) | # 11
[-10.814, -8.057) | # 20
[-8.057, -5.299) | ### 104
[-5.299, -2.542) | ######## 292
[-2.542, 0.21548) | ######################### 959
[0.21548, 2.973) | ############################## 1158
[2.973, 5.730) | ####### 287
[5.730, 8.488) | ### 97
[8.488, 11.245) | # 22
[11.245, 14.003) | # 5
[14.003, 16.760] | # 4
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| BRA | 0.5504 | 1.1327 | -444.234 | 21 |
| LBN | -0.6865 | -1.1077 | -246.355 | 21 |
| EGY | 0.2749 | 1.0941 | -144.391 | 21 |
| PHL | -0.1967 | -1.0778 | -109.155 | 21 |
| GRC | -0.2274 | -1.0669 | -107.250 | 21 |
| ZAF | -0.1955 | -1.0573 | 168.489 | 21 |
| PAN | 0.4405 | 1.0150 | -114.782 | 21 |
| ITA | 0.4789 | 1.0134 | -103.255 | 21 |
