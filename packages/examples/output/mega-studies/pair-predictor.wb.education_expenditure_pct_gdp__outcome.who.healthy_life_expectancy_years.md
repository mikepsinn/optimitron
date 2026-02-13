# Pair Study: Education Expenditure (% GDP) -> Healthy Life Expectancy (HALE)

- Pair ID: `predictor.wb.education_expenditure_pct_gdp__outcome.who.healthy_life_expectancy_years`
- Lag years: 0
- Duration years: 2
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 15
- Temporal candidates with valid results: 15
- Temporal profile score: 0.6246
- Included subjects: 169
- Skipped subjects: 0
- Total aligned pairs: 11154
- Evidence grade: A
- Direction: negative
- Derived uncertainty score: 0.0845 (1 - aggregate significance, not NHST p-value)

## Actionable Takeaway

- Estimated best Education Expenditure (% GDP) level for higher Healthy Life Expectancy (HALE): 4.475 % GDP.
- Approximate per-capita PPP equivalent of that best level: 441.95 international $/person (using median GDP per-capita PPP in-sample).
- Highest observed mean Healthy Life Expectancy (HALE) appears when Education Expenditure (% GDP) is in [4.680, 5.157) (mean outcome 64.233).
- PPP per-capita equivalent in that best observed bin (p10-p90): [183.22, 2543.8].
- Direction is negative in this analysis, so lowering this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Stronger evidence for directional signal relative to other predictors in this report.
- Practical direction: decrease Education Expenditure (% GDP) toward the estimated best level, then monitor Healthy Life Expectancy (HALE).
- Signal strength: relatively stronger within this report set.

## Plain-Language Summary

- Higher Education Expenditure (% GDP) tends to align with worse Healthy Life Expectancy (HALE).
- The estimate uses 169 subjects and 11154 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [4.680, 5.157) (mean outcome 64.233).
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Some subject-level directional scores exceed |1|; this is valid because the score is a difference of two correlations.
- Top temporal profiles are close (score delta 0.0071); temporal assumptions are not yet robust.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Aggregate forward Pearson | 0.0879 |
| Aggregate reverse Pearson | 0.1421 |
| Aggregate directional score (forward - reverse) | -0.0542 |
| Aggregate effect size (% baseline delta) | 0.8060 |
| Aggregate statistical significance | 0.9155 |
| Weighted average PIS | 0.4201 |
| Aggregate value predicting high outcome | 4.4746 |
| Aggregate value predicting low outcome | 4.4365 |
| Aggregate optimal daily value | 4.4746 |
| Observed predictor range | [0.0000, 44.3340] |
| Estimated best level (PPP per-capita equivalent) | 441.95 international $/person |
| Best observed PPP per-capita range (p10-p90) | [183.22, 2543.8] |
| Median GDP per-capita PPP (context) | 9876.9 international $ |
| Pairs with PPP conversion | 11022 |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 0 | 2 | interpolation | 0.6246 | 0.0000 | 169 | 11154 |
| Runner-up | predictor_default | 0 | 3 | interpolation | 0.6175 | 0.0071 | 169 | 11154 |
| Runner-up | predictor_default | 1 | 2 | interpolation | 0.6057 | 0.0189 | 169 | 11154 |
| Runner-up | predictor_default | 0 | 5 | interpolation | 0.5972 | 0.0274 | 169 | 11154 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.00000, 2.233) | 1113 | 42 | 1.6862 | 1.7206 | 54.5552 | 54.3782 |
| 2 | [2.233, 2.826) | 1116 | 60 | 2.5186 | 2.5241 | 58.0711 | 59.3910 |
| 3 | [2.826, 3.381) | 1116 | 73 | 3.1183 | 3.1205 | 61.6793 | 63.3595 |
| 4 | [3.381, 3.798) | 1113 | 81 | 3.5783 | 3.5725 | 60.9779 | 62.5688 |
| 5 | [3.798, 4.191) | 1119 | 88 | 4.0013 | 4.0056 | 63.4595 | 64.2106 |
| 6 | [4.191, 4.680) | 1113 | 92 | 4.4346 | 4.4474 | 63.4375 | 64.7633 |
| 7 | [4.680, 5.157) | 1116 | 75 | 4.9142 | 4.9049 | 64.2328 | 64.9441 |
| 8 | [5.157, 5.657) | 1116 | 70 | 5.4044 | 5.4035 | 64.0309 | 64.8991 |
| 9 | [5.657, 6.570) | 1116 | 63 | 6.0823 | 6.0667 | 62.6946 | 64.3256 |
| 10 | [6.570, 30.964] | 1116 | 41 | 8.6808 | 7.8984 | 59.9840 | 60.4515 |

### Distribution Charts

```text
Predictor Distribution (Education Expenditure (% GDP))
[0.00000, 2.580) | ######### 1782
[2.580, 5.161) | ############################## 6036
[5.161, 7.741) | ############## 2739
[7.741, 10.321) | ## 399
[10.321, 12.902) | # 156
[12.902, 15.482) | # 24
[15.482, 18.062) | # 3
[18.062, 20.643) | # 3
[20.643, 23.223) | # 3
[23.223, 25.803) | # 3
[25.803, 28.384) | # 3
[28.384, 30.964] | # 3
```

```text
Outcome Distribution (Healthy Life Expectancy (HALE), welfare-aligned)
[31.884, 35.487) | # 2
[35.487, 39.089) | # 48
[39.089, 42.692) | ## 152
[42.692, 46.294) | #### 321
[46.294, 49.896) | ###### 480
[49.896, 53.499) | ########## 869
[53.499, 57.101) | ############# 1084
[57.101, 60.704) | ############## 1239
[60.704, 64.306) | ########################## 2225
[64.306, 67.909) | ############################## 2583
[67.909, 71.511) | ####################### 1997
[71.511, 75.113] | ## 154
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| PAK | 0.7231 | 1.0781 | 3.055 | 66 |
| CIV | 0.9282 | 0.9113 | 13.222 | 66 |
| SYC | -0.1818 | -0.8792 | -1.142 | 66 |
| SVN | -0.5265 | -0.8091 | -2.944 | 66 |
| FRA | -0.6197 | -0.7758 | -2.128 | 66 |
| LBN | -0.3069 | -0.7640 | -1.090 | 66 |
| BWA | -0.6177 | -0.7190 | -11.684 | 66 |
| TON | 0.1210 | -0.6516 | 0.679 | 66 |
