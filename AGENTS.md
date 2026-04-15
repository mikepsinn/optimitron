# AGENTS.md — Instructions for All AI Agents

**Read this FIRST before making any changes.**

## Multi-Agent Coordination

Multiple AI agents work on this repo in parallel.

- **Default mode:** lane-based coordination. Each agent is assigned to a set of packages it owns.
- **Optimize Earth mode:** task-based coordination. If the human says `optimize earth`, the task database becomes the source of truth and the leased task becomes the ownership boundary.

### Lane Assignments

| Lane | Packages | Focus |
|------|----------|-------|
| **Core Math** | `optimizer`, `wishocracy` | Algorithm correctness, paper compliance, test coverage |
| **Policy & Budget** | `opg`, `obg`, `data` | Data pipelines, policy scoring, budget optimization |
| **Web & API** | `web` | UI, API routes, task system, treaty pages |
| **Treasury & Contracts** | `treasury-prize`, `treasury-iab`, `treasury-wish`, `treasury-shared` | Smart contracts, agent funding mechanism |
| **Agent & Infra** | `agent`, `hypercerts`, `storage` | Autonomous analysis, publishing, agent orchestration |

### Coordination Rules

1. **In default mode, one package per agent at a time.** Do not edit files in packages outside your lane.
2. **Types are the contract.** `@optimitron/db` exports are shared by everyone. Changes to the Prisma schema or exported types require explicit human approval.
3. **Branch per agent.** Use git worktrees. One branch per lane. Never push to main directly.
4. **Interface changes require coordination.** If you need to change a public export signature that other packages depend on, document the change and stop — let the human merge and coordinate.
5. **Read the package AGENTS.md.** Each package has its own `AGENTS.md` with scope, exports, rules, and off-limits.

### Optimize Earth Mode

When the human says `optimize earth`, switch from lane ownership to **task ownership**.

Use this protocol exactly:

1. Check the current branch/PR for broken GitHub Actions if that information is available.
2. If GitHub Actions are broken because of repo code, treat fixing them as the immediate system-blocker task before trusting the queue.
3. Audit whether the current queue is sane enough to trust.
4. If the queue is obviously narrow, arbitrarily capped, missing quantified impact, or missing system/growth tasks, run `pnpm --filter @optimitron/web run bootstrap:optimize-earth` if available, then propose system-improvement tasks first.
5. Call `getQueueAudit`, then call `getNextAction` with your capabilities.
6. If an action returns a task, call `acquireLease`.
7. Work only on the leased task and only touch files required for that task.
8. If the task runs longer than the lease window, call `heartbeatLease`.
9. If no executable task exists, call `proposeTaskBundle` for high-value missing tasks or unblockers.
10. Never create `ACTIVE` tasks directly. Agent-created tasks must start as `DRAFT`.
11. Never promote tasks unless review passes and the promotion path explicitly allows it.
12. Before any outreach action, respect `checkContactCooldown` / `recordContactAction`.
13. Call `logAgentRun` for planned or skipped work, then release the lease when done.

Additional rules in Optimize Earth mode:

- **One active lease per agent.** Do not hold multiple tasks at once.
- **Task lease supersedes lane boundaries.** A leased task may require edits across packages, but only the files needed for that task may be changed.
- **No repo-wide refactors from a vague prompt.** If the task does not require it, do not do it.
- **No freestyle canonical planning.** New tasks enter the system through `proposeTaskBundle`, review, and promotion.
- **If the task DB/MCP is unavailable, stop and report blocked.** Do not invent an alternate source of truth.

### What Every Agent Must Do

- Run `pnpm check` (typecheck + lint + test) before considering work done
- Never import Prisma client in library packages (optimizer, wishocracy, opg, obg, data, agent, hypercerts, storage)
- Use `import type` for cross-package type imports
- Follow existing patterns — read surrounding code before writing new code
- In `optimize earth` mode, follow `docs/OPTIMIZE_EARTH_PROTOCOL.md`

### Local Dev Safety

- If a local dev server is already running, do not disrupt it for routine verification; if a clean build, restart, or separate run is genuinely needed, that is fine, but escalate from narrow checks to heavier ones only when necessary.

## Documentation

Detailed docs live in `docs/`. Read the relevant ones before working:
- `docs/TYPE_SYSTEM.md` — How types flow from Prisma → all packages


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
