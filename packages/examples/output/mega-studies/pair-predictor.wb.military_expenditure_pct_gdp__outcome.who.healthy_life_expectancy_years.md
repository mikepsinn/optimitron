# Pair Study: Military Expenditure (% GDP) -> Healthy Life Expectancy (HALE)

- Pair ID: `predictor.wb.military_expenditure_pct_gdp__outcome.who.healthy_life_expectancy_years`
- Lag years: 0
- Duration years: 1
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.6357
- Included subjects: 162
- Skipped subjects: 0
- Total aligned pairs: 10692
- Evidence grade: A
- Direction: positive
- Derived uncertainty score: 0.0831 (1 - aggregate significance, not NHST p-value)

## Actionable Takeaway

- Estimated best Military Expenditure (% GDP) level for higher Healthy Life Expectancy (HALE): 2.039 % GDP.
- Approximate per-capita PPP equivalent of that best level: 199.12 international $/person (using median GDP per-capita PPP in-sample).
- Highest observed mean Healthy Life Expectancy (HALE) appears when Military Expenditure (% GDP) is in [1.324, 1.522) (mean outcome 61.865).
- PPP per-capita equivalent in that best observed bin (p10-p90): [26.087, 586.22].
- Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Stronger evidence for directional signal relative to other predictors in this report.
- Practical direction: increase Military Expenditure (% GDP) toward the estimated best level, then monitor Healthy Life Expectancy (HALE).
- Signal strength: relatively stronger within this report set.

## Plain-Language Summary

- Higher Military Expenditure (% GDP) tends to align with better Healthy Life Expectancy (HALE).
- The estimate uses 162 subjects and 10692 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [1.324, 1.522) (mean outcome 61.865).
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Some subject-level directional scores exceed |1|; this is valid because the score is a difference of two correlations.
- Top temporal profiles are close (score delta 0.0104); temporal assumptions are not yet robust.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Aggregate forward Pearson | -0.1819 |
| Aggregate reverse Pearson | -0.2467 |
| Aggregate directional score (forward - reverse) | 0.0648 |
| Aggregate effect size (% baseline delta) | 0.0000 |
| Aggregate statistical significance | 0.9169 |
| Weighted average PIS | 0.4338 |
| Aggregate value predicting high outcome | 2.0388 |
| Aggregate value predicting low outcome | 2.2153 |
| Aggregate optimal daily value | 2.0388 |
| Observed predictor range | [0.0004, 117.3498] |
| Estimated best level (PPP per-capita equivalent) | 199.12 international $/person |
| Best observed PPP per-capita range (p10-p90) | [26.087, 586.22] |
| Median GDP per-capita PPP (context) | 9766.5 international $ |
| Pairs with PPP conversion | 10560 |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 0 | 1 | interpolation | 0.6357 | 0.0000 | 162 | 10692 |
| Runner-up | predictor_default | 0 | 2 | interpolation | 0.6253 | 0.0104 | 162 | 10692 |
| Runner-up | predictor_default | 0 | 3 | interpolation | 0.6179 | 0.0178 | 162 | 10692 |
| Runner-up | predictor_default | 1 | 1 | interpolation | 0.6100 | 0.0257 | 162 | 10692 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.03030, 0.60798) | 1068 | 28 | 0.3889 | 0.4225 | 58.7259 | 58.5649 |
| 2 | [0.60798, 0.90464) | 1071 | 55 | 0.7552 | 0.7497 | 60.1990 | 61.9580 |
| 3 | [0.90464, 1.119) | 1068 | 69 | 1.0123 | 1.0076 | 61.4443 | 63.0692 |
| 4 | [1.119, 1.324) | 1068 | 73 | 1.2154 | 1.2146 | 61.3814 | 63.4478 |
| 5 | [1.324, 1.522) | 1071 | 75 | 1.4167 | 1.4175 | 61.8653 | 64.3774 |
| 6 | [1.522, 1.805) | 1068 | 81 | 1.6645 | 1.6732 | 60.3059 | 62.5268 |
| 7 | [1.805, 2.229) | 1068 | 72 | 1.9794 | 1.9598 | 61.4654 | 64.4571 |
| 8 | [2.229, 2.897) | 1071 | 67 | 2.5343 | 2.5251 | 60.6159 | 62.5640 |
| 9 | [2.897, 4.006) | 1068 | 50 | 3.3971 | 3.3689 | 61.0273 | 62.6159 |
| 10 | [4.006, 33.517] | 1071 | 41 | 6.6828 | 5.2711 | 61.2110 | 63.7428 |

### Distribution Charts

```text
Predictor Distribution (Military Expenditure (% GDP))
[0.03030, 2.821) | ############################## 8442
[2.821, 5.611) | ###### 1803
[5.611, 8.402) | # 291
[8.402, 11.192) | # 63
[11.192, 13.983) | # 24
[13.983, 16.774) | # 3
[19.564, 22.355) | # 63
[30.726, 33.517] | # 3
```

```text
Outcome Distribution (Healthy Life Expectancy (HALE), welfare-aligned)
[31.884, 35.487) | # 2
[35.487, 39.089) | # 49
[39.089, 42.692) | ## 163
[42.692, 46.294) | ##### 383
[46.294, 49.896) | ####### 576
[49.896, 53.499) | ############ 986
[53.499, 57.101) | ############# 1031
[57.101, 60.704) | ############## 1135
[60.704, 64.306) | ######################## 1909
[64.306, 67.909) | ############################## 2418
[67.909, 71.511) | ####################### 1888
[71.511, 75.113] | ## 152
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| SYR | 0.3643 | 1.0716 | 7.354 | 66 |
| THA | 0.1238 | 0.8848 | 2.904 | 66 |
| GNB | -0.4612 | -0.7938 | -1.365 | 66 |
| IDN | 0.2118 | 0.7115 | 0.636 | 66 |
| SYC | -0.0944 | -0.7092 | -1.029 | 66 |
| ARG | -0.2693 | -0.7036 | -1.613 | 66 |
| TLS | 0.0067 | 0.6955 | 0.441 | 66 |
| URY | -0.2663 | -0.6522 | -1.126 | 66 |
