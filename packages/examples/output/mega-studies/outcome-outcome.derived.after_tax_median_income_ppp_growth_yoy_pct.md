# Outcome Mega Study: outcome.derived.after_tax_median_income_ppp_growth_yoy_pct

- Outcome label: After-Tax Median Income Growth (YoY %)
- Multiple testing: benjamini_hochberg
- Alpha: 0.05
- Tests: 6
- Note: `Adj p` is derived from an internal uncertainty proxy, not a classical hypothesis-test p-value.
- Note: After-tax median income is currently proxied by World Bank GNI per-capita PPP in this report set.

## Lead Takeaway

- Top-ranked actionable predictor for After-Tax Median Income Growth (YoY %): Government Expenditure (% GDP).
- Estimated best level: 28.903 % GDP.
- Approximate PPP per-capita equivalent of that level: 2597.5 international $/person.
- Statistical status: no predictors pass adjusted-alpha threshold; treat these as exploratory signals.

## Actionable Takeaways (Top Predictors)

- Rows are filtered for clarity (coverage + directional signal) when possible; fallback is top-ranked predictors.

| Model Rank | Predictor | Estimated Best Level | Estimated Best PPP/Capita | Best Observed Range | Best Observed PPP/Capita (p10-p90) | Best Observed Outcome Mean | Direction | Pair Report |
|-----------:|-----------|---------------------:|--------------------------:|--------------------:|-----------------------------------:|---------------------------:|----------:|------------|
| 1 | Government Expenditure (% GDP) | 28.903 % GDP | 2597.5 intl $/person | [34.597, 40.103) | [2519.0, 18951.7] | 5.127 | positive | [pair-predictor.wb.gov_expenditure_pct_gdp__outcome.derived.after_tax_median_income_ppp_growth_yoy_pct.md](pair-predictor.wb.gov_expenditure_pct_gdp__outcome.derived.after_tax_median_income_ppp_growth_yoy_pct.md) |
| 2 | Government Health Expenditure (% GDP) | 3.158 % GDP | 242.50 intl $/person | [3.811, 4.798) | [178.73, 1263.8] | 4.922 | positive | [pair-predictor.wb.gov_health_expenditure_pct_gdp__outcome.derived.after_tax_median_income_ppp_growth_yoy_pct.md](pair-predictor.wb.gov_health_expenditure_pct_gdp__outcome.derived.after_tax_median_income_ppp_growth_yoy_pct.md) |
| 3 | Tax Revenue (% GDP) | 2.710 % GDP | 240.07 intl $/person | [1.87e-5, 2.25e-5) | [5.93e-4, 0.00761] | 5.787 | negative | [pair-predictor.wb.tax_revenue_pct_gdp__outcome.derived.after_tax_median_income_ppp_growth_yoy_pct.md](pair-predictor.wb.tax_revenue_pct_gdp__outcome.derived.after_tax_median_income_ppp_growth_yoy_pct.md) |
| 4 | R&D Expenditure (% GDP) | 0.96252 % GDP | 136.04 intl $/person | [0.19763, 0.31143) | [8.082, 50.121] | 5.705 | positive | [pair-predictor.wb.rd_expenditure_pct_gdp__outcome.derived.after_tax_median_income_ppp_growth_yoy_pct.md](pair-predictor.wb.rd_expenditure_pct_gdp__outcome.derived.after_tax_median_income_ppp_growth_yoy_pct.md) |
| 5 | Military Expenditure (% GDP) | 2.105 % GDP | 174.70 intl $/person | [1.479, 1.704) | [27.612, 491.77] | 5.770 | positive | [pair-predictor.wb.military_expenditure_pct_gdp__outcome.derived.after_tax_median_income_ppp_growth_yoy_pct.md](pair-predictor.wb.military_expenditure_pct_gdp__outcome.derived.after_tax_median_income_ppp_growth_yoy_pct.md) |

## Plain-Language Summary

- Top-ranked predictor is Government Expenditure (% GDP) with score 0.921 and direction positive.
- This outcome page includes 6 predictor studies and 0 pass the configured adjusted-alpha threshold.
- Ranking combines effect size, directional score, confidence, and multiple-testing-adjusted uncertainty.

## Appendix: Technical Ranking Details

| Rank | Predictor | Score | Confidence | Adj p | Evidence | Direction | Dir Score | Units | Pairs | Optimal High | Optimal Low | Optimal Daily | Pair Report |
|-----:|-----------|------:|-----------:|------:|---------:|----------:|----------:|------:|------:|-------------:|------------:|--------------:|------------|
| 1 | Government Expenditure (% GDP) | 0.9205 | 0.7621 | 0.3291 | B | positive | 0.2129 | 175 | 5740 | 28.903 | 25.859 | 28.903 | [pair-predictor.wb.gov_expenditure_pct_gdp__outcome.derived.after_tax_median_income_ppp_growth_yoy_pct.md](pair-predictor.wb.gov_expenditure_pct_gdp__outcome.derived.after_tax_median_income_ppp_growth_yoy_pct.md) |
| 2 | Government Health Expenditure (% GDP) | 0.5438 | 0.7521 | 0.3291 | B | positive | 0.2051 | 229 | 7356 | 3.158 | 3.148 | 3.158 | [pair-predictor.wb.gov_health_expenditure_pct_gdp__outcome.derived.after_tax_median_income_ppp_growth_yoy_pct.md](pair-predictor.wb.gov_health_expenditure_pct_gdp__outcome.derived.after_tax_median_income_ppp_growth_yoy_pct.md) |
| 3 | Tax Revenue (% GDP) | 0.5101 | 0.7488 | 0.3291 | B | negative | -0.1989 | 182 | 5975 | 2.710 | 2.787 | 2.710 | [pair-predictor.wb.tax_revenue_pct_gdp__outcome.derived.after_tax_median_income_ppp_growth_yoy_pct.md](pair-predictor.wb.tax_revenue_pct_gdp__outcome.derived.after_tax_median_income_ppp_growth_yoy_pct.md) |
| 4 | R&D Expenditure (% GDP) | 0.5071 | 0.7397 | 0.3291 | C | positive | 0.1857 | 124 | 4032 | 0.963 | 0.964 | 0.963 | [pair-predictor.wb.rd_expenditure_pct_gdp__outcome.derived.after_tax_median_income_ppp_growth_yoy_pct.md](pair-predictor.wb.rd_expenditure_pct_gdp__outcome.derived.after_tax_median_income_ppp_growth_yoy_pct.md) |
| 5 | Military Expenditure (% GDP) | 0.3064 | 0.7190 | 0.3291 | C | positive | 0.0567 | 202 | 6439 | 2.105 | 2.251 | 2.105 | [pair-predictor.wb.military_expenditure_pct_gdp__outcome.derived.after_tax_median_income_ppp_growth_yoy_pct.md](pair-predictor.wb.military_expenditure_pct_gdp__outcome.derived.after_tax_median_income_ppp_growth_yoy_pct.md) |
| 6 | Education Expenditure (% GDP) | 0.2938 | 0.7038 | 0.3291 | C | neutral | -0.0124 | 218 | 6955 | 4.185 | 4.318 | 4.185 | [pair-predictor.wb.education_expenditure_pct_gdp__outcome.derived.after_tax_median_income_ppp_growth_yoy_pct.md](pair-predictor.wb.education_expenditure_pct_gdp__outcome.derived.after_tax_median_income_ppp_growth_yoy_pct.md) |
