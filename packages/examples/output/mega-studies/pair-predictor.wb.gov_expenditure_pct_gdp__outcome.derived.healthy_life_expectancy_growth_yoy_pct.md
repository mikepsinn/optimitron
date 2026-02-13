# Pair Study: Government Expenditure (% GDP) -> Healthy Life Expectancy Growth (YoY %)

- Pair ID: `predictor.wb.gov_expenditure_pct_gdp__outcome.derived.healthy_life_expectancy_growth_yoy_pct`
- Lag years: 1
- Duration years: 3
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.3601
- Included subjects: 147
- Skipped subjects: 0
- Total aligned pairs: 3087
- Evidence grade: F
- Direction: positive
- Derived uncertainty score: 0.7994 (1 - aggregate significance, not NHST p-value)

## Actionable Takeaway

- Estimated best Government Expenditure (% GDP) level for higher Healthy Life Expectancy Growth (YoY %): 26.190 % GDP.
- Approximate per-capita PPP equivalent of that best level: 2754.2 international $/person (using median GDP per-capita PPP in-sample).
- Highest observed mean Healthy Life Expectancy Growth (YoY %) appears when Government Expenditure (% GDP) is in [2.806, 11.693) (mean outcome 0.86639).
- PPP per-capita equivalent in that best observed bin (p10-p90): [81.781, 1871.0].
- Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Exploratory evidence only; use primarily for hypothesis generation.
- Practical direction: increase Government Expenditure (% GDP) toward the estimated best level, then monitor Healthy Life Expectancy Growth (YoY %).
- Signal strength: moderate-to-weak; avoid hard policy conclusions from this pair alone.

## Plain-Language Summary

- Higher Government Expenditure (% GDP) tends to align with better Healthy Life Expectancy Growth (YoY %).
- The estimate uses 147 subjects and 3087 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [2.806, 11.693) (mean outcome 0.86639).
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Weak aggregate significance (<0.70).
- Some subject-level directional scores exceed |1|; this is valid because the score is a difference of two correlations.
- Top temporal profiles are close (score delta 0.0124); temporal assumptions are not yet robust.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Aggregate forward Pearson | -0.0408 |
| Aggregate reverse Pearson | -0.1034 |
| Aggregate directional score (forward - reverse) | 0.0627 |
| Aggregate effect size (% baseline delta) | 144.1671 |
| Aggregate statistical significance | 0.2006 |
| Weighted average PIS | 0.0786 |
| Aggregate value predicting high outcome | 26.1896 |
| Aggregate value predicting low outcome | 25.2042 |
| Aggregate optimal daily value | 26.1896 |
| Observed predictor range | [2.0458, 758.9582] |
| Estimated best level (PPP per-capita equivalent) | 2754.2 international $/person |
| Best observed PPP per-capita range (p10-p90) | [81.781, 1871.0] |
| Median GDP per-capita PPP (context) | 10516.3 international $ |
| Pairs with PPP conversion | 3087 |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 1 | 3 | interpolation | 0.3601 | 0.0000 | 147 | 3087 |
| Runner-up | predictor_default | 2 | 2 | interpolation | 0.3477 | 0.0124 | 147 | 3087 |
| Runner-up | predictor_default | 1 | 2 | interpolation | 0.3472 | 0.0129 | 147 | 3087 |
| Runner-up | predictor_default | 2 | 3 | interpolation | 0.3413 | 0.0188 | 147 | 3087 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [2.806, 11.693) | 309 | 25 | 9.1063 | 9.8100 | 0.8664 | 0.7889 |
| 2 | [11.693, 15.302) | 309 | 42 | 13.6719 | 13.6512 | 0.3134 | 0.3328 |
| 3 | [15.302, 17.840) | 308 | 50 | 16.4793 | 16.4012 | 0.4849 | 0.3897 |
| 4 | [17.840, 20.439) | 309 | 51 | 19.0066 | 18.8756 | 0.0867 | 0.1838 |
| 5 | [20.439, 23.770) | 308 | 49 | 21.9788 | 22.0536 | 0.0028 | 0.2841 |
| 6 | [23.770, 26.979) | 309 | 48 | 25.3253 | 25.1388 | 0.0051 | 0.1351 |
| 7 | [26.979, 30.295) | 309 | 45 | 28.5114 | 28.5568 | 0.1990 | 0.2307 |
| 8 | [30.295, 34.161) | 308 | 47 | 32.4522 | 32.6173 | -0.0915 | 0.1616 |
| 9 | [34.161, 39.772) | 309 | 38 | 36.9209 | 36.9687 | -0.1667 | 0.1557 |
| 10 | [39.772, 758.96] | 309 | 31 | 60.2590 | 44.0321 | 0.4975 | 0.3622 |

### Distribution Charts

```text
Predictor Distribution (Government Expenditure (% GDP))
[2.806, 65.819) | ############################## 3059
[65.819, 128.83) | # 19
[191.84, 254.86) | # 1
[254.86, 317.87) | # 1
[317.87, 380.88) | # 1
[380.88, 443.89) | # 1
[443.89, 506.91) | # 1
[569.92, 632.93) | # 1
[632.93, 695.95) | # 1
[695.95, 758.96] | # 2
```

```text
Outcome Distribution (Healthy Life Expectancy Growth (YoY %), welfare-aligned)
[-18.191, -14.967) | # 3
[-14.967, -11.743) | # 7
[-11.743, -8.519) | # 20
[-8.519, -5.296) | ## 113
[-5.296, -2.072) | ####### 381
[-2.072, 1.152) | ############################## 1633
[1.152, 4.376) | ############# 718
[4.376, 7.600) | ### 155
[7.600, 10.824) | # 43
[10.824, 14.048) | # 8
[14.048, 17.272) | # 5
[17.272, 20.496] | # 1
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| NPL | -0.4722 | -1.1989 | -184.601 | 21 |
| UZB | 0.1672 | 1.0416 | 242.552 | 21 |
| IDN | -0.3445 | -0.9711 | -147.514 | 21 |
| LKA | 0.1581 | 0.9574 | -240.208 | 21 |
| MWI | 0.8191 | 0.9118 | -275.414 | 21 |
| KEN | -0.1428 | -0.8620 | -53.125 | 21 |
| ARG | -0.0733 | -0.8080 | -81.363 | 21 |
| ROU | 0.4675 | 0.7749 | -219.751 | 21 |
