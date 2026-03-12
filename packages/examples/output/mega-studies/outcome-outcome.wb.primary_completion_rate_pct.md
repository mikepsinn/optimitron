# Outcome Mega Study: outcome.wb.primary_completion_rate_pct

- Outcome label: Primary School Completion Rate
- Multiple testing: benjamini_hochberg
- Alpha: 0.05
- Tests: 10
- Note: `Adj p` is an uncertainty score in this system (lower is better).

## Quick Meanings

- `Recommended level`: main value to try first.
- `Data-backed level`: level directly supported by seen data.
- `Backup level`: safer fallback from the middle of the data.
- `Math-only guess`: model output used for technical checks only.
- `Not enough data`: we cannot safely recommend a level yet.

## Lead Takeaway

- Lead predictor for Primary School Completion Rate: Military Expenditure Per Capita (PPP).
- Recommended level: 1567.0 international $/person (data-backed level).
- Stats check: no predictors pass the adjusted threshold; treat these as early signals.
- Bucket check: 10/10 math-only guesses are outside the best observed bucket.
- Math-only guess (technical only): 224.20 international $/person.
- Signal tags: strong 0, moderate 0, early 7, not-enough-data 3.
- Data status: 10/10 predictor rows have enough data.
- Average confidence score across predictors: 0.643.
- Publication gate: 4/10 ranked rows are currently safe to surface as top recommendations.

## Top Recommended Levels

- These are the top recommended levels from ranked relationships that pass the publication gate.
- Use them as practical guidance, not guaranteed cause-and-effect rules.

1. Military Expenditure Per Capita (PPP): recommended level 1567.0 international $/person (data-backed level); data-backed level 1567.0 international $/person; minimum useful level 22.674 international $/person; math-only guess 224.20 international $/person; signal grade C (moderate); direction score -0.122.
2. R&D Expenditure Per Capita (PPP): recommended level 553.39 international $/person (data-backed level); data-backed level 553.39 international $/person; minimum useful level 5.790 international $/person; math-only guess 167.62 international $/person; signal grade C (moderate); direction score -0.228.
3. Government Expenditure Per Capita (PPP): recommended level 10221.6 international $/person (data-backed level); data-backed level 10221.6 international $/person; minimum useful level 315.85 international $/person; math-only guess 3805.9 international $/person; signal grade C (moderate); direction score -0.108.
4. Education Expenditure Per Capita (PPP): recommended level 2362.1 international $/person (data-backed level); data-backed level 2362.1 international $/person; minimum useful level 43.782 international $/person; math-only guess 468.72 international $/person; signal grade C (moderate); direction score -0.081.

## Quick Confidence Table

| Predictor | Data Status | Confidence | Signal Tag | Signal Grade | Significance | Direction Score | Data-Backed Level | Minimum Useful Level | Slowdown Starts Near | Included Subjects | Pairs |
|-----------|-------------|-----------:|------------|--------------|-------------:|----------------:|------------------:|---------------------:|--------------------:|------------------:|------:|
| Government Health Expenditure Per Capita (PPP) | enough data | 0.736 (medium confidence) | early signal | C (moderate) | 0.698 | -0.108 | 1214.5 international $/person | 17.845 international $/person | 29.574 international $/person | 205 | 4678 |
| Military Expenditure Per Capita (PPP) | enough data | 0.757 (higher confidence) | early signal | C (moderate) | 0.660 | -0.122 | 1567.0 international $/person | 22.674 international $/person | 34.812 international $/person | 178 | 4175 |
| R&D Expenditure Per Capita (PPP) | enough data | 0.655 (medium confidence) | early signal | C (moderate) | 0.641 | -0.228 | 553.39 international $/person | 5.790 international $/person | 12.371 international $/person | 111 | 2510 |
| R&D Share of Government Spending | enough data | 0.616 (medium confidence) | not enough data | C (moderate) | 0.585 | -0.170 | 12.049 % of government expenditure | 0.74231 % of government expenditure | 1.039 % of government expenditure | 90 | 2012 |
| Government Health Share of Government Spending | enough data | 0.750 (higher confidence) | not enough data | C (moderate) | 0.580 | -0.179 | 16.250 % of government expenditure | 9.584 % of government expenditure | 9.584 % of government expenditure | 152 | 3425 |
| Education Share of Government Spending | enough data | 0.651 (medium confidence) | not enough data | D (weak) | 0.546 | 0.154 | 13.672 % of government expenditure | 12.034 % of government expenditure | 13.672 % of government expenditure | 145 | 3343 |
| Government Expenditure Per Capita (PPP) | enough data | 0.602 (medium confidence) | early signal | C (moderate) | 0.675 | -0.108 | 10221.6 international $/person | 315.85 international $/person | 547.92 international $/person | 159 | 3577 |
| Civilian Government Expenditure Per Capita (PPP) | enough data | 0.464 (lower confidence) | early signal | C (moderate) | 0.682 | -0.087 | 9890.8 international $/person | 268.78 international $/person | 418.04 international $/person | 133 | 3043 |
| Education Expenditure Per Capita (PPP) | enough data | 0.703 (medium confidence) | early signal | C (moderate) | 0.692 | -0.081 | 2362.1 international $/person | 43.782 international $/person | 69.668 international $/person | 198 | 4555 |
| Military Share of Government Spending | enough data | 0.493 (lower confidence) | early signal | C (moderate) | 0.619 | 0.037 | 3.399 % of government expenditure | N/A | 5.185 % of government expenditure | 133 | 3043 |

## Budget Allocation Signals

- These rows show spending mix predictors (share of total government spending).
- Use this section to compare recommended mix levels across sectors.

| Allocation Share Predictor | Recommended Share | Backup Share | Math-Only Guess | Guess-Backup Difference | Direction | Signal Tag | Pair Report |
|----------------------------|------------------:|-------------:|----------------:|------------------------:|----------:|------------|------------|
| Education Share of Government Spending | 13.672 % of government expenditure | 13.856 % of government expenditure | 20.899 % of government expenditure | -7.043 (-33.7%) | positive | not enough data | [pair-predictor.derived.education_share_of_gov_expenditure_pct__outcome.wb.primary_completion_rate_pct.md](pair-predictor.derived.education_share_of_gov_expenditure_pct__outcome.wb.primary_completion_rate_pct.md) |
| Government Health Share of Government Spending | 16.250 % of government expenditure | 15.991 % of government expenditure | 12.861 % of government expenditure | 3.130 (+24.3%) | neutral | not enough data | [pair-predictor.derived.gov_health_share_of_gov_expenditure_pct__outcome.wb.primary_completion_rate_pct.md](pair-predictor.derived.gov_health_share_of_gov_expenditure_pct__outcome.wb.primary_completion_rate_pct.md) |
| Military Share of Government Spending | 3.399 % of government expenditure | 3.533 % of government expenditure | 8.549 % of government expenditure | -5.016 (-58.7%) | negative | early signal | [pair-predictor.derived.military_share_of_gov_expenditure_pct__outcome.wb.primary_completion_rate_pct.md](pair-predictor.derived.military_share_of_gov_expenditure_pct__outcome.wb.primary_completion_rate_pct.md) |
| R&D Share of Government Spending | 12.049 % of government expenditure | 1.050 % of government expenditure | 3.243 % of government expenditure | -2.192 (-67.6%) | negative | not enough data | [pair-predictor.derived.rd_share_of_gov_expenditure_pct__outcome.wb.primary_completion_rate_pct.md](pair-predictor.derived.rd_share_of_gov_expenditure_pct__outcome.wb.primary_completion_rate_pct.md) |

## Recommended Levels By Predictor

- Each row shows key numeric levels for one predictor.
- `Recommended level` is the main level to try.
- `Math-only guess` is shown only for technical comparison.
- `Math-only guess outside best bucket?` means the math-only guess is outside the best observed data bucket.

| Predictor | Recommended Level | Why This Level | Minimum Useful Level | Slowdown Starts Near | Backup Level | Math-Only Guess | Math-Only Guess Outside Seen Data? | Math-Only Guess Outside Best Bucket? | Guess-Backup Difference | Recommended PPP/Capita | Best Observed Range | Best Observed Range (Middle-Data Check) | Best Observed PPP/Capita (p10-p90) | Best Observed Outcome Mean | Direction | Data Status | Confidence | Signal Tag | Pair Report |
|-----------|------------------:|----------------|---------------------:|--------------------:|-------------:|----------------:|------------------------------------|--------------------------------------|------------------------:|----------------------:|--------------------:|----------------------------------------:|-----------------------------------:|---------------------------:|----------:|------------|-----------:|------------|------------|
| Civilian Government Expenditure Per Capita (PPP) | 9890.8 international $/person | data-backed level | 268.78 international $/person | 418.04 international $/person | 9335.5 international $/person | 3786.6 international $/person | no | yes | 5548.8 (+146.5%) | N/A | [7046.1, 10884.1) | [7830.5, 10872.8] | N/A | 98.645 | positive | enough data | 0.464 (lower confidence) | early signal | [pair-predictor.derived.gov_non_military_expenditure_per_capita_ppp__outcome.wb.primary_completion_rate_pct.md](pair-predictor.derived.gov_non_military_expenditure_per_capita_ppp__outcome.wb.primary_completion_rate_pct.md) |
| Education Expenditure Per Capita (PPP) | 2362.1 international $/person | data-backed level | 43.782 international $/person | 69.668 international $/person | 788.00 international $/person | 468.72 international $/person | no | yes | 319.29 (+68.1%) | N/A | [1499.7, 6496.0] | [635.05, 943.27) | N/A | 98.295 | positive | enough data | 0.703 (medium confidence) | early signal | [pair-predictor.derived.education_expenditure_per_capita_ppp__outcome.wb.primary_completion_rate_pct.md](pair-predictor.derived.education_expenditure_per_capita_ppp__outcome.wb.primary_completion_rate_pct.md) |
| Education Share of Government Spending | 13.672 % of government expenditure | data-backed level | 12.034 % of government expenditure | 13.672 % of government expenditure | 13.856 % of government expenditure | 20.899 % of government expenditure | no | yes | -7.043 (-33.7%) | N/A | [13.514, 15.413) | [13.171, 14.641) | N/A | 95.157 | positive | enough data | 0.651 (medium confidence) | not enough data | [pair-predictor.derived.education_share_of_gov_expenditure_pct__outcome.wb.primary_completion_rate_pct.md](pair-predictor.derived.education_share_of_gov_expenditure_pct__outcome.wb.primary_completion_rate_pct.md) |
| Government Expenditure Per Capita (PPP) | 10221.6 international $/person | data-backed level | 315.85 international $/person | 547.92 international $/person | 9486.4 international $/person | 3805.9 international $/person | no | yes | 5680.5 (+149.3%) | N/A | [6592.2, 11473.4) | [7550.4, 11472.7] | N/A | 98.252 | positive | enough data | 0.602 (medium confidence) | early signal | [pair-predictor.derived.gov_expenditure_per_capita_ppp__outcome.wb.primary_completion_rate_pct.md](pair-predictor.derived.gov_expenditure_per_capita_ppp__outcome.wb.primary_completion_rate_pct.md) |
| Government Health Expenditure Per Capita (PPP) | 1214.5 international $/person | data-backed level | 17.845 international $/person | 29.574 international $/person | 572.67 international $/person | 422.64 international $/person | no | yes | 150.03 (+35.5%) | N/A | [1471.7, 5486.7] | [468.75, 760.94) | N/A | 98.129 | positive | enough data | 0.736 (medium confidence) | early signal | [pair-predictor.derived.gov_health_expenditure_per_capita_ppp__outcome.wb.primary_completion_rate_pct.md](pair-predictor.derived.gov_health_expenditure_per_capita_ppp__outcome.wb.primary_completion_rate_pct.md) |
| Government Health Share of Government Spending | 16.250 % of government expenditure | data-backed level | 9.584 % of government expenditure | 9.584 % of government expenditure | 15.991 % of government expenditure | 12.861 % of government expenditure | no | yes | 3.130 (+24.3%) | N/A | [20.308, 65.863] | [15.181, 17.095) | N/A | 92.607 | neutral | enough data | 0.750 (higher confidence) | not enough data | [pair-predictor.derived.gov_health_share_of_gov_expenditure_pct__outcome.wb.primary_completion_rate_pct.md](pair-predictor.derived.gov_health_share_of_gov_expenditure_pct__outcome.wb.primary_completion_rate_pct.md) |
| Military Expenditure Per Capita (PPP) | 1567.0 international $/person | data-backed level | 22.674 international $/person | 34.812 international $/person | 249.44 international $/person | 224.20 international $/person | no | yes | 25.246 (+11.3%) | N/A | [591.02, 21187.0] | [220.69, 294.45) | N/A | 96.224 | positive | enough data | 0.757 (higher confidence) | early signal | [pair-predictor.derived.military_expenditure_per_capita_ppp__outcome.wb.primary_completion_rate_pct.md](pair-predictor.derived.military_expenditure_per_capita_ppp__outcome.wb.primary_completion_rate_pct.md) |
| Military Share of Government Spending | 3.399 % of government expenditure | data-backed level | N/A | 5.185 % of government expenditure | 3.533 % of government expenditure | 8.549 % of government expenditure | no | yes | -5.016 (-58.7%) | N/A | [3.075, 4.084) | [3.080, 3.879) | N/A | 95.342 | negative | enough data | 0.493 (lower confidence) | early signal | [pair-predictor.derived.military_share_of_gov_expenditure_pct__outcome.wb.primary_completion_rate_pct.md](pair-predictor.derived.military_share_of_gov_expenditure_pct__outcome.wb.primary_completion_rate_pct.md) |
| R&D Expenditure Per Capita (PPP) | 553.39 international $/person | data-backed level | 5.790 international $/person | 12.371 international $/person | 492.17 international $/person | 167.62 international $/person | no | yes | 324.55 (+193.6%) | N/A | [284.52, 689.76) | [356.13, 689.50] | N/A | 98.750 | positive | enough data | 0.655 (medium confidence) | early signal | [pair-predictor.derived.rd_expenditure_per_capita_ppp__outcome.wb.primary_completion_rate_pct.md](pair-predictor.derived.rd_expenditure_per_capita_ppp__outcome.wb.primary_completion_rate_pct.md) |
| R&D Share of Government Spending | 12.049 % of government expenditure | data-backed level | 0.74231 % of government expenditure | 1.039 % of government expenditure | 1.050 % of government expenditure | 3.243 % of government expenditure | no | yes | -2.192 (-67.6%) | N/A | [8.367, 26.042] | [0.95227, 1.327) | N/A | 98.679 | negative | enough data | 0.616 (medium confidence) | not enough data | [pair-predictor.derived.rd_share_of_gov_expenditure_pct__outcome.wb.primary_completion_rate_pct.md](pair-predictor.derived.rd_share_of_gov_expenditure_pct__outcome.wb.primary_completion_rate_pct.md) |

### Predictor Summaries In Plain English

- Civilian Government Expenditure Per Capita (PPP): recommended level 9890.8 international $/person (data-backed level); minimum useful level 268.78 international $/person; gains start slowing near 418.04 international $/person; backup level 9335.5 international $/person; math-only guess 3786.6 international $/person (outside best observed bucket); data status enough data; confidence 0.464 (lower confidence); signal tag early signal.
- Education Expenditure Per Capita (PPP): recommended level 2362.1 international $/person (data-backed level); minimum useful level 43.782 international $/person; gains start slowing near 69.668 international $/person; backup level 788.00 international $/person; math-only guess 468.72 international $/person (outside best observed bucket); data status enough data; confidence 0.703 (medium confidence); signal tag early signal.
- Education Share of Government Spending: recommended level 13.672 % of government expenditure (data-backed level); minimum useful level 12.034 % of government expenditure; gains start slowing near 13.672 % of government expenditure; backup level 13.856 % of government expenditure; math-only guess 20.899 % of government expenditure (outside best observed bucket); data status enough data; confidence 0.651 (medium confidence); signal tag not enough data.
- Government Expenditure Per Capita (PPP): recommended level 10221.6 international $/person (data-backed level); minimum useful level 315.85 international $/person; gains start slowing near 547.92 international $/person; backup level 9486.4 international $/person; math-only guess 3805.9 international $/person (outside best observed bucket); data status enough data; confidence 0.602 (medium confidence); signal tag early signal.
- Government Health Expenditure Per Capita (PPP): recommended level 1214.5 international $/person (data-backed level); minimum useful level 17.845 international $/person; gains start slowing near 29.574 international $/person; backup level 572.67 international $/person; math-only guess 422.64 international $/person (outside best observed bucket); data status enough data; confidence 0.736 (medium confidence); signal tag early signal.
- Government Health Share of Government Spending: recommended level 16.250 % of government expenditure (data-backed level); minimum useful level 9.584 % of government expenditure; gains start slowing near 9.584 % of government expenditure; backup level 15.991 % of government expenditure; math-only guess 12.861 % of government expenditure (outside best observed bucket); data status enough data; confidence 0.750 (higher confidence); signal tag not enough data.
- Military Expenditure Per Capita (PPP): recommended level 1567.0 international $/person (data-backed level); minimum useful level 22.674 international $/person; gains start slowing near 34.812 international $/person; backup level 249.44 international $/person; math-only guess 224.20 international $/person (outside best observed bucket); data status enough data; confidence 0.757 (higher confidence); signal tag early signal.
- Military Share of Government Spending: recommended level 3.399 % of government expenditure (data-backed level); minimum useful level N/A; gains start slowing near 5.185 % of government expenditure; backup level 3.533 % of government expenditure; math-only guess 8.549 % of government expenditure (outside best observed bucket); data status enough data; confidence 0.493 (lower confidence); signal tag early signal.
- R&D Expenditure Per Capita (PPP): recommended level 553.39 international $/person (data-backed level); minimum useful level 5.790 international $/person; gains start slowing near 12.371 international $/person; backup level 492.17 international $/person; math-only guess 167.62 international $/person (outside best observed bucket); data status enough data; confidence 0.655 (medium confidence); signal tag early signal.
- R&D Share of Government Spending: recommended level 12.049 % of government expenditure (data-backed level); minimum useful level 0.74231 % of government expenditure; gains start slowing near 1.039 % of government expenditure; backup level 1.050 % of government expenditure; math-only guess 3.243 % of government expenditure (outside best observed bucket); data status enough data; confidence 0.616 (medium confidence); signal tag not enough data.

## Plain-Language Summary

- Highest-ranked publishable row is Military Expenditure Per Capita (PPP) with direction positive.
- This outcome page includes 10 predictor studies; 0 pass the stats threshold.
- Data status: 10/10 rows have enough data; average confidence is 0.643.
- Signal tags in this outcome: strong 0, moderate 0, early 7, not-enough-data 3.
- Recommended levels come from data-backed checks; math-only guesses are kept for technical comparison only.

## Appendix: Extra Technical Numbers

| Rank | Predictor | Score | Confidence | Adj p | Signal Grade | Signal Tag | Direction | Direction Score | Countries | Pairs | High-Outcome Value | Low-Outcome Value | Math-Only Best Daily | Pair Report |
|-----:|-----------|------:|-----------:|------:|--------------|------------|----------:|----------------:|----------:|------:|-------------------:|------------------:|---------------------:|------------|
| 1 | Government Health Expenditure Per Capita (PPP) | 0.7610 | 0.7305 | 0.4541 | C (moderate) | early signal | positive | -0.1081 | 205 | 4678 | 422.643 | 457.840 | 422.643 | [pair-predictor.derived.gov_health_expenditure_per_capita_ppp__outcome.wb.primary_completion_rate_pct.md](pair-predictor.derived.gov_health_expenditure_per_capita_ppp__outcome.wb.primary_completion_rate_pct.md) |
| 2 | Military Expenditure Per Capita (PPP) | 0.6261 | 0.7154 | 0.4541 | C (moderate) | early signal | positive | -0.1218 | 178 | 4175 | 224.197 | 224.759 | 224.197 | [pair-predictor.derived.military_expenditure_per_capita_ppp__outcome.wb.primary_completion_rate_pct.md](pair-predictor.derived.military_expenditure_per_capita_ppp__outcome.wb.primary_completion_rate_pct.md) |
| 3 | R&D Expenditure Per Capita (PPP) | 0.5706 | 0.7220 | 0.4541 | C (moderate) | early signal | positive | -0.2283 | 111 | 2510 | 167.615 | 186.713 | 167.615 | [pair-predictor.derived.rd_expenditure_per_capita_ppp__outcome.wb.primary_completion_rate_pct.md](pair-predictor.derived.rd_expenditure_per_capita_ppp__outcome.wb.primary_completion_rate_pct.md) |
| 4 | R&D Share of Government Spending | 0.4780 | 0.6864 | 0.4541 | C (moderate) | not enough data | negative | -0.1705 | 90 | 2012 | 3.243 | 3.399 | 3.243 | [pair-predictor.derived.rd_share_of_gov_expenditure_pct__outcome.wb.primary_completion_rate_pct.md](pair-predictor.derived.rd_share_of_gov_expenditure_pct__outcome.wb.primary_completion_rate_pct.md) |
| 5 | Government Health Share of Government Spending | 0.4279 | 0.6879 | 0.4541 | C (moderate) | not enough data | neutral | -0.1790 | 152 | 3425 | 12.861 | 13.035 | 12.861 | [pair-predictor.derived.gov_health_share_of_gov_expenditure_pct__outcome.wb.primary_completion_rate_pct.md](pair-predictor.derived.gov_health_share_of_gov_expenditure_pct__outcome.wb.primary_completion_rate_pct.md) |
| 6 | Education Share of Government Spending | 0.3762 | 0.6687 | 0.4541 | D (weak) | not enough data | positive | 0.1544 | 145 | 3343 | 20.899 | 19.545 | 20.899 | [pair-predictor.derived.education_share_of_gov_expenditure_pct__outcome.wb.primary_completion_rate_pct.md](pair-predictor.derived.education_share_of_gov_expenditure_pct__outcome.wb.primary_completion_rate_pct.md) |
| 7 | Government Expenditure Per Capita (PPP) | 0.3580 | 0.7199 | 0.4541 | C (moderate) | early signal | positive | -0.1078 | 159 | 3577 | 3805.880 | 4195.346 | 3805.880 | [pair-predictor.derived.gov_expenditure_per_capita_ppp__outcome.wb.primary_completion_rate_pct.md](pair-predictor.derived.gov_expenditure_per_capita_ppp__outcome.wb.primary_completion_rate_pct.md) |
| 8 | Civilian Government Expenditure Per Capita (PPP) | 0.3352 | 0.7196 | 0.4541 | C (moderate) | early signal | positive | -0.0870 | 133 | 3043 | 3786.647 | 4202.218 | 3786.647 | [pair-predictor.derived.gov_non_military_expenditure_per_capita_ppp__outcome.wb.primary_completion_rate_pct.md](pair-predictor.derived.gov_non_military_expenditure_per_capita_ppp__outcome.wb.primary_completion_rate_pct.md) |
| 9 | Education Expenditure Per Capita (PPP) | 0.3291 | 0.7234 | 0.4541 | C (moderate) | early signal | positive | -0.0806 | 198 | 4555 | 468.717 | 462.717 | 468.717 | [pair-predictor.derived.education_expenditure_per_capita_ppp__outcome.wb.primary_completion_rate_pct.md](pair-predictor.derived.education_expenditure_per_capita_ppp__outcome.wb.primary_completion_rate_pct.md) |
| 10 | Military Share of Government Spending | 0.2719 | 0.6839 | 0.4541 | C (moderate) | early signal | negative | 0.0374 | 133 | 3043 | 8.549 | 10.830 | 8.549 | [pair-predictor.derived.military_share_of_gov_expenditure_pct__outcome.wb.primary_completion_rate_pct.md](pair-predictor.derived.military_share_of_gov_expenditure_pct__outcome.wb.primary_completion_rate_pct.md) |
