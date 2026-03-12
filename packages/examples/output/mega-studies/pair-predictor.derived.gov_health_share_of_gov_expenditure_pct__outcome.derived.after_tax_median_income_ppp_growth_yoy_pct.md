# Pair Study: Government Health Share of Government Spending -> After-Tax Median Income Growth (YoY %)

- Pair ID: `predictor.derived.gov_health_share_of_gov_expenditure_pct__outcome.derived.after_tax_median_income_ppp_growth_yoy_pct`
- Lag years: 3
- Duration years: 5
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.6179
- Included subjects: 168
- Skipped subjects: 0
- Total aligned pairs: 5509
- Signal grade: C (moderate)
- Data status: enough data
- Confidence score: 0.876 (higher confidence)
- Signal tag: early signal
- Direction: positive
- Uncertainty score: 0.3076 (lower is better)

## Quick Meanings

- `Recommended level`: main value to try first.
- `Data-backed level`: level directly supported by seen data.
- `Backup level`: safer fallback from the middle of the data.
- `Math-only guess`: unconstrained model output for technical comparison.
- `Not enough data`: we cannot safely recommend a level yet.

## Key Numeric Takeaways

- Recommended Government Health Share of Government Spending level for higher After-Tax Median Income Growth (YoY %): 12.642 % of government expenditure (data-backed level).
- Best level directly seen in the grouped data: 12.642 % of government expenditure.
- Backup level check (middle 10-90% of data) suggests 12.600 % of government expenditure.
- Could not find a clear minimum useful level (no_consistent_effective_dose_detected).
- Diminishing returns likely begin near 12.642 % of government expenditure.
- Saturation/plateau zone starts around 14.970 % of government expenditure and extends through 27.065 % of government expenditure.
- Highest observed mean After-Tax Median Income Growth (YoY %) appears when Government Health Share of Government Spending is in [12.186, 13.363) (mean outcome 5.756).
- Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Early signal only; use this mainly to guide more testing.
- Pattern hint: higher Government Health Share of Government Spending tends to go with better After-Tax Median Income Growth (YoY %).
- Signal strength: weak to moderate; avoid strong conclusions from this pair alone.

## Plain-Language Summary

- Higher Government Health Share of Government Spending tends to align with better After-Tax Median Income Growth (YoY %).
- The estimate uses 168 subjects and 5509 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [12.186, 13.363) (mean outcome 5.756).
- Confidence score is 0.876 (higher confidence); data status is enough data.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Weak significance score (<0.70).
- Some country-level direction scores are unusually high; this can happen with this scoring method.
- Top temporal profiles are close (score delta 0.0291); temporal assumptions are not yet robust.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Forward correlation | 0.0585 |
| Reverse correlation | -0.0671 |
| Direction score (forward - reverse) | 0.1256 |
| Effect size (% change from baseline) | 62.0627 |
| Significance score | 0.6924 |
| Weighted PIS | 0.1779 |
| Value linked with higher outcome | 13.1539 |
| Value linked with lower outcome | 13.1290 |
| Math-only best daily value | 13.1539 |
| Recommended level (reader-facing) | 12.642 % of government expenditure (data-backed level) |
| Math-only guess (technical) | 13.154 % of government expenditure |
| Data-backed level | 12.642 % of government expenditure |
| Data-backed range | [12.186, 12.999) |
| Backup level (middle-data check) | 12.584 % of government expenditure |
| Math-only guess inside seen data range? | yes |
| Math-only guess inside data-backed range? | no |
| Seen data range | [0.8069, 88.0822] |
| Math-only guess outside seen data? | no (within observed range) |
| Math-only guess outside best observed bucket? | no |
| Best observed range | [12.186, 13.363) |
| Best observed range (middle-data check) | [12.164, 12.930) |
| Best observed outcome average | 5.756 |
| Best observed outcome average (middle-data check) | 6.064 |
| Backup level (bucket median) | 12.600 % of government expenditure |
| Math-only vs backup difference | -0.55378 (-4.2%) |
| Middle-data share kept | 80.1% (4415/5509) |
| Data status | enough data |
| Data-status details | none |
| Confidence score | 0.8756 (higher confidence) |
| Reliability support component | 0.9591 |
| Reliability significance component | 0.6924 |
| Reliability directional component | 0.8370 |
| Reliability temporal-stability component | 0.9686 |
| Reliability robustness component | 1.0000 |
| Signal tag | early signal |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum useful level | Not identified (no_consistent_effective_dose_detected) |
| Point where gains start slowing | 12.642 % of government expenditure (ratio=-1.151) |
| Flat zone range | [14.444, 65.863] |
| Why this data-backed level was chosen | identified |
| Math-only guess minus data-backed level | 0.51139 (+4.0%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 3 | 5 | interpolation | 0.6179 | 0.0000 | 168 | 5509 |
| Runner-up | predictor_default | 2 | 5 | interpolation | 0.5888 | 0.0291 | 168 | 5509 |
| Runner-up | predictor_default | 1 | 5 | interpolation | 0.5807 | 0.0372 | 168 | 5509 |
| Runner-up | predictor_default | 1 | 2 | interpolation | 0.5684 | 0.0495 | 168 | 5509 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.93053, 6.049) | 543 | 26 | 4.7675 | 4.8975 | 4.8081 | 5.1903 |
| 2 | [6.049, 8.429) | 559 | 42 | 7.2378 | 7.1371 | 5.2952 | 5.7348 |
| 3 | [8.429, 9.678) | 546 | 49 | 9.0853 | 9.1087 | 3.8676 | 3.9136 |
| 4 | [9.678, 10.932) | 556 | 66 | 10.2960 | 10.3285 | 4.1646 | 4.5012 |
| 5 | [10.932, 12.186) | 550 | 68 | 11.4969 | 11.4836 | 4.6115 | 4.5599 |
| 6 | [12.186, 13.363) | 551 | 65 | 12.7209 | 12.7043 | 5.7562 | 5.4958 |
| 7 | [13.363, 14.894) | 551 | 64 | 14.1503 | 14.0994 | 4.7005 | 4.3796 |
| 8 | [14.894, 16.642) | 541 | 53 | 15.6293 | 15.5800 | 4.5016 | 4.5097 |
| 9 | [16.642, 20.850) | 561 | 40 | 18.5960 | 18.5823 | 4.6880 | 4.6561 |
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
[-14.516, 2.923) | ############## 1727
[2.923, 20.361) | ############################## 3656
[20.361, 37.799) | # 59
[37.799, 55.238) | # 7
[55.238, 72.676) | # 6
[142.43, 159.87] | # 1
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| GRC | -0.4579 | -1.2205 | -78.221 | 33 |
| TUN | -0.3670 | -1.1335 | -44.400 | 33 |
| SST | 0.4063 | 1.0775 | 35.889 | 33 |
| EAR | 0.3428 | 1.0720 | 52.761 | 33 |
| SRB | -0.3297 | -1.0247 | -37.722 | 26 |
| USA | 0.2692 | 1.0147 | 31.699 | 33 |
| NAC | 0.2370 | 0.9964 | 31.277 | 33 |
| AUS | 0.3790 | 0.9873 | 7.206 | 33 |
