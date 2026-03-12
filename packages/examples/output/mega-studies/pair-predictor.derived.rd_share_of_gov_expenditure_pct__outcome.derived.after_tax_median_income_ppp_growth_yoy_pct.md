# Pair Study: R&D Share of Government Spending -> After-Tax Median Income Growth (YoY %)

- Pair ID: `predictor.derived.rd_share_of_gov_expenditure_pct__outcome.derived.after_tax_median_income_ppp_growth_yoy_pct`
- Lag years: 3
- Duration years: 8
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.5476
- Included subjects: 100
- Skipped subjects: 0
- Total aligned pairs: 3280
- Signal grade: C (moderate)
- Data status: enough data
- Confidence score: 0.559 (medium confidence)
- Signal tag: early signal
- Direction: positive
- Uncertainty score: 0.3034 (lower is better)

## Quick Meanings

- `Recommended level`: main value to try first.
- `Data-backed level`: level directly supported by seen data.
- `Backup level`: safer fallback from the middle of the data.
- `Math-only guess`: unconstrained model output for technical comparison.
- `Not enough data`: we cannot safely recommend a level yet.

## Key Numeric Takeaways

- Recommended R&D Share of Government Spending level for higher After-Tax Median Income Growth (YoY %): 1.498 % of government expenditure (data-backed level).
- Best level directly seen in the grouped data: 1.498 % of government expenditure.
- Math-only guess is inside seen data but outside the best-performing bucket, so we still use the data-backed level.
- Best observed bin anchor (median/mean) is 1.786 % of government expenditure; model-optimal minus observed-anchor difference is 1.940 (+108.6%).
- Backup level check (middle 10-90% of data) suggests 1.513 % of government expenditure.
- The math-only guess and backup level differ by 59.4%, which means extreme values may matter a lot.
- Could not find a clear minimum useful level (no_consistent_effective_dose_detected).
- Diminishing returns likely begin near 1.498 % of government expenditure.
- Could not find a stable flat zone (no_plateau_zone_detected).
- Highest observed mean After-Tax Median Income Growth (YoY %) appears when R&D Share of Government Spending is in [1.523, 2.042) (mean outcome 5.894).
- Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Early signal only; use this mainly to guide more testing.
- Pattern hint: higher R&D Share of Government Spending tends to go with better After-Tax Median Income Growth (YoY %).
- Signal strength: weak to moderate; avoid strong conclusions from this pair alone.

## Plain-Language Summary

- Higher R&D Share of Government Spending tends to align with better After-Tax Median Income Growth (YoY %).
- The estimate uses 100 subjects and 3280 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [1.523, 2.042) (mean outcome 5.894).
- Confidence score is 0.559 (medium confidence); data status is enough data.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Weak significance score (<0.70).
- Some country-level direction scores are unusually high; this can happen with this scoring method.
- Top temporal profiles are close (score delta 0.0074); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 59.4% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Forward correlation | 0.0783 |
| Reverse correlation | -0.0185 |
| Direction score (forward - reverse) | 0.0968 |
| Effect size (% change from baseline) | 7.2361 |
| Significance score | 0.6966 |
| Weighted PIS | 0.1759 |
| Value linked with higher outcome | 3.7257 |
| Value linked with lower outcome | 3.6860 |
| Math-only best daily value | 3.7257 |
| Recommended level (reader-facing) | 1.498 % of government expenditure (data-backed level) |
| Math-only guess (technical) | 3.726 % of government expenditure |
| Data-backed level | 1.498 % of government expenditure |
| Data-backed range | [1.349, 1.724) |
| Backup level (middle-data check) | 5.046 % of government expenditure |
| Math-only guess inside seen data range? | yes |
| Math-only guess inside data-backed range? | no |
| Seen data range | [0.0487, 35.0684] |
| Math-only guess outside seen data? | no (within observed range) |
| Math-only guess outside best observed bucket? | yes |
| Best observed range | [1.523, 2.042) |
| Best observed range (middle-data check) | [1.388, 1.750) |
| Best observed outcome average | 5.894 |
| Best observed outcome average (middle-data check) | 5.571 |
| Backup level (bucket median) | 1.513 % of government expenditure |
| Math-only vs backup difference | -2.212 (-59.4%) |
| Middle-data share kept | 80.0% (2624/3280) |
| Data status | enough data |
| Data-status details | none |
| Confidence score | 0.5594 (medium confidence) |
| Reliability support component | 0.6067 |
| Reliability significance component | 0.6966 |
| Reliability directional component | 0.6453 |
| Reliability temporal-stability component | 0.2459 |
| Reliability robustness component | 0.4513 |
| Signal tag | early signal |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum useful level | Not identified (no_consistent_effective_dose_detected) |
| Point where gains start slowing | 1.498 % of government expenditure (ratio=-0.395) |
| Flat zone range | Not identified (no_plateau_zone_detected) |
| Why this data-backed level was chosen | identified |
| Math-only guess minus data-backed level | 2.228 (+148.7%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 3 | 8 | interpolation | 0.5476 | 0.0000 | 100 | 3280 |
| Runner-up | predictor_default | 3 | 5 | interpolation | 0.5402 | 0.0074 | 100 | 3280 |
| Runner-up | predictor_default | 2 | 8 | interpolation | 0.5293 | 0.0183 | 100 | 3280 |
| Runner-up | predictor_default | 3 | 2 | interpolation | 0.5228 | 0.0248 | 100 | 3280 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.06241, 0.70236) | 328 | 17 | 0.4435 | 0.4822 | 5.1163 | 5.0656 |
| 2 | [0.70236, 1.054) | 328 | 24 | 0.8850 | 0.9030 | 4.7924 | 4.9049 |
| 3 | [1.054, 1.523) | 328 | 31 | 1.3352 | 1.3489 | 5.4785 | 6.1410 |
| 4 | [1.523, 2.042) | 316 | 33 | 1.7912 | 1.7861 | 5.8940 | 6.3447 |
| 5 | [2.042, 2.753) | 332 | 36 | 2.3348 | 2.3203 | 4.5193 | 4.8808 |
| 6 | [2.753, 3.356) | 330 | 29 | 3.0243 | 3.0247 | 4.3851 | 4.1998 |
| 7 | [3.356, 4.307) | 334 | 24 | 3.8088 | 3.7943 | 3.7225 | 4.2963 |
| 8 | [4.307, 5.062) | 328 | 21 | 4.6220 | 4.6157 | 5.2542 | 5.0085 |
| 9 | [5.062, 8.680) | 328 | 26 | 7.0372 | 7.1909 | 4.7518 | 4.3756 |
| 10 | [8.680, 26.042] | 328 | 16 | 13.0136 | 12.0875 | 3.6467 | 3.6745 |

### Distribution Charts

```text
Predictor Distribution (R&D Share of Government Spending)
[0.06241, 2.227) | ############################## 1426
[2.227, 4.392) | ################### 909
[4.392, 6.557) | ######## 393
[6.557, 8.722) | ##### 227
[8.722, 10.887) | ## 97
[10.887, 13.052) | ## 114
[13.052, 15.217) | # 28
[15.217, 17.382) | # 38
[17.382, 19.547) | # 39
[19.547, 21.712) | # 7
[23.877, 26.042] | # 2
```

```text
Outcome Distribution (After-Tax Median Income Growth (YoY %), welfare-aligned)
[-49.393, -40.524) | # 2
[-40.524, -31.654) | # 2
[-31.654, -22.785) | # 5
[-22.785, -13.916) | # 22
[-13.916, -5.047) | ## 117
[-5.047, 3.822) | ################### 1143
[3.822, 12.691) | ############################## 1804
[12.691, 21.560) | ### 160
[21.560, 30.430) | # 16
[30.430, 39.299) | # 5
[39.299, 48.168) | # 2
[48.168, 57.037] | # 2
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| NLD | 0.3213 | 1.1323 | 32.466 | 33 |
| UZB | -0.2016 | -1.0416 | 8.245 | 33 |
| TLA | -0.2297 | -1.0360 | -4.321 | 33 |
| AZE | 0.3230 | 1.0310 | 41.569 | 33 |
| LCN | -0.2234 | -1.0181 | 2.417 | 33 |
| GRC | 0.2383 | 1.0058 | -39.221 | 33 |
| WLD | 0.3414 | 1.0054 | 51.563 | 33 |
| OED | 0.2854 | 1.0011 | 11.238 | 33 |
