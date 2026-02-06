# CLAUDE.md - Optomitron Agent Instructions

## What This Is

Optomitron is an **AI governance platform** for maximizing median health and happiness for humanity. It collects human preferences and outcome data, runs causal inference to figure out what works, and generates optimal policy and budget recommendations.

The system connects:
- **What people want** (pairwise preference surveys via RAPPA)
- **What's happening** (health/wealth outcome tracking via dFDA)  
- **What causes what** (causal inference engine)
- **What to do about it** (optimal policy & budget generation)

## Papers (Required Reading)

These papers define the algorithms you're implementing. **Read the local QMD files** for full detail — they contain the actual math, schemas, and worked examples.

| Paper | Local Path (read this!) | Web URL |
|-------|------------------------|---------|
| **dFDA Spec** | `/mnt/e/code/obsidian/websites/disease-eradication-plan/knowledge/appendix/dfda-spec-paper.qmd` | https://dfda-spec.warondisease.org |
| **Optimocracy** | `/mnt/e/code/obsidian/websites/disease-eradication-plan/knowledge/appendix/optimocracy-paper.qmd` | https://optimocracy.warondisease.org |
| **Optimal Policy Generator** | `/mnt/e/code/obsidian/websites/disease-eradication-plan/knowledge/appendix/optimal-policy-generator-spec.qmd` | https://opg.warondisease.org |
| **Optimal Budget Generator** | `/mnt/e/code/obsidian/websites/disease-eradication-plan/knowledge/appendix/optimal-budget-generator-spec.qmd` | https://obg.warondisease.org |
| **Wishocracy** | `/mnt/e/code/obsidian/websites/disease-eradication-plan/knowledge/appendix/wishocracy-paper.qmd` | https://wishocracy.warondisease.org |

**Before implementing an algorithm, read the relevant paper section.** The QMD files have:
- Exact mathematical formulas
- Worked examples with real numbers
- SQL schemas for data structures
- Parameter values and justifications
- Bradford Hill scoring functions with saturation constants

### How to Use the Papers
1. Working on `@optomitron/causal`? → Read dFDA Spec (PIS, temporal alignment, effect size)
2. Working on `@optomitron/rappa`? → Read Wishocracy (RAPPA, eigenvector, Citizen Alignment Scores)
3. Working on `@optomitron/opg`? → Read Optimal Policy Generator (Policy Impact Score, CCS)
4. Working on `@optomitron/obg`? → Read Optimal Budget Generator (OSL, diminishing returns, BIS)
5. Working on welfare metrics? → Read Optimocracy (two-metric welfare function)

The papers are large (1000-2000 lines each). Read the specific section relevant to what you're implementing — don't try to read them all at once.

## Architecture

```
optomitron/
├── packages/
│   ├── causal/       # 🧠 Domain-agnostic causal inference engine
│   │   └── Temporal alignment, Bradford Hill, PIS, effect size
│   │
│   ├── rappa/        # 🗳️ Preference aggregation (Wishocracy/RAPPA)
│   │   └── Pairwise comparisons, eigenvector, alignment scores
│   │
│   ├── opg/          # 📋 Optimal Policy Generator
│   │   └── Policy scoring, jurisdiction analysis (uses causal)
│   │
│   ├── obg/          # 💰 Optimal Budget Generator
│   │   └── Diminishing returns, cost-effectiveness (uses causal)
│   │
│   ├── data/         # 📊 Data fetchers
│   │   └── OECD, World Bank, FRED, WHO, Congress API
│   │
│   ├── db/           # 🗄️ Prisma schema + database
│   │   └── All survey responses, health data, preferences
│   │
│   └── web/          # 🌐 Next.js (Phase 3 — after libraries work)
│       └── Dashboard, pairwise UI, health tracking, reports
```

## The Core Insight

The same causal inference engine works across all domains:

| Application | Predictor | Outcome | Example |
|-------------|-----------|---------|---------|
| **dFDA** | Drug/Supplement | Symptom/Biomarker | "Does magnesium improve sleep?" |
| **OPG** | Policy | Welfare metrics | "Does tobacco tax reduce smoking?" |
| **OBG** | Spending level | Welfare metrics | "What's the optimal education budget?" |
| **RAPPA** | Alignment score | Welfare metrics | "Do high-alignment politicians produce better outcomes?" |

All use: **Temporal alignment** → **Bradford Hill criteria** → **Predictor Impact Score**

## Package Dependencies

```
causal ← opg (uses causal for policy scoring)
causal ← obg (uses causal for budget optimization)
causal ← rappa (alignment → outcome analysis)
data   ← opg, obg (fetches real-world data)
db     ← (standalone, Prisma schema for web app)
rappa  ← (standalone pure math, NO db imports)
```

Key rules:
- **`causal` depends on NOTHING** — it's the foundation
- **`rappa` has ZERO database imports** — pure functions only
- **`db` is for the web app layer** — libraries never import it
- **No circular deps** — if you need something from both directions, it belongs in `causal`

## Hard Rules

1. **No code without tests.** Every function gets a test. No exceptions.
2. **Run `pnpm check` before committing.** (typecheck + lint + test)
3. **Library packages have ZERO database imports.** Pure functions only.
4. **Types use Zod schemas** where runtime validation matters.
5. **One task per agent run.** Quality over quantity.

## Type Safety & Linting

Before committing, always run:
```bash
pnpm check    # runs: typecheck + lint + test
```

- **TypeScript strict mode** is ON (noUncheckedIndexedAccess, noImplicitOverride)
- **ESLint** uses typescript-eslint strict rules
- **No `any`** — use proper types or `unknown` with type guards
- **No floating promises** — always await or void
- **No unused variables** — prefix with `_` if intentionally unused
- **All tsconfigs extend `tsconfig.base.json`** — don't override strict settings

## Self-Review: Be Ruthlessly Critical

Every run, before picking a new task, scan the codebase with fresh eyes:

### Code Smells to Fix Immediately
- **Dead code**: Unused imports, unreachable branches, commented-out code → delete it
- **Copy-paste**: Same logic in multiple places → extract to shared function
- **Over-engineering**: Abstract base classes nobody extends, factories that create one thing → simplify
- **Wrong abstractions**: If a function takes 8 parameters, it's doing too much → split it
- **Magic numbers**: Unexplained constants → named constants citing the paper
- **Stale TODOs**: TODO comments with no plan → either do it or delete it

### The Simplicity Test
**"Could a junior developer understand this in 30 seconds?"**
If not, simplify it. This should not feel like enterprise Java.

### What Good Looks Like
- Functions are <30 lines
- Files are <300 lines
- Module names tell you exactly what's inside
- Tests read like documentation
- No unnecessary abstractions — just functions that take data and return results

## Workflow

1. `cd /mnt/e/code/optomitron`
2. `git pull` (get latest)
3. Check: `pnpm install && pnpm build && pnpm test`
4. **Self-review pass** (see above)
5. Pick first `todo` task from TASKS.md
6. Implement with tests
7. `pnpm check` (must pass!)
8. `git add -A && git commit -m "<conventional commit>" && git push`
9. Report what you did

## Commit Messages
Follow conventional commits:
- `feat: Add OECD data fetcher`
- `fix: Correct p-value calculation for small n`
- `test: Add temporal alignment unit tests`
- `refactor: Split core into opg/obg packages`

## Contact

This repo is owned by Mike P. Sinn (@mikepsinn). If you need clarification on methodology, reference the papers above or ask via Telegram.
