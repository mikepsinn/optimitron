# Pair Study: Military Expenditure Per Capita (PPP) -> Primary School Completion Rate

- Pair ID: `predictor.derived.military_expenditure_per_capita_ppp__outcome.wb.primary_completion_rate_pct`
- Lag years: 3
- Duration years: 3
- Temporal profile source: predictor_default
- Filling strategy: interpolation
- Temporal candidates evaluated: 12
- Temporal candidates with valid results: 12
- Temporal profile score: 0.6029
- Included subjects: 178
- Skipped subjects: 0
- Total aligned pairs: 4175
- Signal grade: C (moderate)
- Data status: enough data
- Confidence score: 0.757 (higher confidence)
- Signal tag: early signal
- Direction: positive
- Uncertainty score: 0.3396 (lower is better)

## Quick Meanings

- `Recommended level`: main value to try first.
- `Data-backed level`: level directly supported by seen data.
- `Backup level`: safer fallback from the middle of the data.
- `Math-only guess`: unconstrained model output for technical comparison.
- `Not enough data`: we cannot safely recommend a level yet.

## Key Numeric Takeaways

- Recommended Military Expenditure Per Capita (PPP) level for higher Primary School Completion Rate: 1567.0 international $/person (data-backed level).
- Best level directly seen in the grouped data: 1567.0 international $/person.
- Math-only guess is inside seen data but outside the best-performing bucket, so we still use the data-backed level.
- Best observed bin anchor (median/mean) is 1008.4 international $/person; model-optimal minus observed-anchor difference is -784.21 (-77.8%).
- Backup level check (middle 10-90% of data) suggests 249.44 international $/person.
- Minimum effective level (first consistently positive zone): 22.674 international $/person.
- Diminishing returns likely begin near 34.812 international $/person.
- Saturation/plateau zone starts around 138.44 international $/person and extends through 1567.0 international $/person.
- Highest observed mean Primary School Completion Rate appears when Military Expenditure Per Capita (PPP) is in [591.02, 21187.0] (mean outcome 96.224).
- Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Early signal only; use this mainly to guide more testing.
- Pattern hint: higher Military Expenditure Per Capita (PPP) tends to go with better Primary School Completion Rate.
- Signal strength: weak to moderate; avoid strong conclusions from this pair alone.

## Plain-Language Summary

- Higher Military Expenditure Per Capita (PPP) tends to align with better Primary School Completion Rate.
- The estimate uses 178 subjects and 4175 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [591.02, 21187.0] (mean outcome 96.224).
- A minimum effective predictor level appears near 22.674 international $/person in the binned response curve.
- Confidence score is 0.757 (higher confidence); data status is enough data.
- Outcome values in these summaries are welfare-aligned for cross-metric comparison (higher means better).

## Quality Warnings

- Weak significance score (<0.70).
- Forward and direction signals disagree; direction may be unstable.
- Some country-level direction scores are unusually high; this can happen with this scoring method.
- Top temporal profiles are close (score delta 0.0139); temporal assumptions are not yet robust.

## Appendix: Technical Diagnostics

### Core Metrics

| Metric | Value |
|--------|------:|
| Forward correlation | 0.2683 |
| Reverse correlation | 0.3901 |
| Direction score (forward - reverse) | -0.1218 |
| Effect size (% change from baseline) | 9.4719 |
| Significance score | 0.6604 |
| Weighted PIS | 0.4550 |
| Value linked with higher outcome | 224.1973 |
| Value linked with lower outcome | 224.7587 |
| Math-only best daily value | 224.1973 |
| Recommended level (reader-facing) | 1567.0 international $/person (data-backed level) |
| Math-only guess (technical) | 224.20 international $/person |
| Data-backed level | 1567.0 international $/person |
| Data-backed range | [659.76, 21187.0] |
| Backup level (middle-data check) | 284.37 international $/person |
| Math-only guess inside seen data range? | yes |
| Math-only guess inside data-backed range? | no |
| Seen data range | [0.0063, 27448.6207] |
| Math-only guess outside seen data? | no (within observed range) |
| Math-only guess outside best observed bucket? | yes |
| Best observed range | [591.02, 21187.0] |
| Best observed range (middle-data check) | [220.69, 294.45) |
| Best observed outcome average | 96.224 |
| Best observed outcome average (middle-data check) | 95.270 |
| Backup level (bucket median) | 249.44 international $/person |
| Math-only vs backup difference | 25.246 (+11.3%) |
| Middle-data share kept | 80.0% (3339/4175) |
| Data status | enough data |
| Data-status details | none |
| Confidence score | 0.7570 (higher confidence) |
| Reliability support component | 0.8479 |
| Reliability significance component | 0.6604 |
| Reliability directional component | 0.8120 |
| Reliability temporal-stability component | 0.4642 |
| Reliability robustness component | 0.9860 |
| Signal tag | early signal |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum useful level | 22.674 international $/person (z=6.89) |
| Point where gains start slowing | 34.812 international $/person (ratio=0.178) |
| Flat zone range | [116.40, 21187.0] |
| Why this data-backed level was chosen | identified |
| Math-only guess minus data-backed level | -1342.8 (-85.7%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 3 | 3 | interpolation | 0.6029 | 0.0000 | 178 | 4175 |
| Runner-up | predictor_default | 3 | 2 | interpolation | 0.5890 | 0.0139 | 178 | 4175 |
| Runner-up | predictor_default | 3 | 1 | interpolation | 0.5719 | 0.0311 | 178 | 4175 |
| Runner-up | predictor_default | 2 | 3 | interpolation | 0.5667 | 0.0362 | 178 | 4175 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.00630, 19.206) | 418 | 36 | 11.4168 | 11.4256 | 56.1288 | 58.4579 |
| 2 | [19.206, 33.538) | 417 | 55 | 25.9021 | 25.3301 | 66.2826 | 61.5202 |
| 3 | [33.538, 50.279) | 418 | 55 | 41.6812 | 42.0713 | 73.1678 | 69.0171 |
| 4 | [50.279, 76.111) | 416 | 60 | 63.3886 | 63.7422 | 81.0067 | 82.6651 |
| 5 | [76.111, 116.40) | 418 | 68 | 95.2152 | 94.9687 | 86.6546 | 92.5341 |
| 6 | [116.40, 178.18) | 418 | 66 | 145.8302 | 144.4156 | 90.5032 | 95.3217 |
| 7 | [178.18, 249.54) | 417 | 65 | 211.8069 | 212.4047 | 93.5795 | 96.4489 |
| 8 | [249.54, 377.41) | 418 | 57 | 311.4566 | 314.6364 | 94.8742 | 96.8370 |
| 9 | [377.41, 591.02) | 417 | 52 | 469.9680 | 465.7202 | 94.5776 | 97.8873 |
| 10 | [591.02, 21187.0] | 418 | 42 | 1948.8216 | 1008.4059 | 96.2244 | 98.5392 |

### Distribution Charts

```text
Predictor Distribution (Military Expenditure Per Capita (PPP))
[0.00630, 1765.6) | ############################## 4017
[1765.6, 3531.2) | # 97
[3531.2, 5296.8) | # 43
[5296.8, 7062.3) | # 11
[7062.3, 8827.9) | # 3
[14124.7, 15890.3) | # 2
[17655.8, 19421.4) | # 1
[19421.4, 21187.0] | # 1
```

```text
Outcome Distribution (Primary School Completion Rate, welfare-aligned)
[13.404, 25.301) | # 58
[25.301, 37.198) | ## 105
[37.198, 49.095) | ### 150
[49.095, 60.992) | ######## 380
[60.992, 72.889) | ########### 481
[72.889, 84.786) | ########## 458
[84.786, 96.682) | ######################## 1093
[96.682, 108.58) | ############################## 1361
[108.58, 120.48) | ## 74
[120.48, 132.37) | # 10
[132.37, 144.27) | # 3
[144.27, 156.17] | # 2
```

### Top Subjects

| Subject | Forward r | Directional Score | Effect % | Pairs |
|---------|----------:|------------------:|---------:|------:|
| UZB | 0.0930 | 1.0875 | 0.430 | 24 |
| COG | -0.5189 | -1.0357 | -16.156 | 20 |
| SLV | -0.5573 | -1.0279 | -12.335 | 28 |
| NGA | 0.3582 | 1.0064 | 11.170 | 8 |
| SDN | -0.9801 | -0.9995 | -6.810 | 9 |
| SAU | -0.5505 | -0.9340 | -10.220 | 12 |
| BRN | 0.3796 | 0.9099 | 4.546 | 32 |
| PST | -0.6111 | -0.9001 | -0.817 | 25 |
