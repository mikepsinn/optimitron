# Pair Study: Military Expenditure Per Capita (PPP) -> After-Tax Median Income Growth (YoY %)

- Pair ID: `predictor.derived.military_expenditure_per_capita_ppp__outcome.derived.after_tax_median_income_ppp_growth_yoy_pct`
- Lag years: 0
- Duration years: 2
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.5938
- Included subjects: 201
- Skipped subjects: 0
- Total aligned pairs: 6429
- Signal grade: C (moderate)
- Data status: enough data
- Confidence score: 0.674 (medium confidence)
- Signal tag: early signal
- Direction: positive
- Uncertainty score: 0.3121 (lower is better)

## Quick Meanings

- `Recommended level`: main value to try first.
- `Data-backed level`: level directly supported by seen data.
- `Backup level`: safer fallback from the middle of the data.
- `Math-only guess`: unconstrained model output for technical comparison.
- `Not enough data`: we cannot safely recommend a level yet.

## Key Numeric Takeaways

- Recommended Military Expenditure Per Capita (PPP) level for higher After-Tax Median Income Growth (YoY %): 176.22 international $/person (data-backed level).
- Best level directly seen in the grouped data: 176.22 international $/person.
- Math-only guess is inside seen data but outside the best-performing bucket, so we still use the data-backed level.
- Best observed bin anchor (median/mean) is 180.83 international $/person; model-optimal minus observed-anchor difference is 207.67 (+114.8%).
- Backup level check (middle 10-90% of data) suggests 175.06 international $/person.
- The math-only guess and backup level differ by 54.9%, which means extreme values may matter a lot.
- Minimum effective level (first consistently positive zone): 54.457 international $/person.
- Diminishing returns likely begin near 54.457 international $/person.
- Saturation/plateau zone starts around 605.09 international $/person and extends through 2012.4 international $/person.
- Highest observed mean After-Tax Median Income Growth (YoY %) appears when Military Expenditure Per Capita (PPP) is in [152.10, 214.02) (mean outcome 5.295).
- Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Early signal only; use this mainly to guide more testing.
- Pattern hint: higher Military Expenditure Per Capita (PPP) tends to go with better After-Tax Median Income Growth (YoY %).
- Signal strength: weak to moderate; avoid strong conclusions from this pair alone.

## Plain-Language Summary

- Higher Military Expenditure Per Capita (PPP) tends to align with better After-Tax Median Income Growth (YoY %).
- The estimate uses 201 subjects and 6429 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [152.10, 214.02) (mean outcome 5.295).
- A minimum effective predictor level appears near 54.457 international $/person in the binned response curve.
- Confidence score is 0.674 (medium confidence); data status is enough data.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Weak significance score (<0.70).
- Forward and direction signals disagree; direction may be unstable.
- Top temporal profiles are close (score delta 0.0078); temporal assumptions are not yet robust.
- Robustness check: trimmed-range optimal differs by 54.9% from raw optimal; tail observations materially influence target.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Forward correlation | 0.0711 |
| Reverse correlation | 0.1741 |
| Direction score (forward - reverse) | -0.1030 |
| Effect size (% change from baseline) | 8.0284 |
| Significance score | 0.6879 |
| Weighted PIS | 0.1841 |
| Value linked with higher outcome | 388.4957 |
| Value linked with lower outcome | 390.1050 |
| Math-only best daily value | 388.4957 |
| Recommended level (reader-facing) | 176.22 international $/person (data-backed level) |
| Math-only guess (technical) | 388.50 international $/person |
| Data-backed level | 176.22 international $/person |
| Data-backed range | [152.10, 202.03) |
| Backup level (middle-data check) | 171.10 international $/person |
| Math-only guess inside seen data range? | yes |
| Math-only guess inside data-backed range? | no |
| Seen data range | [0.0063, 27448.6207] |
| Math-only guess outside seen data? | no (within observed range) |
| Math-only guess outside best observed bucket? | yes |
| Best observed range | [152.10, 214.02) |
| Best observed range (middle-data check) | [152.10, 199.60) |
| Best observed outcome average | 5.295 |
| Best observed outcome average (middle-data check) | 5.413 |
| Backup level (bucket median) | 175.06 international $/person |
| Math-only vs backup difference | -213.44 (-54.9%) |
| Middle-data share kept | 80.0% (5143/6429) |
| Data status | enough data |
| Data-status details | none |
| Confidence score | 0.6737 (medium confidence) |
| Reliability support component | 1.0000 |
| Reliability significance component | 0.6879 |
| Reliability directional component | 0.6869 |
| Reliability temporal-stability component | 0.2616 |
| Reliability robustness component | 0.5007 |
| Signal tag | early signal |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum useful level | 54.457 international $/person (z=1.28) |
| Point where gains start slowing | 54.457 international $/person (ratio=-0.054) |
| Flat zone range | [490.37, 21187.0] |
| Why this data-backed level was chosen | identified |
| Math-only guess minus data-backed level | 212.27 (+120.5%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 0 | 2 | interpolation | 0.5938 | 0.0000 | 201 | 6429 |
| Runner-up | predictor_default | 0 | 1 | interpolation | 0.5859 | 0.0078 | 201 | 6429 |
| Runner-up | predictor_default | 0 | 3 | interpolation | 0.5814 | 0.0124 | 201 | 6429 |
| Runner-up | predictor_default | 1 | 1 | interpolation | 0.5760 | 0.0178 | 201 | 6429 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.00630, 18.983) | 643 | 40 | 10.6678 | 10.6485 | 4.3220 | 4.4643 |
| 2 | [18.983, 35.208) | 643 | 67 | 26.3738 | 25.5431 | 3.8760 | 4.2424 |
| 3 | [35.208, 56.795) | 643 | 75 | 45.0831 | 44.4584 | 4.9797 | 4.7771 |
| 4 | [56.795, 96.187) | 643 | 88 | 75.3586 | 75.4167 | 5.2409 | 5.2392 |
| 5 | [96.187, 152.10) | 642 | 84 | 123.5767 | 123.7332 | 4.9486 | 5.1578 |
| 6 | [152.10, 214.02) | 643 | 89 | 181.1140 | 180.8303 | 5.2952 | 4.9156 |
| 7 | [214.02, 298.25) | 643 | 80 | 249.7378 | 246.7535 | 5.1830 | 4.8182 |
| 8 | [298.25, 429.47) | 643 | 75 | 358.3144 | 356.6464 | 4.5752 | 4.6229 |
| 9 | [429.47, 718.12) | 643 | 70 | 543.5109 | 528.7344 | 4.5527 | 4.4546 |
| 10 | [718.12, 21187.0] | 643 | 53 | 2254.5483 | 1659.5121 | 3.4418 | 3.6045 |

### Distribution Charts

```text
Predictor Distribution (Military Expenditure Per Capita (PPP))
[0.00630, 1765.6) | ############################## 6124
[1765.6, 3531.2) | # 183
[3531.2, 5296.8) | # 82
[5296.8, 7062.3) | # 32
[7062.3, 8827.9) | # 6
[17655.8, 19421.4) | # 1
[19421.4, 21187.0] | # 1
```

```text
Outcome Distribution (After-Tax Median Income Growth (YoY %), welfare-aligned)
[-62.405, -43.867) | # 5
[-43.867, -25.329) | # 26
[-25.329, -6.791) | # 210
[-6.791, 11.747) | ############################## 5671
[11.747, 30.285) | ### 485
[30.285, 48.823) | # 17
[48.823, 67.360) | # 9
[67.360, 85.898) | # 4
[141.51, 160.05] | # 2
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| LBR | -0.0553 | 0.7563 | -67.211 | 33 |
| NGA | 0.2768 | 0.6908 | 91.037 | 15 |
| COD | -0.4694 | -0.5892 | -223.717 | 33 |
| GNQ | -0.2489 | -0.5149 | 12.570 | 33 |
| VEN | 0.1544 | -0.5120 | 82.447 | 21 |
| PRE | -0.2437 | -0.5081 | -44.671 | 15 |
| SOM | -0.0847 | 0.4919 | 58.804 | 32 |
| KWT | 0.1505 | 0.4694 | 2922.996 | 33 |
