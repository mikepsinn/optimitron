# Outcome Mega Study: outcome.derived.healthy_life_expectancy_growth_yoy_pct

- Outcome label: Healthy Life Expectancy Growth (YoY %)
- Multiple testing: benjamini_hochberg
- Alpha: 0.05
- Tests: 6
- Note: `Adj p` is derived from an internal uncertainty proxy, not a classical hypothesis-test p-value.

## Lead Takeaway

- Top-ranked actionable predictor for Healthy Life Expectancy Growth (YoY %): R&D Expenditure (% GDP).
- Estimated best level: 0.78311 % GDP.
- Approximate PPP per-capita equivalent of that level: 127.78 international $/person.
- Statistical status: no predictors pass adjusted-alpha threshold; treat these as exploratory signals.

## Actionable Takeaways (Top Predictors)

- Rows are filtered for clarity (coverage + directional signal) when possible; fallback is top-ranked predictors.

| Model Rank | Predictor | Estimated Best Level | Estimated Best PPP/Capita | Best Observed Range | Best Observed PPP/Capita (p10-p90) | Best Observed Outcome Mean | Direction | Pair Report |
|-----------:|-----------|---------------------:|--------------------------:|--------------------:|-----------------------------------:|---------------------------:|----------:|------------|
| 1 | R&D Expenditure (% GDP) | 0.78311 % GDP | 127.78 intl $/person | [0.24482, 0.37191) | [9.660, 68.415] | 0.28504 | negative | [pair-predictor.wb.rd_expenditure_pct_gdp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md](pair-predictor.wb.rd_expenditure_pct_gdp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md) |
| 2 | Education Expenditure (% GDP) | 4.430 % GDP | 353.74 intl $/person | [0.00000, 2.097) | [11.715, 113.87] | 0.80303 | positive | [pair-predictor.wb.education_expenditure_pct_gdp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md](pair-predictor.wb.education_expenditure_pct_gdp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md) |
| 3 | Government Expenditure (% GDP) | 26.190 % GDP | 2754.2 intl $/person | [2.806, 11.693) | [81.781, 1871.0] | 0.86639 | positive | [pair-predictor.wb.gov_expenditure_pct_gdp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md](pair-predictor.wb.gov_expenditure_pct_gdp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md) |
| 4 | Tax Revenue (% GDP) | 3.26e-4 % GDP | 0.03427 intl $/person | [5.13e-12, 1.00e-5) | [1.25e-7, 2.53e-4] | 0.42876 | positive | [pair-predictor.wb.tax_revenue_pct_gdp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md](pair-predictor.wb.tax_revenue_pct_gdp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md) |

## Plain-Language Summary

- Top-ranked predictor is R&D Expenditure (% GDP) with score 0.730 and direction negative.
- This outcome page includes 6 predictor studies and 0 pass the configured adjusted-alpha threshold.
- Ranking combines effect size, directional score, confidence, and multiple-testing-adjusted uncertainty.

## Appendix: Technical Ranking Details

| Rank | Predictor | Score | Confidence | Adj p | Evidence | Direction | Dir Score | Units | Pairs | Optimal High | Optimal Low | Optimal Daily | Pair Report |
|-----:|-----------|------:|-----------:|------:|---------:|----------:|----------:|------:|------:|-------------:|------------:|--------------:|------------|
| 1 | R&D Expenditure (% GDP) | 0.7301 | 0.5228 | 0.8385 | F | negative | -0.0866 | 97 | 2037 | 0.783 | 0.832 | 0.783 | [pair-predictor.wb.rd_expenditure_pct_gdp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md](pair-predictor.wb.rd_expenditure_pct_gdp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md) |
| 2 | Education Expenditure (% GDP) | 0.4544 | 0.4998 | 0.8385 | F | positive | 0.0612 | 169 | 3549 | 4.430 | 4.498 | 4.430 | [pair-predictor.wb.education_expenditure_pct_gdp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md](pair-predictor.wb.education_expenditure_pct_gdp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md) |
| 3 | Government Expenditure (% GDP) | 0.4430 | 0.4995 | 0.8385 | F | positive | 0.0627 | 147 | 3087 | 26.190 | 25.204 | 26.190 | [pair-predictor.wb.gov_expenditure_pct_gdp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md](pair-predictor.wb.gov_expenditure_pct_gdp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md) |
| 4 | Tax Revenue (% GDP) | 0.3927 | 0.4906 | 0.8385 | F | positive | 0.1206 | 146 | 3066 | 0.000 | 0.000 | 0.000 | [pair-predictor.wb.tax_revenue_pct_gdp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md](pair-predictor.wb.tax_revenue_pct_gdp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md) |
| 5 | Government Health Expenditure (% GDP) | 0.3796 | 0.5013 | 0.8385 | F | negative | -0.0272 | 181 | 3801 | 2.933 | 3.038 | 2.933 | [pair-predictor.wb.gov_health_expenditure_pct_gdp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md](pair-predictor.wb.gov_health_expenditure_pct_gdp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md) |
| 6 | Military Expenditure (% GDP) | 0.1859 | 0.4866 | 0.8385 | F | negative | -0.0214 | 162 | 3402 | 2.052 | 2.056 | 2.052 | [pair-predictor.wb.military_expenditure_pct_gdp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md](pair-predictor.wb.military_expenditure_pct_gdp__outcome.derived.healthy_life_expectancy_growth_yoy_pct.md) |
