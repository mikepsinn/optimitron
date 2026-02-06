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
2. Working on `@optomitron/wishocracy`? → Read Wishocracy (RAPPA, eigenvector, Citizen Alignment Scores)
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
│   ├── wishocracy/   # 🗳️ Preference aggregation (Wishocracy/RAPPA)
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
│   ├── web/          # 🌐 Next.js (Phase 3 — after libraries work)
│   │   └── Multi-tenant jurisdiction dashboard
│   │
│   └── treasury/     # 💎 IAB Treasury (Phase 4 — after web works)
│       └── Smart contracts, token, alignment-based fund distribution
```

### Phase 4: Treasury / Incentive Alignment Bonds (Future)

Citizens donate to a transparent crypto treasury. Smart contracts automatically distribute campaign funds to politicians based on their Citizen Alignment Scores. No middleman.

Flow: Citizens donate → Treasury holds funds → Alignment scores update on-chain → Smart contracts release funds to high-alignment campaigns → AI agents run ads/social media for those candidates

**Paper**: `/mnt/e/code/obsidian/websites/disease-eradication-plan/knowledge/appendix/incentive-alignment-bonds-paper.qmd` ([iab.warondisease.org](https://iab.warondisease.org))

**DO NOT build this yet.** Prerequisites:
1. ✅ Causal engine working
2. ⬜ RAPPA collecting real preferences  
3. ⬜ Voting record data flowing in
4. ⬜ Alignment scores published
5. ⬜ THEN treasury makes sense

Existing Solidity contracts in the old wishocracy repo (`/mnt/e/code/wishocracy/contracts/`) can be a starting point.

## Jurisdiction Model ("Government OS")

Any jurisdiction (city, county, state, country) should be able to deploy Optomitron as its governance operating system. The libraries are already agnostic — the jurisdiction-specific stuff is **configuration, not code**.

### What a Jurisdiction Gets
1. **Preference collection** — citizens do pairwise comparisons on LOCAL priorities
2. **Outcome tracking** — local health/wealth/satisfaction data
3. **Causal analysis** — "did that road project reduce commute times?"
4. **Policy recommendations** — "based on similar jurisdictions, here's what works"
5. **Budget optimization** — "here's where your budget has the most impact"
6. **Accountability** — "how do your officials' votes align with citizen preferences?"

### Architecture Implications
- **DB schema is multi-tenant**: Every model should have a `jurisdictionId` field
- **Items/priorities are per-jurisdiction**: Federal budget categories ≠ city budget categories
- **Data fetchers are pluggable**: A city uses different data sources than a country
- **Officials are per-jurisdiction**: Politicians, council members, mayors — all fit the same `Politician` model
- **Comparison across jurisdictions** is a key feature: "City A spends X on education and gets Y outcomes; City B spends Z..."

### What This Means for Library Code
- `causal`, `wishocracy`, `opg`, `obg` stay jurisdiction-agnostic (they already are)
- `db` schema needs `jurisdictionId` on relevant models
- `data` fetchers take jurisdiction config as a parameter
- The **web app** handles multi-tenancy (auth, routing, tenant isolation)
- Think of it like Shopify but for governments: same platform, each jurisdiction is a "store"

## The Core Insight

`@optomitron/causal` is **completely domain-agnostic**. It takes any two time series and answers: "Does changing X cause Y to change? By how much? What's the optimal value of X?"

This works for ANY optimization problem with time series data:

| Domain | Predictor (X) | Outcome (Y) | Question |
|--------|--------------|-------------|----------|
| **Health (dFDA)** | Drug/Supplement | Symptom/Biomarker | "Does magnesium improve sleep?" |
| **Policy (OPG)** | Policy change | Welfare metric | "Does tobacco tax reduce smoking?" |
| **Budget (OBG)** | Spending level | Welfare metric | "What's the optimal education budget?" |
| **Governance (RAPPA)** | Alignment score | Welfare metric | "Do responsive politicians produce better outcomes?" |
| **Business** | Ad spend | Revenue | "What's the optimal marketing budget?" |
| **Business** | Pricing change | Conversion rate | "What price maximizes conversions?" |
| **Business** | Feature release | User retention | "Did this feature improve retention?" |
| **Agriculture** | Fertilizer amount | Crop yield | "What's the optimal fertilizer level?" |
| **Manufacturing** | Temperature setting | Defect rate | "What temperature minimizes defects?" |

All use the same pipeline: **Temporal alignment** → **Bradford Hill criteria** → **Predictor Impact Score** → **Optimal value**

**The library doesn't know what it's optimizing.** It just sees predictor time series and outcome time series. The domain-specific packages (opg, obg, wishocracy) add context on top.

### Implications for Code
- **NEVER put domain-specific logic in `@optomitron/causal`** — no references to "drugs", "policies", "budgets", "politicians"
- Use generic terms: predictor, outcome, variable, measurement, effect
- Domain-specific naming belongs in opg/obg/wishocracy/data
- A business analyst should be able to `npm install @optomitron/causal` and use it for revenue optimization without ever seeing the word "government"

## Package Dependencies

```
causal ← opg (uses causal for policy scoring)
causal ← obg (uses causal for budget optimization)
causal ← wishocracy (alignment → outcome analysis)
data   ← opg, obg (fetches real-world data)
db     ← (standalone, Prisma schema for web app)
wishocracy ← (standalone pure math, NO db imports)
```

Key rules:
- **`causal` depends on NOTHING** — it's the foundation
- **`wishocracy` has ZERO database imports** — pure functions only
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
