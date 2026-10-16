# Optimitron

Optimitron is a TypeScript pnpm monorepo with **8 Next.js 15 apps** and **17 workspace packages** built on Prisma and PostgreSQL. At its core is a domain-agnostic **time-series causal-inference engine** (`@optimitron/optimizer`: temporal alignment, Bradford Hill scoring, effect sizes, optimal values), plus policy, budget, and preference-aggregation libraries built on top of it.

It also ships an **MCP server with 100+ tools** so AI agents can work against a live task graph, and an **agent runtime** (`@optimitron/agent`) with compute guardrails, task leases, a human-approval gate for external actions, and audit trails.

> **Mission:** use data to find what actually improves health and income, for individuals and for governments, and make the tools open and free.

---

## Contents

- [Quick Start](#quick-start)
- [Apps](#apps)
- [Packages](#packages)
- [MCP server & agents](#mcp-server--agents)
- [Architecture](#architecture)
- [Stack & quality](#stack--quality)
- [Docs](#docs)
- [Background & papers](#background--papers)

---

## Quick Start

**Prerequisites:** Node.js ≥ 18, pnpm 8 (`packageManager: pnpm@8.14.0`), and Docker (for local Postgres).

```bash
git clone https://github.com/mikepsinn/optimitron.git
cd optimitron

# 1. Environment
cp .env.example .env
#    Minimum for local dev:
#      DATABASE_URL=postgresql://postgres:postgres@localhost:5432/optimitron   (already the default; matches docker-compose)
#      NEXTAUTH_URL=http://localhost:3001
#      NEXTAUTH_SECRET=<any long random string>   # required by auth, MCP OAuth, and email tokens
#    Optional, per feature: GOOGLE_CLIENT_ID/SECRET (Google login), RESEND_API_KEY (email),
#      GOOGLE_GENERATIVE_AI_API_KEY (agent/Gemini), CONGRESS_API_KEY / FRED_API_KEY (data fetchers),
#      STORACHA_* / PINATA_* (IPFS), ATPROTO_* (Hypercerts publishing).

# 2. Install (postinstall generates the Prisma client)
pnpm install

# 3. Database: start Postgres in Docker, run migrations, generate client, sync managed data
pnpm db:setup

# 4. Run the main app on http://localhost:3001
pnpm dev
```

The main app's `dev` script links `apps/optimitron/.env` to the root `.env` and won't start against a non-local `DATABASE_URL` (see [docs/LOCAL_DB.md](./docs/LOCAL_DB.md)).

**Other apps:**

| Command | App | Port |
|---|---|---|
| `pnpm dev` | `apps/optimitron` | 3001 |
| `pnpm dev:warondisease` | `apps/warondisease` | 3010 |
| `pnpm dev:dfda` | `apps/dfda` | 3011 |
| `pnpm dev:wishocracy` | `apps/wishocracy` | 3013 |
| `pnpm dev:trialabundancesurvey` | `apps/trialabundancesurvey` | 3014 |
| `pnpm dev:curedao` | `apps/curedao` | 3015 |
| `pnpm dev:acceleratedmedicine` | `apps/acceleratedmedicine` | 3016 |
| `pnpm dev:courtofhumanity` | `apps/courtofhumanity` | 3017 |

**Common commands:**

```bash
pnpm check              # typecheck + lint + test (must pass before committing)
pnpm build              # build all workspaces
pnpm test               # all package tests
pnpm test:apps:unit     # site-app unit tests
pnpm smoke:apps         # HTTP smoke checks for site apps
pnpm db:reset           # drop the Docker volume and re-run db:setup
pnpm mcp:catalog        # regenerate the MCP tool catalog
pnpm alignment:sync     # sync benchmark politicians from Congress.gov
```

---

## Apps

| App | Package | What it is |
|---|---|---|
| [`apps/optimitron`](apps/optimitron/) | `@optimitron/web` | Main Next.js app and API: auth (Google OAuth, magic link, proof of personhood), task graph, the MCP endpoint, voting and referendums, politician alignment reports, budget/policy generators, and health tracking |
| [`apps/warondisease`](apps/warondisease/) | `@apps/warondisease` | War on Disease campaign site ([warondisease.org](https://warondisease.org)) |
| [`apps/dfda`](apps/dfda/) | `@apps/dfda` | Condition, treatment, and clinical-trial app ([dfda.earth](https://dfda.earth)) |
| [`apps/wishocracy`](apps/wishocracy/) | `@apps/wishocracy` | Pairwise public-priority allocation and public results ([wishocracy.org](https://wishocracy.org)) |
| [`apps/trialabundancesurvey`](apps/trialabundancesurvey/) | `@apps/trialabundancesurvey` | Neutral clinical-trial abundance survey ([trialabundancesurvey.org](https://trialabundancesurvey.org)) |
| [`apps/curedao`](apps/curedao/) | `@apps/curedao` | CureDAO project directory ([curedao.org](https://curedao.org)) |
| [`apps/acceleratedmedicine`](apps/acceleratedmedicine/) | `@apps/acceleratedmedicine` | Institute for Accelerated Medicine site ([acceleratedmedicine.org](https://acceleratedmedicine.org)) |
| [`apps/courtofhumanity`](apps/courtofhumanity/) | `@apps/courtofhumanity` | Court of Humanity project directory, plaintiff registration, and the separate Court MCP endpoint ([courtofhumanity.org](https://courtofhumanity.org)) |

The site apps share their shell, auth, and UI through `@optimitron/site-kit` and `@optimitron/neobrutalist-ui`. See [apps/README.md](apps/README.md) and [apps/DEPLOYMENT.md](apps/DEPLOYMENT.md).

---

## Packages

| Package | Purpose |
|---|---|
| [`@optimitron/optimizer`](packages/optimizer/) | Domain-agnostic time-series causal inference: temporal alignment, Bradford Hill, effect sizes, Predictor Impact Score, optimal values. Has no dependencies. |
| [`@optimitron/wishocracy`](packages/wishocracy/) | RAPPA pairwise preference aggregation, eigenvector weights, and alignment scoring |
| [`@optimitron/opg`](packages/opg/) | Optimal Policy Generator: policy scoring, jurisdiction analysis, causal confidence |
| [`@optimitron/obg`](packages/obg/) | Optimal Budget Generator: diminishing returns, optimal spending levels, Budget Impact Score |
| [`@optimitron/data`](packages/data/) | Public-data fetchers (OECD, World Bank, Census, WHO, FRED, Congress.gov…) and local-first health importers |
| [`@optimitron/db`](packages/db/) | Prisma schema, client, migrations, and Zod validators |
| [`@optimitron/mcp`](packages/mcp/) | Shared MCP primitives: resources, auth, result shaping, and audit helpers |
| [`@optimitron/tracking`](packages/tracking/) | Personal health-tracking engine (measurements, tracking reminders, notifications) and its MCP tool surface, shared by optimitron.com and dfda.earth |
| [`@optimitron/agent`](packages/agent/) | Agent runtime: orchestrator, task runtime/tree/governance/capability model, compute guardrails (analysis, API-call, and time budgets), optimal-next-action selection, CI triage, legislation drafting with evidence, test-output review, Gemini reasoning, image generation, and ERC-8004 identity helpers |
| [`@optimitron/site-kit`](packages/site-kit/) | Shared site-app shell, configuration, auth, and campaign components |
| [`@optimitron/neobrutalist-ui`](packages/neobrutalist-ui/) | Shared shadcn-style UI components for the site apps |
| [`@optimitron/chat-ui`](packages/chat-ui/) | Conversational UI components and text-to-measurement parsing for health tracking |
| [`@optimitron/survey-embed`](packages/survey-embed/) | Embeddable Trial Abundance Survey (iframe wrapper and loader script) |
| [`@optimitron/storage`](packages/storage/) | Content-addressed IPFS (Storacha/Pinata) snapshots for analysis history |
| [`@optimitron/hypercerts`](packages/hypercerts/) | Hypercert record builders and AT Protocol publishing helpers |
| [`@optimitron/extension`](packages/extension/) | Chrome extension for local-first personal health tracking with on-device analysis (no test suite yet) |
| [`@optimitron/wishonia-widget`](packages/wishonia-widget/) | Embeddable animated character widget with lip-sync and optional chat |

---

## MCP server & agents

The Optimitron MCP server lets AI agents work against the live task graph instead of guessing from stale docs or chat history. It's implemented in `apps/optimitron/src/lib/mcp-server.ts` and served over HTTP by the main app, with a stdio entry point for local agents.

**Authoritative tool reference:** [optimitron.com/developers/tools](https://optimitron.com/developers/tools) (for humans) and `/api/mcp/tools` (for machines). Run `pnpm mcp:catalog` to regenerate the catalog.

**Tool categories** (from [docs/MCP_SERVER.md](./docs/MCP_SERVER.md)):

- **Queue discovery:** `listTasks`, `searchTasks`, `getTask`, `getBlockers`, `getQueueAudit`, `getNextAction`, `getAIQueue`, `evaluateTaskEconomics`
- **Task management:** `createTask`, `updateTask`, `proposeTaskBundle` (drafts with duplicate review), `promoteTask`, `addDependency`, `recordTaskActuals`
- **Execution and verification** (admin/agent-gated): `startTaskExecution`, `submitTaskArtifact`, `submitTaskForVerification`, `verifyTaskExecution`, `getTaskAuditTrail`
- **Agent coordination:** `acquireLease`, `heartbeatLease`, `releaseLease`, `logAgentRun`, `getNextTask`
- **External-action approval:** `proposeExternalAction`, `recordExternalActionResult`
- **Reviewed form responses:** `findReviewedAnswers`, `prepareFormResponses`, `proposeFormSubmission`
- **Documents and collections:** versioned markdown documents and structured record collections
- **Comments, referendums, content access, health tracking, task templates**
- **Knowledge:** `searchManual`, `askWishonia`, `searchRepo`, `getFileContent`, `listRepoFiles`, `listSitePages`, `getPageContent`

**Safety model:**

- **OAuth scopes.** Claim and completion operations take the actor from the OAuth identity, never from a caller-supplied user ID. Lease and run logging need the `agent:run` scope.
- **Leases.** Agents acquire a lease on a task, send heartbeats during long-running work, and release it, so parallel agents don't collide.
- **Human approval.** Agents can only *propose* external actions. Approval needs the `actions:approve` scope, which only human approval clients can hold and agent tokens cannot.
- **Audit.** Agent runs, task attempts, artifacts, and verification are recorded, and break-glass admin access is explicit and audited.

**Local agent (stdio)** — for example, in a Claude Code MCP config:

```json
{
  "mcpServers": {
    "optimitron-tasks": {
      "command": "pnpm",
      "args": ["--filter", "@optimitron/web", "exec", "tsx", "scripts/mcp-task-server.ts"],
      "env": { "MCP_USER_EMAIL": "you@example.com" }
    }
  }
}
```

To pick up one task in a single command, run `pnpm --filter @optimitron/web mcp:claude-task`. It claims the top AI-queue task and writes a prompt file. Then run `... mcp:claude-task -- finish --task-id <id> --summary "..." --pr-url <url>`.

**Court of Humanity MCP:** Court case tools are hosted only at `https://courtofhumanity.org/api/mcp` and need their own OAuth authorization. See [docs/COURT_MCP_CUTOVER.md](./docs/COURT_MCP_CUTOVER.md) and [docs/COURT_MCP_OAUTH_ROLLOUT.md](./docs/COURT_MCP_OAUTH_ROLLOUT.md).

---

## Architecture

```
                    ┌──────────────┐
                    │  optimizer   │  ← domain-agnostic math core, no deps
                    └──────┬───────┘
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌─────────┐  ┌────────────┐  ┌─────────┐
        │   opg   │  │ wishocracy │  │   obg   │
        └─────────┘  └────────────┘  └─────────┘

  data · db · mcp · tracking · agent · storage · hypercerts       (services & integration)
  site-kit · neobrutalist-ui · chat-ui · wishonia-widget · survey-embed · extension   (UI)

  apps/optimitron (main app + MCP)   apps/warondisease · dfda · wishocracy ·
                                     trialabundancesurvey · curedao ·
                                     acceleratedmedicine · courtofhumanity
```

**Rules:** `@optimitron/optimizer` depends on nothing and stays domain-agnostic. The library packages are pure TypeScript. There are no circular dependencies. For the full picture, see [docs/SYSTEM_MAP.md](./docs/SYSTEM_MAP.md) and [docs/PRD.md](./docs/PRD.md).

---

## Stack & quality

TypeScript (strict, `noUncheckedIndexedAccess`) · pnpm workspaces · Next.js 15 / React 18 · Prisma + PostgreSQL (Docker Compose) · Zod · MCP (HTTP + stdio, OAuth scopes) · Gemini · IPFS/Storacha · AT Protocol.

Quality gates: `pnpm check` (typecheck + lint + test), Husky + lint-staged pre-commit hooks, conventional commits, app unit tests, HTTP smoke checks, and visual-review coverage for site pages. Read [CLAUDE.md](./CLAUDE.md) and [AGENTS.md](./AGENTS.md) for the full developer guide.

---

## Docs

| Doc | Topic |
|---|---|
| [PRD](./docs/PRD.md) | Product requirements |
| [SYSTEM_MAP](./docs/SYSTEM_MAP.md) | System overview |
| [FEATURES](./docs/FEATURES.md) | Shipped features |
| [ROADMAP](./docs/ROADMAP.md) | Roadmap |
| [MCP_SERVER](./docs/MCP_SERVER.md) | MCP server, scopes, and agent workflow |
| [TASK_MODEL](./docs/TASK_MODEL.md) · [TASK_COMMUNICATION_MODEL](./docs/TASK_COMMUNICATION_MODEL.md) | Task graph and communications |
| [ANALYSIS_PIPELINE](./docs/ANALYSIS_PIPELINE.md) | Causal-analysis pipeline |
| [DATA_SOURCES](./docs/DATA_SOURCES.md) | External data sources |
| [LOCAL_DB](./docs/LOCAL_DB.md) | Local database setup |
| [TYPE_SYSTEM](./docs/TYPE_SYSTEM.md) | Type conventions |
| [DEVELOPER_API_PLAN](./docs/DEVELOPER_API_PLAN.md) | Developer API |

---

## Background & papers

Governments and individuals mostly make spending and health decisions without knowing what causes what. Optimitron's premise is that the same time-series causal tools can answer "does this supplement help me?" and "does this policy work?" The long-form argument, written in the voice of the satirical narrator "Wishonia," is in the [manual](https://manual.warondisease.org).

Each core algorithm is specified in a paper:

| Paper | Implements | Web |
|-------|-----------|-----|
| **dFDA Specification** | `@optimitron/optimizer`: PIS, temporal alignment, Bradford Hill, effect sizes | [dfda-spec.warondisease.org](https://dfda-spec.warondisease.org) |
| **Wishocracy** | `@optimitron/wishocracy`: RAPPA, eigenvector weights, Citizen Alignment Scores | [wishocracy.warondisease.org](https://wishocracy.warondisease.org) |
| **Optimal Policy Generator** | `@optimitron/opg`: Policy Impact Score, Causal Confidence Score | [opg.warondisease.org](https://opg.warondisease.org) |
| **Optimal Budget Generator** | `@optimitron/obg`: diminishing returns, Optimal Spending Level, Budget Impact Score | [obg.warondisease.org](https://obg.warondisease.org) |
| **Optimocracy** | Two-metric welfare function (shared by OPG + OBG) | [optimocracy.warondisease.org](https://optimocracy.warondisease.org) |

<details>
<summary>Motivation & impact papers</summary>

### Motivation & Impact Papers

| Paper | What it quantifies | Web |
|-------|-------------------|-----|
| **Political Dysfunction Tax** | $101T/year governance inefficiency — the problem Optimitron exists to solve | [political-dysfunction-tax.warondisease.org](https://political-dysfunction-tax.warondisease.org) |
| **The Invisible Graveyard** | 102M deaths from FDA efficacy delays since 1962, $1.19 quadrillion deadweight loss | [invisible-graveyard.warondisease.org](https://invisible-graveyard.warondisease.org) |
| **The 1% Treaty** | Redirecting 1% of military spending ($27.2B/yr) → 10.7B deaths prevented, 212-year treatment acceleration | [impact.warondisease.org](https://impact.warondisease.org) |
| **dFDA Impact Analysis** | Trial costs from $41K to $929/patient, $84.8 quadrillion cumulative value | [dfda-impact.warondisease.org](https://dfda-impact.warondisease.org) |
| **US Efficiency Audit** | $4.9T annual US governance waste, $2.45T recoverable capital | [us-efficiency-audit.warondisease.org](https://us-efficiency-audit.warondisease.org) |
| **The Price of Political Change** | Max $25B cost to change US policy — ROI framework for reform incentivization | [cost-of-change.warondisease.org](https://cost-of-change.warondisease.org) |
| **Drug Development Cost Analysis** | 105x real-term cost increase since 1962 Kefauver-Harris Amendment | [drug-cost.warondisease.org](https://drug-cost.warondisease.org) |
| **Right to Trial & FDA Upgrade Act** | Legislative implementation: open-source FDA platform + patient trial participation rights | [right-to-trial.warondisease.org](https://right-to-trial.warondisease.org) |
| **How to End War and Disease** | Complete manual synthesizing all components of the framework | [manual.warondisease.org](https://manual.warondisease.org) |

---

</details>

---

## License

[MIT](https://opensource.org/licenses/MIT) © [Mike P. Sinn](https://github.com/mikepsinn)
