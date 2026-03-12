# Pair Study: Government Expenditure Per Capita (PPP) -> After-Tax Median Income (PPP)

- Pair ID: `predictor.derived.gov_expenditure_per_capita_ppp__outcome.derived.after_tax_median_income_ppp`
- Lag years: 3
- Duration years: 3
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.5919
- Included subjects: 175
- Skipped subjects: 0
- Total aligned pairs: 5915
- Signal grade: A (very strong)
- Data status: enough data
- Confidence score: 0.566 (medium confidence)
- Signal tag: early signal
- Direction: neutral
- Uncertainty score: 0.1002 (lower is better)

## Quick Meanings

- `Recommended level`: main value to try first.
- `Data-backed level`: level directly supported by seen data.
- `Backup level`: safer fallback from the middle of the data.
- `Math-only guess`: unconstrained model output for technical comparison.
- `Not enough data`: we cannot safely recommend a level yet.

## Key Numeric Takeaways

- Recommended Government Expenditure Per Capita (PPP) level for higher After-Tax Median Income (PPP): 15275.5 international $/person (data-backed level).
- Best level directly seen in the grouped data: 15275.5 international $/person.
- Math-only guess is inside seen data but outside the best-performing bucket, so we still use the data-backed level.
- Best observed bin anchor (median/mean) is 14423.7 international $/person; model-optimal minus observed-anchor difference is -9094.2 (-63.1%).
- Backup level check (middle 10-90% of data) suggests 8919.6 international $/person.
- The math-only guess and backup level differ by 67.4%, which means extreme values may matter a lot.
- Minimum effective level (first consistently positive zone): 314.42 international $/person.
- Could not find a clear point where gains start slowing down (drop_below_detection_threshold).
- Could not find a stable flat zone (no_plateau_zone_detected).
- Highest observed mean After-Tax Median Income (PPP) appears when Government Expenditure Per Capita (PPP) is in [10881.6, 48525.1] (mean outcome 50626.0).
- Direction signal is neutral; use caution and rely on the data-backed level.

## Decision Summary

- Interpretation: Medium signal; still sensitive to model choices.
- Pattern hint: no clear up/down pattern; use data-backed levels only.
- Signal strength: stronger in this report set.

## Plain-Language Summary

- No strong directional pattern is detected between Government Expenditure Per Capita (PPP) and After-Tax Median Income (PPP).
- The estimate uses 175 subjects and 5915 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [10881.6, 48525.1] (mean outcome 50626.0).
- A minimum effective predictor level appears near 314.42 international $/person in the binned response curve.
- Confidence score is 0.566 (medium confidence); data status is enough data.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Some country-level direction scores are unusually high; this can happen with this scoring method.
- Top temporal profiles are close (score delta 0.0006); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 67.4% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Forward correlation | 0.8255 |
| Reverse correlation | 0.8525 |
| Direction score (forward - reverse) | -0.0270 |
| Effect size (% change from baseline) | 105.0142 |
| Significance score | 0.8998 |
| Weighted PIS | 0.7830 |
| Value linked with higher outcome | 5329.5689 |
| Value linked with lower outcome | 2897.5567 |
| Math-only best daily value | 5329.5689 |
| Recommended level (reader-facing) | 15275.5 international $/person (data-backed level) |
| Math-only guess (technical) | 5329.6 international $/person |
| Data-backed level | 15275.5 international $/person |
| Data-backed range | [11941.6, 48525.1] |
| Backup level (middle-data check) | 9237.5 international $/person |
| Math-only guess inside seen data range? | yes |
| Math-only guess inside data-backed range? | no |
| Seen data range | [8.5216, 63562.8926] |
| Math-only guess outside seen data? | no (within observed range) |
| Math-only guess outside best observed bucket? | yes |
| Best observed range | [10881.6, 48525.1] |
| Best observed range (middle-data check) | [7170.9, 10880.3] |
| Best observed outcome average | 50626.0 |
| Best observed outcome average (middle-data check) | 33605.9 |
| Backup level (bucket median) | 8919.6 international $/person |
| Math-only vs backup difference | 3590.0 (+67.4%) |
| Middle-data share kept | 80.0% (4731/5915) |
| Data status | enough data |
| Data-status details | none |
| Confidence score | 0.5664 (medium confidence) |
| Reliability support component | 0.9929 |
| Reliability significance component | 0.8998 |
| Reliability directional component | 0.1800 |
| Reliability temporal-stability component | 0.0189 |
| Reliability robustness component | 0.3627 |
| Signal tag | early signal |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum useful level | 314.42 international $/person (z=18.74) |
| Point where gains start slowing | Not identified (drop_below_detection_threshold) |
| Flat zone range | Not identified (no_plateau_zone_detected) |
| Why this data-backed level was chosen | identified |
| Math-only guess minus data-backed level | -9945.9 (-65.1%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 3 | 3 | interpolation | 0.5919 | 0.0000 | 175 | 5915 |
| Runner-up | predictor_default | 3 | 2 | interpolation | 0.5914 | 0.0006 | 175 | 5915 |
| Runner-up | predictor_default | 3 | 1 | interpolation | 0.5903 | 0.0016 | 175 | 5915 |
| Runner-up | predictor_default | 2 | 3 | interpolation | 0.5851 | 0.0069 | 175 | 5915 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [20.664, 250.47) | 592 | 27 | 153.4990 | 138.0197 | 1346.4365 | 1220.0000 |
| 2 | [250.47, 547.92) | 579 | 45 | 380.2848 | 352.7108 | 2837.4661 | 2700.0000 |
| 3 | [547.92, 918.04) | 603 | 53 | 718.6781 | 711.1780 | 4239.7702 | 3910.0000 |
| 4 | [918.04, 1362.7) | 589 | 69 | 1144.2399 | 1156.7402 | 5988.1010 | 5770.0000 |
| 5 | [1362.7, 1987.2) | 594 | 67 | 1661.4504 | 1634.8123 | 7500.6018 | 7370.0000 |
| 6 | [1987.2, 3192.9) | 574 | 72 | 2535.8108 | 2487.7490 | 12663.0368 | 11570.0000 |
| 7 | [3192.9, 4468.9) | 609 | 75 | 3768.1529 | 3787.5294 | 16162.7180 | 14638.1667 |
| 8 | [4468.9, 6745.6) | 590 | 73 | 5434.2763 | 5402.4555 | 25293.8289 | 21230.0000 |
| 9 | [6745.6, 10881.6) | 593 | 58 | 8558.9863 | 8446.8428 | 31549.7212 | 28870.0000 |
| 10 | [10881.6, 48525.1] | 592 | 47 | 16233.3745 | 14423.7410 | 50626.0033 | 47805.0000 |

### Distribution Charts

```text
Predictor Distribution (Government Expenditure Per Capita (PPP))
[20.664, 4062.7) | ############################## 3999
[4062.7, 8104.7) | ####### 987
[8104.7, 12146.8) | ### 455
[12146.8, 16188.8) | ## 272
[16188.8, 20230.8) | # 113
[20230.8, 24272.9) | # 38
[24272.9, 28314.9) | # 21
[28314.9, 32357.0) | # 17
[32357.0, 36399.0) | # 4
[36399.0, 40441.0) | # 4
[40441.0, 44483.1) | # 3
[44483.1, 48525.1] | # 2
```

```text
Outcome Distribution (After-Tax Median Income (PPP), welfare-aligned)
[280.00, 10724.2) | ############################## 3256
[10724.2, 21168.3) | ########### 1155
[21168.3, 31612.5) | ###### 620
[31612.5, 42056.7) | ### 349
[42056.7, 52500.8) | ## 236
[52500.8, 62945.0) | # 121
[62945.0, 73389.2) | # 78
[73389.2, 83833.3) | # 38
[83833.3, 94277.5) | # 28
[94277.5, 104722) | # 21
[104722, 115166) | # 9
[115166, 125610] | # 4
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| AFE | -0.7863 | -1.0863 | -42.026 | 34 |
| GAB | -0.8803 | -0.8589 | -26.069 | 34 |
| NIC | 0.1486 | -0.6915 | 27.404 | 34 |
| SAU | 0.3036 | 0.5570 | 12.920 | 34 |
| CAF | 0.3338 | 0.5544 | 35.769 | 34 |
| TLS | 0.2914 | 0.5280 | 47.480 | 34 |
| MWI | -0.5359 | -0.5174 | -28.903 | 34 |
| SYC | -0.5214 | -0.4727 | -18.565 | 34 |
