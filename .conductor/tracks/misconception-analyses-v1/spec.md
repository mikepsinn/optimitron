# Track Spec: Policy Misconception Analyses (v1)

## Background
Many widely-held policy beliefs have weak or contradictory empirical support. Optimitron's causal inference engine can test these claims using real historical data, generating compelling evidence for the website and grant applications.

## Objectives
- Test 15 popular policy misconceptions using real US time-series data
- Use both absolute correlations AND year-over-year % change (to break monotonic trends)
- Detect causal direction (forward vs reverse causation) using Predictive Pearson
- Generate shareable findings for each misconception
- Populate the website's "Misconceptions" page

## Data Pattern
Each misconception gets a static dataset in `packages/data/src/datasets/us-*.ts`:
- Export interface with JSDoc field descriptions and source citations
- Export typed const array with year-by-year data
- Sources cited: FRED, BLS, IRS, OMB, BEA, FBI UCR, CDC, WHO, World Bank

## Analysis Pattern
Each analysis script (in `/tmp/` or `reports/`):
1. Import dataset + `runFullAnalysis` from `@optimitron/optimizer`
2. Convert to `TimeSeries` format
3. Run absolute value analysis (onset: 1yr, duration: 3yr)
4. Run YoY % change analysis (breaks monotonic trends)
5. Report: r, Causal Direction Score, baseline→followup change
6. Interpret findings with context

## Acceptance Criteria
- Each analysis runs reproducibly from a single `tsx` command
- All datasets compile with `pnpm --filter @optimitron/data run build`
- Findings are sent to Telegram and/or committed as markdown reports
- No fabricated data — use training knowledge with source citations, verify key data points
