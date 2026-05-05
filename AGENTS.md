# AGENTS.md — Instructions for AI Agents

**Read this FIRST before making any changes.**

## Core Working Rules

- Read the relevant package `AGENTS.md` before editing package files.
- Never import Prisma client in library packages (optimizer, wishocracy, opg, obg, data, agent, hypercerts, storage)
- Use `import type` for cross-package type imports
- Follow existing patterns — read surrounding code before writing new code
- Changes to the Prisma schema or exported `@optimitron/db` types require explicit human approval.
- If the human says `optimize earth`, follow `docs/OPTIMIZE_EARTH_PROTOCOL.md`.

## Local Dev Safety

- If a local dev server is already running, do not disrupt it for routine verification; if a clean build, restart, or separate run is genuinely needed, that is fine, but escalate from narrow checks to heavier ones only when necessary.

## UI Verification

- After changing any user interface surface, capture screenshots of the affected pages or states before considering the work complete.
- Inspect the screenshots yourself for layout breakage, overlapping text, missing content, broken styling, and obvious responsive problems.
- Before committing UI changes, tell the human which screenshots you captured, summarize anything you noticed, and explicitly ask them to review the screenshots.
- If screenshots cannot be captured, state exactly why and do not commit the UI change until the human accepts that limitation.
- Reuse an existing dev server for screenshot checks when available; do not disrupt a running server unless a clean run is genuinely needed.

## Documentation

Detailed docs live in `docs/`. Read the relevant ones before working:
- `docs/TYPE_SYSTEM.md` — How types flow from Prisma → all packages
- `docs/h2ewd.md` — Wishonia/H2EWD voice for public-facing persuasion copy

## Public Copy Rules

Before writing or editing any public-facing website, email, metadata, CTA, empty-state, dashboard, survey, referral, or partner copy, read `docs/h2ewd.md` and apply that voice.

- Be concise. Cut filler, throat-clearing, internal process language, and generic nonprofit/consultant copy.
- Speak directly to the specific human or organization that should do something.
- Make the action obvious, then show the value to them for doing it.
- Be funny when the surface allows it. Dry, concrete, slightly alien, and useful beats cute or verbose.
- Do not leak implementation or planning terms into user copy: "site variant", "program graph", "initiative landing page", "approved organizations get", "route allowlist", etc.
- Prefer strong concrete nouns and verbs. If a sentence could appear on any SaaS landing page, rewrite it.
- For treaty/vote/referral copy, optimize for voting, sharing, embedding, and task completion, not explaining the whole system.
- Never commit user-facing copy changes until the human has reviewed and explicitly approved them for commit.
- When you finish editing user-facing copy, output the changed copy in your response and explicitly ask the human to review it before committing.


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

They MAY import **type-only** exports from `@optimitron/db`.
They MUST NOT import Prisma client, database connections, or any runtime DB code.
They MUST work in the browser (for PGlite/local-first).

### 3. Domain Agnosticism

`@optimitron/optimizer` is **completely domain-agnostic**. NEVER reference:
- "drugs", "supplements", "treatments", "patients"
- "policies", "budgets", "politicians", "government"
- Use: "predictor", "outcome", "variable", "measurement", "effect size"

Domain-specific naming belongs in opg/obg/wishocracy/data/web.

### 4. Naming Conventions

| Convention | Example |
|-----------|---------|
| FK field names match target model | `globalVariableId` not `variableId` |
| Predictor/outcome terminology | `predictorGlobalVariableId` not `causeVariableId` |
| Outcome not effect in properties | `outcomeBaselineAverage` (but `effectSize` stays — Cohen's d) |
| Enums over magic strings | Prisma enforces valid values |
| deletedAt on all models | Soft deletes for cr-sqlite sync |

### 5. Dependency Graph

```
optimizer ← (nothing, foundation)
wishocracy ← (nothing, standalone pure math)
opg ← optimizer, data
obg ← optimizer, opg
data ← optimizer
agent ← data, obg, opg, optimizer, storage, hypercerts, wishocracy
web ← everything
```

**No circular deps.** If you need something from both directions, it belongs in `optimizer`.

### Papers (Algorithm Source of Truth)

Before implementing any algorithm, read the relevant paper:
- Optimizer → [dFDA Spec](https://dfda-spec.warondisease.org)
- Wishocracy → [Wishocracy](https://wishocracy.warondisease.org)
- OPG → [Optimal Policy Generator](https://opg.warondisease.org)
- OBG → [Optimal Budget Generator](https://obg.warondisease.org)
- IAB → [Incentive Alignment Bonds](https://iab.warondisease.org)
