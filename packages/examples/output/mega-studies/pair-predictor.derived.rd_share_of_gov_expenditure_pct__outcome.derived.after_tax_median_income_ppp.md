# Pair Study: R&D Share of Government Spending -> After-Tax Median Income (PPP)

- Pair ID: `predictor.derived.rd_share_of_gov_expenditure_pct__outcome.derived.after_tax_median_income_ppp`
- Lag years: 3
- Duration years: 8
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.6413
- Included subjects: 100
- Skipped subjects: 0
- Total aligned pairs: 3380
- Signal grade: A (very strong)
- Data status: enough data
- Confidence score: 0.636 (medium confidence)
- Signal tag: early signal
- Direction: positive
- Uncertainty score: 0.1237 (lower is better)

## Quick Meanings

- `Recommended level`: main value to try first.
- `Data-backed level`: level directly supported by seen data.
- `Backup level`: safer fallback from the middle of the data.
- `Math-only guess`: unconstrained model output for technical comparison.
- `Not enough data`: we cannot safely recommend a level yet.

## Key Numeric Takeaways

- Recommended R&D Share of Government Spending level for higher After-Tax Median Income (PPP): 12.690 % of government expenditure (data-backed level).
- Best level directly seen in the grouped data: 12.690 % of government expenditure.
- Math-only guess is inside seen data but outside the best-performing bucket, so we still use the data-backed level.
- Best observed bin anchor (median/mean) is 12.055 % of government expenditure; model-optimal minus observed-anchor difference is -8.014 (-66.5%).
- Backup level check (middle 10-90% of data) suggests 7.495 % of government expenditure.
- The math-only guess and backup level differ by 85.4%, which means extreme values may matter a lot.
- Minimum effective level (first consistently positive zone): 3.602 % of government expenditure.
- Could not find a clear point where gains start slowing down (drop_below_detection_threshold).
- Could not find a stable flat zone (no_plateau_zone_detected).
- Highest observed mean After-Tax Median Income (PPP) appears when R&D Share of Government Spending is in [8.637, 26.042] (mean outcome 49866.2).
- Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Medium signal; still sensitive to model choices.
- Pattern hint: higher R&D Share of Government Spending tends to go with better After-Tax Median Income (PPP).
- Signal strength: stronger in this report set.

## Plain-Language Summary

- Higher R&D Share of Government Spending tends to align with better After-Tax Median Income (PPP).
- The estimate uses 100 subjects and 3380 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [8.637, 26.042] (mean outcome 49866.2).
- A minimum effective predictor level appears near 3.602 % of government expenditure in the binned response curve.
- Confidence score is 0.636 (medium confidence); data status is enough data.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Some country-level direction scores are unusually high; this can happen with this scoring method.
- Top temporal profiles are close (score delta 0.0145); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 85.4% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Forward correlation | 0.2547 |
| Reverse correlation | 0.1296 |
| Direction score (forward - reverse) | 0.1251 |
| Effect size (% change from baseline) | 46.5315 |
| Significance score | 0.8763 |
| Weighted PIS | 0.6377 |
| Value linked with higher outcome | 4.0417 |
| Value linked with lower outcome | 3.6178 |
| Math-only best daily value | 4.0417 |
| Recommended level (reader-facing) | 12.690 % of government expenditure (data-backed level) |
| Math-only guess (technical) | 4.042 % of government expenditure |
| Data-backed level | 12.690 % of government expenditure |
| Data-backed range | [9.823, 26.042] |
| Backup level (middle-data check) | 5.028 % of government expenditure |
| Math-only guess inside seen data range? | yes |
| Math-only guess inside data-backed range? | no |
| Seen data range | [0.0487, 35.0684] |
| Math-only guess outside seen data? | no (within observed range) |
| Math-only guess outside best observed bucket? | yes |
| Best observed range | [8.637, 26.042] |
| Best observed range (middle-data check) | [5.623, 8.636] |
| Best observed outcome average | 49866.2 |
| Best observed outcome average (middle-data check) | 32377.1 |
| Backup level (bucket median) | 7.495 % of government expenditure |
| Math-only vs backup difference | 3.453 (+85.4%) |
| Middle-data share kept | 80.0% (2704/3380) |
| Data status | enough data |
| Data-status details | none |
| Confidence score | 0.6363 (medium confidence) |
| Reliability support component | 0.6150 |
| Reliability significance component | 0.8763 |
| Reliability directional component | 0.8342 |
| Reliability temporal-stability component | 0.4828 |
| Reliability robustness component | 0.1618 |
| Signal tag | early signal |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum useful level | 3.602 % of government expenditure (z=1.42) |
| Point where gains start slowing | Not identified (drop_below_detection_threshold) |
| Flat zone range | Not identified (no_plateau_zone_detected) |
| Why this data-backed level was chosen | identified |
| Math-only guess minus data-backed level | -8.649 (-68.2%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 3 | 8 | interpolation | 0.6413 | 0.0000 | 100 | 3380 |
| Runner-up | predictor_default | 2 | 8 | interpolation | 0.6268 | 0.0145 | 100 | 3380 |
| Runner-up | predictor_default | 1 | 8 | interpolation | 0.6194 | 0.0219 | 100 | 3380 |
| Runner-up | predictor_default | 3 | 5 | interpolation | 0.6137 | 0.0276 | 100 | 3380 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.06241, 0.70236) | 338 | 17 | 0.4436 | 0.4822 | 20953.3432 | 11035.0000 |
| 2 | [0.70236, 1.053) | 338 | 24 | 0.8840 | 0.8999 | 11192.1598 | 7565.0000 |
| 3 | [1.053, 1.513) | 321 | 31 | 1.3237 | 1.3439 | 13936.0748 | 10240.0000 |
| 4 | [1.513, 2.042) | 345 | 34 | 1.7745 | 1.7639 | 14505.9012 | 13260.0000 |
| 5 | [2.042, 2.753) | 340 | 36 | 2.3336 | 2.3203 | 15772.2896 | 14065.0000 |
| 6 | [2.753, 3.356) | 341 | 29 | 3.0243 | 3.0247 | 15982.3631 | 12270.0000 |
| 7 | [3.356, 4.303) | 327 | 22 | 3.7784 | 3.7557 | 26590.9905 | 22130.0000 |
| 8 | [4.303, 5.044) | 354 | 21 | 4.5966 | 4.6044 | 27642.9973 | 27012.7869 |
| 9 | [5.044, 8.637) | 338 | 26 | 7.0072 | 7.1884 | 32968.9982 | 28595.0000 |
| 10 | [8.637, 26.042] | 338 | 16 | 12.9798 | 12.0553 | 49866.2140 | 45180.0000 |

### Distribution Charts

```text
Predictor Distribution (R&D Share of Government Spending)
[0.06241, 2.227) | ############################## 1472
[2.227, 4.392) | ################### 940
[4.392, 6.557) | ######## 401
[6.557, 8.722) | ##### 236
[8.722, 10.887) | ## 97
[10.887, 13.052) | ## 118
[13.052, 15.217) | # 28
[15.217, 17.382) | # 39
[17.382, 19.547) | # 40
[19.547, 21.712) | # 7
[23.877, 26.042] | # 2
```

```text
Outcome Distribution (After-Tax Median Income (PPP), welfare-aligned)
[570.00, 10990.0) | ############################## 1178
[10990.0, 21410.0) | ##################### 828
[21410.0, 31830.0) | ############## 536
[31830.0, 42250.0) | ######## 331
[42250.0, 52670.0) | ##### 214
[52670.0, 63090.0) | ### 117
[63090.0, 73510.0) | ## 76
[73510.0, 83930.0) | # 38
[83930.0, 94350.0) | # 29
[94350.0, 104770) | # 20
[104770, 115190) | # 9
[115190, 125610] | # 4
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| ZAF | 0.6496 | 1.4005 | 37.174 | 34 |
| ECA | -0.5452 | -1.2850 | -40.655 | 34 |
| CRI | 0.8377 | 1.2322 | 139.543 | 34 |
| PAN | -0.4740 | -1.1062 | -57.046 | 34 |
| RUS | 0.1536 | 1.0508 | 9.688 | 34 |
| KWT | 0.1041 | 1.0160 | 0.799 | 34 |
| FIN | 0.6949 | 1.0103 | 58.120 | 34 |
| CAN | 0.7998 | 0.9768 | 81.703 | 34 |
