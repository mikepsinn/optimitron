# Pair Study: Tax Revenue (% GDP) -> After-Tax Median Income Growth (YoY %)

- Pair ID: `predictor.wb.tax_revenue_pct_gdp__outcome.derived.after_tax_median_income_ppp_growth_yoy_pct`
- Lag years: 1
- Duration years: 3
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.6970
- Included subjects: 182
- Skipped subjects: 0
- Total aligned pairs: 5975
- Evidence grade: B
- Direction: negative
- Derived uncertainty score: 0.2912 (1 - aggregate significance, not NHST p-value)

## Actionable Takeaway

- Estimated best Tax Revenue (% GDP) level for higher After-Tax Median Income Growth (YoY %): 2.710 % GDP.
- Approximate per-capita PPP equivalent of that best level: 240.07 international $/person (using median GDP per-capita PPP in-sample).
- Highest observed mean After-Tax Median Income Growth (YoY %) appears when Tax Revenue (% GDP) is in [1.87e-5, 2.25e-5) (mean outcome 5.787).
- PPP per-capita equivalent in that best observed bin (p10-p90): [5.93e-4, 0.00761].
- Direction is negative in this analysis, so lowering this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Exploratory evidence only; use primarily for hypothesis generation.
- Practical direction: decrease Tax Revenue (% GDP) toward the estimated best level, then monitor After-Tax Median Income Growth (YoY %).
- Signal strength: moderate-to-weak; avoid hard policy conclusions from this pair alone.

## Plain-Language Summary

- Higher Tax Revenue (% GDP) tends to align with worse After-Tax Median Income Growth (YoY %).
- The estimate uses 182 subjects and 5975 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [1.87e-5, 2.25e-5) (mean outcome 5.787).
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Some subject-level directional scores exceed |1|; this is valid because the score is a difference of two correlations.
- Top temporal profiles are close (score delta 0.0052); temporal assumptions are not yet robust.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Aggregate forward Pearson | -0.0176 |
| Aggregate reverse Pearson | 0.1813 |
| Aggregate directional score (forward - reverse) | -0.1989 |
| Aggregate effect size (% baseline delta) | 13.2818 |
| Aggregate statistical significance | 0.7088 |
| Weighted average PIS | 0.1986 |
| Aggregate value predicting high outcome | 2.7101 |
| Aggregate value predicting low outcome | 2.7872 |
| Aggregate optimal daily value | 2.7101 |
| Observed predictor range | [0.0000, 73.2262] |
| Estimated best level (PPP per-capita equivalent) | 240.07 international $/person |
| Best observed PPP per-capita range (p10-p90) | [5.93e-4, 0.00761] |
| Median GDP per-capita PPP (context) | 8858.6 international $ |
| Pairs with PPP conversion | 5975 |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 1 | 3 | interpolation | 0.6970 | 0.0000 | 182 | 5975 |
| Runner-up | predictor_default | 1 | 2 | interpolation | 0.6918 | 0.0052 | 182 | 5975 |
| Runner-up | predictor_default | 0 | 3 | interpolation | 0.6662 | 0.0307 | 182 | 5975 |
| Runner-up | predictor_default | 1 | 1 | interpolation | 0.6618 | 0.0352 | 182 | 5975 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [4.82e-12, 9.88e-6) | 2388 | 82 | 0.0000 | 0.0000 | 4.5738 | 4.6546 |
| 2 | [9.88e-6, 1.53e-5) | 599 | 45 | 0.0000 | 0.0000 | 4.7141 | 4.6512 |
| 3 | [1.53e-5, 1.87e-5) | 598 | 53 | 0.0000 | 0.0000 | 5.3321 | 5.4192 |
| 4 | [1.87e-5, 2.25e-5) | 597 | 54 | 0.0000 | 0.0000 | 5.7874 | 5.4924 |
| 5 | [2.25e-5, 0.00750) | 598 | 39 | 0.0002 | 0.0000 | 3.6956 | 3.9835 |
| 6 | [0.00750, 11.982) | 597 | 21 | 7.9899 | 10.0252 | 5.3924 | 5.4136 |
| 7 | [11.982, 73.226] | 598 | 22 | 17.7845 | 17.0822 | 4.3877 | 4.2185 |

### Distribution Charts

```text
Predictor Distribution (Tax Revenue (% GDP))
[4.82e-12, 6.102) | ############################## 4919
[6.102, 12.204) | ### 479
[12.204, 18.307) | ## 352
[18.307, 24.409) | # 213
[42.715, 48.817) | # 1
[67.124, 73.226] | # 11
```

```text
Outcome Distribution (After-Tax Median Income Growth (YoY %), welfare-aligned)
[-62.405, -43.867) | # 4
[-43.867, -25.329) | # 22
[-25.329, -6.791) | # 200
[-6.791, 11.747) | ############################## 5262
[11.747, 30.285) | ### 461
[30.285, 48.823) | # 14
[48.823, 67.360) | # 8
[67.360, 85.898) | # 2
[141.51, 160.05] | # 2
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| PSS | -0.6226 | -1.3567 | -61.430 | 33 |
| FJI | -0.4483 | -1.1411 | -20.223 | 33 |
| PAN | -0.1497 | -1.1070 | 19.767 | 33 |
| CHN | -0.4560 | -0.9656 | -30.775 | 33 |
| GAB | -0.2966 | -0.9557 | -86.903 | 33 |
| KWT | -0.4123 | -0.9141 | -105.459 | 33 |
| TTO | -0.3354 | -0.8960 | -70.115 | 33 |
| CAF | -0.0457 | -0.8882 | -6.305 | 33 |
