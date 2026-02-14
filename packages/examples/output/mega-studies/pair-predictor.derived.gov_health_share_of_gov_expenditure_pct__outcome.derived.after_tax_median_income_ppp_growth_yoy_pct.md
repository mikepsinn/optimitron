# Pair Study: Government Health Share of Government Spending -> After-Tax Median Income Growth (YoY %)

- Pair ID: `predictor.derived.gov_health_share_of_gov_expenditure_pct__outcome.derived.after_tax_median_income_ppp_growth_yoy_pct`
- Lag years: 3
- Duration years: 5
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.6210
- Included subjects: 168
- Skipped subjects: 0
- Total aligned pairs: 5509
- Evidence grade: C
- Data sufficiency: sufficient
- Reliability score: 0.882 (high)
- Quality tier: exploratory
- Direction: positive
- Derived uncertainty score: 0.3021 (1 - aggregate significance, not NHST p-value)

## Key Numeric Takeaways

- Decision-target Government Health Share of Government Spending level for higher After-Tax Median Income Growth (YoY %): 12.642 % of government expenditure (support constrained).
- Observed-support target from binned response curve: 12.642 % of government expenditure.
- Robust sensitivity (trimmed 10-90% predictor range) suggests 12.600 % of government expenditure.
- Minimum effective level not reliably identified (no_consistent_effective_dose_detected).
- Diminishing returns likely begin near 12.642 % of government expenditure.
- Saturation/plateau zone starts around 14.970 % of government expenditure and extends through 27.065 % of government expenditure.
- Highest observed mean After-Tax Median Income Growth (YoY %) appears when Government Health Share of Government Spending is in [12.186, 13.363) (mean outcome 5.778).
- Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Exploratory evidence only; use primarily for hypothesis generation.
- Directional hint: higher Government Health Share of Government Spending is associated with better After-Tax Median Income Growth (YoY %).
- Signal strength: moderate-to-weak; avoid hard policy conclusions from this pair alone.

## Plain-Language Summary

- Higher Government Health Share of Government Spending tends to align with better After-Tax Median Income Growth (YoY %).
- The estimate uses 168 subjects and 5509 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [12.186, 13.363) (mean outcome 5.778).
- Reliability score is 0.882 (high); data sufficiency is sufficient.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Weak aggregate significance (<0.70).
- Some subject-level directional scores exceed |1|; this is valid because the score is a difference of two correlations.
- Top temporal profiles are close (score delta 0.0298); temporal assumptions are not yet robust.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Aggregate forward Pearson | 0.0625 |
| Aggregate reverse Pearson | -0.0642 |
| Aggregate directional score (forward - reverse) | 0.1267 |
| Aggregate effect size (% baseline delta) | 63.1946 |
| Aggregate statistical significance | 0.6979 |
| Weighted average PIS | 0.1829 |
| Aggregate value predicting high outcome | 13.1490 |
| Aggregate value predicting low outcome | 13.1200 |
| Aggregate optimal daily value | 13.1490 |
| Decision target value (reader-facing) | 12.642 % of government expenditure (support constrained) |
| Model-derived optimum (diagnostics) | 13.149 % of government expenditure |
| Support-constrained optimal value | 12.642 % of government expenditure |
| Support-constrained optimal range | [12.186, 12.999) |
| Response-curve robust optimal value | 12.584 % of government expenditure |
| Raw model optimal within observed range | yes |
| Raw model optimal within support-constrained range | no |
| Observed predictor range | [0.8069, 88.0822] |
| Model-derived optimal extrapolative? | no (within observed range) |
| Model-derived optimal outside best observed bin? | no |
| Raw best observed range | [12.186, 13.363) |
| Robust best observed range (trimmed) | [12.164, 12.930) |
| Raw best observed outcome mean | 5.778 |
| Robust best observed outcome mean | 6.080 |
| Robust optimal value (bin median) | 12.600 % of government expenditure |
| Raw vs robust optimal delta | -0.54889 (-4.2%) |
| Robustness retained fraction | 80.1% (4415/5509) |
| Data sufficiency status | sufficient |
| Data sufficiency reasons | none |
| Reliability score | 0.8824 (high) |
| Reliability support component | 0.9591 |
| Reliability significance component | 0.6979 |
| Reliability directional component | 0.8450 |
| Reliability temporal-stability component | 0.9941 |
| Reliability robustness component | 1.0000 |
| Quality tier | exploratory |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum effective level (MED) | Not identified (no_consistent_effective_dose_detected) |
| Diminishing-returns knee | 12.642 % of government expenditure (ratio=-1.148) |
| Saturation / plateau range | [14.444, 65.863] |
| Support-constrained target reason | identified |
| Raw to support delta | 0.50649 (+4.0%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 3 | 5 | interpolation | 0.6210 | 0.0000 | 168 | 5509 |
| Runner-up | predictor_default | 2 | 5 | interpolation | 0.5912 | 0.0298 | 168 | 5509 |
| Runner-up | predictor_default | 1 | 5 | interpolation | 0.5816 | 0.0395 | 168 | 5509 |
| Runner-up | predictor_default | 1 | 2 | interpolation | 0.5703 | 0.0507 | 168 | 5509 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.93053, 6.049) | 543 | 26 | 4.7675 | 4.8975 | 4.8081 | 5.1903 |
| 2 | [6.049, 8.429) | 559 | 42 | 7.2378 | 7.1371 | 5.2849 | 5.7348 |
| 3 | [8.429, 9.678) | 546 | 49 | 9.0853 | 9.1087 | 3.8754 | 3.9136 |
| 4 | [9.678, 10.932) | 556 | 66 | 10.2960 | 10.3285 | 4.1369 | 4.4945 |
| 5 | [10.932, 12.186) | 550 | 68 | 11.4969 | 11.4836 | 4.6032 | 4.5839 |
| 6 | [12.186, 13.363) | 551 | 65 | 12.7209 | 12.7043 | 5.7782 | 5.4653 |
| 7 | [13.363, 14.894) | 551 | 64 | 14.1503 | 14.0994 | 4.7206 | 4.3796 |
| 8 | [14.894, 16.642) | 541 | 53 | 15.6293 | 15.5800 | 4.4920 | 4.4815 |
| 9 | [16.642, 20.850) | 561 | 40 | 18.5960 | 18.5823 | 4.6905 | 4.6518 |
| 10 | [20.850, 65.863] | 551 | 28 | 29.6309 | 26.1008 | 4.0605 | 3.8818 |

### Distribution Charts

```text
Predictor Distribution (Government Health Share of Government Spending)
[0.93053, 6.342) | ########## 641
[6.342, 11.753) | ############################## 1967
[11.753, 17.164) | ############################# 1884
[17.164, 22.575) | ######### 602
[22.575, 27.986) | ### 197
[27.986, 33.397) | ## 133
[33.397, 38.808) | # 26
[38.808, 44.219) | # 17
[44.219, 49.630) | # 3
[49.630, 55.041) | # 6
[55.041, 60.452) | # 1
[60.452, 65.863] | # 32
```

```text
Outcome Distribution (After-Tax Median Income Growth (YoY %), welfare-aligned)
[-49.393, -31.954) | # 9
[-31.954, -14.516) | # 44
[-14.516, 2.923) | ############## 1730
[2.923, 20.361) | ############################## 3652
[20.361, 37.799) | # 60
[37.799, 55.238) | # 7
[55.238, 72.676) | # 6
[142.43, 159.87] | # 1
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| GRC | -0.4579 | -1.2205 | -78.221 | 33 |
| TUN | -0.3670 | -1.1335 | -44.400 | 33 |
| SRB | -0.4550 | -1.1280 | -48.442 | 26 |
| SST | 0.4274 | 1.0975 | 39.632 | 33 |
| EAR | 0.3428 | 1.0720 | 52.761 | 33 |
| USA | 0.2692 | 1.0147 | 31.699 | 33 |
| NAC | 0.2370 | 0.9964 | 31.277 | 33 |
| AUS | 0.3790 | 0.9873 | 7.206 | 33 |
