# Government Size Analysis: World Bank Panel (1990-2023)

## Summary

Evidence-weighted N-of-1 analysis suggests an optimal government spending share of **32.2% of GDP** (band: **20.9% - 38.1%**).

- **US latest spending share (2023):** 24.9%
- **US gap to central estimate:** -7.3 percentage points
- **US status vs inferred band:** within optimal band

## Predictor Definition

Government Expenditure (% GDP):
- World Bank WDI `GC.XPN.TOTL.GD.ZS`
- Includes total general government spending share relative to GDP (not category-level decomposition).
- Source taxonomy and alternative definitions: `government-spending-metric-comparison.md`.

## Data Coverage

- Jurisdictions: 47
- Years: 1990-2023
- Country-year observations: 1402

## Temporal Sensitivity (Start Year)

All scenarios use the same methodology and countries where data is available; only the start year changes.

| Start Year | End Year | Country-Years | Jurisdictions | Optimal % GDP | Inferred Band | US % GDP | US Status |
|-----------:|---------:|--------------:|--------------:|--------------:|--------------|---------:|----------|
| 1990 | 2023 | 1402 | 47 | 32.2 | 20.9-38.1 | 24.9 | within optimal band (primary) |
| 1995 | 2023 | 1233 | 47 | 32.2 | 21.1-38.2 | 24.9 | within optimal band |
| 2000 | 2023 | 1036 | 47 | 32.2 | 21.6-38.2 | 24.9 | within optimal band |

## Spending Levels vs Typical Outcomes

Primary welfare outcomes are median healthy life years and real after-tax median income growth.
Rows are lag-aligned for causal interpretation: predictor at year t, outcomes summarized over t+1 to t+3.
Coverage notes for metric construction:
- Healthy life years level: WHO Healthy Life Expectancy (HALE) (direct).
- Healthy life years growth: annualized percent growth of HALE.
- Real after-tax median income level: proxy via GNI per-capita PPP.
- Real after-tax median income growth: annualized percent growth of the GNI proxy.

### Spending Share (% GDP) Bins

- Adaptive bins: target 12, minimum 30 observations/bin, anchors at 20%, rounded to 1%

| Spending Level (% GDP) | Country-Years | Jurisdictions | Typical Healthy Life Years (HALE) | Typical Healthy Life Years Growth | Typical Real After-Tax Median Income (proxy level) | Typical Real After-Tax Median Income Growth (proxy) | Notes |
|------------------------|-------------:|--------------:|-----------------------------------------:|-------------------------------------------:|----------------------------------------------------:|-----------------------------------------------------:|-------|
| 9.7-15% | 97 | 11 | 65.2 | +0.295 | $9,250 | +5.47% | — |
| 15-18% | 148 | 18 | 67.7 | +0.163 | $26,930 | +4.59% | — |
| 18-20% | 71 | 16 | 66.1 | +0.295 | $20,250 | +4.42% | — |
| 20-21% | 33 | 10 | 66.3 | +0.057 | $22,610 | +4.41% | — |
| 21-25% | 85 | 18 | 67.0 | -0.215 | $24,650 | +4.44% | — |
| 25-30% | 131 | 23 | 67.3 | +0.036 | $23,340 | +4.88% | — |
| 30-32% | 93 | 22 | 67.1 | +0.288 | $27,240 | +5.30% | — |
| 32-35% | 152 | 27 | 67.9 | +0.072 | $29,590 | +5.45% | — |
| 35-37% | 89 | 21 | 67.9 | +0.100 | $29,970 | +5.52% | — |
| 37-39% | 100 | 21 | 68.9 | +0.086 | $29,465 | +5.58% | — |
| 39-42% | 121 | 22 | 68.7 | +0.308 | $29,130 | +4.98% | — |
| 42-45% | 105 | 17 | 68.4 | +0.327 | $29,240 | +4.62% | — |
| 45-62.4% | 117 | 19 | 69.1 | +0.493 | $29,240 | +4.24% | — |

### Spending Per-Capita (PPP) Bins

Per-capita PPP spending is derived as: government expenditure % GDP × GDP per capita PPP.
- Adaptive bins: target 12, minimum 30 observations/bin, anchors at $5,000, $10,000, $20,000, rounded to $500

| Spending Per-Capita PPP Level | Country-Years | Jurisdictions | Typical Healthy Life Years (HALE) | Typical Healthy Life Years Growth | Typical Real After-Tax Median Income (proxy level) | Typical Real After-Tax Median Income Growth (proxy) | Notes |
|-------------------------------|-------------:|--------------:|-----------------------------------------:|-------------------------------------------:|----------------------------------------------------:|-----------------------------------------------------:|-------|
| $188-$1,500 | 126 | 15 | 60.9 | +0.218 | $5,800 | +6.02% | — |
| $1,500-$2,500 | 89 | 14 | 64.0 | +0.099 | $10,170 | +6.62% | — |
| $2,500-$4,000 | 104 | 22 | 65.2 | +0.385 | $13,495 | +5.78% | — |
| $4,000-$5,000 | 109 | 29 | 64.9 | +0.235 | $16,660 | +4.39% | — |
| $5,000-$6,500 | 128 | 29 | 66.6 | -0.133 | $23,025 | +5.20% | — |
| $6,500-$8,000 | 129 | 32 | 68.1 | +0.233 | $24,030 | +4.75% | — |
| $8,000-$9,500 | 106 | 34 | 67.6 | +0.243 | $27,760 | +4.59% | — |
| $9,500-$10,000 | 40 | 24 | 67.9 | +0.255 | $30,030 | +4.79% | — |
| $10,000-$10,500 | 43 | 27 | 68.7 | +0.183 | $29,110 | +3.70% | — |
| $10,500-$12,500 | 136 | 33 | 68.6 | +0.142 | $34,870 | +4.29% | — |
| $12,500-$15,000 | 117 | 31 | 69.3 | +0.146 | $38,800 | +4.14% | — |
| $15,000-$18,500 | 103 | 28 | 69.6 | +0.076 | $45,380 | +4.39% | — |
| $18,500-$20,000 | 31 | 13 | 70.0 | +0.241 | $53,000 | +4.54% | — |
| $20,000-$36,758 | 81 | 16 | 70.2 | +0.220 | $63,200 | +6.27% | — |

## Outcome-Level Results

| Outcome | Direction | Weight | N | +/- | Mean r | Mean % Change | Optimal %GDP (Median) | IQR | Confidence |
|---------|-----------|-------:|---:|-----|-------:|--------------:|----------------------:|-----|------------|
| Healthy Life Expectancy (HALE) | Higher is better | 0.25 | 47 | 32/15 | 0.186 | +1.03% | 32.5 | 21.1-38.2 | C (0.44) |
| Healthy Life Expectancy Growth (Annualized %) | Higher is better | 0.25 | 47 | 20/27 | -0.031 | -126.29% | 31.9 | 19.9-38.1 | F (0.20) |
| After-Tax Median Income (PPP, proxy) | Higher is better | 0.25 | 47 | 34/13 | 0.299 | +39.53% | 32.2 | 22.0-38.0 | C (0.53) |
| After-Tax Median Income Growth (Annualized %, proxy) | Higher is better | 0.25 | 47 | 31/16 | 0.125 | -15.50% | 32.0 | 19.8-38.0 | D (0.29) |

## Method

- Run N-of-1 longitudinal causal analysis within each jurisdiction.
- Estimate per-jurisdiction optimal predictor value from high-outcome periods.
- Aggregate outcome-level medians and uncertainty bands (IQR).
- Build lag-aligned bin tables from predictor year t to outcome follow-up window t+1..t+3.
- Combine outcomes via outcome-weighted average with evidence modulation (0.2 + 0.8*confidence).
- Report start-year sensitivity to show temporal robustness of the estimate.

## Limitations

- This is cross-country observational panel analysis; confounding remains possible.
- Government spending % GDP captures scale, not composition quality.
- Real after-tax median income is currently proxied by GNI per-capita PPP (not direct median disposable income).
- HALE growth and income-growth series are annualized derivatives and can be noisy in sparse panels.
- Indicator revisions in source databases can shift historical estimates over time.
