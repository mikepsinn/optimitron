# Tech Stack

## Languages and Runtime
- TypeScript (strict mode)
- Node.js >= 18
- ESM modules across all packages

## Monorepo Tooling
- pnpm workspaces
- Vitest for all tests
- eslint (typescript-eslint, `recommendedTypeChecked`)
- Pre-commit hooks: secret detection + typecheck + lint + tests

## Core Libraries (ZERO database imports, pure functions only)
- `@optomitron/optimizer` — Causal inference engine (domain-agnostic, no policy/health words)
- `@optomitron/wishocracy` — RAPPA preference aggregation
- `@optomitron/opg` — Optimal Policy Generator (depends on optimizer)
- `@optomitron/obg` — Optimal Budget Generator (depends on optimizer)
- `@optomitron/data` — Data fetchers + importers + static datasets (depends on optimizer for TimeSeries type)

## Data Layer
- Prisma schema → single source of truth for types
- Zod validators auto-generated from Prisma (planned)
- Two runtimes: Postgres server + PGlite (browser)
- cr-sqlite for p2p device sync (Phase 2)

## Data Sources
- **APIs**: OECD, World Bank, WHO GHO, FRED, Congress.gov
- **Health Importers**: Apple Health, Fitbit, Oura, MFP, Withings, Google Fit, Cronometer, Strava, CSV
- **Static Datasets**: `packages/data/src/datasets/us-*.ts` (drug war, Laffer, min wage, healthcare, etc.)
- **economic-data submodule**: 65 CSVs of international comparison data

## Web
- Next.js 14 + React 18 (packages/web)
- Tailwind CSS + shadcn/ui + framer-motion
- GitHub Pages auto-deploy on push to main
- Static data files: `packages/web/src/data/*.json`

## Extension
- Chrome Manifest V3
- esbuild bundler
- chrome.storage.local for Phase 1, PGlite for Phase 2

## Key Conventions
- **predictor/outcome** terminology (not cause/effect)
- **GlobalVariable** not "variables"; use **UnitVariableRelationship** / **AggregateVariableRelationship** across optimizer and db (not "correlations")
- **FK names match target model**: `globalVariableId`, `predictorGlobalVariableId`
- **deletedAt on all models** (soft deletes)
- **No domain words in optimizer**: no "drugs", "policies", "budgets", "politicians"
- **Change from baseline + z-score** as primary metrics (Pearson is supplementary)
- **YoY percent change** for causal direction detection (strips monotonic trends)
- **N-of-1 longitudinal** over cross-sectional analysis

## Build
- `tsc` for library builds
- `tsup` for chat-ui
- `esbuild` for extension
- `next build && next export` for web (static export)
