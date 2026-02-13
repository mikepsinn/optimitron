# Government Size Analysis: OECD Panel (2000-2022)

## Summary

Evidence-weighted N-of-1 analysis suggests an optimal modeled spending share of **40.4% of GDP** (band: **38.0% - 46.5%**).

- **US latest modeled share (2022):** 50.8%
- **US gap to central estimate:** +10.3 percentage points
- **US status vs inferred band:** above optimal band

## Predictor Definition

Modeled Public Spending Basket (% GDP) =
- Health spending % GDP
- Education spending % GDP
- Military spending % GDP
- Social spending % GDP
- R&D spending % GDP

This is a large OECD spending basket, not full general-government spending.

## Data Coverage

- Jurisdictions: 23
- Years: 2000-2022
- Country-year observations: 529

## Spending Levels vs Typical Outcomes

Primary welfare outcomes are median healthy life years and real after-tax median income growth.
Cross-country panel proxies are used here because direct country-year series for those metrics are incomplete in-repo:
- Healthy life years level proxy: Life expectancy at birth
- Healthy life years growth proxy: Life expectancy YoY change
- Real after-tax median income level proxy: GDP per capita PPP level
- Real after-tax median income growth proxy: Real GDP per capita YoY growth

| Spending Level (% GDP) | Country-Years | Jurisdictions | Typical Healthy Life Years (proxy level) | Typical Healthy Life Years Growth (proxy) | Typical Real After-Tax Median Income (proxy level) | Typical Real After-Tax Median Income Growth (proxy) |
|------------------------|-------------:|--------------:|-----------------------------------------:|-------------------------------------------:|----------------------------------------------------:|-----------------------------------------------------:|
| <25% | 15 | 2 | 78.8 | +0.400 | $29,330 | +4.92% |
| 25-30% | 18 | 2 | 80.4 | +0.400 | $38,855 | +3.20% |
| 30-35% | 74 | 10 | 79.5 | +0.200 | $32,410 | +2.04% |
| 35-40% | 142 | 16 | 81.3 | +0.200 | $37,720 | +1.57% |
| 40-45% | 126 | 16 | 80.8 | +0.200 | $36,250 | +1.09% |
| 45-50% | 108 | 13 | 80.6 | +0.200 | $39,295 | +1.34% |
| >=50% | 46 | 10 | 81.0 | +0.100 | $38,535 | +1.05% |

## Outcome-Level Results

| Outcome | Direction | Weight | N | +/- | Mean r | Mean % Change | Optimal %GDP (Median) | IQR | Confidence |
|---------|-----------|-------:|---:|-----|-------:|--------------:|----------------------:|-----|------------|
| Life Expectancy | Higher is better | 0.35 | 23 | 21/2 | 0.663 | +2.03% | 40.7 | 38.3-46.5 | B (0.70) |
| GDP per Capita (PPP) | Higher is better | 0.35 | 23 | 21/2 | 0.565 | +7.31% | 40.2 | 38.2-46.9 | B (0.67) |
| Infant Mortality | Lower is better (negated) | 0.15 | 23 | 21/2 | 0.688 | -19.76% | 40.6 | 38.2-47.0 | B (0.72) |
| Income Inequality (Gini) | Lower is better (negated) | 0.15 | 22 | 10/12 | -0.030 | +0.91% | 40.1 | 35.3-44.0 | D (0.24) |

## Method

- Run N-of-1 longitudinal causal analysis within each jurisdiction (2000-2022).
- Estimate per-jurisdiction optimal predictor value from high-outcome periods.
- Aggregate outcome-level medians and uncertainty bands (IQR).
- Combine outcomes via outcome-weighted average with evidence modulation (0.2 + 0.8*confidence).

## Limitations

- Predictor is a spending basket available in this dataset, not total government spending.
- OECD high-income panel may not generalize globally.
- Macro outcomes are affected by time-varying confounders (wars, crises, pandemics).
