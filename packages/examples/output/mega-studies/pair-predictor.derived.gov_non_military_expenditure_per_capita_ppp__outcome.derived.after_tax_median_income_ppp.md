# Pair Study: Civilian Government Expenditure Per Capita (PPP) -> After-Tax Median Income (PPP)

- Pair ID: `predictor.derived.gov_non_military_expenditure_per_capita_ppp__outcome.derived.after_tax_median_income_ppp`
- Lag years: 3
- Duration years: 3
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.5881
- Included subjects: 148
- Skipped subjects: 0
- Total aligned pairs: 5001
- Signal grade: A (very strong)
- Data status: enough data
- Confidence score: 0.547 (lower confidence)
- Signal tag: early signal
- Direction: neutral
- Uncertainty score: 0.0998 (lower is better)

## Quick Meanings

- `Recommended level`: main value to try first.
- `Data-backed level`: level directly supported by seen data.
- `Backup level`: safer fallback from the middle of the data.
- `Math-only guess`: unconstrained model output for technical comparison.
- `Not enough data`: we cannot safely recommend a level yet.

## Key Numeric Takeaways

- Recommended Civilian Government Expenditure Per Capita (PPP) level for higher After-Tax Median Income (PPP): 14731.8 international $/person (data-backed level).
- Best level directly seen in the grouped data: 14731.8 international $/person.
- Math-only guess is inside seen data but outside the best-performing bucket, so we still use the data-backed level.
- Best observed bin anchor (median/mean) is 13773.2 international $/person; model-optimal minus observed-anchor difference is -8538.3 (-62.0%).
- Backup level check (middle 10-90% of data) suggests 8943.1 international $/person.
- The math-only guess and backup level differ by 70.8%, which means extreme values may matter a lot.
- Minimum effective level (first consistently positive zone): 246.50 international $/person.
- Could not find a clear point where gains start slowing down (drop_below_detection_threshold).
- Could not find a stable flat zone (no_plateau_zone_detected).
- Highest observed mean After-Tax Median Income (PPP) appears when Civilian Government Expenditure Per Capita (PPP) is in [10301.5, 47874.3] (mean outcome 50353.3).
- Direction signal is neutral; use caution and rely on the data-backed level.

## Decision Summary

- Interpretation: Stronger signal compared with most other predictors in this report.
- Pattern hint: no clear up/down pattern; use data-backed levels only.
- Signal strength: stronger in this report set.

## Plain-Language Summary

- No strong directional pattern is detected between Civilian Government Expenditure Per Capita (PPP) and After-Tax Median Income (PPP).
- The estimate uses 148 subjects and 5001 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [10301.5, 47874.3] (mean outcome 50353.3).
- A minimum effective predictor level appears near 246.50 international $/person in the binned response curve.
- Confidence score is 0.547 (lower confidence); data status is enough data.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Some country-level direction scores are unusually high; this can happen with this scoring method.
- Top temporal profiles are close (score delta 0.0031); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 70.8% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Forward correlation | 0.8438 |
| Reverse correlation | 0.8669 |
| Direction score (forward - reverse) | -0.0231 |
| Effect size (% change from baseline) | 108.7375 |
| Significance score | 0.9002 |
| Weighted PIS | 0.8000 |
| Value linked with higher outcome | 5234.8822 |
| Value linked with lower outcome | 2661.1524 |
| Math-only best daily value | 5234.8822 |
| Recommended level (reader-facing) | 14731.8 international $/person (data-backed level) |
| Math-only guess (technical) | 5234.9 international $/person |
| Data-backed level | 14731.8 international $/person |
| Data-backed range | [11134.6, 47874.3] |
| Backup level (middle-data check) | 9193.2 international $/person |
| Math-only guess inside seen data range? | yes |
| Math-only guess inside data-backed range? | no |
| Seen data range | [7.6041, 62399.1940] |
| Math-only guess outside seen data? | no (within observed range) |
| Math-only guess outside best observed bucket? | yes |
| Best observed range | [10301.5, 47874.3] |
| Best observed range (middle-data check) | [7245.7, 10301.5] |
| Best observed outcome average | 50353.3 |
| Best observed outcome average (middle-data check) | 35997.4 |
| Backup level (bucket median) | 8943.1 international $/person |
| Math-only vs backup difference | 3708.3 (+70.8%) |
| Middle-data share kept | 80.4% (4019/5001) |
| Data status | enough data |
| Data-status details | none |
| Confidence score | 0.5475 (lower confidence) |
| Reliability support component | 0.9101 |
| Reliability significance component | 0.9002 |
| Reliability directional component | 0.1537 |
| Reliability temporal-stability component | 0.1036 |
| Reliability robustness component | 0.3240 |
| Signal tag | early signal |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum useful level | 246.50 international $/person (z=11.39) |
| Point where gains start slowing | Not identified (drop_below_detection_threshold) |
| Flat zone range | Not identified (no_plateau_zone_detected) |
| Why this data-backed level was chosen | identified |
| Math-only guess minus data-backed level | -9496.9 (-64.5%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 3 | 3 | interpolation | 0.5881 | 0.0000 | 148 | 5001 |
| Runner-up | predictor_default | 3 | 2 | interpolation | 0.5850 | 0.0031 | 148 | 5001 |
| Runner-up | predictor_default | 3 | 1 | interpolation | 0.5817 | 0.0064 | 148 | 5001 |
| Runner-up | predictor_default | 2 | 3 | interpolation | 0.5767 | 0.0114 | 148 | 5001 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [7.604, 208.35) | 482 | 21 | 112.1199 | 104.8715 | 1291.0174 | 1160.0000 |
| 2 | [208.35, 435.58) | 518 | 38 | 291.2491 | 285.0898 | 2575.7031 | 2370.0000 |
| 3 | [435.58, 787.92) | 500 | 45 | 591.7877 | 581.5755 | 4338.7913 | 3860.0000 |
| 4 | [787.92, 1176.2) | 492 | 59 | 987.7493 | 968.5864 | 6162.1584 | 5919.3469 |
| 5 | [1176.2, 1913.4) | 508 | 58 | 1548.4946 | 1564.5766 | 8252.0221 | 7992.4517 |
| 6 | [1913.4, 3080.9) | 500 | 61 | 2514.7668 | 2438.6249 | 12143.2880 | 11685.0000 |
| 7 | [3080.9, 4301.1) | 500 | 69 | 3681.0203 | 3675.4137 | 15762.8427 | 14944.8718 |
| 8 | [4301.1, 6669.7) | 497 | 64 | 5311.9351 | 5166.3367 | 24423.5429 | 21555.8097 |
| 9 | [6669.7, 10301.5) | 503 | 54 | 8459.4235 | 8517.1898 | 34564.6716 | 30310.0000 |
| 10 | [10301.5, 47874.3] | 501 | 44 | 15598.1853 | 13773.1992 | 50353.3495 | 46678.1515 |

### Distribution Charts

```text
Predictor Distribution (Civilian Government Expenditure Per Capita (PPP))
[7.604, 3996.5) | ############################## 3410
[3996.5, 7985.4) | ####### 781
[7985.4, 11974.3) | #### 458
[11974.3, 15963.2) | ## 184
[15963.2, 19952.0) | # 84
[19952.0, 23940.9) | # 50
[23940.9, 27929.8) | # 21
[27929.8, 31918.7) | # 2
[31918.7, 35907.6) | # 3
[35907.6, 39896.5) | # 3
[39896.5, 43885.4) | # 3
[43885.4, 47874.3] | # 2
```

```text
Outcome Distribution (After-Tax Median Income (PPP), welfare-aligned)
[280.00, 10724.2) | ############################## 2684
[10724.2, 21168.3) | ########### 982
[21168.3, 31612.5) | ###### 545
[31612.5, 42056.7) | #### 321
[42056.7, 52500.8) | ### 232
[52500.8, 62945.0) | # 112
[62945.0, 73389.2) | # 70
[73389.2, 83833.3) | # 29
[83833.3, 94277.5) | # 13
[94277.5, 104722) | # 8
[104722, 115166) | # 3
[115166, 125610] | # 2
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| AFE | -0.7873 | -1.0862 | -42.026 | 34 |
| SAU | 0.4000 | 1.0676 | 14.645 | 34 |
| KWT | -0.1894 | -0.5957 | -8.506 | 34 |
| GAB | -0.7776 | -0.5902 | -28.121 | 34 |
| CAF | 0.2814 | 0.5544 | 35.769 | 34 |
| GNQ | 0.2586 | -0.5479 | 34.860 | 34 |
| TLS | 0.2947 | 0.5255 | 47.480 | 34 |
| MWI | -0.5415 | -0.5227 | -28.903 | 34 |
