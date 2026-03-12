# Outcome Mega Study: outcome.derived.healthy_life_expectancy_growth_yoy_pct

- Outcome label: Healthy Life Expectancy Growth (YoY %)
- Multiple testing: benjamini_hochberg
- Alpha: 0.05
- Tests: 8
- Note: `Adj p` is an uncertainty score in this system (lower is better).

## Quick Meanings

- `Recommended level`: main value to try first.
- `Data-backed level`: level directly supported by seen data.
- `Backup level`: safer fallback from the middle of the data.
- `Math-only guess`: model output used for technical checks only.
- `Not enough data`: we cannot safely recommend a level yet.

## Lead Takeaway

- Highest-ranked diagnostic row for Healthy Life Expectancy Growth (YoY %): Government Health Share of Government Spending.
- Publication gate: no row currently clears the publishable recommendation threshold for this outcome.
- Recommended level: N/A (not enough data).
- Stats check: no predictors pass the adjusted threshold; treat these as early signals.
- Bucket check: 7/8 math-only guesses are outside the best observed bucket.
- Math-only guess (technical only): 13.195 % of government expenditure.
- Signal tags: strong 0, moderate 0, early 0, not-enough-data 8.
- Data status: 8/8 predictor rows have enough data.
- Average confidence score across predictors: 0.441.
- Publication gate: 0/8 ranked rows are currently safe to surface as top recommendations.

## Pairs With Not Enough Data

- 2 predictor/outcome pairs were removed from ranking and recommendation tables because they did not have enough data.
| Predictor | Included Subjects | Aligned Pairs | Why Not Enough Data | Pair Report |
|-----------|------------------:|--------------:|---------------------|------------|
| R&D Expenditure Per Capita (PPP) | 95 | 1995 | aligned-pair support below minimum (1995 < 2000) | [pair-predictor.derived.rd_expenditure_per_capita_ppp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md](pair-predictor.derived.rd_expenditure_per_capita_ppp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md) |
| R&D Share of Government Spending | 82 | 1722 | aligned-pair support below minimum (1722 < 2000) | [pair-predictor.derived.rd_share_of_gov_expenditure_pct__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md](pair-predictor.derived.rd_share_of_gov_expenditure_pct__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md) |

## Top Recommended Levels

- These are the top recommended levels from ranked relationships that pass the publication gate.
- Use them as practical guidance, not guaranteed cause-and-effect rules.

1. No publishable recommendation yet because the current ranked rows remain lower-confidence or exploratory.

## Quick Confidence Table

| Predictor | Data Status | Confidence | Signal Tag | Signal Grade | Significance | Direction Score | Data-Backed Level | Minimum Useful Level | Slowdown Starts Near | Included Subjects | Pairs |
|-----------|-------------|-----------:|------------|--------------|-------------:|----------------:|------------------:|---------------------:|--------------------:|------------------:|------:|
| Government Health Share of Government Spending | enough data | 0.540 (lower confidence) | not enough data | F (very weak) | 0.167 | -0.116 | 9.584 % of government expenditure | N/A | 9.584 % of government expenditure | 141 | 2961 |
| Civilian Government Expenditure Per Capita (PPP) | enough data | 0.476 (lower confidence) | not enough data | F (very weak) | 0.237 | 0.074 | 112.66 international $/person | N/A | 3937.2 international $/person | 126 | 2646 |
| Education Share of Government Spending | enough data | 0.475 (lower confidence) | not enough data | F (very weak) | 0.203 | -0.078 | 33.378 % of government expenditure | 19.592 % of government expenditure | 21.063 % of government expenditure | 134 | 2814 |
| Education Expenditure Per Capita (PPP) | enough data | 0.473 (lower confidence) | not enough data | F (very weak) | 0.242 | -0.122 | 21.584 international $/person | N/A | 513.65 international $/person | 165 | 3465 |
| Government Expenditure Per Capita (PPP) | enough data | 0.350 (lower confidence) | not enough data | F (very weak) | 0.182 | -0.063 | 132.79 international $/person | N/A | 5032.9 international $/person | 147 | 3087 |
| Government Health Expenditure Per Capita (PPP) | enough data | 0.418 (lower confidence) | not enough data | F (very weak) | 0.218 | -0.099 | 7.012 international $/person | N/A | 902.00 international $/person | 179 | 3759 |
| Military Share of Government Spending | enough data | 0.400 (lower confidence) | not enough data | F (very weak) | 0.170 | 0.036 | 9.950 % of government expenditure | N/A | 4.318 % of government expenditure | 126 | 2646 |
| Military Expenditure Per Capita (PPP) | enough data | 0.398 (lower confidence) | not enough data | F (very weak) | 0.228 | 0.058 | 8.665 international $/person | N/A | 342.13 international $/person | 159 | 3339 |

## Budget Allocation Signals

- These rows show spending mix predictors (share of total government spending).
- Use this section to compare recommended mix levels across sectors.

| Allocation Share Predictor | Recommended Share | Backup Share | Math-Only Guess | Guess-Backup Difference | Direction | Signal Tag | Pair Report |
|----------------------------|------------------:|-------------:|----------------:|------------------------:|----------:|------------|------------|
| Education Share of Government Spending | 33.378 % of government expenditure | 20.911 % of government expenditure | 19.382 % of government expenditure | 1.529 (+7.9%) | neutral | not enough data | [pair-predictor.derived.education_share_of_gov_expenditure_pct__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md](pair-predictor.derived.education_share_of_gov_expenditure_pct__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md) |
| Government Health Share of Government Spending | 9.584 % of government expenditure | 9.672 % of government expenditure | 13.195 % of government expenditure | -3.523 (-26.7%) | negative | not enough data | [pair-predictor.derived.gov_health_share_of_gov_expenditure_pct__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md](pair-predictor.derived.gov_health_share_of_gov_expenditure_pct__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md) |
| Military Share of Government Spending | 9.950 % of government expenditure | 9.883 % of government expenditure | 8.933 % of government expenditure | 0.94929 (+10.6%) | neutral | not enough data | [pair-predictor.derived.military_share_of_gov_expenditure_pct__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md](pair-predictor.derived.military_share_of_gov_expenditure_pct__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md) |

## Recommended Levels By Predictor

- Each row shows key numeric levels for one predictor.
- `Recommended level` is the main level to try.
- `Math-only guess` is shown only for technical comparison.
- `Math-only guess outside best bucket?` means the math-only guess is outside the best observed data bucket.

| Predictor | Recommended Level | Why This Level | Minimum Useful Level | Slowdown Starts Near | Backup Level | Math-Only Guess | Math-Only Guess Outside Seen Data? | Math-Only Guess Outside Best Bucket? | Guess-Backup Difference | Recommended PPP/Capita | Best Observed Range | Best Observed Range (Middle-Data Check) | Best Observed PPP/Capita (p10-p90) | Best Observed Outcome Mean | Direction | Data Status | Confidence | Signal Tag | Pair Report |
|-----------|------------------:|----------------|---------------------:|--------------------:|-------------:|----------------:|------------------------------------|--------------------------------------|------------------------:|----------------------:|--------------------:|----------------------------------------:|-----------------------------------:|---------------------------:|----------:|------------|-----------:|------------|------------|
| Civilian Government Expenditure Per Capita (PPP) | 112.66 international $/person | data-backed level | N/A | 3937.2 international $/person | 649.66 international $/person | 4322.0 international $/person | no | yes | -3672.3 (-85.0%) | N/A | [7.604, 214.06) | [506.71, 813.78) | N/A | 0.99627 | negative | enough data | 0.476 (lower confidence) | not enough data | [pair-predictor.derived.gov_non_military_expenditure_per_capita_ppp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md](pair-predictor.derived.gov_non_military_expenditure_per_capita_ppp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md) |
| Education Expenditure Per Capita (PPP) | 21.584 international $/person | data-backed level | N/A | 513.65 international $/person | 49.502 international $/person | 592.10 international $/person | no | yes | -542.59 (-91.6%) | N/A | [0.00000, 37.595) | [37.622, 61.553) | N/A | 1.027 | negative | enough data | 0.473 (lower confidence) | not enough data | [pair-predictor.derived.education_expenditure_per_capita_ppp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md](pair-predictor.derived.education_expenditure_per_capita_ppp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md) |
| Education Share of Government Spending | 33.378 % of government expenditure | data-backed level | 19.592 % of government expenditure | 21.063 % of government expenditure | 20.911 % of government expenditure | 19.382 % of government expenditure | no | no | 1.529 (+7.9%) | N/A | [19.007, 20.477) | [20.190, 21.607) | N/A | 0.72473 | neutral | enough data | 0.475 (lower confidence) | not enough data | [pair-predictor.derived.education_share_of_gov_expenditure_pct__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md](pair-predictor.derived.education_share_of_gov_expenditure_pct__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md) |
| Government Expenditure Per Capita (PPP) | 132.79 international $/person | data-backed level | N/A | 5032.9 international $/person | 688.01 international $/person | 4331.5 international $/person | no | yes | -3643.5 (-84.1%) | N/A | [15.672, 243.75) | [547.92, 851.35) | N/A | 0.98739 | negative | enough data | 0.350 (lower confidence) | not enough data | [pair-predictor.derived.gov_expenditure_per_capita_ppp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md](pair-predictor.derived.gov_expenditure_per_capita_ppp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md) |
| Government Health Expenditure Per Capita (PPP) | 7.012 international $/person | data-backed level | N/A | 902.00 international $/person | 17.753 international $/person | 528.12 international $/person | no | yes | -510.36 (-96.6%) | N/A | [0.25914, 14.049) | [14.055, 22.166) | N/A | 0.92037 | negative | enough data | 0.418 (lower confidence) | not enough data | [pair-predictor.derived.gov_health_expenditure_per_capita_ppp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md](pair-predictor.derived.gov_health_expenditure_per_capita_ppp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md) |
| Government Health Share of Government Spending | 9.584 % of government expenditure | data-backed level | N/A | 9.584 % of government expenditure | 9.672 % of government expenditure | 13.195 % of government expenditure | no | yes | -3.523 (-26.7%) | N/A | [0.93053, 5.892) | [9.217, 10.275) | N/A | 0.54984 | negative | enough data | 0.540 (lower confidence) | not enough data | [pair-predictor.derived.gov_health_share_of_gov_expenditure_pct__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md](pair-predictor.derived.gov_health_share_of_gov_expenditure_pct__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md) |
| Military Expenditure Per Capita (PPP) | 8.665 international $/person | data-backed level | N/A | 342.13 international $/person | 21.730 international $/person | 356.86 international $/person | no | yes | -335.13 (-93.9%) | N/A | [0.91749, 16.666) | [16.681, 26.916) | N/A | 0.99641 | negative | enough data | 0.398 (lower confidence) | not enough data | [pair-predictor.derived.military_expenditure_per_capita_ppp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md](pair-predictor.derived.military_expenditure_per_capita_ppp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md) |
| Military Share of Government Spending | 9.950 % of government expenditure | data-backed level | N/A | 4.318 % of government expenditure | 9.883 % of government expenditure | 8.933 % of government expenditure | no | yes | 0.94929 (+10.6%) | N/A | [16.650, 88.206] | [9.079, 10.774) | N/A | 0.59494 | neutral | enough data | 0.400 (lower confidence) | not enough data | [pair-predictor.derived.military_share_of_gov_expenditure_pct__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md](pair-predictor.derived.military_share_of_gov_expenditure_pct__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md) |

### Predictor Summaries In Plain English

- Civilian Government Expenditure Per Capita (PPP): recommended level 112.66 international $/person (data-backed level); minimum useful level N/A; gains start slowing near 3937.2 international $/person; backup level 649.66 international $/person; math-only guess 4322.0 international $/person (outside best observed bucket); data status enough data; confidence 0.476 (lower confidence); signal tag not enough data.
- Education Expenditure Per Capita (PPP): recommended level 21.584 international $/person (data-backed level); minimum useful level N/A; gains start slowing near 513.65 international $/person; backup level 49.502 international $/person; math-only guess 592.10 international $/person (outside best observed bucket); data status enough data; confidence 0.473 (lower confidence); signal tag not enough data.
- Education Share of Government Spending: recommended level 33.378 % of government expenditure (data-backed level); minimum useful level 19.592 % of government expenditure; gains start slowing near 21.063 % of government expenditure; backup level 20.911 % of government expenditure; math-only guess 19.382 % of government expenditure; data status enough data; confidence 0.475 (lower confidence); signal tag not enough data.
- Government Expenditure Per Capita (PPP): recommended level 132.79 international $/person (data-backed level); minimum useful level N/A; gains start slowing near 5032.9 international $/person; backup level 688.01 international $/person; math-only guess 4331.5 international $/person (outside best observed bucket); data status enough data; confidence 0.350 (lower confidence); signal tag not enough data.
- Government Health Expenditure Per Capita (PPP): recommended level 7.012 international $/person (data-backed level); minimum useful level N/A; gains start slowing near 902.00 international $/person; backup level 17.753 international $/person; math-only guess 528.12 international $/person (outside best observed bucket); data status enough data; confidence 0.418 (lower confidence); signal tag not enough data.
- Government Health Share of Government Spending: recommended level 9.584 % of government expenditure (data-backed level); minimum useful level N/A; gains start slowing near 9.584 % of government expenditure; backup level 9.672 % of government expenditure; math-only guess 13.195 % of government expenditure (outside best observed bucket); data status enough data; confidence 0.540 (lower confidence); signal tag not enough data.
- Military Expenditure Per Capita (PPP): recommended level 8.665 international $/person (data-backed level); minimum useful level N/A; gains start slowing near 342.13 international $/person; backup level 21.730 international $/person; math-only guess 356.86 international $/person (outside best observed bucket); data status enough data; confidence 0.398 (lower confidence); signal tag not enough data.
- Military Share of Government Spending: recommended level 9.950 % of government expenditure (data-backed level); minimum useful level N/A; gains start slowing near 4.318 % of government expenditure; backup level 9.883 % of government expenditure; math-only guess 8.933 % of government expenditure (outside best observed bucket); data status enough data; confidence 0.400 (lower confidence); signal tag not enough data.

## Plain-Language Summary

- No row currently clears the publication gate; the highest-ranked diagnostic row is Government Health Share of Government Spending with direction negative.
- This outcome page includes 8 predictor studies; 0 pass the stats threshold.
- Data status: 8/8 rows have enough data; average confidence is 0.441.
- Signal tags in this outcome: strong 0, moderate 0, early 0, not-enough-data 8.
- Recommended levels come from data-backed checks; math-only guesses are kept for technical comparison only.

## Appendix: Extra Technical Numbers

| Rank | Predictor | Score | Confidence | Adj p | Signal Grade | Signal Tag | Direction | Direction Score | Countries | Pairs | High-Outcome Value | Low-Outcome Value | Math-Only Best Daily | Pair Report |
|-----:|-----------|------:|-----------:|------:|--------------|------------|----------:|----------------:|----------:|------:|-------------------:|------------------:|---------------------:|------------|
| 1 | Government Health Share of Government Spending | 0.7810 | 0.4921 | 0.8334 | F (very weak) | not enough data | negative | -0.1158 | 141 | 2961 | 13.195 | 13.304 | 13.195 | [pair-predictor.derived.gov_health_share_of_gov_expenditure_pct__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md](pair-predictor.derived.gov_health_share_of_gov_expenditure_pct__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md) |
| 2 | Civilian Government Expenditure Per Capita (PPP) | 0.5148 | 0.5174 | 0.8334 | F (very weak) | not enough data | negative | 0.0745 | 126 | 2646 | 4321.969 | 4524.973 | 4321.969 | [pair-predictor.derived.gov_non_military_expenditure_per_capita_ppp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md](pair-predictor.derived.gov_non_military_expenditure_per_capita_ppp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md) |
| 3 | Education Share of Government Spending | 0.5070 | 0.5028 | 0.8334 | F (very weak) | not enough data | neutral | -0.0776 | 134 | 2814 | 19.382 | 19.433 | 19.382 | [pair-predictor.derived.education_share_of_gov_expenditure_pct__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md](pair-predictor.derived.education_share_of_gov_expenditure_pct__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md) |
| 4 | Education Expenditure Per Capita (PPP) | 0.4359 | 0.5270 | 0.8334 | F (very weak) | not enough data | negative | -0.1216 | 165 | 3465 | 592.095 | 640.944 | 592.095 | [pair-predictor.derived.education_expenditure_per_capita_ppp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md](pair-predictor.derived.education_expenditure_per_capita_ppp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md) |
| 5 | Government Expenditure Per Capita (PPP) | 0.4259 | 0.4909 | 0.8334 | F (very weak) | not enough data | negative | -0.0625 | 147 | 3087 | 4331.532 | 4498.588 | 4331.532 | [pair-predictor.derived.gov_expenditure_per_capita_ppp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md](pair-predictor.derived.gov_expenditure_per_capita_ppp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md) |
| 6 | Government Health Expenditure Per Capita (PPP) | 0.4096 | 0.5130 | 0.8334 | F (very weak) | not enough data | negative | -0.0992 | 179 | 3759 | 528.117 | 568.385 | 528.117 | [pair-predictor.derived.gov_health_expenditure_per_capita_ppp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md](pair-predictor.derived.gov_health_expenditure_per_capita_ppp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md) |
| 7 | Military Share of Government Spending | 0.3793 | 0.4816 | 0.8334 | F (very weak) | not enough data | neutral | 0.0358 | 126 | 2646 | 8.933 | 8.599 | 8.933 | [pair-predictor.derived.military_share_of_gov_expenditure_pct__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md](pair-predictor.derived.military_share_of_gov_expenditure_pct__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md) |
| 8 | Military Expenditure Per Capita (PPP) | 0.2678 | 0.5113 | 0.8334 | F (very weak) | not enough data | negative | 0.0584 | 159 | 3339 | 356.862 | 377.463 | 356.862 | [pair-predictor.derived.military_expenditure_per_capita_ppp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md](pair-predictor.derived.military_expenditure_per_capita_ppp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md) |
