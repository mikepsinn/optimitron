# Pair Study: Military Share of Government Spending -> Healthy Life Expectancy (HALE)

- Pair ID: `predictor.derived.military_share_of_gov_expenditure_pct__outcome.who.healthy_life_expectancy_years`
- Lag years: 3
- Duration years: 3
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.6039
- Included subjects: 126
- Skipped subjects: 0
- Total aligned pairs: 8316
- Evidence grade: A
- Data sufficiency: sufficient
- Reliability score: 0.642 (moderate)
- Quality tier: exploratory
- Direction: negative
- Derived uncertainty score: 0.0792 (1 - aggregate significance, not NHST p-value)

## Key Numeric Takeaways

- Estimated best Military Share of Government Spending level for higher Healthy Life Expectancy (HALE): 8.235 % of government expenditure.
- Observed-support target from binned response curve: 3.773 % of government expenditure.
- Model-derived optimum is within observed support but outside the highest-outcome bin; this reflects smooth objective optimization vs coarse bin averages.
- Best observed bin anchor (median/mean) is 3.317 % of government expenditure; model-optimal minus observed-anchor difference is 4.918 (+148.3%).
- Robust sensitivity (trimmed 10-90% predictor range) suggests 3.213 % of government expenditure.
- Raw vs robust optimal differs by 61.0%, indicating strong tail influence.
- Minimum effective level not reliably identified (no_consistent_effective_dose_detected).
- Diminishing returns likely begin near 3.773 % of government expenditure.
- No stable plateau zone detected (no_plateau_zone_detected).
- Highest observed mean Healthy Life Expectancy (HALE) appears when Military Share of Government Spending is in [2.653, 3.717) (mean outcome 65.359).
- Direction is negative in this analysis, so lowering this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Stronger evidence for directional signal relative to other predictors in this report.
- Directional hint: lower Military Share of Government Spending is associated with better Healthy Life Expectancy (HALE).
- Signal strength: relatively stronger within this report set.

## Plain-Language Summary

- Higher Military Share of Government Spending tends to align with worse Healthy Life Expectancy (HALE).
- The estimate uses 126 subjects and 8316 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [2.653, 3.717) (mean outcome 65.359).
- Reliability score is 0.642 (moderate); data sufficiency is sufficient.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Some subject-level directional scores exceed |1|; this is valid because the score is a difference of two correlations.
- Top temporal profiles are close (score delta 0.0149); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 61.0% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Aggregate forward Pearson | -0.3633 |
| Aggregate reverse Pearson | -0.3317 |
| Aggregate directional score (forward - reverse) | -0.0317 |
| Aggregate effect size (% baseline delta) | -2.4929 |
| Aggregate statistical significance | 0.9208 |
| Weighted average PIS | 0.4859 |
| Aggregate value predicting high outcome | 8.2351 |
| Aggregate value predicting low outcome | 10.0299 |
| Aggregate optimal daily value | 8.2351 |
| Support-constrained optimal value | 3.773 % of government expenditure |
| Support-constrained optimal range | [3.483, 4.135) |
| Response-curve robust optimal value | 3.717 % of government expenditure |
| Raw model optimal within observed range | yes |
| Raw model optimal within support-constrained range | no |
| Observed predictor range | [0.4821, 100.9768] |
| Model-derived optimal extrapolative? | no (within observed range) |
| Model-derived optimal outside best observed bin? | yes |
| Raw best observed range | [2.653, 3.717) |
| Robust best observed range (trimmed) | [2.653, 3.579) |
| Raw best observed outcome mean | 65.359 |
| Robust best observed outcome mean | 65.630 |
| Robust optimal value (bin median) | 3.213 % of government expenditure |
| Raw vs robust optimal delta | -5.022 (-61.0%) |
| Robustness retained fraction | 80.0% (6654/8316) |
| Data sufficiency status | sufficient |
| Data sufficiency reasons | none |
| Reliability score | 0.6420 (moderate) |
| Reliability support component | 0.9200 |
| Reliability significance component | 0.9208 |
| Reliability directional component | 0.2112 |
| Reliability temporal-stability component | 0.4972 |
| Reliability robustness component | 0.4335 |
| Quality tier | exploratory |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum effective level (MED) | Not identified (no_consistent_effective_dose_detected) |
| Diminishing-returns knee | 3.773 % of government expenditure (ratio=-1.493) |
| Saturation / plateau range | Not identified (no_plateau_zone_detected) |
| Support-constrained target reason | identified |
| Raw to support delta | 4.462 (+118.2%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 3 | 3 | interpolation | 0.6039 | 0.0000 | 126 | 8316 |
| Runner-up | predictor_default | 2 | 3 | interpolation | 0.5890 | 0.0149 | 126 | 8316 |
| Runner-up | predictor_default | 0 | 1 | interpolation | 0.5865 | 0.0174 | 126 | 8316 |
| Runner-up | predictor_default | 3 | 2 | interpolation | 0.5854 | 0.0186 | 126 | 8316 |

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
| BGD | -0.6777 | -1.1749 | -3.817 | 66 |
| GAB | -0.4487 | -1.0584 | -5.818 | 66 |
| USA | 0.5035 | 1.0131 | 1.242 | 66 |
| BFA | -0.7820 | -0.9604 | -9.561 | 66 |
| ECU | 0.0520 | 0.9178 | -1.103 | 66 |
| TGO | -0.5115 | -0.8765 | -6.065 | 66 |
| ZAF | -0.8651 | -0.8473 | -13.055 | 66 |
