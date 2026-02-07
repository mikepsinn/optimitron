# Plan: Policy Misconception Analyses (v1)

## Phase 1: Datasets ✅ COMPLETE
- [x] Drug war spending → overdose deaths (`us-drug-war.ts`)
- [x] Drug war spending → violent crime / homicide (`us-drug-war.ts`)
- [x] Immigration enforcement → income (`us-immigration-tariffs.ts`)
- [x] Tariffs → income / inflation (`us-immigration-tariffs.ts`)
- [x] Minimum wage → unemployment → income (`us-minimum-wage.ts`)
- [x] Laffer curve: tax rates → revenue → GDP → income (`us-laffer-curve.ts`)
- [x] US vs OECD healthcare spending → outcomes (`us-healthcare-spending.ts`)
- [x] Police spending → crime rates (`us-police-spending.ts`)
- [x] Incarceration rate → crime rates (`us-incarceration.ts`)
- [x] Gun ownership / NICS checks → homicide (`us-gun-data.ts`)

## Phase 2: Analyses ✅ COMPLETE
- [x] Drug war → overdose analysis (commit `886e061`)
- [x] Drug war → crime analysis (commit `ada32d2`)
- [x] Immigration enforcement → income analysis (commit `bbd06e1`)
- [x] Tariff → income / inflation analysis (commit `bbd06e1`)
- [x] Laffer curve analysis — Hauser's Law confirmed, revenue stays 15-20% GDP at any top rate
- [x] Minimum wage analysis — results sent to Telegram
- [x] Healthcare spending analysis — US spends 2.2x OECD avg, 2.4 fewer years LE
- [x] Police spending → crime — crime drives spending (reactive), not preventive. All Grade F.
- [x] Incarceration → crime — near-zero YoY correlations (r=0.09-0.23). Crime drives policy, not reverse.
- [x] Gun ownership → homicide — all Grade F, only 23 data points. Need state-level panel data.

## Phase 3: Tier 2 Datasets + Analyses ✅ COMPLETE
- [x] Death penalty → homicide rate — r=-0.655 absolute vanishes to r=-0.013 YoY (spurious)
- [x] Foreign aid → conflict / poverty — reactive spending (r=+0.715 conflict), not causal
- [x] Abstinence education → teen pregnancy — STRONGEST causal dir (+0.713), funding worsens outcomes
- [x] Regulation → GDP / business — complete nulls, no regulation→economy link
- [x] Climate spending → CO2 / GDP — r=-0.960 but trend-driven; no GDP harm from renewables

## Phase 4: Website Integration
- [x] Create `/misconceptions` page with ranked findings
- [x] Interactive "myth vs reality" cards with data viz
- [x] Link each finding to full methodology / data sources
- [x] Generate `misconceptions.json` data file for web app

## Phase 5: Reports
- [x] Generate "Life Years Gained per $1M" ranking across all categories
- [x] Consolidated markdown report: "15 Things Everyone Believes That Data Contradicts"
- [x] Executive summary for grant applications
