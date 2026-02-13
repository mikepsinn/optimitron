# Outcome Mega Study: outcome.derived.after_tax_median_income_ppp

- Outcome label: After-Tax Median Income (PPP)
- Multiple testing: benjamini_hochberg
- Alpha: 0.05
- Tests: 6
- Note: `Adj p` is derived from an internal uncertainty proxy, not a classical hypothesis-test p-value.
- Note: After-tax median income is currently proxied by World Bank GNI per-capita PPP in this report set.

## Lead Takeaway

- Top-ranked actionable predictor for After-Tax Median Income (PPP): R&D Expenditure (% GDP).
- Estimated best level: 0.99755 % GDP.
- Approximate PPP per-capita equivalent of that level: 125.77 international $/person.
- Statistical status: no predictors pass adjusted-alpha threshold; treat these as exploratory signals.

## Actionable Takeaways (Top Predictors)

- Rows are filtered for clarity (coverage + directional signal) when possible; fallback is top-ranked predictors.

| Model Rank | Predictor | Estimated Best Level | Estimated Best PPP/Capita | Best Observed Range | Best Observed PPP/Capita (p10-p90) | Best Observed Outcome Mean | Direction | Pair Report |
|-----------:|-----------|---------------------:|--------------------------:|--------------------:|-----------------------------------:|---------------------------:|----------:|------------|
| 1 | R&D Expenditure (% GDP) | 0.99755 % GDP | 125.77 intl $/person | [2.216, 4.749] | [415.64, 1583.4] | 40116.5 | positive | [pair-predictor.wb.rd_expenditure_pct_gdp__outcome.derived.after_tax_median_income_ppp.md](pair-predictor.wb.rd_expenditure_pct_gdp__outcome.derived.after_tax_median_income_ppp.md) |
| 2 | Tax Revenue (% GDP) | 2.694 % GDP | 212.76 intl $/person | [2.28e-5, 0.00513) | [6.64e-4, 0.01500] | 21150.6 | positive | [pair-predictor.wb.tax_revenue_pct_gdp__outcome.derived.after_tax_median_income_ppp.md](pair-predictor.wb.tax_revenue_pct_gdp__outcome.derived.after_tax_median_income_ppp.md) |
| 3 | Government Health Expenditure (% GDP) | 3.352 % GDP | 263.24 intl $/person | [6.266, 22.254] | [501.09, 4801.4] | 35040.1 | positive | [pair-predictor.wb.gov_health_expenditure_pct_gdp__outcome.derived.after_tax_median_income_ppp.md](pair-predictor.wb.gov_health_expenditure_pct_gdp__outcome.derived.after_tax_median_income_ppp.md) |
| 4 | Education Expenditure (% GDP) | 4.353 % GDP | 321.40 intl $/person | [4.863, 5.432) | [176.97, 2325.3] | 23684.7 | positive | [pair-predictor.wb.education_expenditure_pct_gdp__outcome.derived.after_tax_median_income_ppp.md](pair-predictor.wb.education_expenditure_pct_gdp__outcome.derived.after_tax_median_income_ppp.md) |
| 5 | Government Expenditure (% GDP) | 26.782 % GDP | 2176.7 intl $/person | [34.154, 39.858) | [2450.5, 17750.2] | 28954.9 | negative | [pair-predictor.wb.gov_expenditure_pct_gdp__outcome.derived.after_tax_median_income_ppp.md](pair-predictor.wb.gov_expenditure_pct_gdp__outcome.derived.after_tax_median_income_ppp.md) |

## Plain-Language Summary

- Top-ranked predictor is R&D Expenditure (% GDP) with score 0.879 and direction positive.
- This outcome page includes 6 predictor studies and 0 pass the configured adjusted-alpha threshold.
- Ranking combines effect size, directional score, confidence, and multiple-testing-adjusted uncertainty.

## Appendix: Technical Ranking Details

| Rank | Predictor | Score | Confidence | Adj p | Evidence | Direction | Dir Score | Units | Pairs | Optimal High | Optimal Low | Optimal Daily | Pair Report |
|-----:|-----------|------:|-----------:|------:|---------:|----------:|----------:|------:|------:|-------------:|------------:|--------------:|------------|
| 1 | R&D Expenditure (% GDP) | 0.8788 | 0.8136 | 0.1378 | A | positive | 0.1087 | 124 | 4156 | 0.998 | 0.811 | 0.998 | [pair-predictor.wb.rd_expenditure_pct_gdp__outcome.derived.after_tax_median_income_ppp.md](pair-predictor.wb.rd_expenditure_pct_gdp__outcome.derived.after_tax_median_income_ppp.md) |
| 2 | Tax Revenue (% GDP) | 0.7908 | 0.8117 | 0.1378 | A | positive | 0.1394 | 182 | 6157 | 2.694 | 2.830 | 2.694 | [pair-predictor.wb.tax_revenue_pct_gdp__outcome.derived.after_tax_median_income_ppp.md](pair-predictor.wb.tax_revenue_pct_gdp__outcome.derived.after_tax_median_income_ppp.md) |
| 3 | Government Health Expenditure (% GDP) | 0.7572 | 0.8017 | 0.1378 | A | positive | 0.0558 | 229 | 7585 | 3.352 | 2.836 | 3.352 | [pair-predictor.wb.gov_health_expenditure_pct_gdp__outcome.derived.after_tax_median_income_ppp.md](pair-predictor.wb.gov_health_expenditure_pct_gdp__outcome.derived.after_tax_median_income_ppp.md) |
| 4 | Education Expenditure (% GDP) | 0.7351 | 0.8063 | 0.1378 | A | positive | 0.1157 | 218 | 7173 | 4.353 | 4.134 | 4.353 | [pair-predictor.wb.education_expenditure_pct_gdp__outcome.derived.after_tax_median_income_ppp.md](pair-predictor.wb.education_expenditure_pct_gdp__outcome.derived.after_tax_median_income_ppp.md) |
| 5 | Government Expenditure (% GDP) | 0.6279 | 0.7955 | 0.1378 | A | negative | -0.0500 | 175 | 5915 | 26.782 | 28.409 | 26.782 | [pair-predictor.wb.gov_expenditure_pct_gdp__outcome.derived.after_tax_median_income_ppp.md](pair-predictor.wb.gov_expenditure_pct_gdp__outcome.derived.after_tax_median_income_ppp.md) |
| 6 | Military Expenditure (% GDP) | 0.5545 | 0.8181 | 0.1378 | A | negative | -0.1549 | 202 | 6641 | 1.921 | 2.758 | 1.921 | [pair-predictor.wb.military_expenditure_pct_gdp__outcome.derived.after_tax_median_income_ppp.md](pair-predictor.wb.military_expenditure_pct_gdp__outcome.derived.after_tax_median_income_ppp.md) |
