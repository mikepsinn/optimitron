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
- Uncertainty score: 0.3399 (lower is better)

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
- Best observed bin anchor (median/mean) is 1008.2 international $/person; model-optimal minus observed-anchor difference is -784.48 (-77.8%).
- Backup level check (middle 10-90% of data) suggests 248.67 international $/person.
- Minimum effective level (first consistently positive zone): 22.674 international $/person.
- Diminishing returns likely begin near 34.812 international $/person.
- Saturation/plateau zone starts around 138.23 international $/person and extends through 1567.0 international $/person.
- Highest observed mean Primary School Completion Rate appears when Military Expenditure Per Capita (PPP) is in [587.74, 21187.0] (mean outcome 96.174).
- Direction is positive in this analysis, so increasing this predictor is associated with better outcomes.

## Decision Summary

- Interpretation: Early signal only; use this mainly to guide more testing.
- Pattern hint: higher Military Expenditure Per Capita (PPP) tends to go with better Primary School Completion Rate.
- Signal strength: weak to moderate; avoid strong conclusions from this pair alone.

## Plain-Language Summary

- Higher Military Expenditure Per Capita (PPP) tends to align with better Primary School Completion Rate.
- The estimate uses 178 subjects and 4175 aligned predictor-outcome observations.
- Best observed mean outcome appears in predictor bin [587.74, 21187.0] (mean outcome 96.174).
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
| Forward correlation | 0.2692 |
| Reverse correlation | 0.3910 |
| Direction score (forward - reverse) | -0.1219 |
| Effect size (% change from baseline) | 9.4756 |
| Significance score | 0.6601 |
| Weighted PIS | 0.4550 |
| Value linked with higher outcome | 223.7289 |
| Value linked with lower outcome | 223.7932 |
| Math-only best daily value | 223.7289 |
| Recommended level (reader-facing) | 1567.0 international $/person (data-backed level) |
| Math-only guess (technical) | 223.73 international $/person |
| Data-backed level | 1567.0 international $/person |
| Data-backed range | [659.76, 21187.0] |
| Backup level (middle-data check) | 281.88 international $/person |
| Math-only guess inside seen data range? | yes |
| Math-only guess inside data-backed range? | no |
| Seen data range | [0.0063, 27448.6207] |
| Math-only guess outside seen data? | no (within observed range) |
| Math-only guess outside best observed bucket? | yes |
| Best observed range | [587.74, 21187.0] |
| Best observed range (middle-data check) | [217.33, 293.89) |
| Best observed outcome average | 96.174 |
| Best observed outcome average (middle-data check) | 95.193 |
| Backup level (bucket median) | 248.67 international $/person |
| Math-only vs backup difference | 24.940 (+11.1%) |
| Middle-data share kept | 80.0% (3339/4175) |
| Data status | enough data |
| Data-status details | none |
| Confidence score | 0.7573 (higher confidence) |
| Reliability support component | 0.8479 |
| Reliability significance component | 0.6601 |
| Reliability directional component | 0.8125 |
| Reliability temporal-stability component | 0.4647 |
| Reliability robustness component | 0.9873 |
| Signal tag | early signal |

### Response-Curve Diagnostics

| Diagnostic | Result |
|------------|--------|
| Minimum useful level | 22.674 international $/person (z=6.89) |
| Point where gains start slowing | 34.812 international $/person (ratio=0.178) |
| Flat zone range | [115.59, 21187.0] |
| Why this data-backed level was chosen | identified |
| Math-only guess minus data-backed level | -1343.3 (-85.7%) |

### Temporal Sensitivity

| Profile | Source | Lag (years) | Duration (years) | Filling | Score | Delta vs Best | Included Subjects | Total Pairs |
|---------|--------|------------:|-----------------:|---------|------:|--------------:|------------------:|------------:|
| Selected | predictor_default | 3 | 3 | interpolation | 0.6029 | 0.0000 | 178 | 4175 |
| Runner-up | predictor_default | 3 | 2 | interpolation | 0.5890 | 0.0139 | 178 | 4175 |
| Runner-up | predictor_default | 3 | 1 | interpolation | 0.5717 | 0.0312 | 178 | 4175 |
| Runner-up | predictor_default | 2 | 3 | interpolation | 0.5675 | 0.0354 | 178 | 4175 |

### Binned Pattern Table

| Bin | Predictor Range | Pairs | Subjects | Predictor Mean | Predictor Median | Outcome Mean | Outcome Median |
|----:|-----------------|------:|---------:|---------------:|-----------------:|-------------:|---------------:|
| 1 | [0.00630, 19.206) | 418 | 36 | 11.4168 | 11.4256 | 56.1288 | 58.4579 |
| 2 | [19.206, 33.538) | 417 | 55 | 25.9021 | 25.3301 | 66.2826 | 61.5202 |
| 3 | [33.538, 50.279) | 418 | 55 | 41.6817 | 42.0713 | 73.1678 | 69.0171 |
| 4 | [50.279, 76.111) | 416 | 60 | 63.3772 | 63.7427 | 81.0067 | 82.6651 |
| 5 | [76.111, 115.59) | 418 | 67 | 95.0187 | 94.8807 | 86.6908 | 92.6530 |
| 6 | [115.59, 177.09) | 418 | 67 | 145.0211 | 143.1303 | 90.5018 | 95.3217 |
| 7 | [177.09, 248.68) | 417 | 65 | 210.4460 | 210.2024 | 93.5701 | 96.4152 |
| 8 | [248.68, 376.83) | 418 | 57 | 309.7371 | 313.5350 | 94.7758 | 96.8236 |
| 9 | [376.83, 587.74) | 417 | 52 | 468.0475 | 464.0774 | 94.7010 | 97.9539 |
| 10 | [587.74, 21187.0] | 418 | 41 | 1948.4305 | 1008.2099 | 96.1742 | 98.5392 |

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
| PST | -0.6111 | -0.9000 | -0.817 | 25 |
