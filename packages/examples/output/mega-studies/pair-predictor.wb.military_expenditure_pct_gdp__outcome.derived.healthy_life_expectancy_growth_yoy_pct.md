# Pair Study: Military Expenditure (% GDP) -> Healthy Life Expectancy Growth (YoY %)

- Pair ID: `predictor.wb.military_expenditure_pct_gdp__outcome.derived.healthy_life_expectancy_growth_yoy_pct`
- Lag years: 0
- Duration years: 2
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.3214
- Included subjects: 162
- Skipped subjects: 0
- Total aligned pairs: 3402
- Evidence grade: F
- Direction: negative
- Derived uncertainty score: 0.8145 (1 - aggregate significance, not NHST p-value)

## Actionable Takeaway

- Estimated best Military Expenditure (% GDP) level for higher Healthy Life Expectancy Growth (YoY %): 2.052 % GDP.
- Approximate per-capita PPP equivalent of that best level: 206.31 international $/person (using median GDP per-capita PPP in-sample).
- Highest observed mean Healthy Life Expectancy Growth (YoY %) appears when Military Expenditure (% GDP) is in [0.03030, 0.60039) (mean outcome 0.44941).
- PPP per-capita equivalent in that best observed bin (p10-p90): [3.281, 233.00].
- Direction is negative in this analysis, so lowering this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Exploratory evidence only; use primarily for hypothesis generation.
- Practical direction: decrease Military Expenditure (% GDP) toward the estimated best level, then monitor Healthy Life Expectancy Growth (YoY %).
- Signal strength: moderate-to-weak; avoid hard policy conclusions from this pair alone.

## Plain-Language Summary

- Higher Military Expenditure (% GDP) tends to align with worse Healthy Life Expectancy Growth (YoY %).
- The estimate uses 162 subjects and 3402 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [0.03030, 0.60039) (mean outcome 0.44941).
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Weak aggregate significance (<0.70).
- Some subject-level directional scores exceed |1|; this is valid because the score is a difference of two correlations.
- Top temporal profiles are close (score delta 0.0011); temporal assumptions are not yet robust.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Aggregate forward Pearson | -0.0302 |
| Aggregate reverse Pearson | -0.0088 |
| Aggregate directional score (forward - reverse) | -0.0214 |
| Aggregate effect size (% baseline delta) | 0.0000 |
| Aggregate statistical significance | 0.1855 |
| Weighted average PIS | 0.0646 |
| Aggregate value predicting high outcome | 2.0518 |
| Aggregate value predicting low outcome | 2.0561 |
| Aggregate optimal daily value | 2.0518 |
| Observed predictor range | [0.0004, 117.3498] |
| Estimated best level (PPP per-capita equivalent) | 206.31 international $/person |
| Best observed PPP per-capita range (p10-p90) | [3.281, 233.00] |
| Median GDP per-capita PPP (context) | 10055.5 international $ |
| Pairs with PPP conversion | 3360 |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 0 | 2 | interpolation | 0.3214 | 0.0000 | 162 | 3402 |
| Runner-up | predictor_default | 0 | 1 | interpolation | 0.3203 | 0.0011 | 162 | 3402 |
| Runner-up | predictor_default | 2 | 3 | interpolation | 0.3147 | 0.0067 | 162 | 3402 |
| Runner-up | predictor_default | 2 | 2 | interpolation | 0.3136 | 0.0077 | 162 | 3402 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.03030, 0.60039) | 341 | 27 | 0.3923 | 0.4267 | 0.4494 | 0.2861 |
| 2 | [0.60039, 0.90697) | 340 | 52 | 0.7562 | 0.7521 | 0.2625 | 0.3201 |
| 3 | [0.90697, 1.122) | 340 | 63 | 1.0147 | 1.0103 | 0.3950 | 0.3859 |
| 4 | [1.122, 1.323) | 340 | 74 | 1.2154 | 1.2078 | 0.3056 | 0.2532 |
| 5 | [1.323, 1.518) | 340 | 69 | 1.4140 | 1.4093 | 0.2099 | 0.2648 |
| 6 | [1.518, 1.806) | 340 | 79 | 1.6618 | 1.6660 | 0.0691 | 0.2934 |
| 7 | [1.806, 2.210) | 340 | 67 | 1.9740 | 1.9591 | 0.2932 | 0.3077 |
| 8 | [2.210, 2.880) | 340 | 63 | 2.5276 | 2.5143 | 0.2928 | 0.3159 |
| 9 | [2.880, 3.975) | 340 | 51 | 3.3849 | 3.3748 | 0.1699 | 0.2372 |
| 10 | [3.975, 27.396] | 341 | 40 | 6.5740 | 5.2122 | 0.4245 | 0.2914 |

### Distribution Charts

```text
Predictor Distribution (Military Expenditure (% GDP))
[0.03030, 2.311) | ############################## 2443
[2.311, 4.591) | ######### 730
[4.591, 6.872) | ## 150
[6.872, 9.152) | # 37
[9.152, 11.433) | # 16
[11.433, 13.713) | # 4
[13.713, 15.994) | # 1
[20.555, 22.835) | # 20
[25.116, 27.396] | # 1
```

```text
Outcome Distribution (Healthy Life Expectancy Growth (YoY %), welfare-aligned)
[-33.373, -25.372) | # 1
[-25.372, -17.372) | # 1
[-17.372, -9.372) | # 23
[-9.372, -1.372) | ######## 695
[-1.372, 6.629) | ############################## 2584
[6.629, 14.629) | # 89
[14.629, 22.629) | # 7
[22.629, 30.629) | # 1
[54.630, 62.630] | # 1
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| NOR | 0.3643 | 1.0626 | 162.229 | 21 |
| YEM | 0.5621 | 1.0503 | -392.483 | 21 |
| KOR | -0.5934 | -1.0079 | -98.073 | 21 |
| BHR | -0.4274 | -0.8855 | -145.117 | 21 |
| SOM | -0.0292 | 0.8238 | 91.611 | 21 |
| ROU | -0.4366 | -0.7742 | -215.643 | 21 |
| ARG | 0.3154 | 0.7210 | -253.450 | 21 |
| GNB | -0.3615 | -0.7062 | -489.158 | 21 |
