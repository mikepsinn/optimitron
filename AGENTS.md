# AGENTS.md — Instructions for All AI Agents

**Read this FIRST before making any changes.**

## Documentation

Detailed docs live in `docs/`. Read the relevant ones before working:
- `docs/TYPE_SYSTEM.md` — How types flow from Prisma → all packages
- `docs/CONVENTIONS.md` — Naming, commits, domain agnosticism, testing
- `docs/WEB_APP.md` — Current Next.js app behavior, auth, envs, deployment, smoke checks
- `.conductor/product.md` — Product context and user personas
- `.conductor/tech-stack.md` — Language, frameworks, tooling
- `.conductor/workflow.md` — Development workflow

## Critical Architecture Rules

### 1. Type System — Single Source of Truth

The Prisma schema (`packages/db/prisma/schema.prisma`) is the canonical source for all data models.

**How types flow:**
```
schema.prisma → @optimitron/db exports:
  ├── Prisma client (for web/API layer ONLY)
  ├── Pure TS interfaces (for ALL packages)
  └── Zod schemas (for runtime validation)
```

**DO:**
- Import PLAIN TypeScript interfaces from `@optimitron/db` (type-only imports)
- Use `import type { Measurement, GlobalVariable } from '@optimitron/db'`
- Keep Prisma schema as the single source of truth

**DO NOT:**
- Import `@prisma/client` in library packages (optimizer, wishocracy, opg, obg, data)
- Define duplicate interfaces in library packages that mirror DB models
- Create separate "db-types" packages — the types live in `@optimitron/db`

### 2. Library Package Rules

These packages are **pure functions with ZERO runtime database dependencies:**
- `@optimitron/optimizer` — Domain-agnostic causal inference
- `@optimitron/wishocracy` — Preference aggregation (RAPPA)
- `@optimitron/opg` — Optimal Policy Generator
- `@optimitron/obg` — Optimal Budget Generator
- `@optimitron/data` — Data fetchers and importers

They MAY import **type-only** exports from `@optimitron/db`.
They MUST NOT import Prisma client, database connections, or any runtime DB code.
They MUST work in the browser (for PGlite/local-first).

### 3. Domain Agnosticism

`@optimitron/optimizer` is **completely domain-agnostic**. NEVER reference:
- ❌ "drugs", "supplements", "treatments", "patients"
- ❌ "policies", "budgets", "politicians", "government"
- ✅ "predictor", "outcome", "variable", "measurement", "effect size"

Domain-specific naming belongs in opg/obg/wishocracy/data/web.

### 4. Naming Conventions

| Convention | Example |
|-----------|---------|
| FK field names match target model | `globalVariableId` not `variableId` |
| Predictor/outcome terminology | `predictorGlobalVariableId` not `causeVariableId` |
| Outcome not effect in properties | `outcomeBaselineAverage` (but `effectSize` stays — Cohen's d) |
| Enums over magic strings | Prisma enforces valid values |
| deletedAt on all models | Soft deletes for cr-sqlite sync |
| No CureDAO/QuantiModo branding | Use "legacy API" for references |

### 5. Package Dependencies

```
optimizer ← nothing (foundation)
wishocracy ← nothing (standalone)
opg ← optimizer
obg ← optimizer
data ← nothing (standalone)
db ← nothing (standalone)
web ← everything (application layer)
chat-ui ← nothing (standalone)
```

Library packages NEVER import from each other except as shown above.
The web package is the integration layer where everything comes together.

### 6. Testing

- **No code without tests.** Every function gets a test.
- Pre-commit runs ALL tests. If tests fail, don't commit.
- Use `pnpm --filter @optimitron/<package> test` to run package tests.
- Integration tests that depend on multiple packages go in `packages/examples`.
- Currently ~1,700+ tests across all packages.

### 7. CI/CD

- GitHub Actions: typecheck + lint + test on push/PR
- `packages/web` is excluded from CI typecheck/lint/test (build-only via deploy workflow)
- Full server-side web app deploy target: Vercel with project root `packages/web`
- GitHub Pages is legacy/static-only and does not support auth, cron, or server routes

### 8. Git Workflow

- Always `git pull --rebase` before starting work
- Always `git pull --rebase` before pushing
- Commit with conventional commits: `feat:`, `fix:`, `test:`, `refactor:`, `docs:`, `ci:`
- Use `--no-verify` only if pre-commit hooks are slow; ensure tests pass
- If push fails (conflict), `git pull --rebase` and retry once

### 9. File Ownership (Parallel Agents)

When multiple agents work simultaneously, each ONLY modifies files in its assigned package:
- Agent working on optimizer → only touch `packages/optimizer/`
- Agent working on data → only touch `packages/data/`
- etc.

This prevents git conflicts. The web package integrates everything.

### 10. Key Files

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Detailed agent instructions (algorithms, papers, architecture) |
| `AGENTS.md` | This file — architectural rules for all agents |
| `CHECKLIST.md` | Prioritized feature checklist (P0/P1/P2) |
| `USER_STORIES.md` | User personas and revenue strategy |
| `FUNDING.md` | Funding plan and targets |
| `ONE_PAGER.md` | Elevator pitch |
| `ARCHITECTURE.md` | Technical architecture details |
| `LEGACY_API_GAPS.md` | Features from legacy API not yet ported |

### 11. Papers (Algorithm Source of Truth)

Before implementing any algorithm, read the relevant paper:
- Optimizer → [dFDA Spec](https://dfda-spec.warondisease.org)
- Wishocracy → [Wishocracy](https://wishocracy.warondisease.org)
- OPG → [Optimal Policy Generator](https://opg.warondisease.org)
- OBG → [Optimal Budget Generator](https://obg.warondisease.org)
- IAB → [Incentive Alignment Bonds](https://iab.warondisease.org)

## Quick Start

```bash
cd /mnt/e/code/optimitron
git pull --rebase
pnpm install
pnpm build
pnpm test
```
