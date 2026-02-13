# Outcome Mega Study: outcome.who.healthy_life_expectancy_years

- Outcome label: Healthy Life Expectancy (HALE)
- Multiple testing: benjamini_hochberg
- Alpha: 0.05
- Tests: 6
- Note: `Adj p` is derived from an internal uncertainty proxy, not a classical hypothesis-test p-value.

## Lead Takeaway

- Top-ranked actionable predictor for Healthy Life Expectancy (HALE): Government Health Expenditure (% GDP).
- Estimated best level: 3.004 % GDP.
- Approximate PPP per-capita equivalent of that level: 264.29 international $/person.
- Statistical status: no predictors pass adjusted-alpha threshold; treat these as exploratory signals.

## Actionable Takeaways (Top Predictors)

- Rows are filtered for clarity (coverage + directional signal) when possible; fallback is top-ranked predictors.

| Model Rank | Predictor | Estimated Best Level | Estimated Best PPP/Capita | Best Observed Range | Best Observed PPP/Capita (p10-p90) | Best Observed Outcome Mean | Direction | Pair Report |
|-----------:|-----------|---------------------:|--------------------------:|--------------------:|-----------------------------------:|---------------------------:|----------:|------------|
| 1 | Government Health Expenditure (% GDP) | 3.004 % GDP | 264.29 intl $/person | [6.123, 10.976] | [1296.4, 4208.6] | 68.454 | negative | [pair-predictor.wb.gov_health_expenditure_pct_gdp__outcome.who.healthy_life_expectancy_years.md](pair-predictor.wb.gov_health_expenditure_pct_gdp__outcome.who.healthy_life_expectancy_years.md) |
| 2 | Government Expenditure (% GDP) | 25.417 % GDP | 2491.5 intl $/person | [34.249, 39.825) | [2799.1, 23010.0] | 66.285 | negative | [pair-predictor.wb.gov_expenditure_pct_gdp__outcome.who.healthy_life_expectancy_years.md](pair-predictor.wb.gov_expenditure_pct_gdp__outcome.who.healthy_life_expectancy_years.md) |
| 4 | Education Expenditure (% GDP) | 4.475 % GDP | 441.95 intl $/person | [4.680, 5.157) | [183.22, 2543.8] | 64.233 | negative | [pair-predictor.wb.education_expenditure_pct_gdp__outcome.who.healthy_life_expectancy_years.md](pair-predictor.wb.education_expenditure_pct_gdp__outcome.who.healthy_life_expectancy_years.md) |
| 5 | R&D Expenditure (% GDP) | 0.98499 % GDP | 164.11 intl $/person | [2.405, 5.347] | [851.10, 1825.7] | 69.663 | negative | [pair-predictor.wb.rd_expenditure_pct_gdp__outcome.who.healthy_life_expectancy_years.md](pair-predictor.wb.rd_expenditure_pct_gdp__outcome.who.healthy_life_expectancy_years.md) |
| 6 | Military Expenditure (% GDP) | 2.039 % GDP | 199.12 intl $/person | [1.324, 1.522) | [26.087, 586.22] | 61.865 | positive | [pair-predictor.wb.military_expenditure_pct_gdp__outcome.who.healthy_life_expectancy_years.md](pair-predictor.wb.military_expenditure_pct_gdp__outcome.who.healthy_life_expectancy_years.md) |

## Plain-Language Summary

- Top-ranked predictor is Government Health Expenditure (% GDP) with score 0.959 and direction negative.
- This outcome page includes 6 predictor studies and 0 pass the configured adjusted-alpha threshold.
- Ranking combines effect size, directional score, confidence, and multiple-testing-adjusted uncertainty.

## Appendix: Technical Ranking Details

| Rank | Predictor | Score | Confidence | Adj p | Evidence | Direction | Dir Score | Units | Pairs | Optimal High | Optimal Low | Optimal Daily | Pair Report |
|-----:|-----------|------:|-----------:|------:|---------:|----------:|----------:|------:|------:|-------------:|------------:|--------------:|------------|
| 1 | Government Health Expenditure (% GDP) | 0.9585 | 0.8385 | 0.0998 | A | negative | -0.1356 | 181 | 11946 | 3.004 | 2.806 | 3.004 | [pair-predictor.wb.gov_health_expenditure_pct_gdp__outcome.who.healthy_life_expectancy_years.md](pair-predictor.wb.gov_health_expenditure_pct_gdp__outcome.who.healthy_life_expectancy_years.md) |
| 2 | Government Expenditure (% GDP) | 0.8409 | 0.8161 | 0.0998 | A | negative | -0.0742 | 147 | 9702 | 25.417 | 28.396 | 25.417 | [pair-predictor.wb.gov_expenditure_pct_gdp__outcome.who.healthy_life_expectancy_years.md](pair-predictor.wb.gov_expenditure_pct_gdp__outcome.who.healthy_life_expectancy_years.md) |
| 3 | Tax Revenue (% GDP) | 0.7172 | 0.8144 | 0.0998 | A | positive | 0.0216 | 146 | 9636 | 0.000 | 0.000 | 0.000 | [pair-predictor.wb.tax_revenue_pct_gdp__outcome.who.healthy_life_expectancy_years.md](pair-predictor.wb.tax_revenue_pct_gdp__outcome.who.healthy_life_expectancy_years.md) |
| 4 | Education Expenditure (% GDP) | 0.5966 | 0.8201 | 0.0998 | A | negative | -0.0542 | 169 | 11154 | 4.475 | 4.437 | 4.475 | [pair-predictor.wb.education_expenditure_pct_gdp__outcome.who.healthy_life_expectancy_years.md](pair-predictor.wb.education_expenditure_pct_gdp__outcome.who.healthy_life_expectancy_years.md) |
| 5 | R&D Expenditure (% GDP) | 0.5749 | 0.8307 | 0.0998 | A | negative | -0.0987 | 97 | 6402 | 0.985 | 0.900 | 0.985 | [pair-predictor.wb.rd_expenditure_pct_gdp__outcome.who.healthy_life_expectancy_years.md](pair-predictor.wb.rd_expenditure_pct_gdp__outcome.who.healthy_life_expectancy_years.md) |
| 6 | Military Expenditure (% GDP) | 0.4251 | 0.8223 | 0.0998 | A | positive | 0.0648 | 162 | 10692 | 2.039 | 2.215 | 2.039 | [pair-predictor.wb.military_expenditure_pct_gdp__outcome.who.healthy_life_expectancy_years.md](pair-predictor.wb.military_expenditure_pct_gdp__outcome.who.healthy_life_expectancy_years.md) |
