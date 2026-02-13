# Pair Study: Government Health Expenditure (% GDP) -> Healthy Life Expectancy Growth (YoY %)

- Pair ID: `predictor.wb.gov_health_expenditure_pct_gdp__outcome.derived.healthy_life_expectancy_growth_yoy_pct`
- Lag years: 2
- Duration years: 3
- Temporal profile source: pair_override
- Filling strategy: interpolation
- Temporal candidates evaluated: 1
- Temporal candidates with valid results: 1
- Temporal profile score: 0.3479
- Included subjects: 181
- Skipped subjects: 0
- Total aligned pairs: 3801
- Evidence grade: F
- Direction: negative
- Derived uncertainty score: 0.7840 (1 - aggregate significance, not NHST p-value)

## Actionable Takeaway

- Estimated best Government Health Expenditure (% GDP) level for higher Healthy Life Expectancy Growth (YoY %): 2.933 % GDP.
- Approximate per-capita PPP equivalent of that best level: 264.94 international $/person (using median GDP per-capita PPP in-sample).
- Highest observed mean Healthy Life Expectancy Growth (YoY %) appears when Government Health Expenditure (% GDP) is in [0.74290, 1.163) (mean outcome 0.72690).
- PPP per-capita equivalent in that best observed bin (p10-p90): [10.755, 87.295].
- Direction is negative in this analysis, so lowering this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Exploratory evidence only; use primarily for hypothesis generation.
- Practical direction: decrease Government Health Expenditure (% GDP) toward the estimated best level, then monitor Healthy Life Expectancy Growth (YoY %).
- Signal strength: moderate-to-weak; avoid hard policy conclusions from this pair alone.

## Plain-Language Summary

- Higher Government Health Expenditure (% GDP) tends to align with worse Healthy Life Expectancy Growth (YoY %).
- The estimate uses 181 subjects and 3801 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [0.74290, 1.163) (mean outcome 0.72690).
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Weak aggregate significance (<0.70).

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Aggregate forward Pearson | -0.1097 |
| Aggregate reverse Pearson | -0.0824 |
| Aggregate directional score (forward - reverse) | -0.0272 |
| Aggregate effect size (% baseline delta) | -152.3943 |
| Aggregate statistical significance | 0.2160 |
| Weighted average PIS | 0.0891 |
| Aggregate value predicting high outcome | 2.9331 |
| Aggregate value predicting low outcome | 3.0376 |
| Aggregate optimal daily value | 2.9331 |
| Observed predictor range | [0.0622, 12.6285] |
| Estimated best level (PPP per-capita equivalent) | 264.94 international $/person |
| Best observed PPP per-capita range (p10-p90) | [10.755, 87.295] |
| Median GDP per-capita PPP (context) | 9032.8 international $ |
| Pairs with PPP conversion | 3759 |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | pair_override | 2 | 3 | interpolation | 0.3479 | 0.0000 | 181 | 3801 |
| Runner-up | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.06221, 0.74290) | 380 | 33 | 0.5013 | 0.5292 | 0.7254 | 0.6948 |
| 2 | [0.74290, 1.163) | 380 | 51 | 0.9448 | 0.9462 | 0.7269 | 0.5368 |
| 3 | [1.163, 1.599) | 380 | 62 | 1.3816 | 1.3738 | 0.1432 | 0.4648 |
| 4 | [1.599, 1.991) | 380 | 66 | 1.7875 | 1.7813 | 0.5201 | 0.2438 |
| 5 | [1.991, 2.455) | 380 | 66 | 2.2176 | 2.2193 | 0.0490 | 0.1729 |
| 6 | [2.455, 2.982) | 380 | 63 | 2.7004 | 2.6967 | 0.1372 | 0.1430 |
| 7 | [2.982, 3.786) | 380 | 55 | 3.3708 | 3.3667 | 0.1254 | 0.2393 |
| 8 | [3.786, 4.764) | 380 | 55 | 4.2562 | 4.2443 | -0.0732 | 0.1874 |
| 9 | [4.764, 6.223) | 380 | 42 | 5.4571 | 5.4696 | 0.1115 | 0.2101 |
| 10 | [6.223, 11.160] | 381 | 29 | 7.4236 | 7.2195 | 0.1655 | 0.1622 |

### Distribution Charts

```text
Predictor Distribution (Government Health Expenditure (% GDP))
[0.06221, 0.98704) | ##################### 604
[0.98704, 1.912) | ############################## 844
[1.912, 2.837) | ########################## 743
[2.837, 3.762) | ################ 456
[3.762, 4.686) | ############# 371
[4.686, 5.611) | ######### 267
[5.611, 6.536) | ####### 209
[6.536, 7.461) | ##### 154
[7.461, 8.386) | ### 90
[8.386, 9.311) | ## 46
[9.311, 10.235) | # 6
[10.235, 11.160] | # 11
```

```text
Outcome Distribution (Healthy Life Expectancy Growth (YoY %), welfare-aligned)
[-33.373, -25.372) | # 1
[-25.372, -17.372) | # 1
[-17.372, -9.372) | # 23
[-9.372, -1.372) | ######## 799
[-1.372, 6.629) | ############################## 2867
[6.629, 14.629) | # 101
[14.629, 22.629) | # 7
[22.629, 30.629) | # 1
[54.630, 62.630] | # 1
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| TKM | -0.2655 | -0.9471 | -86.825 | 21 |
| IRL | 0.1805 | 0.9127 | -159.511 | 21 |
| FSM | 0.5415 | 0.8663 | -120.072 | 21 |
| LBR | -0.4712 | -0.8202 | -79.692 | 21 |
| ROU | 0.3047 | 0.8082 | -136.323 | 21 |
| LBN | -0.2453 | -0.7558 | -121.941 | 21 |
| KGZ | 0.1609 | 0.7486 | -10452.529 | 21 |
| AGO | -0.2309 | -0.7027 | -94.360 | 21 |
