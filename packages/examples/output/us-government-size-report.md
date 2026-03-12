# Government Size Analysis: World Bank Panel (1990-2023)

## Summary

Lag-aligned panel diagnostics suggest a **minimum efficient government spending floor** around **$19,299 PPP per capita** (support bin **$18,500 - $20,000**).

- **U.S.-equivalent floor share:** 23.4% of GDP (band 22.5-24.3)
- **Cross-country floor-bin median share (descriptive only):** 40.0% of GDP (IQR 33.9-42.5)
- **US latest spending share (2023):** 24.9%
- **US latest GDP per-capita PPP (2023):** $82,305
- **US latest spending per-capita PPP (2023):** $20,492
- **US gap to U.S.-equivalent floor:** +1.5 percentage points
- **US gap to per-capita floor estimate:** +$1,194
- **US status vs inferred band:** above optimal band
- **Headline outcomes used:** Healthy Life Expectancy (HALE), After-Tax Median Income (PPP, proxy)
- **Qualifying low-spend / high-outcome jurisdictions:** 18
- **Lowest direct-outcome floor in this model:** Healthy Life Expectancy Only at 20.1% of U.S. GDP
- **Federal current-budget composition view:** standalone category optima sum to $8,313,687,512,185 (+23.2% vs current federal budget), but the composition table below is constrained to today's federal budget

## Predictor Definition

Government Expense (% GDP):
- World Bank WDI `GC.XPN.TOTL.GD.ZS`
- World Bank labels this series as government expense; it is not a category decomposition.
- Cross-country headline comparisons should use per-capita PPP; raw % GDP is descriptive only.
- Source taxonomy and alternative definitions: `government-spending-metric-comparison.md`.

## Data Coverage

- Jurisdictions: 47
- Years: 1990-2023
- Country-year observations: 1402

## Objective Floors

These floors isolate direct welfare objectives instead of forcing a single combined headline. Each row uses the same lag-aligned floor method and then translates the per-capita floor into a U.S.-equivalent % GDP share.

| Objective | U.S.-Equiv Floor % GDP | U.S.-Equiv Band | Floor PPP / Capita | Qualifying Jurisdictions |
|-----------|-----------------------:|----------------|-------------------:|-------------------------:|
| Combined Direct Welfare | 23.4 | 22.5-24.3 | $19,299 | 18 |
| Healthy Life Expectancy Only | 20.1 | 18.2-22.5 | $16,506 | 29 |
| Income Proxy Only | 27.8 | 24.3-44.7 | $22,912 | 16 |

## Floor Tolerance

This checks how much the combined direct-welfare floor moves when the "within tolerance of best bin" rule is tightened or loosened.

| Tolerance | U.S.-Equiv Floor % GDP | U.S.-Equiv Band | Floor PPP / Capita |
|----------:|-----------------------:|----------------|-------------------:|
| 0.15 | 27.8 | 24.3-44.7 | $22,912 |
| 0.35 | 23.4 | 22.5-24.3 | $19,299 |
| 0.75 | 20.1 | 18.2-22.5 | $16,506 |

## Temporal Sensitivity (Start Year)

Start-year sensitivity re-runs the same floor benchmark with different left-window cutoffs; a separate COVID exclusion check drops 2020-2021 source years.

| Start Year | End Year | Country-Years | Jurisdictions | U.S.-Equiv Floor % GDP | U.S.-Equiv Band | Raw Bin Median % GDP | US % GDP | US Status |
|-----------:|---------:|--------------:|--------------:|------------------------:|----------------|---------------------:|---------:|----------|
| 1990 | 2023 | 1402 | 47 | 23.4 | 22.5-24.3 | 40.0 | 24.9 | above optimal band (primary) |
| 1995 | 2023 | 1233 | 47 | 27.8 | 24.3-44.7 | 40.7 | 24.9 | within optimal band |
| 2000 | 2023 | 1036 | 47 | 27.8 | 24.3-44.7 | 40.7 | 24.9 | within optimal band |

COVID exclusion check (dropping 2020-2021 source years): 27.2% GDP U.S.-equivalent (band 24.3-44.7; raw floor-bin median 40.4% GDP; US status within optimal band).

## Federal Composition

The budget-composition summary below comes from the existing US federal budget model, not the cross-country general-government panel. It is useful for "where should money go?" but should not be equated mechanically with the total government size floor.

- **Current federal budget:** $6,750,000,000,000
- **Standalone federal category optima sum:** $8,313,687,512,185
- **Gap vs current federal budget if each category hit its standalone optimum:** +$1,563,687,512,185 (+23.2%)
- **Caveat:** This composition model is federal-budget only; the category table below is constrained to the current federal budget even though standalone category optima sum to a different total.

| Top Scale-Ups At Current Budget | Reallocation % | Evidence | Target Share |
|---------------|------:|----------|--------------:|
| Education | +271.2% | A | 13.1% |
| Science & Space (NASA, NSF) | +329.5% | B | 5.2% |
| Income Security (SNAP, Housing) | +50.9% | D | 6.8% |
| Community & Regional Development | +89.2% | D | 1.1% |
| Energy Programs | +46.0% | D | 1.2% |

| Top Scale-Downs At Current Budget | Reallocation % | Evidence | Target Share |
|-----------------|------:|----------|--------------:|
| Military | -62.3% | D | 5.0% |

| Largest Target Shares At Current Budget | Target Share | Current | Target |
|--------------------------------|--------------:|--------:|--------:|
| Social Security | 21.0% | $1,418,000,000,000 | $1,418,000,000,000 |
| Education | 13.1% | $238,000,000,000 | $883,532,444,340 |
| Net Interest on Debt | 13.1% | $881,000,000,000 | $881,000,000,000 |
| Medicare | 12.9% | $874,000,000,000 | $874,000,000,000 |
| Medicaid & CHIP | 8.5% | $575,000,000,000 | $575,000,000,000 |
| Income Security (SNAP, Housing) | 6.8% | $304,000,000,000 | $458,830,755,271 |
| Science & Space (NASA, NSF) | 5.2% | $81,000,000,000 | $347,916,486,716 |
| Military | 5.0% | $886,000,000,000 | $334,312,540,436 |

## Efficient Jurisdictions

These are jurisdictions with at least two lag-aligned observations inside the minimum-efficient per-capita band and non-negative welfare benchmark scores within that band.

| Jurisdiction | Qualifying Obs | Median % GDP | Median Spend / Capita PPP | Median HALE | Median Income Proxy |
|--------------|---------------:|-------------:|--------------------------:|------------:|--------------------:|
| Finland | 2 | 37.5 | $19,030 | 70.2 | $55,910 |
| Ireland | 5 | 25.7 | $19,034 | 70.3 | $65,460 |
| Denmark | 5 | 39.9 | $19,082 | 70.2 | $53,120 |
| Netherlands | 3 | 42.2 | $19,252 | 70.3 | $47,220 |
| Norway | 2 | 33.0 | $19,373 | 69.7 | $60,950 |

## Spending Levels vs Typical Outcomes

Headline floor logic uses only outcomes that pass directionality/confounding gates; all four outcomes are still published below.
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
| 9.7-15% | 97 | 11 | 65.4 | +0.540 | $9,250 | +5.47% | — |
| 15-18% | 148 | 18 | 68.3 | +0.239 | $26,930 | +4.59% | — |
| 18-20% | 71 | 16 | 66.9 | +0.156 | $20,250 | +4.42% | — |
| 20-21% | 33 | 10 | 66.5 | +0.057 | $22,610 | +4.41% | — |
| 21-25% | 85 | 18 | 67.0 | +0.065 | $24,650 | +4.44% | — |
| 25-30% | 131 | 23 | 67.3 | +0.223 | $23,340 | +4.88% | — |
| 30-32% | 93 | 22 | 67.4 | +0.270 | $27,240 | +5.30% | — |
| 32-35% | 152 | 27 | 67.9 | +0.176 | $29,590 | +5.45% | — |
| 35-37% | 89 | 21 | 67.9 | -0.008 | $29,970 | +5.52% | — |
| 37-39% | 100 | 21 | 69.0 | +0.103 | $29,465 | +5.58% | — |
| 39-42% | 121 | 22 | 68.7 | +0.317 | $29,130 | +4.98% | — |
| 42-45% | 105 | 17 | 68.6 | +0.215 | $29,240 | +4.62% | — |
| 45-62.4% | 117 | 19 | 69.2 | +0.493 | $29,240 | +4.24% | — |

### Spending Per-Capita (PPP) Bins

Per-capita PPP spending is derived as: government expense % GDP × GDP per capita PPP.
- Adaptive bins: target 12, minimum 30 observations/bin, anchors at $5,000, $10,000, $20,000, rounded to $500

| Spending Per-Capita PPP Level | Country-Years | Jurisdictions | Typical Healthy Life Years (HALE) | Typical Healthy Life Years Growth | Typical Real After-Tax Median Income (proxy level) | Typical Real After-Tax Median Income Growth (proxy) | Notes |
|-------------------------------|-------------:|--------------:|-----------------------------------------:|-------------------------------------------:|----------------------------------------------------:|-----------------------------------------------------:|-------|
| $188-$1,500 | 126 | 15 | 60.4 | +0.569 | $5,800 | +6.02% | — |
| $1,500-$2,500 | 89 | 14 | 64.7 | -0.516 | $10,170 | +6.62% | — |
| $2,500-$4,000 | 104 | 22 | 65.0 | +0.428 | $13,495 | +5.78% | — |
| $4,000-$5,000 | 109 | 29 | 65.3 | +0.217 | $16,660 | +4.39% | — |
| $5,000-$6,500 | 128 | 29 | 67.3 | +0.062 | $23,025 | +5.20% | — |
| $6,500-$8,000 | 129 | 32 | 67.9 | +0.152 | $24,030 | +4.75% | — |
| $8,000-$9,500 | 106 | 34 | 67.6 | +0.291 | $27,760 | +4.59% | — |
| $9,500-$10,000 | 40 | 24 | 67.9 | +0.288 | $30,030 | +4.79% | — |
| $10,000-$10,500 | 43 | 27 | 68.6 | +0.246 | $29,110 | +3.70% | — |
| $10,500-$12,500 | 136 | 33 | 68.8 | +0.136 | $34,870 | +4.29% | — |
| $12,500-$15,000 | 117 | 31 | 69.3 | +0.216 | $38,800 | +4.14% | — |
| $15,000-$18,500 | 103 | 28 | 69.6 | +0.163 | $45,380 | +4.39% | — |
| $18,500-$20,000 | 31 | 13 | 70.2 | +0.318 | $53,000 | +4.54% | — |
| $20,000-$36,758 | 81 | 16 | 70.2 | +0.029 | $63,200 | +6.27% | — |

## Outcome-Level Results

| Outcome | Weight | N | Mean r | Mean pred r | Mean % Change | Partial r (%GDP \| GDP/cap) | Headline | Confidence |
|---------|-------:|---:|-------:|------------:|--------------:|-----------------------------:|----------|------------|
| Healthy Life Expectancy (HALE) | 0.25 | 47 | 0.195 | -0.026 | +1.18% | 0.175 | Yes | C (0.46) |
| Healthy Life Expectancy Growth (Annualized %) | 0.25 | 47 | -0.040 | -0.007 | +304.45% | -0.019 | No: Excluded from headline because this outcome is a growth/proxy diagnostic. | D (0.22) |
| After-Tax Median Income (PPP, proxy) | 0.25 | 47 | 0.299 | 0.024 | +39.53% | 0.157 | Yes | C (0.53) |
| After-Tax Median Income Growth (Annualized %, proxy) | 0.25 | 47 | 0.125 | 0.302 | -15.50% | 0.056 | No: Excluded from headline because this outcome is a growth/proxy diagnostic. | D (0.29) |

## Method

- Run N-of-1 longitudinal causal analysis within each jurisdiction.
- Keep Bradford Hill scoring, forward vs reverse Pearson, and change-from-baseline as the core within-jurisdiction diagnostics.
- Build lag-aligned bin tables from predictor year t to outcome follow-up window t+1..t+3.
- Compute pooled partial correlations controlling for GDP per capita as a confounding check.
- Derive the headline from Lowest per-capita PPP spending bin within 0.35 composite-score units of the best bin.
- Score the floor bin via Composite z-score across selected direct-welfare outcomes, weighted by outcome weights.
- Translate the per-capita floor into a U.S.-equivalent % GDP share using the latest U.S. GDP per-capita PPP.
- Re-run the same floor logic for HALE-only, income-only, and tolerance-sensitivity scenarios.
- Import the separate federal budget model to summarize minimum-budget composition recommendations by category.
- Report start-year and COVID-excluded sensitivity to show how stable the floor estimate is.

## Limitations

- This is cross-country observational panel analysis; confounding remains possible.
- Total government expense still collapses composition quality, capture, and corruption into a single scalar.
- Raw cross-country % GDP medians are descriptive and not portable across countries with very different GDP per capita.
- The federal composition summary is a separate model and a different budget level from the general-government size floor.
- Category-level floors are a better policy object than a single total-size number.
- Real after-tax median income is currently proxied by GNI per-capita PPP (not direct median disposable income).
- HALE growth and income-growth series are annualized derivatives and can be noisy in sparse panels.
- Indicator revisions in source databases can shift historical estimates over time.
