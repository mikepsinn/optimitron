# TODO: Universal Optimal Budget & Policy Analysis

## 🎯 The Goal
Generate a **universally optimal budget** that maximizes:
1. **Median after-tax income growth** (economic welfare)
2. **Median healthy life years (HALE)** (health welfare)

For any jurisdiction, answer: "Given $X total budget, how should it be allocated across categories to maximize citizen welfare?"

---

## 🏗️ Infrastructure Needed

### P0: Multi-Outcome Optimization
- [ ] Add multi-outcome support to `optimizeBudget()` — optimize across BOTH income AND health simultaneously
- [ ] Weighted welfare function: `welfare = w1 * income_z + w2 * hale_z` (user-configurable weights)
- [ ] Pareto frontier: show tradeoffs between income-maximizing and health-maximizing budgets

### P0: Inflation-Adjusted Per-Capita Analysis
- [ ] Add `toRealPerCapita()` helper: divide by population × deflate by CPI/GDP deflator
- [ ] Convert all FRED spending series to real per-capita before analysis
- [ ] Add population data to country-level datasets (World Bank has this)
- [ ] Re-run all US analyses with inflation-adjusted per-capita inputs

### P0: YoY % Change Mode
- [ ] Add `firstDifference` option to `runFullAnalysis()` — auto-convert to YoY % change
- [ ] This should be the DEFAULT for single-country N-of-1 (breaks monotonic trends)
- [ ] Keep absolute values for cross-country panels (different levels matter there)

### P0: Outcome Data Gaps
- [ ] **Healthy Life Expectancy (HALE)** — WHO GHO has this; add fetcher
- [ ] **Median after-tax income** — FRED `MEHOINUSA672N` (real) ✅ have it
- [ ] **Inequality-adjusted income** — Gini × median income composite
- [ ] **Quality-Adjusted Life Years** — combine HALE + income into single welfare metric

### P1: Spending Category Data Gaps
- [ ] **Social benefits / welfare spending** — FRED `W823RC1Q027SBEA` (added, needs API key test)
- [ ] **Infrastructure spending** — FRED or BEA (transportation, water, broadband)
- [ ] **Criminal justice / policing** — BJS has state+local police expenditures
- [ ] **R&D broken out** — NIH vs NSF vs DOE vs DoD research (different ROI profiles)
- [ ] **Environmental / EPA** — FRED or OMB
- [ ] **Foreign aid** — World Bank ODA indicator
- [ ] **Veterans healthcare** — separate from military (VA budget from FRED)

### P1: "Return to Citizens" Option
- [ ] Model the null category: "reduce taxes / give money back"
- [ ] Use: tax burden changes → income growth as the baseline ROI
- [ ] Every spending category must beat "just return the money" to justify its existence

---

## 📊 Misconception Analyses (Priority Order)

### Tier 1: Data Ready NOW
- [ ] **"Tax cuts pay for themselves" (Laffer Curve)** — tax revenue %GDP vs GDP growth; 52 years US data
- [ ] **"Welfare creates dependency"** — social spending vs labor force participation (already partially done: r=-0.797)
- [ ] **"More police = less crime"** — police spending (need from FRED/BJS) vs FBI crime rates
- [ ] **"Universal healthcare is unaffordable"** — gov health share vs total health spend vs outcomes; 231 countries
- [ ] **"Minimum wage kills jobs"** — federal minimum wage (FRED) vs unemployment rate; since 1938

### Tier 2: Need Small Datasets (1-2 hours each)
- [ ] **"Incarceration reduces crime"** — BJS incarceration rate vs crime rate; US has 25% of world's prisoners
- [ ] **"Death penalty deters murder"** — execution counts vs homicide rate
- [ ] **"Foreign aid is wasted"** — ODA spending vs conflict/migration outcomes
- [ ] **"Gun ownership = safety"** — NICS background checks (FRED) vs homicide/violent crime
- [ ] **"Abstinence education works"** — state-level teen pregnancy vs sex ed policy type

### Tier 3: Contrarian & Fascinating
- [ ] **"Regulation kills growth"** — Ease of Doing Business vs GDP growth (World Bank has both)
- [ ] **"Rent control helps affordability"** — city-level rent control vs housing costs
- [ ] **"Privatization improves efficiency"** — private vs public healthcare costs cross-country
- [ ] **"Climate spending hurts economy"** — renewable energy investment vs GDP growth
- [ ] **"College is always worth it"** — education spending vs student debt vs income growth

### Already Done ✅
- [x] **Drug war spending → overdose deaths** (r=0.026, Direction=-0.577 REVERSE)
- [x] **Drug war spending → violent crime** (r=-0.025, Direction=-0.834 REVERSE)
- [x] **Immigration enforcement → income** (r=-0.812, Direction=-0.903 REVERSE)
- [x] **Immigration enforcement → net migration** (Direction=+0.533 but POSITIVE — doesn't reduce it!)
- [x] **Tariffs → income** (r=0.253, Direction unclear)
- [x] **Tariffs → inflation** (r=0.283, Direction=+0.450 FORWARD — tariffs cause inflation)
- [x] **Education spending → various** (forward for infant mortality, reverse for GDP)
- [x] **Military spending → life expectancy** (zero effect)
- [x] **Government spending → labor participation** (r=-0.797 in US)
- [x] **Tax burden → life expectancy** (r=-0.398 in US)

---

## 🔧 Code Improvements

### Analysis Quality
- [ ] **Inflation-adjusted per-capita mode** for all analyses
- [ ] **Confidence intervals** on all estimates (bootstrap or analytical)
- [ ] **Multiple testing correction** (Bonferroni/FDR when running many categories)
- [ ] **Lag optimization** — auto-test multiple onset delays, report which fits best
- [ ] **Structural break detection** — find policy changes (ACA 2010, drug war 1971, Trump tariffs 2018)
- [ ] **Granger causality test** — formal econometric test alongside our Causal Direction Score
- [ ] **Instrumental variables** — for cases where reverse causation is strong

### Data Pipeline
- [ ] **Cache World Bank API results** — avoid re-fetching 6000 data points every run
- [ ] **FRED API key in CI** — so CI can run integration tests with real data
- [ ] **Dataset versioning** — track when static datasets were last updated
- [ ] **Automated data freshness checks** — cron job to detect when new year data is available

### Website / Visualization
- [ ] **Misconceptions page** — ranked list of "things everyone thinks are true but data says otherwise"
- [ ] **Interactive "what if" budget tool** — slider per category, real-time welfare estimate
- [ ] **Country comparison tool** — pick any 2 countries, see spending differences + outcome differences
- [ ] **Causal Direction visualization** — show forward vs reverse arrows with strength
- [ ] **Time series charts** — spending vs outcome over time per country

### Reports
- [ ] **"Life Years Gained per $1M"** ranking — the killer chart (normalize all categories to same unit)
- [ ] **Optimal US Federal Budget report** — full markdown with all categories, all evidence
- [ ] **Executive summary for policymakers** — 1-page version with just the recommendations
- [ ] **Per-state optimal budget** — use state-level data where available

---

## 📋 Steps to Universal Optimal Budget

1. ✅ Build `optimizeBudget()` pipeline
2. ✅ Wire real World Bank data (231 countries)
3. ✅ Add FRED data (65 years US)
4. ✅ Fix Predictive Pearson (was always 0)
5. ✅ Identify monotonic trend problem → YoY % change solution
6. [ ] **Add inflation-adjusted per-capita mode**
7. [ ] **Add HALE (healthy life years) as outcome**
8. [ ] **Add all major US budget categories with FRED data**
9. [ ] **Add "return to citizens" baseline category**
10. [ ] **Build multi-outcome optimizer (income + health)**
11. [ ] **Run full US optimal budget with 15+ categories**
12. [ ] **Generate the report: "How the US Should Actually Spend $6.7 Trillion"**
13. [ ] **Publish to website with interactive visualization**
