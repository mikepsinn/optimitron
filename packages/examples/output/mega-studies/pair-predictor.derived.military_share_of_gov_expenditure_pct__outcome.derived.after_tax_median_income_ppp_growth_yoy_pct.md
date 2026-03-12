# Pair Study: Military Share of Government Spending -> After-Tax Median Income Growth (YoY %)

- Pair ID: `predictor.derived.military_share_of_gov_expenditure_pct__outcome.derived.after_tax_median_income_ppp_growth_yoy_pct`
- Lag years: 2
- Duration years: 1
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.6162
- Included subjects: 148
- Skipped subjects: 0
- Total aligned pairs: 4853
- Signal grade: C (moderate)
- Data status: enough data
- Confidence score: 0.755 (higher confidence)
- Signal tag: early signal
- Direction: negative
- Uncertainty score: 0.3195 (lower is better)

## Quick Meanings

- `Recommended level`: main value to try first.
- `Data-backed level`: level directly supported by seen data.
- `Backup level`: safer fallback from the middle of the data.
- `Math-only guess`: unconstrained model output for technical comparison.
- `Not enough data`: we cannot safely recommend a level yet.

## Key Numeric Takeaways

- Recommended Military Share of Government Spending level for higher After-Tax Median Income Growth (YoY %): 4.734 % of government expenditure (data-backed level).
- Best level directly seen in the grouped data: 4.734 % of government expenditure.
- Math-only guess is inside seen data but outside the best-performing bucket, so we still use the data-backed level.
- Best observed bin anchor (median/mean) is 5.208 % of government expenditure; model-optimal minus observed-anchor difference is 4.593 (+88.2%).
- Backup level check (middle 10-90% of data) suggests 4.759 % of government expenditure.
- The math-only guess and backup level differ by 51.4%, which means extreme values may matter a lot.
- Could not find a clear minimum useful level (no_consistent_effective_dose_detected).
- Diminishing returns likely begin near 4.734 % of government expenditure.
- Saturation/plateau zone starts around 10.950 % of government expenditure and extends through 13.996 % of government expenditure.
- Highest observed mean After-Tax Median Income Growth (YoY %) appears when Military Share of Government Spending is in [4.760, 5.660) (mean outcome 5.133).
- Direction is negative in this analysis, so lowering this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Early signal only; use this mainly to guide more testing.
- Pattern hint: lower Military Share of Government Spending tends to go with better After-Tax Median Income Growth (YoY %).
- Signal strength: weak to moderate; avoid strong conclusions from this pair alone.

## Plain-Language Summary

- Higher Military Share of Government Spending tends to align with worse After-Tax Median Income Growth (YoY %).
- The estimate uses 148 subjects and 4853 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [4.760, 5.660) (mean outcome 5.133).
- Confidence score is 0.755 (higher confidence); data status is enough data.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Weak significance score (<0.70).
- Top temporal profiles are close (score delta 0.0218); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 51.4% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Forward correlation | -0.1115 |
| Reverse correlation | 0.0165 |
| Direction score (forward - reverse) | -0.1280 |
| Effect size (% change from baseline) | 26.2670 |
| Significance score | 0.6805 |
| Weighted PIS | 0.1829 |
| Value linked with higher outcome | 9.8013 |
| Value linked with lower outcome | 10.2255 |
| Math-only best daily value | 9.8013 |
| Recommended level (reader-facing) | 4.734 % of government expenditure (data-backed level) |
| Math-only guess (technical) | 9.801 % of government expenditure |
| Data-backed level | 4.734 % of government expenditure |
| Data-backed range | [4.395, 5.018) |
| Backup level (middle-data check) | 4.508 % of government expenditure |
| Math-only guess inside seen data range? | yes |
| Math-only guess inside data-backed range? | no |
| Seen data range | [0.4821, 100.9768] |
| Math-only guess outside seen data? | no (within observed range) |
| Math-only guess outside best observed bucket? | yes |
| Best observed range | [4.760, 5.660) |
| Best observed range (middle-data check) | [4.441, 5.096) |
| Best observed outcome average | 5.133 |
| Best observed outcome average (middle-data check) | 5.438 |
| Backup level (bucket median) | 4.759 % of government expenditure |
| Math-only vs backup difference | -5.042 (-51.4%) |
| Middle-data share kept | 80.0% (3881/4853) |
| Data status | enough data |
| Data-status details | none |
| Confidence score | 0.7554 (higher confidence) |
| Reliability support component | 0.8978 |
| Reliability significance component | 0.6805 |
| Reliability directional component | 0.8532 |
| Reliability temporal-stability component | 0.7281 |
| Reliability robustness component | 0.5395 |
| Signal tag | early signal |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum useful level | Not identified (no_consistent_effective_dose_detected) |
| Point where gains start slowing | 4.734 % of government expenditure (ratio=-0.345) |
| Flat zone range | [9.950, 15.368) |
| Why this data-backed level was chosen | identified |
| Math-only guess minus data-backed level | 5.067 (+107.0%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 2 | 1 | interpolation | 0.6162 | 0.0000 | 148 | 4853 |
| Runner-up | predictor_default | 2 | 3 | interpolation | 0.5943 | 0.0218 | 148 | 4853 |
| Runner-up | predictor_default | 1 | 2 | interpolation | 0.5939 | 0.0223 | 148 | 4853 |
| Runner-up | predictor_default | 2 | 2 | interpolation | 0.5936 | 0.0226 | 148 | 4853 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.51710, 2.985) | 486 | 34 | 2.0045 | 2.1403 | 4.9374 | 4.9626 |
| 2 | [2.985, 4.052) | 485 | 59 | 3.5530 | 3.5780 | 4.7338 | 4.5404 |
| 3 | [4.052, 4.760) | 485 | 66 | 4.4128 | 4.3951 | 4.9861 | 4.6422 |
| 4 | [4.760, 5.660) | 485 | 71 | 5.2063 | 5.2081 | 5.1329 | 5.0445 |
| 5 | [5.660, 6.902) | 485 | 76 | 6.2487 | 6.2103 | 4.6091 | 4.8048 |
| 6 | [6.902, 8.590) | 474 | 70 | 7.7189 | 7.6964 | 4.7218 | 4.6052 |
| 7 | [8.590, 10.747) | 484 | 73 | 9.6005 | 9.6276 | 4.3704 | 4.4685 |
| 8 | [10.747, 14.381) | 497 | 69 | 12.4939 | 12.5238 | 4.0900 | 4.5455 |
| 9 | [14.381, 17.805) | 486 | 52 | 15.9017 | 15.8956 | 4.9001 | 5.2594 |
| 10 | [17.805, 100.98] | 486 | 45 | 28.4999 | 22.6817 | 4.6725 | 4.0101 |

### Distribution Charts

```text
Predictor Distribution (Military Share of Government Spending)
[0.51710, 8.889) | ############################## 2972
[8.889, 17.260) | ############## 1346
[17.260, 25.632) | ### 339
[25.632, 34.004) | # 90
[34.004, 42.375) | # 40
[42.375, 50.747) | # 26
[50.747, 59.119) | # 8
[59.119, 67.490) | # 4
[67.490, 75.862) | # 15
[84.234, 92.605) | # 11
[92.605, 100.98] | # 2
```

```text
Outcome Distribution (After-Tax Median Income Growth (YoY %), welfare-aligned)
[-49.393, -31.954) | # 8
[-31.954, -14.516) | # 43
[-14.516, 2.923) | ############## 1479
[2.923, 20.361) | ############################## 3257
[20.361, 37.799) | # 53
[37.799, 55.238) | # 6
[55.238, 72.676) | # 6
[142.43, 159.87] | # 1
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| HPC | -0.4569 | -0.9360 | -33.053 | 33 |
| ALB | -0.3131 | -0.8862 | -58.209 | 33 |
| IDX | -0.2524 | -0.8642 | -15.543 | 33 |
| LDC | -0.2313 | -0.8025 | -16.126 | 33 |
| IDN | -0.1200 | -0.6896 | -21.043 | 33 |
| KWT | 0.2094 | 0.6860 | 2922.996 | 33 |
| NAM | -0.0535 | -0.6803 | -27.040 | 33 |
| BOL | -0.1129 | -0.6485 | -34.220 | 33 |
