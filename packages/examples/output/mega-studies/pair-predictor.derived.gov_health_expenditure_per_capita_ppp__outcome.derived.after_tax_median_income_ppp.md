# Pair Study: Government Health Expenditure Per Capita (PPP) -> After-Tax Median Income (PPP)

- Pair ID: `predictor.derived.gov_health_expenditure_per_capita_ppp__outcome.derived.after_tax_median_income_ppp`
- Lag years: 3
- Duration years: 5
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.5779
- Included subjects: 229
- Skipped subjects: 0
- Total aligned pairs: 7585
- Signal grade: A (very strong)
- Data status: enough data
- Confidence score: 0.497 (lower confidence)
- Signal tag: early signal
- Direction: neutral
- Uncertainty score: 0.1095 (lower is better)

## Quick Meanings

- `Recommended level`: main value to try first.
- `Data-backed level`: level directly supported by seen data.
- `Backup level`: safer fallback from the middle of the data.
- `Math-only guess`: unconstrained model output for technical comparison.
- `Not enough data`: we cannot safely recommend a level yet.

## Key Numeric Takeaways

- Recommended Government Health Expenditure Per Capita (PPP) level for higher After-Tax Median Income (PPP): 2504.9 international $/person (data-backed level).
- Best level directly seen in the grouped data: 2504.9 international $/person.
- Math-only guess is inside seen data but outside the best-performing bucket, so we still use the data-backed level.
- Best observed bin anchor (median/mean) is 2315.1 international $/person; model-optimal minus observed-anchor difference is -1627.4 (-70.3%).
- Backup level check (middle 10-90% of data) suggests 1372.0 international $/person.
- The math-only guess and backup level differ by 99.5%, which means extreme values may matter a lot.
- Minimum effective level (first consistently positive zone): 17.753 international $/person.
- Diminishing returns likely begin near 33.100 international $/person.
- Could not find a stable flat zone (no_plateau_zone_detected).
- Highest observed mean After-Tax Median Income (PPP) appears when Government Health Expenditure Per Capita (PPP) is in [1639.8, 5977.9] (mean outcome 46276.9).
- Direction signal is neutral; use caution and rely on the data-backed level.

## Decision Summary

- Interpretation: Medium signal; still sensitive to model choices.
- Pattern hint: no clear up/down pattern; use data-backed levels only.
- Signal strength: stronger in this report set.

## Plain-Language Summary

- No strong directional pattern is detected between Government Health Expenditure Per Capita (PPP) and After-Tax Median Income (PPP).
- The estimate uses 229 subjects and 7585 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [1639.8, 5977.9] (mean outcome 46276.9).
- A minimum effective predictor level appears near 17.753 international $/person in the binned response curve.
- Confidence score is 0.497 (lower confidence); data status is enough data.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Top temporal profiles are close (score delta 0.0004); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 99.5% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Forward correlation | 0.8133 |
| Reverse correlation | 0.8295 |
| Direction score (forward - reverse) | -0.0162 |
| Effect size (% change from baseline) | 101.2009 |
| Significance score | 0.8905 |
| Weighted PIS | 0.7625 |
| Value linked with higher outcome | 687.6606 |
| Value linked with lower outcome | 391.5440 |
| Math-only best daily value | 687.6606 |
| Recommended level (reader-facing) | 2504.9 international $/person (data-backed level) |
| Math-only guess (technical) | 687.66 international $/person |
| Data-backed level | 2504.9 international $/person |
| Data-backed range | [1837.7, 5977.9] |
| Backup level (middle-data check) | 1420.7 international $/person |
| Math-only guess inside seen data range? | yes |
| Math-only guess inside data-backed range? | no |
| Seen data range | [0.2591, 8503.2455] |
| Math-only guess outside seen data? | no (within observed range) |
| Math-only guess outside best observed bucket? | yes |
| Best observed range | [1639.8, 5977.9] |
| Best observed range (middle-data check) | [1003.3, 1639.5] |
| Best observed outcome average | 46276.9 |
| Best observed outcome average (middle-data check) | 37112.6 |
| Backup level (bucket median) | 1372.0 international $/person |
| Math-only vs backup difference | 684.32 (+99.5%) |
| Middle-data share kept | 80.0% (6067/7585) |
| Data status | enough data |
| Data-status details | none |
| Confidence score | 0.4969 (lower confidence) |
| Reliability support component | 1.0000 |
| Reliability significance component | 0.8905 |
| Reliability directional component | 0.1081 |
| Reliability temporal-stability component | 0.0122 |
| Reliability robustness component | 0.0054 |
| Signal tag | early signal |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum useful level | 17.753 international $/person (z=17.66) |
| Point where gains start slowing | 33.100 international $/person (ratio=0.322) |
| Flat zone range | Not identified (no_plateau_zone_detected) |
| Why this data-backed level was chosen | identified |
| Math-only guess minus data-backed level | -1817.3 (-72.5%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 3 | 5 | interpolation | 0.5779 | 0.0000 | 229 | 7585 |
| Runner-up | predictor_default | 0 | 3 | interpolation | 0.5775 | 0.0004 | 229 | 7585 |
| Runner-up | predictor_default | 0 | 2 | interpolation | 0.5754 | 0.0024 | 229 | 7585 |
| Runner-up | predictor_default | 0 | 5 | interpolation | 0.5716 | 0.0063 | 229 | 7585 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.25914, 15.955) | 759 | 34 | 8.7585 | 8.6572 | 1374.8372 | 1170.0000 |
| 2 | [15.955, 31.472) | 758 | 53 | 21.5214 | 20.1254 | 2487.2113 | 2205.0000 |
| 3 | [31.472, 66.791) | 755 | 59 | 45.0000 | 41.9080 | 3966.5172 | 3356.5380 |
| 4 | [66.791, 114.38) | 762 | 59 | 89.4992 | 89.2877 | 4619.9119 | 4199.9152 |
| 5 | [114.38, 195.83) | 758 | 69 | 153.2012 | 154.3724 | 7693.6020 | 7125.0000 |
| 6 | [195.83, 284.60) | 746 | 80 | 234.5006 | 233.0067 | 9440.0382 | 8930.0000 |
| 7 | [284.60, 463.04) | 771 | 87 | 361.9150 | 362.5836 | 13019.5898 | 12310.0000 |
| 8 | [463.04, 871.32) | 756 | 73 | 615.8674 | 578.0396 | 19441.7623 | 17995.0000 |
| 9 | [871.32, 1639.8) | 761 | 59 | 1249.2997 | 1268.1838 | 35536.4886 | 28610.0000 |
| 10 | [1639.8, 5977.9] | 759 | 42 | 2598.0347 | 2315.1032 | 46276.8750 | 42010.0000 |

### Distribution Charts

```text
Predictor Distribution (Government Health Expenditure Per Capita (PPP))
[0.25914, 498.39) | ############################## 5426
[498.39, 996.52) | #### 786
[996.52, 1494.7) | ### 474
[1494.7, 1992.8) | ## 357
[1992.8, 2490.9) | # 220
[2490.9, 2989.1) | # 123
[2989.1, 3487.2) | # 77
[3487.2, 3985.3) | # 55
[3985.3, 4483.5) | # 29
[4483.5, 4981.6) | # 24
[4981.6, 5479.7) | # 10
[5479.7, 5977.9] | # 4
```

```text
Outcome Distribution (After-Tax Median Income (PPP), welfare-aligned)
[280.00, 14356.7) | ############################## 5169
[14356.7, 28433.3) | ####### 1276
[28433.3, 42510.0) | ### 558
[42510.0, 56586.7) | ## 287
[56586.7, 70663.3) | # 142
[70663.3, 84740.0) | # 79
[84740.0, 98816.7) | # 43
[98816.7, 112893) | # 16
[112893, 126970) | # 10
[126970, 141047) | # 1
[141047, 155123) | # 1
[155123, 169200] | # 3
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| DJI | -0.8362 | -0.9621 | -30.852 | 11 |
| CAF | -0.7661 | -0.8879 | -32.623 | 34 |
| NGA | -0.5481 | -0.8728 | -18.603 | 16 |
| SDN | 0.7156 | 0.8645 | 48.652 | 34 |
| IRQ | 0.6985 | 0.8509 | 71.737 | 33 |
| MDG | 0.5746 | 0.8102 | 20.147 | 34 |
| NRU | 0.1086 | -0.7354 | 12.711 | 34 |
| ZWE | 0.2263 | 0.6298 | 89.399 | 34 |
