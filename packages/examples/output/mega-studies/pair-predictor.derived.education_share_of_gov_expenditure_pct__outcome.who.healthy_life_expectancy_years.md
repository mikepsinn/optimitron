# Pair Study: Education Share of Government Spending -> Healthy Life Expectancy (HALE)

- Pair ID: `predictor.derived.education_share_of_gov_expenditure_pct__outcome.who.healthy_life_expectancy_years`
- Lag years: 5
- Duration years: 5
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 15
- Temporal candidates with valid results: 15
- Temporal profile score: 0.6767
- Included subjects: 134
- Skipped subjects: 0
- Total aligned pairs: 8844
- Evidence grade: A
- Data sufficiency: sufficient
- Reliability score: 0.813 (high)
- Quality tier: exploratory
- Direction: neutral
- Derived uncertainty score: 0.0893 (1 - aggregate significance, not NHST p-value)

## Key Numeric Takeaways

- Estimated best Education Share of Government Spending level for higher Healthy Life Expectancy (HALE): 19.742 % of government expenditure.
- Observed-support target from binned response curve: 14.666 % of government expenditure.
- Model-derived optimum is within observed support but outside the highest-outcome bin; this reflects smooth objective optimization vs coarse bin averages.
- Best observed bin anchor (median/mean) is 13.815 % of government expenditure; model-optimal minus observed-anchor difference is 5.928 (+42.9%).
- Robust sensitivity (trimmed 10-90% predictor range) suggests 14.703 % of government expenditure.
- Raw vs robust optimal differs by 25.5%, indicating strong tail influence.
- Minimum effective level (first consistently positive zone): 12.940 % of government expenditure.
- Diminishing returns likely begin near 12.940 % of government expenditure.
- No stable plateau zone detected (no_plateau_zone_detected).
- Highest observed mean Healthy Life Expectancy (HALE) appears when Education Share of Government Spending is in [12.846, 14.703) (mean outcome 65.740).
- Directional signal is neutral; use caution when treating the estimated optimal value as prescriptive.

## Decision Summary

- Interpretation: Stronger evidence for directional signal relative to other predictors in this report.
- Directional hint: no stable increase/decrease signal; prioritize observed-support targets.
- Signal strength: relatively stronger within this report set.

## Plain-Language Summary

- No strong directional pattern is detected between Education Share of Government Spending and Healthy Life Expectancy (HALE).
- The estimate uses 134 subjects and 8844 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [12.846, 14.703) (mean outcome 65.740).
- A minimum effective predictor level appears near 12.940 % of government expenditure in the binned response curve.
- Reliability score is 0.813 (high); data sufficiency is sufficient.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Some subject-level directional scores exceed |1|; this is valid because the score is a difference of two correlations.
- Top temporal profiles are close (score delta 0.0162); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 25.5% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Aggregate forward Pearson | -0.0031 |
| Aggregate reverse Pearson | -0.1110 |
| Aggregate directional score (forward - reverse) | 0.1079 |
| Aggregate effect size (% baseline delta) | 0.0990 |
| Aggregate statistical significance | 0.9107 |
| Weighted average PIS | 0.4100 |
| Aggregate value predicting high outcome | 19.7423 |
| Aggregate value predicting low outcome | 19.6611 |
| Aggregate optimal daily value | 19.7423 |
| Support-constrained optimal value | 14.666 % of government expenditure |
| Support-constrained optimal range | [13.860, 15.650) |
| Response-curve robust optimal value | 14.120 % of government expenditure |
| Raw model optimal within observed range | yes |
| Raw model optimal within support-constrained range | no |
| Observed predictor range | [0.0000, 70.8565] |
| Model-derived optimal extrapolative? | no (within observed range) |
| Model-derived optimal outside best observed bin? | yes |
| Raw best observed range | [12.846, 14.703) |
| Robust best observed range (trimmed) | [14.004, 15.850) |
| Raw best observed outcome mean | 65.740 |
| Robust best observed outcome mean | 65.991 |
| Robust optimal value (bin median) | 14.703 % of government expenditure |
| Raw vs robust optimal delta | -5.040 (-25.5%) |
| Robustness retained fraction | 80.0% (7074/8844) |
| Data sufficiency status | sufficient |
| Data sufficiency reasons | none |
| Reliability score | 0.8131 (high) |
| Reliability support component | 0.9467 |
| Reliability significance component | 0.9107 |
| Reliability directional component | 0.7195 |
| Reliability temporal-stability component | 0.5384 |
| Reliability robustness component | 0.8275 |
| Quality tier | exploratory |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum effective level (MED) | 12.940 % of government expenditure (z=5.98) |
| Diminishing-returns knee | 12.940 % of government expenditure (ratio=-0.826) |
| Saturation / plateau range | Not identified (no_plateau_zone_detected) |
| Support-constrained target reason | identified |
| Raw to support delta | 5.077 (+34.6%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 5 | 5 | interpolation | 0.6767 | 0.0000 | 134 | 8844 |
| Runner-up | predictor_default | 5 | 3 | interpolation | 0.6605 | 0.0162 | 134 | 8844 |
| Runner-up | predictor_default | 3 | 5 | interpolation | 0.6548 | 0.0219 | 134 | 8844 |
| Runner-up | predictor_default | 5 | 2 | interpolation | 0.6520 | 0.0246 | 134 | 8844 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.00000, 10.745) | 885 | 28 | 8.8035 | 9.1967 | 64.0996 | 66.1829 |
| 2 | [10.745, 12.846) | 873 | 33 | 11.8885 | 11.9716 | 64.2175 | 66.6242 |
| 3 | [12.846, 14.703) | 867 | 41 | 13.7910 | 13.8146 | 65.7405 | 66.9147 |
| 4 | [14.703, 17.067) | 912 | 50 | 15.9771 | 16.0829 | 63.9165 | 65.2615 |
| 5 | [17.067, 19.153) | 855 | 50 | 17.9991 | 17.8125 | 62.6116 | 63.7656 |
| 6 | [19.153, 20.782) | 912 | 51 | 19.9169 | 20.0108 | 60.8950 | 62.6056 |
| 7 | [20.782, 22.933) | 885 | 55 | 21.7604 | 21.7311 | 61.6902 | 62.5365 |
| 8 | [22.933, 24.770) | 885 | 52 | 23.7242 | 23.8524 | 60.2739 | 61.9396 |
| 9 | [24.770, 28.685) | 885 | 41 | 26.6691 | 26.7347 | 58.7692 | 60.7587 |
| 10 | [28.685, 66.586] | 885 | 26 | 36.0264 | 32.5660 | 57.1594 | 57.2389 |

### Distribution Charts

```text
Predictor Distribution (Education Share of Government Spending)
[0.00000, 5.549) | # 21
[5.549, 11.098) | ########### 1005
[11.098, 16.647) | ######################### 2262
[16.647, 22.195) | ############################## 2676
[22.195, 27.744) | ##################### 1839
[27.744, 33.293) | ####### 639
[33.293, 38.842) | ### 282
[38.842, 44.391) | # 21
[44.391, 49.940) | # 15
[49.940, 55.488) | # 12
[55.488, 61.037) | # 3
[61.037, 66.586] | # 69
```

```text
Outcome Distribution (Healthy Life Expectancy (HALE), welfare-aligned)
[36.729, 39.928) | # 71
[39.928, 43.126) | ## 121
[43.126, 46.325) | #### 230
[46.325, 49.524) | ##### 298
[49.524, 52.723) | ####### 451
[52.723, 55.921) | ########## 625
[55.921, 59.120) | ############ 766
[59.120, 62.319) | ################### 1156
[62.319, 65.517) | ############################ 1691
[65.517, 68.716) | ############################## 1840
[68.716, 71.915) | ######################## 1489
[71.915, 75.113] | ## 106
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| TZA | 0.6856 | 1.4316 | 12.683 | 66 |
| LUX | 0.6899 | 1.3743 | 3.388 | 66 |
| ZAF | -0.9072 | -1.3210 | -13.055 | 66 |
| COD | -0.6028 | -1.3012 | -8.719 | 66 |
| CYP | 0.6699 | 1.2069 | 1.668 | 66 |
| TTO | 0.4149 | 1.1916 | 2.011 | 66 |
| NZL | 0.4616 | 1.1869 | 1.915 | 66 |
| SGP | 0.5155 | 1.1630 | 2.183 | 66 |
