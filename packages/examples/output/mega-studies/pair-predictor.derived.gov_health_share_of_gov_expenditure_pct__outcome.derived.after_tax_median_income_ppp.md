# Pair Study: Government Health Share of Government Spending -> After-Tax Median Income (PPP)

- Pair ID: `predictor.derived.gov_health_share_of_gov_expenditure_pct__outcome.derived.after_tax_median_income_ppp`
- Lag years: 3
- Duration years: 5
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.5997
- Included subjects: 168
- Skipped subjects: 0
- Total aligned pairs: 5677
- Signal grade: A (very strong)
- Data status: enough data
- Confidence score: 0.663 (medium confidence)
- Signal tag: early signal
- Direction: positive
- Uncertainty score: 0.1188 (lower is better)

## Quick Meanings

- `Recommended level`: main value to try first.
- `Data-backed level`: level directly supported by seen data.
- `Backup level`: safer fallback from the middle of the data.
- `Math-only guess`: unconstrained model output for technical comparison.
- `Not enough data`: we cannot safely recommend a level yet.

## Key Numeric Takeaways

- Recommended Government Health Share of Government Spending level for higher After-Tax Median Income (PPP): 27.006 % of government expenditure (data-backed level).
- Best level directly seen in the grouped data: 27.006 % of government expenditure.
- Math-only guess is inside seen data but outside the best-performing bucket, so we still use the data-backed level.
- Best observed bin anchor (median/mean) is 26.086 % of government expenditure; model-optimal minus observed-anchor difference is -12.297 (-47.1%).
- Backup level check (middle 10-90% of data) suggests 18.907 % of government expenditure.
- The math-only guess and backup level differ by 37.1%, which means extreme values may matter a lot.
- Minimum effective level (first consistently positive zone): 6.606 % of government expenditure.
- Could not find a clear point where gains start slowing down (drop_below_detection_threshold).
- Could not find a stable flat zone (no_plateau_zone_detected).
- Highest observed mean After-Tax Median Income (PPP) appears when Government Health Share of Government Spending is in [20.836, 65.863] (mean outcome 35032.6).
- Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Medium signal; still sensitive to model choices.
- Pattern hint: higher Government Health Share of Government Spending tends to go with better After-Tax Median Income (PPP).
- Signal strength: stronger in this report set.

## Plain-Language Summary

- Higher Government Health Share of Government Spending tends to align with better After-Tax Median Income (PPP).
- The estimate uses 168 subjects and 5677 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [20.836, 65.863] (mean outcome 35032.6).
- A minimum effective predictor level appears near 6.606 % of government expenditure in the binned response curve.
- Confidence score is 0.663 (medium confidence); data status is enough data.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Forward and direction signals disagree; direction may be unstable.
- Some country-level direction scores are unusually high; this can happen with this scoring method.
- Top temporal profiles are close (score delta 0.0080); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 37.1% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Forward correlation | 0.2626 |
| Reverse correlation | 0.3039 |
| Direction score (forward - reverse) | -0.0412 |
| Effect size (% change from baseline) | 47.0827 |
| Significance score | 0.8812 |
| Weighted PIS | 0.6360 |
| Value linked with higher outcome | 13.7896 |
| Value linked with lower outcome | 13.0351 |
| Math-only best daily value | 13.7896 |
| Recommended level (reader-facing) | 27.006 % of government expenditure (data-backed level) |
| Math-only guess (technical) | 13.790 % of government expenditure |
| Data-backed level | 27.006 % of government expenditure |
| Data-backed range | [22.108, 65.863] |
| Backup level (middle-data check) | 19.235 % of government expenditure |
| Math-only guess inside seen data range? | yes |
| Math-only guess inside data-backed range? | no |
| Seen data range | [0.8069, 88.0822] |
| Math-only guess outside seen data? | no (within observed range) |
| Math-only guess outside best observed bucket? | yes |
| Best observed range | [20.836, 65.863] |
| Best observed range (middle-data check) | [17.435, 20.827] |
| Best observed outcome average | 35032.6 |
| Best observed outcome average (middle-data check) | 24728.8 |
| Backup level (bucket median) | 18.907 % of government expenditure |
| Math-only vs backup difference | 5.117 (+37.1%) |
| Middle-data share kept | 80.1% (4547/5677) |
| Data status | enough data |
| Data-status details | none |
| Confidence score | 0.6631 (medium confidence) |
| Reliability support component | 0.9731 |
| Reliability significance component | 0.8812 |
| Reliability directional component | 0.2748 |
| Reliability temporal-stability component | 0.2650 |
| Reliability robustness component | 0.6988 |
| Signal tag | early signal |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum useful level | 6.606 % of government expenditure (z=8.57) |
| Point where gains start slowing | Not identified (drop_below_detection_threshold) |
| Flat zone range | Not identified (no_plateau_zone_detected) |
| Why this data-backed level was chosen | identified |
| Math-only guess minus data-backed level | -13.217 (-48.9%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 3 | 5 | interpolation | 0.5997 | 0.0000 | 168 | 5677 |
| Runner-up | predictor_default | 3 | 3 | interpolation | 0.5917 | 0.0080 | 168 | 5677 |
| Runner-up | predictor_default | 3 | 2 | interpolation | 0.5896 | 0.0101 | 168 | 5677 |
| Runner-up | predictor_default | 2 | 5 | interpolation | 0.5822 | 0.0175 | 168 | 5677 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.93053, 6.049) | 562 | 26 | 4.7660 | 4.8966 | 3538.6788 | 2485.0000 |
| 2 | [6.049, 8.425) | 574 | 42 | 7.2350 | 7.1360 | 9445.6669 | 5205.0000 |
| 3 | [8.425, 9.678) | 566 | 50 | 9.0836 | 9.1043 | 8624.8037 | 3930.0000 |
| 4 | [9.678, 10.915) | 569 | 66 | 10.2898 | 10.3254 | 10024.4196 | 6480.0000 |
| 5 | [10.915, 12.168) | 567 | 68 | 11.4876 | 11.4731 | 14202.4784 | 9610.0000 |
| 6 | [12.168, 13.359) | 568 | 65 | 12.7165 | 12.7043 | 13995.5510 | 10955.0000 |
| 7 | [13.359, 14.871) | 568 | 64 | 14.1474 | 14.0939 | 17172.6706 | 13315.0000 |
| 8 | [14.871, 16.642) | 560 | 53 | 15.6261 | 15.5760 | 17733.0642 | 12850.0000 |
| 9 | [16.642, 20.836) | 575 | 40 | 18.5864 | 18.5633 | 24942.3355 | 21190.0000 |
| 10 | [20.836, 65.863] | 568 | 28 | 29.5985 | 26.0862 | 35032.5737 | 30859.5082 |

### Distribution Charts

```text
Predictor Distribution (Government Health Share of Government Spending)
[0.93053, 6.342) | ########## 663
[6.342, 11.753) | ############################## 2028
[11.753, 17.164) | ############################# 1942
[17.164, 22.575) | ######### 616
[22.575, 27.986) | ### 204
[27.986, 33.397) | ## 138
[33.397, 38.808) | # 26
[38.808, 44.219) | # 17
[44.219, 49.630) | # 3
[49.630, 55.041) | # 6
[55.041, 60.452) | # 1
[60.452, 65.863] | # 33
```

```text
Outcome Distribution (After-Tax Median Income (PPP), welfare-aligned)
[280.00, 10724.2) | ############################## 3121
[10724.2, 21168.3) | ########### 1131
[21168.3, 31612.5) | ###### 605
[31612.5, 42056.7) | ### 339
[42056.7, 52500.8) | ## 230
[52500.8, 62945.0) | # 111
[62945.0, 73389.2) | # 65
[73389.2, 83833.3) | # 31
[83833.3, 94277.5) | # 24
[94277.5, 104722) | # 14
[104722, 115166) | # 4
[115166, 125610] | # 2
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| PSS | -0.7288 | -1.5069 | -39.169 | 34 |
| ARE | 0.6472 | 1.2114 | 27.522 | 34 |
| RWA | -0.8044 | -1.1610 | -63.249 | 34 |
| KGZ | -0.8096 | -1.1233 | -54.301 | 33 |
| TGO | 0.7838 | 1.0962 | 72.266 | 34 |
| ITA | 0.5917 | 1.0789 | 67.197 | 34 |
| ZMB | -0.8955 | -1.0021 | -48.499 | 34 |
| IDX | -0.8618 | -0.9966 | -55.389 | 34 |
