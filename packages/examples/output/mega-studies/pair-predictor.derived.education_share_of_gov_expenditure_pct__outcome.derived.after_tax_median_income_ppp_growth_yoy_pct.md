# Pair Study: Education Share of Government Spending -> After-Tax Median Income Growth (YoY %)

- Pair ID: `predictor.derived.education_share_of_gov_expenditure_pct__outcome.derived.after_tax_median_income_ppp_growth_yoy_pct`
- Lag years: 2
- Duration years: 5
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.6219
- Included subjects: 159
- Skipped subjects: 0
- Total aligned pairs: 5212
- Evidence grade: C
- Data sufficiency: sufficient
- Reliability score: 0.730 (moderate)
- Quality tier: exploratory
- Direction: neutral
- Derived uncertainty score: 0.3192 (1 - aggregate significance, not NHST p-value)

## Key Numeric Takeaways

- Decision-target Education Share of Government Spending level for higher After-Tax Median Income Growth (YoY %): 13.129 % of government expenditure (support constrained).
- Observed-support target from binned response curve: 13.129 % of government expenditure.
- Model-derived optimum is within observed support but outside the highest-outcome bin; this reflects smooth objective optimization vs coarse bin averages.
- Best observed bin anchor (median/mean) is 13.796 % of government expenditure; model-optimal minus observed-anchor difference is 5.240 (+38.0%).
- Robust sensitivity (trimmed 10-90% predictor range) suggests 13.288 % of government expenditure.
- Raw vs robust optimal differs by 30.2%, indicating strong tail influence.
- Minimum effective level not reliably identified (no_consistent_effective_dose_detected).
- Diminishing returns likely begin near 13.129 % of government expenditure.
- Saturation/plateau zone starts around 16.371 % of government expenditure and extends through 17.804 % of government expenditure.
- Highest observed mean After-Tax Median Income Growth (YoY %) appears when Education Share of Government Spending is in [12.937, 14.674) (mean outcome 5.598).
- Directional signal is neutral; use caution when treating the estimated optimal value as prescriptive.

## Decision Summary

- Interpretation: Exploratory evidence only; use primarily for hypothesis generation.
- Directional hint: no stable increase/decrease signal; prioritize observed-support targets.
- Signal strength: moderate-to-weak; avoid hard policy conclusions from this pair alone.

## Plain-Language Summary

- No strong directional pattern is detected between Education Share of Government Spending and After-Tax Median Income Growth (YoY %).
- The estimate uses 159 subjects and 5212 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [12.937, 14.674) (mean outcome 5.598).
- Reliability score is 0.730 (moderate); data sufficiency is sufficient.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Weak aggregate significance (<0.70).
- Some subject-level directional scores exceed |1|; this is valid because the score is a difference of two correlations.
- Top temporal profiles are close (score delta 0.0064); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 30.2% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Aggregate forward Pearson | -0.0412 |
| Aggregate reverse Pearson | 0.0924 |
| Aggregate directional score (forward - reverse) | -0.1336 |
| Aggregate effect size (% baseline delta) | 7.9630 |
| Aggregate statistical significance | 0.6808 |
| Weighted average PIS | 0.1767 |
| Aggregate value predicting high outcome | 19.0358 |
| Aggregate value predicting low outcome | 18.8879 |
| Aggregate optimal daily value | 19.0358 |
| Decision target value (reader-facing) | 13.129 % of government expenditure (support constrained) |
| Model-derived optimum (diagnostics) | 19.036 % of government expenditure |
| Support-constrained optimal value | 13.129 % of government expenditure |
| Support-constrained optimal range | [12.370, 13.797) |
| Response-curve robust optimal value | 12.935 % of government expenditure |
| Raw model optimal within observed range | yes |
| Raw model optimal within support-constrained range | no |
| Observed predictor range | [0.0000, 70.8565] |
| Model-derived optimal extrapolative? | no (within observed range) |
| Model-derived optimal outside best observed bin? | yes |
| Raw best observed range | [12.937, 14.674) |
| Robust best observed range (trimmed) | [12.548, 13.910) |
| Raw best observed outcome mean | 5.598 |
| Robust best observed outcome mean | 5.767 |
| Robust optimal value (bin median) | 13.288 % of government expenditure |
| Raw vs robust optimal delta | -5.748 (-30.2%) |
| Robustness retained fraction | 80.1% (4174/5212) |
| Data sufficiency status | sufficient |
| Data sufficiency reasons | none |
| Reliability score | 0.7304 (moderate) |
| Reliability support component | 0.9343 |
| Reliability significance component | 0.6808 |
| Reliability directional component | 0.8907 |
| Reliability temporal-stability component | 0.2143 |
| Reliability robustness component | 0.7756 |
| Quality tier | exploratory |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum effective level (MED) | Not identified (no_consistent_effective_dose_detected) |
| Diminishing-returns knee | 13.129 % of government expenditure (ratio=-0.258) |
| Saturation / plateau range | [15.392, 18.510) |
| Support-constrained target reason | identified |
| Raw to support delta | 5.907 (+45.0%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 2 | 5 | interpolation | 0.6219 | 0.0000 | 159 | 5212 |
| Runner-up | predictor_default | 1 | 5 | interpolation | 0.6154 | 0.0064 | 159 | 5212 |
| Runner-up | predictor_default | 1 | 2 | interpolation | 0.6136 | 0.0083 | 159 | 5212 |
| Runner-up | predictor_default | 3 | 5 | interpolation | 0.6123 | 0.0096 | 159 | 5212 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.00000, 11.068) | 522 | 38 | 9.1273 | 9.6442 | 5.2982 | 5.3833 |
| 2 | [11.068, 12.937) | 521 | 47 | 12.1173 | 12.0995 | 4.2644 | 4.6958 |
| 3 | [12.937, 14.674) | 519 | 58 | 13.8039 | 13.7962 | 5.5984 | 5.4354 |
| 4 | [14.674, 16.814) | 506 | 69 | 15.7132 | 15.6877 | 4.6192 | 4.8955 |
| 5 | [16.814, 18.510) | 535 | 73 | 17.6632 | 17.7196 | 4.2931 | 4.2966 |
| 6 | [18.510, 19.964) | 524 | 73 | 19.1804 | 19.1920 | 4.3778 | 4.2261 |
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
[0.91158, 10.972) | ############################## 3724
[10.972, 21.033) | #### 463
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
| SRB | -0.5223 | -1.0357 | -56.721 | 26 |
| IDX | 0.2060 | 1.0032 | 14.529 | 33 |
| CSS | -0.3627 | -0.9924 | -5.654 | 33 |
| LDC | 0.2016 | 0.9855 | 24.611 | 33 |
| ECU | -0.2795 | -0.9782 | -29.549 | 33 |
| LAC | -0.2803 | -0.9773 | -30.201 | 33 |
| ARM | -0.1009 | -0.9579 | -18.589 | 33 |
