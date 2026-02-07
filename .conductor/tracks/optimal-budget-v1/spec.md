# Track Spec: Universal Optimal Budget (v1)

## Background
The current `optimizeBudget()` works for single-outcome optimization per category. The goal is a universal budget optimizer that maximizes BOTH median after-tax income growth AND median healthy life years (HALE) simultaneously across 15+ spending categories.

## Objectives
- Determine the optimal allocation of the US federal budget ($6.7T) across all major categories
- Optimize for dual outcomes: income growth + healthy life years
- Every category must beat the "return money to citizens" baseline
- Use real per-capita PPP data to determine optimal LEVELS (not just directions)
- Produce "How the US Should Actually Spend $6.7 Trillion" report

## Methodology Requirements (Updated 2026-02-07)

### Data
- **Cross-country panel**: OECD 23+ countries × 20+ years (N≈500+). Single-country N=23 is too small.
- **Spending metric**: Real per-capita PPP (constant 2017 international dollars). NOT % of GDP (GDP growth ≠ proportional spending need).
- **Deflator**: GDP deflator preferred over CPI for government spending (CPI reflects consumer basket, not govt spending mix). For cross-country: World Bank PPP constant dollars (already deflated + comparable).
- **Detrending**: YoY % change for causal detection (strips monotonic trends). Absolute real per-capita for determining optimal LEVELS.

### Analysis
- **Primary metrics**: Change from baseline + z-score (NOT Pearson r as headline)
  - Split spending at mean → above-average vs below-average periods
  - Report outcome difference as % change from baseline
  - z-score normalizes across different outcome scales
  - Cohen's d for standardized effect size
- **Supplementary**: Pearson r, p-values, predictive Pearson (forward r - reverse r) for causal direction
- **Confidence levels**: strong (p<0.01), moderate (p<0.05), weak (p<0.1), none (p≥0.1)
- **Multiple testing**: Bonferroni correction when running many category/outcome pairs
- **Lag optimization**: Auto-test 0, 1, 2, 3, 5, 10 year onset delays — report best fit per category (education ≠ military ≠ R&D)
- **Reverse causation detection**: Predictive Pearson (forward r vs reverse r) + Causal Direction Score
- **COVID robustness**: Run with and without 2020-2021 to check sensitivity

### Report Format
Lead with intuitive findings:
> "Countries that spent above-average on education saw **+2.3 years** life expectancy (z=1.4, strong)"

NOT:
> "r = 0.47, p = 0.02"

Include:
- Per-category: current spend, optimal spend, delta, evidence strength, life-years/$1M
- "Return to citizens" comparison for each category
- Honest limitations section (sample size, confounders, ecological fallacy)
- Pareto frontier: income-maximizing vs health-maximizing budget tradeoffs

## Acceptance Criteria
- Cross-country panel with N≥200 observations
- All spending in real per-capita PPP (not nominal, not % GDP)
- Change from baseline as headline metric, z-score for ranking
- Multiple lag structures tested per category
- COVID sensitivity check included
- Bonferroni-corrected significance thresholds
- Every recommendation backed by causal direction analysis
- Honest about what the data CAN'T tell us
