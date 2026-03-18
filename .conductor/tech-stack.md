# Tech Stack

## Languages and Runtime
- TypeScript (strict mode)
- Node.js >= 18 (`@optimitron/storage` and `@optimitron/agent` target Node 22+ workflows)
- ESM modules across all packages

## Monorepo Tooling
- pnpm workspaces
- Vitest for all tests
- eslint (typescript-eslint, `recommendedTypeChecked`)
- Pre-commit hooks: secret detection + typecheck + lint + tests

## Core Libraries (ZERO database imports, pure functions only)
- `@optimitron/optimizer` — Causal inference engine (domain-agnostic, no policy/health words)
- `@optimitron/wishocracy` — RAPPA preference aggregation
- `@optimitron/opg` — Optimal Policy Generator (depends on optimizer)
- `@optimitron/obg` — Optimal Budget Generator (depends on optimizer)
- `@optimitron/data` — Data fetchers + importers + static datasets (depends on optimizer for TimeSeries type)
- `@optimitron/storage` — Storacha/IPFS content-addressed snapshot storage with CID history chains
- `@optimitron/hypercerts` — Hypercerts AT Protocol record mapping (activity claims, measurements, evaluations)
- `@optimitron/agent` — Autonomous policy analyst agent (Gemini structured reasoning + ERC-8004)

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
- **GlobalVariable** not "variables"; use **NOf1VariableRelationship** / **AggregateVariableRelationship** across optimizer and db (not "correlations")
- **FK names match target model**: `globalVariableId`, `predictorGlobalVariableId`, and `unitId` only for `Unit` references
- **N-of-1 identity fields are not measurement units**: use `subjectId` instead of `unitId` in analysis/report contracts
- **Subject identity foundation**: `Subject` model + `SubjectType` enum support user/jurisdiction/cohort/organization identities
- **deletedAt on all models** (soft deletes)
- **No domain words in optimizer**: no "drugs", "policies", "budgets", "politicians"
- **Change from baseline + z-score** as primary metrics (Pearson is supplementary)
- **YoY percent change** for causal direction detection (strips monotonic trends)
- **N-of-1 longitudinal** over cross-sectional analysis
- **UCUM standardization target**: unit catalog and ingestion pipeline should converge on UCUM-coded units

## Decentralized Infrastructure
- `@storacha/client` — Content-addressed storage (requires Node 22+)
- `@atproto/oauth-client-node`, `@atproto/jwk-jose`, `@atproto/api` — AT Protocol (Hypercerts)
- `@google/genai` — Gemini structured-output orchestration
- `ethers` v6 — ERC-8004 on-chain agent identity (Sepolia testnet)

## Build
- `tsc` for library builds
- `tsup` for chat-ui
- `esbuild` for extension
- `next build && next export` for web (static export)
