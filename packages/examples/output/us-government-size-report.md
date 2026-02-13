# Government Size Analysis: World Bank Panel (1990-2023)

## Summary

Evidence-weighted N-of-1 analysis suggests an optimal government spending share of **32.1% of GDP** (band: **21.5% - 37.8%**).

- **US latest spending share (2023):** 24.9%
- **US gap to central estimate:** -7.2 percentage points
- **US status vs inferred band:** within optimal band

## Predictor Definition

Government Expenditure (% GDP):
- World Bank WDI `GC.XPN.TOTL.GD.ZS`
- Includes total general government spending share relative to GDP (not category-level decomposition).

## Data Coverage

- Jurisdictions: 47
- Years: 1990-2023
- Country-year observations: 1402

## Temporal Sensitivity (Start Year)

All scenarios use the same methodology and countries where data is available; only the start year changes.

| Start Year | End Year | Country-Years | Jurisdictions | Optimal % GDP | Inferred Band | US % GDP | US Status |
|-----------:|---------:|--------------:|--------------:|--------------:|--------------|---------:|----------|
| 1990 | 2023 | 1402 | 47 | 32.1 | 21.5-37.8 | 24.9 | within optimal band (primary) |
| 1995 | 2023 | 1233 | 47 | 32.6 | 22.2-38.6 | 24.9 | within optimal band |
| 2000 | 2023 | 1036 | 47 | 32.7 | 23.1-38.7 | 24.9 | within optimal band |

## Spending Levels vs Typical Outcomes

Primary welfare outcomes are median healthy life years and real after-tax median income growth.
Cross-country panel proxies are used here because direct country-year series for those metrics are incomplete in-repo:
- Healthy life years level proxy: Life expectancy at birth
- Healthy life years growth proxy: Life expectancy YoY change
- Real after-tax median income level proxy: GDP per capita PPP level
- Real after-tax median income growth proxy: Real GDP per capita YoY growth

### Spending Share (% GDP) Bins

- Adaptive bins: target 12, minimum 30 observations/bin, anchors at 20%, rounded to 1%

| Spending Level (% GDP) | Country-Years | Jurisdictions | Typical Healthy Life Years (proxy level) | Typical Healthy Life Years Growth (proxy) | Typical Real After-Tax Median Income (proxy level) | Typical Real After-Tax Median Income Growth (proxy) | Notes |
|------------------------|-------------:|--------------:|-----------------------------------------:|-------------------------------------------:|----------------------------------------------------:|-----------------------------------------------------:|-------|
| 9.7-15% | 101 | 11 | 71.2 | +0.301 | $8,933 | +6.60% | — |
| 15-17% | 108 | 15 | 74.3 | +0.273 | $11,434 | +5.21% | — |
| 17-20% | 121 | 20 | 77.9 | +0.256 | $27,841 | +4.10% | — |
| 20-21% | 35 | 10 | 76.4 | +0.163 | $22,554 | +4.45% | — |
| 21-25% | 92 | 19 | 77.4 | +0.227 | $23,972 | +4.55% | — |
| 25-30% | 135 | 23 | 76.5 | +0.190 | $22,201 | +4.93% | — |
| 30-32% | 95 | 22 | 76.2 | +0.205 | $25,094 | +5.83% | — |
| 32-34% | 106 | 25 | 77.1 | +0.225 | $27,373 | +5.91% | — |
| 34-37% | 149 | 24 | 77.4 | +0.202 | $28,610 | +5.58% | — |
| 37-39% | 103 | 21 | 77.7 | +0.202 | $28,087 | +4.77% | — |
| 39-42% | 126 | 22 | 78.6 | +0.249 | $29,179 | +4.33% | — |
| 42-45% | 109 | 17 | 78.8 | +0.200 | $28,076 | +4.41% | — |
| 45-65.6% | 122 | 19 | 80.1 | +0.204 | $28,776 | +3.73% | — |

### Spending Per-Capita (PPP) Bins

Per-capita PPP spending is derived as: government expenditure % GDP × GDP per capita PPP.
- Adaptive bins: target 12, minimum 30 observations/bin, anchors at $5,000, $10,000, $20,000, rounded to $500

| Spending Per-Capita PPP Level | Country-Years | Jurisdictions | Typical Healthy Life Years (proxy level) | Typical Healthy Life Years Growth (proxy) | Typical Real After-Tax Median Income (proxy level) | Typical Real After-Tax Median Income Growth (proxy) | Notes |
|-------------------------------|-------------:|--------------:|-----------------------------------------:|-------------------------------------------:|----------------------------------------------------:|-----------------------------------------------------:|-------|
| $188-$1,500 | 133 | 15 | 68.4 | +0.330 | $5,192 | +6.27% | — |
| $1,500-$2,500 | 94 | 15 | 70.0 | +0.260 | $9,254 | +6.36% | — |
| $2,500-$4,000 | 106 | 22 | 73.0 | +0.295 | $12,251 | +6.29% | — |
| $4,000-$5,000 | 112 | 29 | 74.7 | +0.250 | $15,493 | +4.58% | — |
| $5,000-$6,500 | 133 | 30 | 75.8 | +0.211 | $22,201 | +4.96% | — |
| $6,500-$8,000 | 131 | 33 | 76.8 | +0.251 | $22,637 | +4.80% | — |
| $8,000-$9,500 | 107 | 34 | 77.5 | +0.251 | $26,268 | +4.90% | — |
| $9,500-$10,000 | 41 | 24 | 78.1 | +0.205 | $28,360 | +4.31% | — |
| $10,000-$11,000 | 78 | 30 | 78.5 | +0.205 | $28,144 | +3.85% | — |
| $11,000-$13,000 | 128 | 34 | 79.0 | +0.151 | $33,783 | +3.97% | — |
| $13,000-$15,500 | 107 | 33 | 80.6 | +0.200 | $37,121 | +4.12% | — |
| $15,500-$19,000 | 110 | 27 | 81.2 | +0.200 | $44,186 | +4.11% | — |
| $19,000-$37,200 | 122 | 18 | 81.6 | +0.151 | $57,138 | +5.08% | — |

## Outcome-Level Results

| Outcome | Direction | Weight | N | +/- | Mean r | Mean % Change | Optimal %GDP (Median) | IQR | Confidence |
|---------|-----------|-------:|---:|-----|-------:|--------------:|----------------------:|-----|------------|
| Life Expectancy | Higher is better | 0.35 | 47 | 32/15 | 0.305 | +2.12% | 32.4 | 21.4-37.9 | C (0.50) |
| GDP per Capita (PPP) | Higher is better | 0.35 | 47 | 34/13 | 0.301 | +39.39% | 32.2 | 21.9-38.0 | C (0.53) |
| Infant Mortality | Lower is better (negated) | 0.15 | 47 | 33/14 | 0.328 | -13.78% | 32.0 | 21.2-37.5 | C (0.53) |
| Income Inequality (Gini) | Lower is better (negated) | 0.15 | 45 | 21/24 | 0.078 | -1.18% | 30.8 | 21.1-37.8 | D (0.30) |

## Method

- Run N-of-1 longitudinal causal analysis within each jurisdiction.
- Estimate per-jurisdiction optimal predictor value from high-outcome periods.
- Aggregate outcome-level medians and uncertainty bands (IQR).
- Combine outcomes via outcome-weighted average with evidence modulation (0.2 + 0.8*confidence).
- Report start-year sensitivity to show temporal robustness of the estimate.

## Limitations

- This is cross-country observational panel analysis; confounding remains possible.
- Government spending % GDP captures scale, not composition quality.
- Healthy life years and after-tax median income are represented by in-repo proxies in the level table.
- Indicator revisions in source databases can shift historical estimates over time.
