# Product Guidelines

## Messaging
- Lead with evidence, transparency, and reproducibility.
- Describe Optomitron as decision-support, not a replacement for legal authority.
- Emphasize domain-agnostic capability: the same engine works for health, budgets, or business metrics.
- Make uncertainty explicit (confidence intervals, evidence grades, sensitivity analysis).

## Trust and Safety
- Avoid deterministic claims about causation without evidence grades.
- Make privacy and data minimization explicit in user-facing docs.
- Provide sources for all data used in public reports.

## Scope Discipline
- Keep the core engine agnostic to domain-specific politics or ideology.
- Keep normative choices (objective functions, weights) explicit and configurable.
- Separate data ingestion, causal inference, and recommendation layers cleanly.

## Pilot Framing
- Position the US federal pilot as a reproducible public-good analysis.
- Make it easy for any jurisdiction to rerun with their own data.
- Be explicit about what is simulated vs. sourced from real datasets.

## Analysis Methodology (Updated 2026-02-07)

### Metrics Hierarchy
1. **Change from baseline** (primary) — "Above-average spending → X% better outcome"
2. **z-score** (for ranking) — normalizes across different outcome scales
3. **Cohen's d** (effect size) — small/medium/large standardized magnitude
4. **Pearson r** (supplementary) — traditional correlation, NOT the headline
5. **Predictive Pearson** (causal direction) — forward r minus reverse r
6. **Causal Direction Score** — composite of evidence for A→B vs B→A

### Reporting Rules
- Lead with intuitive, human-readable findings (change from baseline)
- Always include sample size and confidence level
- Apply Bonferroni correction when running multiple tests
- Flag reverse causation explicitly (spending responding to crises)
- Include COVID sensitivity check for any analysis touching 2020-2021
- Be honest about limitations — better to be credibly modest than impressively wrong

### Direct Outcome Mapping
Always use the MOST DIRECT outcome for each spending category, not just generic LE/income:

| Category | Direct Outcomes | Why |
|----------|----------------|-----|
| Drug enforcement | Overdose deaths, drug use rates, drug seizures | Direct causal pathway |
| Education | PISA scores, graduation rates, literacy | Proximal to intervention |
| Healthcare | Preventable deaths, infant mortality, HALE | Measures healthcare quality |
| Criminal justice | Crime rates, recidivism, incarceration rate | Direct policy target |
| Military | Conflict deaths, defense capability index | Security outcomes |
| R&D | Patents filed, productivity growth, tech exports | Innovation output |
| Environmental | CO2 emissions, air quality index, cancer rates | Environmental health |
| Social protection | Poverty rate, food insecurity, homelessness | Direct welfare measures |
| Infrastructure | Commute times, broadband access, bridge condition | Infrastructure quality |
| Foreign aid | Recipient country LE/poverty, refugee flows | Aid effectiveness |

Generic outcomes (LE, GDP/capita) are SUPPLEMENTARY — they show the full chain but dilute the signal.
Run analyses with BOTH direct and generic outcomes, lead with direct in reports.

### Confound Control (CRITICAL)
Cross-country correlations are confounded by wealth. Rich countries spend more on EVERYTHING and have better outcomes. Every cross-country analysis MUST:

1. **Compute partial correlations controlling for GDP per capita** — `partial_r(spending, outcome | GDP)`
2. **Flag categories where the effect vanishes after controlling** — "confounded, insufficient evidence"
3. **Report BOTH simple and partial correlations** — the gap reveals how much was just "being rich"
4. **Sign flips are disqualifying** — if education→LE is positive simple but zero/negative partial, the recommendation is bogus
5. **Within-country YoY analysis is the tiebreaker** — if cross-country says positive but within-country YoY says null/negative, trust the YoY

The optimizer library should do this automatically: `runFullAnalysis()` with cross-country data should compute partial correlations as a standard step.

### Data Rules
- **Deflator**: GDP deflator for US govt spending, World Bank PPP for cross-country
- **NOT CPI** for government spending (CPI reflects consumer basket, not govt mix)
- **NOT % of GDP** as primary metric (GDP growth ≠ need for proportional spending)
- **Real per-capita PPP** is the standard for cross-country comparisons
- **YoY % change** for causal detection (strips monotonic trends)
- **Absolute real per-capita** for determining optimal spending LEVELS
- Always cite data sources in JSDoc and report footnotes
