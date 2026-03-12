# How to Reproduce All Analyses

## Prerequisites
- Node.js ≥ 20
- pnpm ≥ 9

## Setup
```bash
git clone https://github.com/mikepsinn/optomitron.git
cd optomitron
pnpm install
```

## Run All Tests
```bash
pnpm test
```
Expected: ~1,700+ tests passing across all packages.

## Run Specific Analyses

### Optimal Budget (OBG)
```bash
# Run all budget optimization tests (308 tests)
pnpm --filter @optomitron/obg test

# Generate US optimal budget v6 report (minimum effective spending + efficient frontier)
pnpm --filter @optomitron/examples exec tsx src/us-federal-analysis/generate-efficient-frontier-report.ts

# Output: reports/us-optimal-budget-v6.md + packages/web/public/data/efficient-frontier-v6.json
```

### Policy Misconception Analyses
```bash
# Run policy hypothesis tests
pnpm --filter @optomitron/obg test -- src/__tests__/policy-hypotheses.test.ts

# Run country analysis hypothesis tests
pnpm --filter @optomitron/obg test -- src/__tests__/country-analysis-hypotheses.test.ts

# Run efficient frontier hypothesis tests (Japan/Korea efficient, US inefficient)
pnpm --filter @optomitron/obg test -- src/__tests__/efficient-frontier-hypotheses.test.ts
```

### US Federal Budget Analysis (Full)
```bash
# Generate comprehensive budget analysis with BIS scores
pnpm --filter @optomitron/examples exec tsx src/us-federal-analysis/generate-budget-analysis.ts

# Output: reports/us-optimal-budget-v5.md + packages/web/public/data/*.json
```

### Website
```bash
# Build and preview the website
pnpm --filter @optomitron/web run build
pnpm --filter @optomitron/web run start

# Or regenerate website data from libraries
pnpm --filter @optomitron/web run generate
```

### Analysis Explorer Mega Studies
```bash
# Generate structured mega-study outputs
pnpm --filter @optomitron/examples run generate:mega-studies

# Run the agent-assisted publication review on mega-study-api.json
pnpm --filter @optomitron/examples run review:mega-studies

# Or do both in one step
pnpm --filter @optomitron/examples run generate:mega-studies:reviewed
```
Review artifact:
- `packages/examples/output/mega-studies/mega-study-publication-review.json`

### Typecheck Everything
```bash
pnpm run typecheck
```

## Data Sources
All datasets in `packages/data/src/datasets/` include source citations:
- **Economic data:** OECD, World Bank, FRED, BLS, BEA, CBO, OMB
- **Health data:** WHO, CDC, OECD Health Statistics
- **Crime data:** FBI UCR, BJS
- **Education data:** UNESCO, NCES, OECD PISA

## Package Structure
| Package | Purpose |
| --- | --- |
| `@optomitron/optimizer` | Core causal inference engine |
| `@optomitron/obg` | Optimal Budget Generator |
| `@optomitron/data` | Datasets and importers |
| `@optomitron/db` | Prisma schema and types |
| `@optomitron/web` | Next.js website |
| `@optomitron/examples` | Analysis scripts and demos |
