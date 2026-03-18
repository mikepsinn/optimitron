# Optimitron — Optimize Everything

## What It Is

A domain-agnostic causal inference engine that takes any two time series and answers three questions:
1. **Does X cause Y?** (Bradford Hill criteria, Predictor Impact Score)
2. **By how much?** (Effect size, confidence intervals)
3. **What's the optimal value of X?** (Diminishing returns, optimal daily value)

It works for health, government, business, agriculture — anything with measurable inputs and outcomes.

## The Problem

Humanity generates more data than ever but makes worse decisions than it should. Budgets are set by politics, health choices by marketing, and policies by ideology. The causal evidence exists — it's just buried in disconnected datasets that nobody synthesizes.

## How It Works

**For individuals:** Upload your health data (Apple Health, Fitbit, etc.) → Optimitron finds what actually affects your mood, energy, sleep, and symptoms. "Your mood is 15% higher on days you take 5000 IU vitamin D with a 2-day onset delay."

**For governments:** Public spending and outcome data from 20+ countries → evidence-based budget and policy recommendations. "Singapore spends 4% of GDP on healthcare with the world's highest life expectancy. The US spends 17% and ranks 40th. Here's what the data says to change."

**For anyone:** Give it time series data about anything → it finds the causal relationships and optimal values. Revenue vs ad spend. Crop yield vs fertilizer. Student outcomes vs class size.

## What Makes It Different

- **Domain-agnostic core** — The same engine optimizes drug dosages, government budgets, and business metrics. No domain-specific assumptions baked in.
- **Transparent methodology** — Every recommendation includes effect sizes, confidence intervals, evidence grades, and source citations. No black boxes.
- **Local-first** — Personal health data never leaves your device. Causal inference runs in-browser via PGlite (Postgres-in-browser).
- **Preference aggregation** — Citizens vote on priorities through pairwise comparisons (Wishocracy/RAPPA). The system optimizes for what people actually want, not what politicians assume.
- **Politician alignment scoring** — Compare how elected officials vote vs what citizens prefer. Fund campaigns of high-alignment candidates via Incentive Alignment Bonds.

## What Exists Today

- **~1,700 tests** across 8 packages in a TypeScript monorepo
- **Web app** with Google login, magic-link auth, referral capture, World ID verification, profile/census tracking, and shareable alignment reports
- **Live demo** at mikepsinn.github.io/optimitron with US budget optimization, policy rankings, and international comparisons across 20+ countries
- **Real data**: FY2025 US federal budget, 11 years historical spending, 60+ outcome metrics, 27 evidence-based policies with academic citations
- **9 health data importers** (Apple Health, Fitbit, Oura, MyFitnessPal, Withings, Google Fit, Cronometer, Strava, generic CSV)
- **Causal inference pipeline**: temporal alignment → Bradford Hill scoring → effect size → optimal daily values → markdown reports
- **Preference engine**: pairwise comparisons, eigenvector ranking, confidence-weighted and time-weighted aggregation
- **Citizen loop**: pairwise budget voting, personal alignment reports, public shared report URLs, and daily health/happiness/income check-ins
- **6 peer-reviewed-format papers** defining the methodology

## The Vision

Every person has a Digital Twin Safe — a local-first app that tracks their health, analyzes what works, and aggregates anonymized insights to improve public policy. Every government has an evidence-based advisory layer that tells them exactly where their budget has the most impact. Politicians are scored on alignment with citizen preferences, and campaign funding flows automatically to representatives who actually represent.

## What We Need

$350K–$600K for a 12-month pilot:
- Run the full pipeline on US federal data with multi-source verification
- Replace curated politician allocations with reproducible legislative behavior ingestion
- Launch the personal health optimization app (Chrome extension + PWA)
- Expand sybil-resistant citizen preference collection for 3-5 jurisdictions
- Publish the first public politician alignment scorecard with provenance

## Who We Are

Mike P. Sinn — 10+ years building health data infrastructure (legacy API: 100K+ users, 10M+ measurements). Previously built the world's largest open-source health correlation database.

## Links

- **Live demo**: https://mikepsinn.github.io/optimitron/
- **GitHub**: https://github.com/mikepsinn/optimitron
- **Papers**: dfda-spec.warondisease.org | wishocracy.warondisease.org | opg.warondisease.org | obg.warondisease.org | optimocracy.warondisease.org | iab.warondisease.org
