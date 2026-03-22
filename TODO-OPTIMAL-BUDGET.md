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
- [x] **Healthy Life Expectancy (HALE)** — ✅ implemented in WHO GHO fetcher (`packages/data/src/fetchers/who.ts`)
- [x] **Median after-tax income** — FRED `MEHOINUSA672N` (real) ✅ in FRED fetcher
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
- [x] **"Tax cuts pay for themselves" (Laffer Curve)** — ✅ in misconceptions.json: top tax rate 91%→37% had no effect on revenue share (15-20% GDP)
- [ ] **"Welfare creates dependency"** — social spending vs labor force participation (partially done: r=-0.797, not in misconceptions.json yet)
- [x] **"More police = less crime"** — ✅ in misconceptions.json: crime goes up first, police budgets respond (reverse causation)
- [x] **"Universal healthcare is unaffordable"** — ✅ in misconceptions.json: US spends 2x OECD avg, lives 2.4 fewer years
- [x] **"Minimum wage kills jobs"** — ✅ in misconceptions.json: no measurable effect on unemployment (r=0.01)

### Tier 2: Need Small Datasets (1-2 hours each)
- [x] **"Incarceration reduces crime"** — ✅ in misconceptions.json: US 5x OECD rate, no meaningful crime reduction
- [x] **"Death penalty deters murder"** — ✅ in misconceptions.json: both declined (fake correlation), YoY r=-0.013
- [x] **"Foreign aid is wasted"** — ✅ in misconceptions.json: aid responds to crises, reverse causation
- [x] **"Gun ownership = safety"** — ✅ in misconceptions.json: no YoY link (r=0.02), poverty/urbanization stronger
- [x] **"Abstinence education works"** — ✅ in misconceptions.json: more abstinence spending = higher teen pregnancy (r=0.713)

### Tier 3: Contrarian & Fascinating
- [x] **"Regulation kills growth"** — ✅ in misconceptions.json: no measurable relationship (r=0.0)
- [ ] **"Rent control helps affordability"** — city-level rent control vs housing costs
- [ ] **"Privatization improves efficiency"** — private vs public healthcare costs cross-country
- [x] **"Climate spending hurts economy"** — ✅ in misconceptions.json: no GDP harm, CO₂ dropped (r=-0.96)
- [ ] **"College is always worth it"** — education spending vs student debt vs income growth

### Already Done ✅ (15 published in misconceptions.json + 5 additional analyses)
- [x] **Drug war spending → overdose deaths** (r=0.026, Direction=-0.577 REVERSE)
- [x] **Drug war spending → violent crime** (r=-0.025, Direction=-0.834 REVERSE)
- [x] **Immigration enforcement → income** (r=-0.812, Direction=-0.903 REVERSE)
- [x] **Immigration enforcement → net migration** (Direction=+0.533 but POSITIVE — doesn't reduce it!)
- [x] **Tariffs → income / inflation** (r=0.283, Direction=+0.450 FORWARD — tariffs cause inflation)
- [x] **Education spending → various** (forward for infant mortality, reverse for GDP)
- [x] **Military spending → life expectancy** (zero effect)
- [x] **Government spending → labor participation** (r=-0.797 in US)
- [x] **Tax burden → life expectancy** (r=-0.398 in US)
- [x] **Laffer Curve** — top rate 91%→37%, revenue stayed 15-20% GDP
- [x] **More police ≠ less crime** — reverse causation (crime up → budgets up)
- [x] **Healthcare overspending** — US 2x OECD avg, 2.4 fewer life years
- [x] **Minimum wage ≠ unemployment** — no measurable effect (r=0.01)
- [x] **Mass incarceration ≠ less crime** — US 5x OECD rate, no effect
- [x] **Death penalty ≠ deterrence** — fake correlation from co-declining trends
- [x] **Foreign aid → conflict** — reverse causation, aid responds to crises
- [x] **Gun ownership ≠ safety** — no YoY link, poverty/urbanization dominate
- [x] **Abstinence education → more teen pregnancy** (r=0.713)
- [x] **Regulation ≠ growth killer** — no measurable relationship (r=0.0)
- [x] **Climate spending ≠ economic harm** — no GDP harm, CO₂ dropped (r=-0.96)

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
- [x] **Misconceptions page** — ✅ `/misconceptions` with 15 myth-vs-reality analyses, category filters
- [x] **Budget analysis page** — ✅ `/budget` with 34+ categories scored via OSL estimation
- [x] **Policy analysis page** — ✅ `/policies` with 12 policies scored via Bradford Hill
- [x] **Country comparison page** — ✅ `/compare` with healthcare, drug policy, education comparisons
- [ ] **Interactive "what if" budget tool** — slider per category, real-time welfare estimate
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
