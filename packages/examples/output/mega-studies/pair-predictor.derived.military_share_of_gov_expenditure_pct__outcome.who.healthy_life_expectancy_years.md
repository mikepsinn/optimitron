# Pair Study: Military Share of Government Spending -> Healthy Life Expectancy (HALE)

- Pair ID: `predictor.derived.military_share_of_gov_expenditure_pct__outcome.who.healthy_life_expectancy_years`
- Lag years: 3
- Duration years: 3
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.6060
- Included subjects: 126
- Skipped subjects: 0
- Total aligned pairs: 8316
- Signal grade: A (very strong)
- Data status: enough data
- Confidence score: 0.648 (medium confidence)
- Signal tag: early signal
- Direction: negative
- Uncertainty score: 0.0792 (lower is better)

## Quick Meanings

- `Recommended level`: main value to try first.
- `Data-backed level`: level directly supported by seen data.
- `Backup level`: safer fallback from the middle of the data.
- `Math-only guess`: unconstrained model output for technical comparison.
- `Not enough data`: we cannot safely recommend a level yet.

## Key Numeric Takeaways

- Recommended Military Share of Government Spending level for higher Healthy Life Expectancy (HALE): 3.773 % of government expenditure (data-backed level).
- Best level directly seen in the grouped data: 3.773 % of government expenditure.
- Math-only guess is inside seen data but outside the best-performing bucket, so we still use the data-backed level.
- Best observed bin anchor (median/mean) is 3.317 % of government expenditure; model-optimal minus observed-anchor difference is 4.918 (+148.3%).
- Backup level check (middle 10-90% of data) suggests 3.213 % of government expenditure.
- The math-only guess and backup level differ by 61.0%, which means extreme values may matter a lot.
- Could not find a clear minimum useful level (no_consistent_effective_dose_detected).
- Diminishing returns likely begin near 3.773 % of government expenditure.
- Could not find a stable flat zone (no_plateau_zone_detected).
- Highest observed mean Healthy Life Expectancy (HALE) appears when Military Share of Government Spending is in [2.653, 3.717) (mean outcome 65.359).
- Direction is negative in this analysis, so lowering this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Stronger signal compared with most other predictors in this report.
- Pattern hint: lower Military Share of Government Spending tends to go with better Healthy Life Expectancy (HALE).
- Signal strength: stronger in this report set.

## Plain-Language Summary

- Higher Military Share of Government Spending tends to align with worse Healthy Life Expectancy (HALE).
- The estimate uses 126 subjects and 8316 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [2.653, 3.717) (mean outcome 65.359).
- Confidence score is 0.648 (medium confidence); data status is enough data.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Some country-level direction scores are unusually high; this can happen with this scoring method.
- Top temporal profiles are close (score delta 0.0155); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 61.0% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Forward correlation | -0.3633 |
| Reverse correlation | -0.3296 |
| Direction score (forward - reverse) | -0.0338 |
| Effect size (% change from baseline) | -2.4929 |
| Significance score | 0.9208 |
| Weighted PIS | 0.4859 |
| Value linked with higher outcome | 8.2351 |
| Value linked with lower outcome | 10.0299 |
| Math-only best daily value | 8.2351 |
| Recommended level (reader-facing) | 3.773 % of government expenditure (data-backed level) |
| Math-only guess (technical) | 8.235 % of government expenditure |
| Data-backed level | 3.773 % of government expenditure |
| Data-backed range | [3.483, 4.135) |
| Backup level (middle-data check) | 3.717 % of government expenditure |
| Math-only guess inside seen data range? | yes |
| Math-only guess inside data-backed range? | no |
| Seen data range | [0.4821, 100.9768] |
| Math-only guess outside seen data? | no (within observed range) |
| Math-only guess outside best observed bucket? | yes |
| Best observed range | [2.653, 3.717) |
| Best observed range (middle-data check) | [2.653, 3.579) |
| Best observed outcome average | 65.359 |
| Best observed outcome average (middle-data check) | 65.630 |
| Backup level (bucket median) | 3.213 % of government expenditure |
| Math-only vs backup difference | -5.022 (-61.0%) |
| Middle-data share kept | 80.0% (6654/8316) |
| Data status | enough data |
| Data-status details | none |
| Confidence score | 0.6476 (medium confidence) |
| Reliability support component | 0.9200 |
| Reliability significance component | 0.9208 |
| Reliability directional component | 0.2252 |
| Reliability temporal-stability component | 0.5159 |
| Reliability robustness component | 0.4335 |
| Signal tag | early signal |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum useful level | Not identified (no_consistent_effective_dose_detected) |
| Point where gains start slowing | 3.773 % of government expenditure (ratio=-1.493) |
| Flat zone range | Not identified (no_plateau_zone_detected) |
| Why this data-backed level was chosen | identified |
| Math-only guess minus data-backed level | 4.462 (+118.2%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 3 | 3 | interpolation | 0.6060 | 0.0000 | 126 | 8316 |
| Runner-up | predictor_default | 2 | 3 | interpolation | 0.5906 | 0.0155 | 126 | 8316 |
| Runner-up | predictor_default | 3 | 2 | interpolation | 0.5874 | 0.0186 | 126 | 8316 |
| Runner-up | predictor_default | 0 | 1 | interpolation | 0.5862 | 0.0198 | 126 | 8316 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.65224, 2.653) | 831 | 21 | 1.7973 | 1.8857 | 64.4539 | 65.1313 |
| 2 | [2.653, 3.717) | 816 | 35 | 3.2687 | 3.3172 | 65.3593 | 66.4338 |
| 3 | [3.717, 4.430) | 810 | 47 | 4.0880 | 4.1237 | 65.1059 | 67.1049 |
| 4 | [4.430, 5.339) | 867 | 48 | 4.8306 | 4.7786 | 62.9665 | 65.0165 |
| 5 | [5.339, 6.528) | 834 | 52 | 5.9169 | 5.8759 | 63.4946 | 64.8669 |
| 6 | [6.528, 8.107) | 831 | 50 | 7.1700 | 7.1160 | 61.6490 | 63.4164 |
| 7 | [8.107, 10.202) | 831 | 42 | 9.0598 | 9.1234 | 56.5580 | 56.4494 |
| 8 | [10.202, 13.314) | 831 | 43 | 11.6738 | 11.7219 | 57.7433 | 58.7161 |
| 9 | [13.314, 17.117) | 831 | 36 | 15.1964 | 15.2839 | 61.4000 | 63.1418 |
| 10 | [17.117, 88.206] | 834 | 30 | 27.3261 | 21.3173 | 59.3291 | 61.6618 |

### Distribution Charts

```text
Predictor Distribution (Military Share of Government Spending)
[0.65224, 7.948) | ############################## 4932
[7.948, 15.245) | ############# 2115
[15.245, 22.541) | ##### 888
[22.541, 29.837) | # 132
[29.837, 37.133) | # 120
[37.133, 44.429) | # 66
[44.429, 51.725) | # 12
[51.725, 59.022) | # 12
[59.022, 66.318) | # 9
[66.318, 73.614) | # 21
[80.910, 88.206] | # 9
```

```text
Outcome Distribution (Healthy Life Expectancy (HALE), welfare-aligned)
[36.729, 39.928) | # 71
[39.928, 43.126) | ## 121
[43.126, 46.325) | #### 231
[46.325, 49.524) | ##### 316
[49.524, 52.723) | ######## 456
[52.723, 55.921) | ########## 591
[55.921, 59.120) | ########### 651
[59.120, 62.319) | ################## 1064
[62.319, 65.517) | ########################### 1576
[65.517, 68.716) | ############################## 1760
[68.716, 71.915) | ####################### 1373
[71.915, 75.113] | ## 106
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| TJK | -0.6734 | -1.1974 | -6.019 | 66 |
| BGD | -0.6777 | -1.1140 | -3.817 | 66 |
| GAB | -0.4487 | -1.0584 | -5.818 | 66 |
| USA | 0.5035 | 1.0131 | 1.242 | 66 |
| BFA | -0.7820 | -0.9560 | -9.561 | 66 |
| ECU | 0.0520 | 0.9178 | -1.103 | 66 |
| TGO | -0.5115 | -0.8765 | -6.065 | 66 |
| UKR | -0.3754 | -0.8575 | -2.691 | 66 |
