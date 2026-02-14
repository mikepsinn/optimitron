# Outcome Mega Study: outcome.derived.healthy_life_expectancy_growth_yoy_pct

- Outcome label: Healthy Life Expectancy Growth (YoY %)
- Multiple testing: benjamini_hochberg
- Alpha: 0.05
- Tests: 8
- Note: `Adj p` is derived from an internal uncertainty proxy, not a classical hypothesis-test p-value.

## Lead Takeaway

- Lead predictor for Healthy Life Expectancy Growth (YoY %): Military Share of Government Spending.
- Decision target level: 9.950 % of government expenditure (support constrained).
- Statistical status: no predictors pass adjusted-alpha threshold; treat these as exploratory signals.
- Bin-alignment note: 8/8 model-derived optima sit outside the top observed outcome bin range.
- Model-derived optimum (diagnostics only): 9.048 % of government expenditure.
- Quality tiers: strong 0, moderate 0, exploratory 0, insufficient 8.
- Data sufficiency: 8/8 predictor rows pass minimum coverage/shape thresholds.
- Mean reliability score across predictors: 0.438.

## Sufficiency-Gated Pairs

- 2 predictor/outcome pairs were excluded from ranking/recommendation tables by hard sufficiency gates.
| Predictor | Included Subjects | Aligned Pairs | Blocking Reasons | Pair Report |
|-----------|------------------:|--------------:|------------------|------------|
| R&D Expenditure Per Capita (PPP) | 95 | 1995 | aligned-pair support below minimum (1995 < 2000) | [pair-predictor.derived.rd_expenditure_per_capita_ppp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md](pair-predictor.derived.rd_expenditure_per_capita_ppp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md) |
| R&D Share of Government Spending | 82 | 1722 | aligned-pair support below minimum (1722 < 2000) | [pair-predictor.derived.rd_share_of_gov_expenditure_pct__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md](pair-predictor.derived.rd_share_of_gov_expenditure_pct__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md) |

## Top Numeric Targets

- These are numeric target summaries from the highest-scoring predictor/outcome relationships.
- Treat them as evidence-weighted guidance, not deterministic causal prescriptions.

1. Military Share of Government Spending: decision target 9.950 % of government expenditure (support constrained); observed-support target 9.950 % of government expenditure; MED N/A; model optimum 9.048 % of government expenditure; evidence F; directional score 0.056.
2. Education Share of Government Spending: decision target 33.378 % of government expenditure (support constrained); observed-support target 33.378 % of government expenditure; MED 19.592 % of government expenditure; model optimum 19.440 % of government expenditure; evidence F; directional score 0.062.
3. Civilian Government Expenditure Per Capita (PPP): decision target 112.66 international $/person (support constrained); observed-support target 112.66 international $/person; MED N/A; model optimum 4471.6 international $/person; evidence F; directional score 0.069.
4. Government Expenditure Per Capita (PPP): decision target 138.29 international $/person (support constrained); observed-support target 138.29 international $/person; MED N/A; model optimum 4531.5 international $/person; evidence F; directional score 0.064.
5. Government Health Share of Government Spending: decision target 15.035 % of government expenditure (support constrained); observed-support target 15.035 % of government expenditure; MED N/A; model optimum 13.024 % of government expenditure; evidence F; directional score -0.122.

## Evidence Snapshot

| Predictor | Data Sufficiency | Reliability | Quality Tier | Evidence | Significance | Directional Score | Observed-Support Target | MED | Knee | Included Subjects | Pairs |
|-----------|-----------------|------------:|--------------|----------|-------------:|------------------:|------------------------:|----:|-----:|------------------:|------:|
| Military Share of Government Spending | sufficient | 0.474 (low) | insufficient | F | 0.193 | 0.056 | 9.950 % of government expenditure | N/A | 9.950 % of government expenditure | 126 | 2646 |
| Education Share of Government Spending | sufficient | 0.508 (low) | insufficient | F | 0.194 | 0.062 | 33.378 % of government expenditure | 19.592 % of government expenditure | 21.063 % of government expenditure | 134 | 2814 |
| Civilian Government Expenditure Per Capita (PPP) | sufficient | 0.367 (low) | insufficient | F | 0.191 | 0.069 | 112.66 international $/person | N/A | 5781.1 international $/person | 126 | 2646 |
| Government Expenditure Per Capita (PPP) | sufficient | 0.407 (low) | insufficient | F | 0.185 | 0.064 | 138.29 international $/person | N/A | 8422.5 international $/person | 147 | 3087 |
| Government Health Share of Government Spending | sufficient | 0.663 (moderate) | insufficient | F | 0.227 | -0.122 | 15.035 % of government expenditure | N/A | 15.035 % of government expenditure | 141 | 2961 |
| Education Expenditure Per Capita (PPP) | sufficient | 0.413 (low) | insufficient | F | 0.185 | 0.075 | 30.522 international $/person | N/A | 1237.4 international $/person | 165 | 3465 |
| Government Health Expenditure Per Capita (PPP) | sufficient | 0.351 (low) | insufficient | F | 0.220 | -0.050 | 6.995 international $/person | N/A | 869.53 international $/person | 179 | 3759 |
| Military Expenditure Per Capita (PPP) | sufficient | 0.324 (low) | insufficient | F | 0.197 | 0.053 | 8.665 international $/person | N/A | 340.45 international $/person | 159 | 3339 |

## Budget Allocation Signals

- These rows isolate budget-composition predictors (share of total government spending).
- Use this section to compare suggested allocation mix targets across sectors.

| Allocation Share Predictor | Decision Target Share | Robust Best Share (Trimmed) | Model Best (Diagnostics) | Raw-Robust Delta | Direction | Quality Tier | Pair Report |
|----------------------------|----------------------:|----------------------------:|-------------------------:|-----------------:|----------:|--------------|------------|
| Education Share of Government Spending | 33.378 % of government expenditure | 20.911 % of government expenditure | 19.440 % of government expenditure | 1.471 (+7.6%) | positive | insufficient | [pair-predictor.derived.education_share_of_gov_expenditure_pct__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md](pair-predictor.derived.education_share_of_gov_expenditure_pct__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md) |
| Government Health Share of Government Spending | 15.035 % of government expenditure | 14.852 % of government expenditure | 13.024 % of government expenditure | 1.828 (+14.0%) | negative | insufficient | [pair-predictor.derived.gov_health_share_of_gov_expenditure_pct__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md](pair-predictor.derived.gov_health_share_of_gov_expenditure_pct__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md) |
| Military Share of Government Spending | 9.950 % of government expenditure | 9.883 % of government expenditure | 9.048 % of government expenditure | 0.83424 (+9.2%) | positive | insufficient | [pair-predictor.derived.military_share_of_gov_expenditure_pct__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md](pair-predictor.derived.military_share_of_gov_expenditure_pct__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md) |

## Optimal Levels By Predictor

- This table is predictor-centric: each row shows key numeric target estimates.
- `Decision Target Level` is support-constrained (or robust fallback) and is the primary recommendation.
- `Model Best (Diagnostics)` is retained for technical comparison and can be extrapolative.
- `Model Outside Best Observed Bin?` means the unconstrained model target differs from the highest-outcome bin interval from binned summaries.

| Predictor | Decision Target Level | Decision Target Source | MED | Knee | Robust Best Level (Trimmed) | Model Best (Diagnostics) | Model Extrapolative? | Model Outside Best Observed Bin? | Model-Robust Delta | Decision Target PPP/Capita | Best Observed Range | Robust Best Range (Trimmed) | Best Observed PPP/Capita (p10-p90) | Best Observed Outcome Mean | Direction | Data Sufficiency | Reliability | Quality Tier | Pair Report |
|-----------|----------------------:|------------------------|----:|-----:|----------------------------:|-------------------------:|---------------------|-------------------------------|-------------------:|---------------------------:|--------------------:|---------------------------:|-----------------------------------:|---------------------------:|----------:|-----------------|------------:|--------------|------------|
| Civilian Government Expenditure Per Capita (PPP) | 112.66 international $/person | support constrained | N/A | 5781.1 international $/person | 305.21 international $/person | 4471.6 international $/person | no | yes | -4166.3 (-93.2%) | N/A | [7.604, 214.06) | [214.06, 506.71) | N/A | 1.110 | negative | sufficient | 0.367 (low) | insufficient | [pair-predictor.derived.gov_non_military_expenditure_per_capita_ppp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md](pair-predictor.derived.gov_non_military_expenditure_per_capita_ppp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md) |
| Education Expenditure Per Capita (PPP) | 30.522 international $/person | support constrained | N/A | 1237.4 international $/person | 62.367 international $/person | 744.31 international $/person | no | yes | -681.94 (-91.6%) | N/A | [9.238, 48.180) | [48.249, 82.428) | N/A | 1.097 | negative | sufficient | 0.413 (low) | insufficient | [pair-predictor.derived.education_expenditure_per_capita_ppp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md](pair-predictor.derived.education_expenditure_per_capita_ppp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md) |
| Education Share of Government Spending | 33.378 % of government expenditure | support constrained | 19.592 % of government expenditure | 21.063 % of government expenditure | 20.911 % of government expenditure | 19.440 % of government expenditure | no | yes | 1.471 (+7.6%) | N/A | [28.681, 66.668] | [20.190, 21.607) | N/A | 0.72663 | positive | sufficient | 0.508 (low) | insufficient | [pair-predictor.derived.education_share_of_gov_expenditure_pct__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md](pair-predictor.derived.education_share_of_gov_expenditure_pct__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md) |
| Government Expenditure Per Capita (PPP) | 138.29 international $/person | support constrained | N/A | 8422.5 international $/person | 716.19 international $/person | 4531.5 international $/person | no | yes | -3815.3 (-84.2%) | N/A | [20.664, 260.72) | [576.55, 888.95) | N/A | 1.070 | negative | sufficient | 0.407 (low) | insufficient | [pair-predictor.derived.gov_expenditure_per_capita_ppp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md](pair-predictor.derived.gov_expenditure_per_capita_ppp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md) |
| Government Health Expenditure Per Capita (PPP) | 6.995 international $/person | support constrained | N/A | 869.53 international $/person | 17.662 international $/person | 506.82 international $/person | no | yes | -489.16 (-96.5%) | N/A | [0.25914, 13.927) | [13.941, 22.120) | N/A | 1.064 | negative | sufficient | 0.351 (low) | insufficient | [pair-predictor.derived.gov_health_expenditure_per_capita_ppp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md](pair-predictor.derived.gov_health_expenditure_per_capita_ppp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md) |
| Government Health Share of Government Spending | 15.035 % of government expenditure | support constrained | N/A | 15.035 % of government expenditure | 14.852 % of government expenditure | 13.024 % of government expenditure | no | yes | 1.828 (+14.0%) | N/A | [0.93053, 5.930) | [14.275, 15.542) | N/A | 0.57112 | negative | sufficient | 0.663 (moderate) | insufficient | [pair-predictor.derived.gov_health_share_of_gov_expenditure_pct__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md](pair-predictor.derived.gov_health_share_of_gov_expenditure_pct__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md) |
| Military Expenditure Per Capita (PPP) | 8.665 international $/person | support constrained | N/A | 340.45 international $/person | 21.730 international $/person | 372.10 international $/person | no | yes | -350.37 (-94.2%) | N/A | [0.91749, 16.666) | [16.681, 26.916) | N/A | 0.96572 | negative | sufficient | 0.324 (low) | insufficient | [pair-predictor.derived.military_expenditure_per_capita_ppp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md](pair-predictor.derived.military_expenditure_per_capita_ppp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md) |
| Military Share of Government Spending | 9.950 % of government expenditure | support constrained | N/A | 9.950 % of government expenditure | 9.883 % of government expenditure | 9.048 % of government expenditure | no | yes | 0.83424 (+9.2%) | N/A | [16.650, 88.206] | [9.079, 10.774) | N/A | 0.63575 | positive | sufficient | 0.474 (low) | insufficient | [pair-predictor.derived.military_share_of_gov_expenditure_pct__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md](pair-predictor.derived.military_share_of_gov_expenditure_pct__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md) |

### Human-Readable Predictor Targets

- Civilian Government Expenditure Per Capita (PPP): decision target 112.66 international $/person (support constrained); MED N/A; diminishing-returns knee 5781.1 international $/person; robust sensitivity target 305.21 international $/person; model optimum 4471.6 international $/person (outside best observed bin range); sufficiency sufficient; reliability 0.367 (low); quality tier insufficient.
- Education Expenditure Per Capita (PPP): decision target 30.522 international $/person (support constrained); MED N/A; diminishing-returns knee 1237.4 international $/person; robust sensitivity target 62.367 international $/person; model optimum 744.31 international $/person (outside best observed bin range); sufficiency sufficient; reliability 0.413 (low); quality tier insufficient.
- Education Share of Government Spending: decision target 33.378 % of government expenditure (support constrained); MED 19.592 % of government expenditure; diminishing-returns knee 21.063 % of government expenditure; robust sensitivity target 20.911 % of government expenditure; model optimum 19.440 % of government expenditure (outside best observed bin range); sufficiency sufficient; reliability 0.508 (low); quality tier insufficient.
- Government Expenditure Per Capita (PPP): decision target 138.29 international $/person (support constrained); MED N/A; diminishing-returns knee 8422.5 international $/person; robust sensitivity target 716.19 international $/person; model optimum 4531.5 international $/person (outside best observed bin range); sufficiency sufficient; reliability 0.407 (low); quality tier insufficient.
- Government Health Expenditure Per Capita (PPP): decision target 6.995 international $/person (support constrained); MED N/A; diminishing-returns knee 869.53 international $/person; robust sensitivity target 17.662 international $/person; model optimum 506.82 international $/person (outside best observed bin range); sufficiency sufficient; reliability 0.351 (low); quality tier insufficient.
- Government Health Share of Government Spending: decision target 15.035 % of government expenditure (support constrained); MED N/A; diminishing-returns knee 15.035 % of government expenditure; robust sensitivity target 14.852 % of government expenditure; model optimum 13.024 % of government expenditure (outside best observed bin range); sufficiency sufficient; reliability 0.663 (moderate); quality tier insufficient.
- Military Expenditure Per Capita (PPP): decision target 8.665 international $/person (support constrained); MED N/A; diminishing-returns knee 340.45 international $/person; robust sensitivity target 21.730 international $/person; model optimum 372.10 international $/person (outside best observed bin range); sufficiency sufficient; reliability 0.324 (low); quality tier insufficient.
- Military Share of Government Spending: decision target 9.950 % of government expenditure (support constrained); MED N/A; diminishing-returns knee 9.950 % of government expenditure; robust sensitivity target 9.883 % of government expenditure; model optimum 9.048 % of government expenditure (outside best observed bin range); sufficiency sufficient; reliability 0.474 (low); quality tier insufficient.

## Plain-Language Summary

- Highest-ranked row is Civilian Government Expenditure Per Capita (PPP) with direction negative.
- This outcome page includes 8 predictor studies; 0 pass the configured adjusted-alpha threshold.
- Data sufficiency: 8/8 rows are sufficient; mean reliability is 0.438.
- Quality tiers in this outcome: strong 0, moderate 0, exploratory 0, insufficient 8.
- Decision targets come from support-constrained response-curve diagnostics; model optima are kept for technical comparison only.

## Appendix: Technical Ranking Details

| Rank | Predictor | Score | Confidence | Adj p | Evidence | Quality Tier | Direction | Dir Score | Units | Pairs | Optimal High | Optimal Low | Optimal Daily | Pair Report |
|-----:|-----------|------:|-----------:|------:|---------:|--------------|----------:|----------:|------:|------:|-------------:|------------:|--------------:|------------|
| 1 | Military Share of Government Spending | 0.6582 | 0.4948 | 0.8151 | F | insufficient | positive | 0.0560 | 126 | 2646 | 9.048 | 8.701 | 9.048 | [pair-predictor.derived.military_share_of_gov_expenditure_pct__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md](pair-predictor.derived.military_share_of_gov_expenditure_pct__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md) |
| 2 | Education Share of Government Spending | 0.6399 | 0.4962 | 0.8151 | F | insufficient | positive | 0.0623 | 134 | 2814 | 19.440 | 19.214 | 19.440 | [pair-predictor.derived.education_share_of_gov_expenditure_pct__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md](pair-predictor.derived.education_share_of_gov_expenditure_pct__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md) |
| 3 | Civilian Government Expenditure Per Capita (PPP) | 0.5856 | 0.4958 | 0.8151 | F | insufficient | negative | 0.0692 | 126 | 2646 | 4471.558 | 4689.740 | 4471.558 | [pair-predictor.derived.gov_non_military_expenditure_per_capita_ppp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md](pair-predictor.derived.gov_non_military_expenditure_per_capita_ppp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md) |
| 4 | Government Expenditure Per Capita (PPP) | 0.5317 | 0.4926 | 0.8151 | F | insufficient | negative | 0.0636 | 147 | 3087 | 4531.514 | 4726.013 | 4531.514 | [pair-predictor.derived.gov_expenditure_per_capita_ppp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md](pair-predictor.derived.gov_expenditure_per_capita_ppp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md) |
| 5 | Government Health Share of Government Spending | 0.4166 | 0.5204 | 0.8151 | F | insufficient | negative | -0.1222 | 141 | 2961 | 13.024 | 13.165 | 13.024 | [pair-predictor.derived.gov_health_share_of_gov_expenditure_pct__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md](pair-predictor.derived.gov_health_share_of_gov_expenditure_pct__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md) |
| 6 | Education Expenditure Per Capita (PPP) | 0.3677 | 0.4945 | 0.8151 | F | insufficient | negative | 0.0753 | 165 | 3465 | 744.310 | 783.164 | 744.310 | [pair-predictor.derived.education_expenditure_per_capita_ppp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md](pair-predictor.derived.education_expenditure_per_capita_ppp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md) |
| 7 | Government Health Expenditure Per Capita (PPP) | 0.2525 | 0.5066 | 0.8151 | F | insufficient | negative | -0.0503 | 179 | 3759 | 506.824 | 543.597 | 506.824 | [pair-predictor.derived.gov_health_expenditure_per_capita_ppp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md](pair-predictor.derived.gov_health_expenditure_per_capita_ppp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md) |
| 8 | Military Expenditure Per Capita (PPP) | 0.2516 | 0.4963 | 0.8151 | F | insufficient | negative | 0.0525 | 159 | 3339 | 372.099 | 393.871 | 372.099 | [pair-predictor.derived.military_expenditure_per_capita_ppp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md](pair-predictor.derived.military_expenditure_per_capita_ppp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md) |
