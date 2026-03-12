# Pair Study: Education Share of Government Spending -> After-Tax Median Income Growth (YoY %)

- Pair ID: `predictor.derived.education_share_of_gov_expenditure_pct__outcome.derived.after_tax_median_income_ppp_growth_yoy_pct`
- Lag years: 2
- Duration years: 5
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.6242
- Included subjects: 159
- Skipped subjects: 0
- Total aligned pairs: 5212
- Signal grade: C (moderate)
- Data status: enough data
- Confidence score: 0.738 (medium confidence)
- Signal tag: early signal
- Direction: neutral
- Uncertainty score: 0.3206 (lower is better)

## Quick Meanings

- `Recommended level`: main value to try first.
- `Data-backed level`: level directly supported by seen data.
- `Backup level`: safer fallback from the middle of the data.
- `Math-only guess`: unconstrained model output for technical comparison.
- `Not enough data`: we cannot safely recommend a level yet.

## Key Numeric Takeaways

- Recommended Education Share of Government Spending level for higher After-Tax Median Income Growth (YoY %): 13.129 % of government expenditure (data-backed level).
- Best level directly seen in the grouped data: 13.129 % of government expenditure.
- Math-only guess is inside seen data but outside the best-performing bucket, so we still use the data-backed level.
- Best observed bin anchor (median/mean) is 13.796 % of government expenditure; model-optimal minus observed-anchor difference is 5.257 (+38.1%).
- Backup level check (middle 10-90% of data) suggests 13.288 % of government expenditure.
- The math-only guess and backup level differ by 30.3%, which means extreme values may matter a lot.
- Could not find a clear minimum useful level (no_consistent_effective_dose_detected).
- Diminishing returns likely begin near 13.129 % of government expenditure.
- Saturation/plateau zone starts around 16.371 % of government expenditure and extends through 17.804 % of government expenditure.
- Highest observed mean After-Tax Median Income Growth (YoY %) appears when Education Share of Government Spending is in [12.937, 14.674) (mean outcome 5.579).
- Direction signal is neutral; use caution and rely on the data-backed level.

## Decision Summary

- Interpretation: Early signal only; use this mainly to guide more testing.
- Pattern hint: no clear up/down pattern; use data-backed levels only.
- Signal strength: weak to moderate; avoid strong conclusions from this pair alone.

## Plain-Language Summary

- No strong directional pattern is detected between Education Share of Government Spending and After-Tax Median Income Growth (YoY %).
- The estimate uses 159 subjects and 5212 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [12.937, 14.674) (mean outcome 5.579).
- Confidence score is 0.738 (medium confidence); data status is enough data.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Weak significance score (<0.70).
- Some country-level direction scores are unusually high; this can happen with this scoring method.
- Top temporal profiles are close (score delta 0.0073); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 30.3% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Forward correlation | -0.0423 |
| Reverse correlation | 0.0942 |
| Direction score (forward - reverse) | -0.1364 |
| Effect size (% change from baseline) | 7.7537 |
| Significance score | 0.6794 |
| Weighted PIS | 0.1762 |
| Value linked with higher outcome | 19.0537 |
| Value linked with lower outcome | 18.9162 |
| Math-only best daily value | 19.0537 |
| Recommended level (reader-facing) | 13.129 % of government expenditure (data-backed level) |
| Math-only guess (technical) | 19.054 % of government expenditure |
| Data-backed level | 13.129 % of government expenditure |
| Data-backed range | [12.370, 13.797) |
| Backup level (middle-data check) | 12.935 % of government expenditure |
| Math-only guess inside seen data range? | yes |
| Math-only guess inside data-backed range? | no |
| Seen data range | [0.0000, 70.8565] |
| Math-only guess outside seen data? | no (within observed range) |
| Math-only guess outside best observed bucket? | yes |
| Best observed range | [12.937, 14.674) |
| Best observed range (middle-data check) | [12.548, 13.910) |
| Best observed outcome average | 5.579 |
| Best observed outcome average (middle-data check) | 5.752 |
| Backup level (bucket median) | 13.288 % of government expenditure |
| Math-only vs backup difference | -5.766 (-30.3%) |
| Middle-data share kept | 80.1% (4174/5212) |
| Data status | enough data |
| Data-status details | none |
| Confidence score | 0.7381 (medium confidence) |
| Reliability support component | 0.9343 |
| Reliability significance component | 0.6794 |
| Reliability directional component | 0.9095 |
| Reliability temporal-stability component | 0.2434 |
| Reliability robustness component | 0.7749 |
| Signal tag | early signal |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum useful level | Not identified (no_consistent_effective_dose_detected) |
| Point where gains start slowing | 13.129 % of government expenditure (ratio=-0.263) |
| Flat zone range | [15.392, 18.510) |
| Why this data-backed level was chosen | identified |
| Math-only guess minus data-backed level | 5.925 (+45.1%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 2 | 5 | interpolation | 0.6242 | 0.0000 | 159 | 5212 |
| Runner-up | predictor_default | 1 | 5 | interpolation | 0.6169 | 0.0073 | 159 | 5212 |
| Runner-up | predictor_default | 3 | 5 | interpolation | 0.6154 | 0.0088 | 159 | 5212 |
| Runner-up | predictor_default | 1 | 2 | interpolation | 0.6130 | 0.0112 | 159 | 5212 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.00000, 11.068) | 522 | 38 | 9.1273 | 9.6442 | 5.3090 | 5.4951 |
| 2 | [11.068, 12.937) | 521 | 47 | 12.1173 | 12.0995 | 4.2680 | 4.7260 |
| 3 | [12.937, 14.674) | 519 | 58 | 13.8039 | 13.7962 | 5.5795 | 5.4446 |
| 4 | [14.674, 16.814) | 506 | 69 | 15.7132 | 15.6877 | 4.6257 | 4.9369 |
| 5 | [16.814, 18.510) | 535 | 73 | 17.6632 | 17.7196 | 4.2936 | 4.2966 |
| 6 | [18.510, 19.964) | 524 | 73 | 19.1804 | 19.1920 | 4.3786 | 4.2250 |
| 7 | [19.964, 21.764) | 516 | 72 | 20.8274 | 20.9103 | 4.3378 | 4.7170 |
| 8 | [21.764, 23.863) | 502 | 66 | 22.8299 | 22.9495 | 4.1305 | 4.2934 |
| 9 | [23.863, 27.700) | 540 | 55 | 25.5790 | 25.6262 | 4.9008 | 4.9027 |
| 10 | [27.700, 66.586] | 527 | 35 | 34.5588 | 31.5226 | 4.5091 | 4.1451 |

### Distribution Charts

```text
Predictor Distribution (Education Share of Government Spending)
[0.00000, 5.549) | # 25
[5.549, 11.098) | ######### 503
[11.098, 16.647) | ########################## 1496
[16.647, 22.195) | ############################## 1723
[22.195, 27.744) | ################# 953
[27.744, 33.293) | ##### 314
[33.293, 38.842) | ## 136
[38.842, 44.391) | # 13
[44.391, 49.940) | # 11
[49.940, 55.488) | # 6
[55.488, 61.037) | # 2
[61.037, 66.586] | # 30
```

```text
Outcome Distribution (After-Tax Median Income Growth (YoY %), welfare-aligned)
[-49.393, -39.332) | # 5
[-39.332, -29.271) | # 10
[-29.271, -19.210) | # 23
[-19.210, -9.149) | # 89
[-9.149, 0.91158) | ####### 837
[0.91158, 10.972) | ############################## 3727
[10.972, 21.033) | #### 460
[21.033, 31.094) | # 45
[31.094, 41.155) | # 7
[41.155, 51.216) | # 4
[51.216, 61.277) | # 3
[61.277, 71.338] | # 2
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| BRA | -0.4766 | -1.1544 | -51.819 | 33 |
| SRB | -0.4005 | -1.0245 | -46.898 | 26 |
| IDX | 0.2060 | 1.0032 | 14.529 | 33 |
| CSS | -0.3627 | -0.9924 | -5.654 | 33 |
| LDC | 0.2016 | 0.9855 | 24.611 | 33 |
| ECU | -0.2795 | -0.9782 | -29.549 | 33 |
| LAC | -0.2803 | -0.9773 | -30.201 | 33 |
| ARM | -0.1009 | -0.9579 | -18.589 | 33 |
