# Pair Study: Government Health Expenditure (% GDP) -> After-Tax Median Income Growth (YoY %)

- Pair ID: `predictor.wb.gov_health_expenditure_pct_gdp__outcome.derived.after_tax_median_income_ppp_growth_yoy_pct`
- Lag years: 1
- Duration years: 2
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.7050
- Included subjects: 229
- Skipped subjects: 0
- Total aligned pairs: 7356
- Evidence grade: B
- Direction: positive
- Derived uncertainty score: 0.2858 (1 - aggregate significance, not NHST p-value)

## Actionable Takeaway

- Estimated best Government Health Expenditure (% GDP) level for higher After-Tax Median Income Growth (YoY %): 3.158 % GDP.
- Approximate per-capita PPP equivalent of that best level: 242.50 international $/person (using median GDP per-capita PPP in-sample).
- Highest observed mean After-Tax Median Income Growth (YoY %) appears when Government Health Expenditure (% GDP) is in [3.811, 4.798) (mean outcome 4.922).
- PPP per-capita equivalent in that best observed bin (p10-p90): [178.73, 1263.8].
- Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Exploratory evidence only; use primarily for hypothesis generation.
- Practical direction: increase Government Health Expenditure (% GDP) toward the estimated best level, then monitor After-Tax Median Income Growth (YoY %).
- Signal strength: moderate-to-weak; avoid hard policy conclusions from this pair alone.

## Plain-Language Summary

- Higher Government Health Expenditure (% GDP) tends to align with better After-Tax Median Income Growth (YoY %).
- The estimate uses 229 subjects and 7356 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [3.811, 4.798) (mean outcome 4.922).
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Some subject-level directional scores exceed |1|; this is valid because the score is a difference of two correlations.
- Top temporal profiles are close (score delta 0.0103); temporal assumptions are not yet robust.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Aggregate forward Pearson | 0.1326 |
| Aggregate reverse Pearson | -0.0725 |
| Aggregate directional score (forward - reverse) | 0.2051 |
| Aggregate effect size (% baseline delta) | 49.5860 |
| Aggregate statistical significance | 0.7142 |
| Weighted average PIS | 0.2154 |
| Aggregate value predicting high outcome | 3.1579 |
| Aggregate value predicting low outcome | 3.1481 |
| Aggregate optimal daily value | 3.1579 |
| Observed predictor range | [0.0622, 22.2543] |
| Estimated best level (PPP per-capita equivalent) | 242.50 international $/person |
| Best observed PPP per-capita range (p10-p90) | [178.73, 1263.8] |
| Median GDP per-capita PPP (context) | 7679.2 international $ |
| Pairs with PPP conversion | 7356 |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 1 | 2 | interpolation | 0.7050 | 0.0000 | 229 | 7356 |
| Runner-up | predictor_default | 1 | 3 | interpolation | 0.6947 | 0.0103 | 229 | 7356 |
| Runner-up | predictor_default | 1 | 5 | interpolation | 0.6744 | 0.0306 | 229 | 7356 |
| Runner-up | predictor_default | 2 | 2 | interpolation | 0.6531 | 0.0519 | 229 | 7356 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.06221, 0.84814) | 736 | 45 | 0.5602 | 0.5799 | 4.5607 | 4.4559 |
| 2 | [0.84814, 1.214) | 735 | 67 | 1.0154 | 1.0154 | 4.4263 | 4.6841 |
| 3 | [1.214, 1.694) | 732 | 80 | 1.4497 | 1.4618 | 4.8276 | 4.6649 |
| 4 | [1.694, 2.085) | 739 | 86 | 1.8767 | 1.8802 | 4.1068 | 4.3796 |
| 5 | [2.085, 2.535) | 729 | 92 | 2.2997 | 2.3023 | 4.2600 | 4.1854 |
| 6 | [2.535, 3.030) | 742 | 91 | 2.7768 | 2.7699 | 4.4429 | 4.4926 |
| 7 | [3.030, 3.811) | 733 | 90 | 3.3975 | 3.3775 | 4.6484 | 4.7941 |
| 8 | [3.811, 4.798) | 738 | 77 | 4.3054 | 4.2733 | 4.9216 | 5.1115 |
| 9 | [4.798, 6.266) | 733 | 69 | 5.4943 | 5.5204 | 4.8782 | 4.6580 |
| 10 | [6.266, 22.254] | 739 | 46 | 7.9638 | 7.3274 | 4.3973 | 4.1111 |

### Distribution Charts

```text
Predictor Distribution (Government Health Expenditure (% GDP))
[0.06221, 1.912) | ############################## 2630
[1.912, 3.761) | ############################ 2473
[3.761, 5.610) | ############## 1234
[5.610, 7.460) | ######## 684
[7.460, 9.309) | ### 254
[9.309, 11.158) | # 39
[11.158, 13.008) | # 10
[13.008, 14.857) | # 5
[14.857, 16.706) | # 12
[16.706, 18.556) | # 3
[18.556, 20.405) | # 1
[20.405, 22.254] | # 11
```

```text
Outcome Distribution (After-Tax Median Income Growth (YoY %), welfare-aligned)
[-62.405, -43.867) | # 5
[-43.867, -25.329) | # 29
[-25.329, -6.791) | # 265
[-6.791, 11.747) | ############################## 6459
[11.747, 30.285) | ### 564
[30.285, 48.823) | # 19
[48.823, 67.360) | # 9
[67.360, 85.898) | # 4
[141.51, 160.05] | # 2
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| LBN | -0.3330 | -1.1027 | -56.956 | 33 |
| WSM | 0.1540 | 0.9697 | 14.812 | 33 |
| ATG | 0.4483 | 0.9662 | 89.093 | 33 |
| BRN | 0.4870 | 0.8076 | -211.823 | 33 |
| FJI | 0.2161 | 0.8069 | 55.158 | 33 |
| FCS | 0.1640 | 0.7859 | 37.826 | 15 |
| IDA | 0.6325 | 0.6967 | 80.371 | 33 |
| AFG | -0.2865 | -0.6964 | 14.948 | 23 |
