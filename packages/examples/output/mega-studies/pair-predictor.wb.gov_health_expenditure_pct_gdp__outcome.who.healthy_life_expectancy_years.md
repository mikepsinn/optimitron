# Pair Study: Government Health Expenditure (% GDP) -> Healthy Life Expectancy (HALE)

- Pair ID: `predictor.wb.gov_health_expenditure_pct_gdp__outcome.who.healthy_life_expectancy_years`
- Lag years: 2
- Duration years: 5
- Temporal profile source: pair_override
- Filling strategy: interpolation
- Temporal candidates evaluated: 1
- Temporal candidates with valid results: 1
- Temporal profile score: 0.7108
- Included subjects: 181
- Skipped subjects: 0
- Total aligned pairs: 11946
- Evidence grade: A
- Direction: negative
- Derived uncertainty score: 0.0707 (1 - aggregate significance, not NHST p-value)

## Actionable Takeaway

- Estimated best Government Health Expenditure (% GDP) level for higher Healthy Life Expectancy (HALE): 3.004 % GDP.
- Approximate per-capita PPP equivalent of that best level: 264.29 international $/person (using median GDP per-capita PPP in-sample).
- Highest observed mean Healthy Life Expectancy (HALE) appears when Government Health Expenditure (% GDP) is in [6.123, 10.976] (mean outcome 68.454).
- PPP per-capita equivalent in that best observed bin (p10-p90): [1296.4, 4208.6].
- Direction is negative in this analysis, so lowering this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Stronger evidence for directional signal relative to other predictors in this report.
- Practical direction: decrease Government Health Expenditure (% GDP) toward the estimated best level, then monitor Healthy Life Expectancy (HALE).
- Signal strength: relatively stronger within this report set.

## Plain-Language Summary

- Higher Government Health Expenditure (% GDP) tends to align with worse Healthy Life Expectancy (HALE).
- The estimate uses 181 subjects and 11946 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [6.123, 10.976] (mean outcome 68.454).
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Some subject-level directional scores exceed |1|; this is valid because the score is a difference of two correlations.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Aggregate forward Pearson | 0.2153 |
| Aggregate reverse Pearson | 0.3508 |
| Aggregate directional score (forward - reverse) | -0.1356 |
| Aggregate effect size (% baseline delta) | 1.6778 |
| Aggregate statistical significance | 0.9293 |
| Weighted average PIS | 0.4992 |
| Aggregate value predicting high outcome | 3.0041 |
| Aggregate value predicting low outcome | 2.8058 |
| Aggregate optimal daily value | 3.0041 |
| Observed predictor range | [0.0622, 12.6285] |
| Estimated best level (PPP per-capita equivalent) | 264.29 international $/person |
| Best observed PPP per-capita range (p10-p90) | [1296.4, 4208.6] |
| Median GDP per-capita PPP (context) | 8797.5 international $ |
| Pairs with PPP conversion | 11814 |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | pair_override | 2 | 5 | interpolation | 0.7108 | 0.0000 | 181 | 11946 |
| Runner-up | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.06221, 0.73128) | 1194 | 32 | 0.5006 | 0.5338 | 51.8866 | 51.6839 |
| 2 | [0.73128, 1.162) | 1194 | 50 | 0.9400 | 0.9427 | 56.3452 | 56.6045 |
| 3 | [1.162, 1.596) | 1194 | 58 | 1.3729 | 1.3617 | 56.5540 | 56.8719 |
| 4 | [1.596, 1.956) | 1194 | 63 | 1.7679 | 1.7550 | 60.0062 | 61.1017 |
| 5 | [1.956, 2.414) | 1197 | 64 | 2.1838 | 2.1745 | 62.0364 | 62.9749 |
| 6 | [2.414, 2.923) | 1194 | 60 | 2.6589 | 2.6588 | 62.6542 | 64.2622 |
| 7 | [2.923, 3.749) | 1194 | 50 | 3.3138 | 3.3015 | 62.2313 | 63.5067 |
| 8 | [3.749, 4.712) | 1188 | 50 | 4.2035 | 4.1890 | 64.2110 | 65.2393 |
| 9 | [4.712, 6.123) | 1200 | 41 | 5.3783 | 5.3986 | 65.9712 | 67.5140 |
| 10 | [6.123, 10.976] | 1197 | 29 | 7.3053 | 7.0733 | 68.4542 | 69.4242 |

### Distribution Charts

```text
Predictor Distribution (Government Health Expenditure (% GDP))
[0.06221, 0.97166) | ##################### 1863
[0.97166, 1.881) | ############################## 2673
[1.881, 2.791) | ########################### 2370
[2.791, 3.700) | ################ 1413
[3.700, 4.609) | ############# 1125
[4.609, 5.519) | ######### 834
[5.519, 6.428) | ######## 699
[6.428, 7.338) | ##### 477
[7.338, 8.247) | ### 309
[8.247, 9.157) | # 111
[9.157, 10.066) | # 42
[10.066, 10.976] | # 30
```

```text
Outcome Distribution (Healthy Life Expectancy (HALE), welfare-aligned)
[31.884, 35.487) | # 2
[35.487, 39.089) | # 49
[39.089, 42.692) | ## 163
[42.692, 46.294) | #### 374
[46.294, 49.896) | ###### 553
[49.896, 53.499) | ########### 977
[53.499, 57.101) | ############# 1194
[57.101, 60.704) | ################ 1401
[60.704, 64.306) | ########################## 2353
[64.306, 67.909) | ############################## 2706
[67.909, 71.511) | ###################### 2022
[71.511, 75.113] | ## 152
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| SOM | -0.6655 | -1.4235 | -8.116 | 66 |
| DJI | 0.5938 | 1.1658 | 3.651 | 66 |
| PAK | -0.5095 | -1.1439 | -2.399 | 66 |
| ALB | -0.5055 | -1.1312 | -2.836 | 66 |
| COM | -0.7946 | -1.0340 | -5.017 | 66 |
| PER | -0.3940 | -1.0150 | -0.955 | 66 |
| KHM | -0.7252 | -0.9801 | -7.732 | 66 |
| NAM | -0.7345 | -0.9740 | -11.153 | 66 |
