# Pair Study: R&D Share of Government Spending -> After-Tax Median Income Growth (YoY %)

- Pair ID: `predictor.derived.rd_share_of_gov_expenditure_pct__outcome.derived.after_tax_median_income_ppp_growth_yoy_pct`
- Lag years: 3
- Duration years: 8
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.5547
- Included subjects: 100
- Skipped subjects: 0
- Total aligned pairs: 3280
- Evidence grade: B
- Data sufficiency: sufficient
- Reliability score: 0.578 (moderate)
- Quality tier: exploratory
- Direction: positive
- Derived uncertainty score: 0.2977 (1 - aggregate significance, not NHST p-value)

## Key Numeric Takeaways

- Decision-target R&D Share of Government Spending level for higher After-Tax Median Income Growth (YoY %): 1.498 % of government expenditure (support constrained).
- Observed-support target from binned response curve: 1.498 % of government expenditure.
- Model-derived optimum is within observed support but outside the highest-outcome bin; this reflects smooth objective optimization vs coarse bin averages.
- Best observed bin anchor (median/mean) is 1.786 % of government expenditure; model-optimal minus observed-anchor difference is 1.924 (+107.7%).
- Robust sensitivity (trimmed 10-90% predictor range) suggests 1.513 % of government expenditure.
- Raw vs robust optimal differs by 59.2%, indicating strong tail influence.
- Minimum effective level not reliably identified (no_consistent_effective_dose_detected).
- Diminishing returns likely begin near 1.498 % of government expenditure.
- No stable plateau zone detected (no_plateau_zone_detected).
- Highest observed mean After-Tax Median Income Growth (YoY %) appears when R&D Share of Government Spending is in [1.523, 2.042) (mean outcome 5.853).
- Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Exploratory evidence only; use primarily for hypothesis generation.
- Directional hint: higher R&D Share of Government Spending is associated with better After-Tax Median Income Growth (YoY %).
- Signal strength: moderate-to-weak; avoid hard policy conclusions from this pair alone.

## Plain-Language Summary

- Higher R&D Share of Government Spending tends to align with better After-Tax Median Income Growth (YoY %).
- The estimate uses 100 subjects and 3280 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [1.523, 2.042) (mean outcome 5.853).
- Reliability score is 0.578 (moderate); data sufficiency is sufficient.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Some subject-level directional scores exceed |1|; this is valid because the score is a difference of two correlations.
- Top temporal profiles are close (score delta 0.0094); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 59.2% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Aggregate forward Pearson | 0.0860 |
| Aggregate reverse Pearson | -0.0159 |
| Aggregate directional score (forward - reverse) | 0.1019 |
| Aggregate effect size (% baseline delta) | 9.1553 |
| Aggregate statistical significance | 0.7023 |
| Weighted average PIS | 0.1816 |
| Aggregate value predicting high outcome | 3.7105 |
| Aggregate value predicting low outcome | 3.6662 |
| Aggregate optimal daily value | 3.7105 |
| Decision target value (reader-facing) | 1.498 % of government expenditure (support constrained) |
| Model-derived optimum (diagnostics) | 3.711 % of government expenditure |
| Support-constrained optimal value | 1.498 % of government expenditure |
| Support-constrained optimal range | [1.349, 1.724) |
| Response-curve robust optimal value | 2.042 % of government expenditure |
| Raw model optimal within observed range | yes |
| Raw model optimal within support-constrained range | no |
| Observed predictor range | [0.0487, 35.0684] |
| Model-derived optimal extrapolative? | no (within observed range) |
| Model-derived optimal outside best observed bin? | yes |
| Raw best observed range | [1.523, 2.042) |
| Robust best observed range (trimmed) | [1.388, 1.750) |
| Raw best observed outcome mean | 5.853 |
| Robust best observed outcome mean | 5.577 |
| Robust optimal value (bin median) | 1.513 % of government expenditure |
| Raw vs robust optimal delta | -2.197 (-59.2%) |
| Robustness retained fraction | 80.0% (2624/3280) |
| Data sufficiency status | sufficient |
| Data sufficiency reasons | none |
| Reliability score | 0.5781 (moderate) |
| Reliability support component | 0.6067 |
| Reliability significance component | 0.7023 |
| Reliability directional component | 0.6791 |
| Reliability temporal-stability component | 0.3139 |
| Reliability robustness component | 0.4531 |
| Quality tier | exploratory |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum effective level (MED) | Not identified (no_consistent_effective_dose_detected) |
| Diminishing-returns knee | 1.498 % of government expenditure (ratio=-0.371) |
| Saturation / plateau range | Not identified (no_plateau_zone_detected) |
| Support-constrained target reason | identified |
| Raw to support delta | 2.213 (+147.7%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 3 | 8 | interpolation | 0.5547 | 0.0000 | 100 | 3280 |
| Runner-up | predictor_default | 3 | 5 | interpolation | 0.5452 | 0.0094 | 100 | 3280 |
| Runner-up | predictor_default | 2 | 8 | interpolation | 0.5353 | 0.0194 | 100 | 3280 |
| Runner-up | predictor_default | 3 | 2 | interpolation | 0.5251 | 0.0296 | 100 | 3280 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.06241, 0.70236) | 328 | 17 | 0.4435 | 0.4822 | 5.0801 | 4.8690 |
| 2 | [0.70236, 1.054) | 328 | 24 | 0.8850 | 0.9030 | 4.7584 | 4.9005 |
| 3 | [1.054, 1.523) | 328 | 31 | 1.3352 | 1.3489 | 5.5292 | 6.1530 |
| 4 | [1.523, 2.042) | 316 | 33 | 1.7912 | 1.7861 | 5.8527 | 6.4088 |
| 5 | [2.042, 2.753) | 332 | 36 | 2.3348 | 2.3203 | 4.5628 | 4.7835 |
| 6 | [2.753, 3.356) | 330 | 29 | 3.0243 | 3.0247 | 4.3902 | 4.1428 |
| 7 | [3.356, 4.307) | 334 | 24 | 3.8088 | 3.7943 | 3.7258 | 4.2963 |
| 8 | [4.307, 5.062) | 328 | 21 | 4.6220 | 4.6157 | 5.2525 | 4.9995 |
| 9 | [5.062, 8.680) | 328 | 26 | 7.0372 | 7.1909 | 4.7538 | 4.3753 |
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
[-5.047, 3.822) | ################### 1151
[3.822, 12.691) | ############################## 1795
[12.691, 21.560) | ### 161
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
| WLD | 0.3409 | 1.0044 | 51.587 | 33 |
| OED | 0.2854 | 1.0011 | 11.238 | 33 |
