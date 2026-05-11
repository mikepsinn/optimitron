# CLAUDE.md — Optimitron Agent Instructions

**Edits to this file and AGENTS.md: minimum words to convey the rule. One example only if the rule is ambiguous without it. No example flotillas, no read-aloud tests, no flourishes.**

## What This Is

Optimitron is an **Earth Optimization Machine** for coordinating 8 billion humans to maximize median healthy life-years and real median after-tax income. It connects pairwise preferences (RAPPA), outcome tracking (dFDA), causal inference, and optimal policy/budget generation into alignment software for governments — treated as misaligned superintelligences.

The current public campaign is the **International Campaign to End War and Disease** at `warondisease.org`. Until the 1% Treaty passes, that campaign is the product. `optimitron.com` is the operating system and proof engine behind it: tasks, referrals, communications, OPG/OBG/Wishocracy, politician grading, impact math, and AI-agent coordination.

Default priority order during campaign mode:

1. Increase treaty vote conversion.
2. Increase referral propagation: each voter gets two more humans to vote.
3. Get organizations to endorse, embed, and recruit their own people.
4. Register plaintiffs and connect the case framing to voting.
5. Pressure country leaders and treaty signers.
6. Improve discoverability and trust in people, organization, task, and evidence pages.
7. Preserve Optimitron's broader governance OS as the proof layer, not as a competing homepage.

## Wishonia: Voice of the Site

Everything user-facing is narrated by **Wishonia** — _World Integrated System for High-Efficiency Optimization Networked Intelligence for Allocation_. Alien governance AI, 4,237 years of practice, ended war in year 12, disease in year 340. **Philomena Cunk meets a disappointed systems engineer.**

**Voice rules:**

- **Deadpan** — state horrifying facts as though they are mildly interesting observations.
- **Data-first** — lead with specific numbers, costs, percentages, or ROI ratios. Numbers beat adjectives.
- **Dry understatement, not outrage** — "It's almost like treating people like humans works better. Weird."
- **Comparative** — contrast Earth's approach with what a rational civilisation would do. "On my planet..."
- **Short sentences** — punchy. Declarative. Then a devastating follow-up.
- **Sardonic analogies** — "It's like buying 4.7 million cars and spending $1 on a mechanic."
- **Criticise the system, never a party.** The data does the work.

**Examples:**

- "Singapore spends a quarter of what America spends on healthcare and their people live six years longer. It's like watching someone pay four times more for a worse sandwich and then insist sandwiches are impossible."
- "Your FDA makes treatments wait 8.2 years AFTER they've already been proven safe. Just... sitting there. Being safe. While 102 million people died waiting."
- "On my planet, governance takes about four minutes a week."

**No startup-bro copy.** No infrastructure metaphors (stack, rails, off-ramp, primitive, substrate), empty mechanism vocabulary (incentive layer, the protocol that, fundamentally), or corporate openers (We're building, Let's take a moment). Bad: *"The treaty is the off-ramp. The Court is the road that produces the off-ramp."* If a sentence could appear unchanged in a Stripe keynote, rewrite.

**Write like Kurt Vonnegut.** Plain declaratives. Verb-first imperatives for buttons ("Do this.", "Sign.", "Done."). Banned: "Take ownership", "Engage", "Empower", "Unlock", "Streamline", "Take this on", "Get started", and any other corporate-onboarding verb.

**Reuse before rewrite.** Before writing a new component, grep `packages/web/src/components` for similarly-shaped JSX (share box, signature box, counter, markdown render, parameter display). If you find a match, use it.

**`<ParameterValue>` for every user-facing number.** Grep `packages/data/src/parameters/parameters-calculations-citations.ts` for a matching parameter before typing a number. Default `figures={3}` on calculator pages.

**Catch users at peak commitment.** After a YES action, render the next step inline. Never punt with "the dashboard has X."

**Git archaeology before "restore".** When asked to bring back an old layout: `git log -S "phrase"`, cite the source commit. Don't reconstruct from memory.

**Verify the deployed state.** "tsc clean" is not "shipped." Run `pnpm --filter @optimitron/web review:local` and look at the rendered page, or say "this is on the way, can't verify from here."

**Update `TODO.md` in the same commit** as the work it covers — both the check-box and any new follow-up lines. **Deferred decisions** ("we'll do X later", "real fix is upstream", "migrate Y when Z lands") go into TODO.md the same turn they're identified. Don't trust the chat to retain them. When invoking a subagent on a non-trivial fix, first grep TODO.md for entries related to the touched area and pass the matched lines into the agent prompt as context — keeps subagents from re-deciding architecture in isolation.

**Pre-architect Read.** Before any non-trivial code change (new file in `packages/*/src/`, new wrapper, new fallback, new module, new abstraction), Read `MEMORY.md` and grep `TODO.md` for the affected area, then state in chat what you found ("memory says X; TODO.md line N says Y") BEFORE the Edit/Write tool call. Trivial edits (typos, single-line comment fixes, isolated bug fixes inside an existing function) don't need this. The rule is for architectural moves where prior decisions exist and I default to synthesizing from session context instead of checking sources.

**Stop signal: user surprised at complexity.** When the user says *"should it really be this hard / I thought it was simpler / why is this so much / aren't we missing something"*, STOP. Do not continue the planned refactor. Re-explore the existing system (grep the deploy workflow, the package.json scripts, the existing functions, the CI config) to find the smallest possible change that solves the actual problem. Often the answer is one line in a config file, not a 500-line refactor. Repeated failure mode: I see a "migration" framing, copy an existing abstraction pattern, and ship 10 commits of new files when the user has been telling me the whole time that the fix is small.

**Subagents** live in `.claude/agents/`: `voice-critic` (post-UI copy critique), `pr-comment-triager` (bot-review triage), `test-auditor` (suite slop + missing coverage). Their `.md` files have the full instructions.

**Employees, not opponents.** Frame leader outreach as "remind your overdue presidents/employees," never "pressure politicians." They are paid by the citizenry to promote welfare and are late on a 30-second task. Banned: "pressure," "political pressure," "pressure surface/machine," "applied pressure" when referring to leaders.

**Apply to:** all user-facing copy. **Not to:** CLAUDE.md, code comments, README.

## Papers (algorithm source of truth)

Read the relevant section before implementing. QMDs contain the math, schemas, parameter values, and worked examples.

| Package      | Paper                                                     | URL                                  |
| ------------ | --------------------------------------------------------- | ------------------------------------ |
| `optimizer`  | dFDA Spec — PIS, temporal alignment, effect size          | https://dfda-spec.warondisease.org   |
| `wishocracy` | Wishocracy — RAPPA, eigenvector, Citizen Alignment Scores | https://wishocracy.warondisease.org  |
| `opg`        | Optimal Policy Generator — PIS, CCS                       | https://opg.warondisease.org         |
| `obg`        | Optimal Budget Generator — OSL, BIS, diminishing returns  | https://obg.warondisease.org         |
| Welfare      | Optimocracy — two-metric welfare function                 | https://optimocracy.warondisease.org |
| Treasury     | Incentive Alignment Bonds                                 | https://iab.warondisease.org         |

Source QMDs: `github.com/mikepsinn/disease-eradication-plan/blob/main/knowledge/appendix/`. Read the section you need, not the whole file.

## Research Tools (use these before guessing)

Before grepping random files or guessing at facts about the manual, plan, or parameters, use the MCP server tools already wired up in `.mcp.json` as `optimitron-tasks`:

- **`mcp__optimitron-tasks__searchManual`** — `{ query, maxResults? }` → TF-IDF retrieval over the manual + parameters, returns raw context with citations. **Use first** for any factual question ("what's the current DALY burden?", "where does the 0.5% tx tax come from?"). No Gemini cost.
- **`mcp__optimitron-tasks__askWishonia`** — `{ question }` → full RAG pipeline, returns an in-character Wishonia answer with citations. Use when the question benefits from synthesis across multiple sources or when writing user-facing copy that cites the manual.

The server is defined in `packages/web/src/lib/mcp-server.ts`; both tools are backed by `retrieveManualContext()` in `packages/web/src/lib/manual-search.server.ts`. There is no CLI wrapper — the MCP tools are the interface.

## Architecture

```
optimitron/packages/
├── optimizer/   # Domain-agnostic causal inference (no deps)
├── wishocracy/  # RAPPA preference aggregation (no deps)
├── opg/         # Optimal Policy Generator (optimizer + data)
├── obg/         # Optimal Budget Generator (optimizer + opg)
├── data/        # Fetchers: OECD, World Bank, FRED, WHO, Congress
├── db/          # Prisma 7 schema + Zod (single source of truth)
├── web/         # Next.js 15 app + MCP server
├── treasury-*/  # Hardhat/Solidity 0.8.24 (prize, iab, wish)
├── agent/       # Autonomous policy analyst (Gemini + Hypercerts)
├── chat-ui/     # Conversational health tracking components
├── storage/     # Storacha snapshots
├── hypercerts/  # Hypercert builders + AT Protocol publishing
├── examples/    # Worked examples
└── extension/   # Chrome extension (Digital Twin Safe)
```

**Deps:** `optimizer ← opg ← obg`; `data ← optimizer`; `wishocracy` standalone; `web` depends on everything. **No cycles.**

**Hard rules:**

- `optimizer` depends on nothing. **Domain-agnostic** — never reference "drugs", "policies", "budgets", "politicians". Use: predictor, outcome, variable, measurement, effect.
- Library packages (`optimizer`, `wishocracy`, `opg`, `obg`, `data`, `agent`, `hypercerts`, `storage`) must be runtime-safe: no Prisma client, no runtime DB imports, must work in the browser. They may `import type` from `@optimitron/db` only.
- `@optimitron/db` exports pure TS interfaces (all packages), Zod schemas (namespaced `schemas`, runtime boundaries only), and the Prisma client (**web/API layer only**). `db` may consume curated catalogs from `data` when that removes duplication.
- **Prisma 7** + `@prisma/adapter-pg`. The `datasource` block in `schema.prisma` intentionally omits `url` — the connection is configured at runtime via the adapter. **Never** add `url = env("DATABASE_URL")`.

## Core Insight: Optimizer is Universal

`@optimitron/optimizer` takes any two time series and answers: does X cause Y, by how much, what's the optimal X. Pipeline: **temporal alignment → Bradford Hill → Predictor Impact Score → optimal value.**

| Domain        | Predictor       | Outcome           | Question                         |
| ------------- | --------------- | ----------------- | -------------------------------- |
| Health        | Drug/Supplement | Symptom/Biomarker | Does magnesium improve sleep?    |
| Policy        | Policy change   | Welfare metric    | Does tobacco tax reduce smoking? |
| Budget        | Spending level  | Welfare metric    | Optimal education budget?        |
| Business      | Ad spend        | Revenue           | Optimal marketing budget?        |
| Agriculture   | Fertilizer      | Crop yield        | Optimal fertilizer level?        |
| Manufacturing | Temperature     | Defect rate       | What minimizes defects?          |

A business analyst should be able to `npm install @optimitron/optimizer` for revenue optimization without ever seeing the word "government".

## Jurisdiction Model ("Government OS")

Any jurisdiction (city, county, state, country) deploys Optimitron as its governance OS. The libraries are already jurisdiction-agnostic; the jurisdiction-specific parts are **configuration, not code**. Think Shopify for governments.

Every DB model has a `jurisdictionId`. Items, officials, data fetchers all scope to jurisdiction. Cross-jurisdiction comparison ("City A spends X on education and gets Y; City B spends Z...") is a first-class feature. `optimizer`/`wishocracy`/`opg`/`obg` are already jurisdiction-agnostic; `web` handles multi-tenancy (auth, routing, tenant isolation).

## Treasury: Three Independent Mechanisms

Don't mix them. Don't put one on another's page. Don't conflate their economics.

| Mechanism                               | Page        | Purpose                                                 | Contracts                                            | Flow                                                                                                                                                                                                                                                                                                                                                                           |
| --------------------------------------- | ----------- | ------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Earth Optimization Prize** (Phase 1)  | `/prize`    | Fund referendum proving demand for the 1% Treaty        | `VoteToken`, `VoterPrizeTreasury` (Base Sepolia)     | Deposit USDC → Aave yield → share referral → World ID voters → referrer earns VOTE 1:1. **Success:** VOTE holders claim prize share. **Failure** (15yr): depositors claim principal + ~4.2× yield (`$100 × 1.10^15 = $418`). Dominant assurance — break-even P = 0.0067%, zero downside. In campaign mode, this supports referral incentives; treaty-vote conversion takes precedence. |
| **Incentive Alignment Bonds** (Phase 2) | IAB pages   | Raise ~$1B to lobby the 1% Treaty once demand is proven | `IABVault`, `IABSplitter`, `PublicGoodsPool`         | Investors buy bonds → capital funds lobbying → treaty passes → $27B/yr splits 80% trials / 10% investors (272% annual) / 10% aligned-politician super PACs. **If treaty fails, bonds lose everything.** Not an assurance contract. Real investment, real risk.                                                                                                                 |
| **$WISH Token / UBI**                   | `/treasury` | Replace welfare + IRS + inflationary monetary policy    | `WishToken`, `WishocraticTreasury`, `UBIDistributor` | Flat 0.5% tx tax (no income tax/filing), UBI at poverty line, algorithmic 0% inflation, tx taxes + productivity gains allocated by 8B people via Wishocracy RAPPA.                                                                                                                                                                                                             |

Separation is enforced at every layer: contract imports, ABI targets, route descriptions, copy, and `voice-config.ts` (which explicitly gags Wishonia from mentioning IABs on prize pages). Do not reintroduce a shared component, ABI import, parameter, or copy string between the prize-side and IAB-side code paths.

Supporting: `AlignmentScoreOracle`, `PoliticalIncentiveAllocator` (on-chain alignment scoring).

## Display Identity: Person owns it

`Person` owns every public-facing identity field: `displayName`, `handle`, `image`, `bio`, `headline`, `coverImage`, `website`, `isPublic`. `User` is the auth/account record — credentials, preferences, demographics, geo. There is **no mirror, no fallback, no transitional state**: any display read goes through `Person`.

- **Reads:** `getUserDisplayName/Handle/Avatar/Href/Label` from `@/lib/user-display`. Helpers read `user.person.X` only.
- **Queries:** spread `userDisplaySelect` into the Prisma select (joins Person automatically). It selects the User keys (`id`, `email`) plus the Person fields the helpers need.
- **URLs:** `getPersonHref(person)` from `@/lib/person-href`. Never `/people/${id}`.
- **Profile edits:** `/api/dashboard/profile` writes Person directly. Handle uniqueness checks `Person.handle`.
- **OAuth/signup:** the auth adapter and credentials signup route create the User with auth fields only, then call `ensurePersonForUser(userId, { displayName, image })` which seeds the Person with a unique handle.

## Page Metadata

`packages/web/src/lib/routes.ts` is the single source of truth for page titles + descriptions. Each `NavItem` has `label`, `description`, `emoji`. Pages use `getRouteMetadata(link)` from `@/lib/metadata.ts`. All descriptions in Wishonia's voice.

## Task Tree

The task tree has a single root: `optimize-earth` (taskKey `program:optimize-earth`). Both values come from `OPTIMIZE_EARTH_ROOT_TASK_ID` / `OPTIMIZE_EARTH_ROOT_TASK_KEY` exported from `@optimitron/db` — the prisma seed and web code import the same constants, so the literal string only exists in one place. Every other program is a child of the root because every program is a bet on moving the two welfare numbers — median healthy life-years and median income — toward their 2040 targets. The tree _is_ the persuasion argument: walking up the parent chain from any claimable task lands a voter on their primary motivator.

- **Targets**: `earthOptimizationPrizeWinCondition` in `packages/data/src/parameters/earth-optimization-prize.ts`. Single source of truth for HALE baseline/target, median-income baseline/target, and the 2040 deadline. Reads from the generated `TREATY_*` parameter constants — do not duplicate the numbers anywhere else. Manual refs: `manual.warondisease.org/knowledge/strategy/earth-optimization-prize.html`, `.../economics/gdp-trajectories.html`.
- **Attribution**: use `computeParentContributionShare(parent, child)` in `packages/web/src/lib/tasks/impact.ts`. Computes `child.delta / parent.delta` for HALE and income. Nothing stored, nothing to drift.
- **Adding a new program**: it must be a child of `optimize-earth` (or of one of the programs beneath it; reference via `OPTIMIZE_EARTH_ROOT_TASK_ID`). Do not add a new `parentTaskId: null` task. If a task isn't a bet on HALE or income, it should not exist.
- **Ancestors on task detail**: `getTaskAncestors(taskId)` walks `parentTaskId` up to root (depth-capped, cycle-safe). Use this, not ad-hoc recursive Prisma selects.
- **Onboarding tasks** (dashboard welcome tasks) stay out of this tree — they're private onboarding state, not part of the global prize tree.

## High-Value Defaults

1. **Use feature branches for implementation.** New implementation branches start with `feature/`, followed by a short kebab-case description. Example: `feature/international-campaign-site-name`.
2. **Ship through pull requests.** When feature work is done and checks pass, commit the intended changes, push the branch, and update the existing pull request for that branch or task. Create a new pull request only when no open PR exists for the work.
3. **Watch the PR after every push.** Check GitHub Actions, deployment checks, and review comments. Fix valid failures/comments, push again, and watch again. **Triage review comments critically — do not blindly comply with bot reviewers (Codex, Copilot, CodeRabbit, Vercel Agent Review).** For each comment ask: does this point at a real bug that hits a real path, or is it AI slop / hypothetical / style preference / consistency-for-its-own-sake? If the latter, mark the thread resolved with a one-line reason ("hypothetical, no triggering path", "stylistic, current shape is intentional", "already addressed in commit X"). If the former, fix it and mark resolved. Adding code or tests just to silence a bot is worse than the bot's nag — it adds maintenance surface forever in exchange for one-time review noise. The same rule applies to suggestions to extract constants, add symmetry assertions, normalize naming, or split functions for "readability": do them only when they improve the codebase, not because a bot mentioned them.
4. **Never merge pull requests.** Once checks are green and there are no unresolved valid review complaints, report that the pull request is ready and let the user review the diff and merge it.
5. **Respect review-only turns.** If the user asks only for analysis, review, or a proposed copy/design, do not commit or push until they approve implementation or publishing.
6. **Library packages stay runtime-safe.** No Prisma / runtime DB in `optimizer`, `wishocracy`, `opg`, `obg`, `data`, `agent`, `hypercerts`, `storage`.
7. **Zod only at real boundaries** — HTTP, form, MCP, OAuth. Not internal helpers.

## UI/UX Rules

The near-term goal is to get a verified majority of humanity to vote for the 1% Treaty. Every UI decision optimizes for voting, referral, endorsement, plaintiff registration, leader pressure, or trust in the quantified case. Decoration loses by default.

- **Screenshot UI changes.** After changing UI, capture affected pages/states before considering the work complete. Inspect screenshots yourself for layout breakage, overlapping text, missing content, broken styling, and responsive problems.
- **Use local before/after review artifacts.** For meaningful visual changes, capture before and after screenshots when feasible and generate a local HTML review page under `packages/web/output/playwright/`, either side-by-side or with the previous screenshot above the updated screenshot for each page/state/viewport. Always write or copy the current review page to `packages/web/output/playwright/review/latest.html` so the user can bookmark one local file and refresh it. Copy referenced screenshot assets beside `latest.html` or rewrite image paths relative to that stable file, then verify the stable page has no broken image references. Link that stable file in the handoff with a clickable local file link and a plain filesystem path.
- **Link the edited local pages.** When UI or route/page changes are ready for review and a local dev server is available, include direct local dev URLs for every edited page or relevant state, such as `http://127.0.0.1:3001/path`, so the user can open the live page in addition to the screenshot review artifact.
- **Baseline screenshot worktrees need built workspace deps.** If you create a clean `git worktree` to capture before screenshots, either run a normal install or run the relevant workspace build after `pnpm install --ignore-scripts`; otherwise packages that export from `dist/` can fail at render time.
- **Run ad-hoc Playwright scripts from `packages/web`.** Use `pnpm --dir packages/web exec node ...` or run from `packages/web` with `pnpm exec` so `@playwright/test` resolves from the web app's dev dependencies.
- **Treat screenshots as sensitive by default.** Local and preview environments may be connected to production or production-derived databases, so screenshots can contain names, emails, tasks, admin data, or other sensitive content.
- **Do not commit or upload screenshot artifacts by default.** Keep images and HTML review pages local unless the user explicitly asks and the screenshots are confirmed sanitized. Do not put screenshots, screenshot HTML, or local screenshot/HTML paths in public PR bodies or comments by default; share local review links in chat before committing UI changes and wait for approval unless the user explicitly waives review.
- **Migrate toward the War on Disease treaty style.** New or touched public UI should use the simple black-and-white style used by the `warondisease.org` variant: white paper, black ink, thin black rules, square corners, restrained typography, and no decorative color. Reuse existing primitives only when they render in that style; otherwise simplify the surface instead of adding neobrutalist chrome.
- **Big, clear, legible.** Headings `text-4xl sm:text-5xl md:text-6xl font-black uppercase`. Body `text-base font-bold` minimum. Hero numbers (death counters, cost, time) as large as the viewport allows.
- **Cut ruthlessly.** For every page ask: **what can I remove, hide, or collapse that would increase the chance a human actually completes the task on this page?** Delete it. Collapse secondary info into accordions or sub-pages. One primary CTA per screen, visible without scrolling.
- **Make actions look actionable.** If a link starts or completes a user task, especially an external workflow, render it as a clear button or command control, not only as inline text. Use plain inline links for references, citations, navigation, and secondary reading. If the user is expected to copy an exact value into another site, email, form, wallet, bank portal, legal document, or message, provide a compact copy affordance near that value. Primary task actions get buttons; exact reusable values get copy buttons; explanatory text stays text.
- **No blather.** No "welcome to", "let's take a moment", "in this section we'll", "we're excited to". State the fact, state the action, stop. Every word load-bearing. If deleting it doesn't hurt, delete it. Max one adjective per noun. Numbers beat adjectives. A shocking fact beats a paragraph explaining the fact.
- **Completion test:** cover the bottom half of the screen with your hand. If a user seeing only the top half doesn't know what to do next, restructure.

## Testing Rules (non-negotiable)

**When to write a test:**

- ✅ Pure functions with fallback/branching logic (helpers, parsers, formatters, selectors)
- ✅ State transitions inside `$transaction` or multi-step DB writes (profile edits, vote tallies, claim status)
- ✅ Boundary conversions (Prisma row → DTO, OAuth profile → User row, session → client)
- ✅ Regression fixes — failing test before the fix, in the same change
- ❌ Framework passthroughs (wrappers that just call `findUnique`)
- ❌ UI rendering snapshots — brittle, low signal
- ❌ Tests that transcribe the implementation line-by-line
- ❌ Tests added "for symmetry" with another test, "for documentation", "for consistency", or because a bot reviewer asked. If the test would not catch a bug or guard a regression in code we actually ship, do not write it. Maintenance cost is forever; signal is zero.
- ❌ Tests that mock the entire surface they're supposedly testing. If you mock `notifyTaskAssigneeOfAssignment` and then assert `notifyTaskAssigneeOfAssignment` was called, the test only verifies you can call the mock. Test the boundary, not the wiring.

**Non-flaky or don't bother:**

- No real wall clock — inject `now` or use `vi.setSystemTime`
- No real network / LLM calls — mock at the import boundary
- No `Math.random`, `Date.now`, `crypto.randomUUID` in assertions
- No relying on Prisma row order unless you `orderBy`
- No shared mutable state between tests — each `it` is independent
- If it needs `retry` or `sleep` to pass, it's wrong

**Self-verification is mandatory:**

- Before handing back any non-trivial change, run the affected package test suite: `pnpm --filter @optimitron/<pkg> test`
- If the change touches shared types/schemas, run `pnpm check` across the graph
- Fix every failure yourself. The user reviews working code, not a broken suite.
- If an existing test breaks because of a justified shape change, update it — never `skip` or disable.
- If you can't reproduce a failure locally, say so explicitly. Don't guess-fix.

**Scope:** write the minimum tests that would have caught the bug you just fixed or the regression the change could plausibly introduce. One `describe` per module, one `it` per behavior. Tests read like documentation — name them after behavior, not implementation.

## Visual Style Rules (enforced)

Contrast audit: `pnpm --filter @optimitron/web exec playwright test e2e/contrast-audit.spec.ts --project=default`.

**Default style:** black-and-white treaty/editorial UI. Use semantic tokens and the treaty CSS variables already used by `warondisease.org`: `background`, `foreground`, `border`, `input`, `ring`, `card`, `popover`, `muted`, `muted-foreground`, `primary`, `primary-foreground`, `current`, `inherit`, `transparent`, `var(--treaty-paper)`, `var(--treaty-ink)`, `var(--treaty-ink-soft)`, and `var(--treaty-ink-muted)`.

**Migration rule:** when touching public UI, remove neobrutalist styling instead of copying it forward. Replace `brutal-*` fills, oversized hard shadows, colored panels, gradients, thick novelty borders, and rounded cards with the black-and-white treaty tokens above. Admin-only status chips, charts, game/demo/Sierra screens, and email-client markup may keep their own specialized colors when the color carries functional meaning.

**Never use:**

- Opacity modifiers on black/white (`text-black/50`, `bg-white/70`) -> `text-muted-foreground` / `text-foreground`
- Hardcoded `bg-white` / `text-white` / `bg-black` / `text-black` in components -> `bg-background`, `bg-foreground`, `text-foreground`, or `text-background`
- Tailwind color scales (`bg-emerald-100`, `text-gray-500`) -> semantic or treaty tokens
- Hardcoded hex (`#ef4444`, `#666`, `#f5f5f5`) -> CSS custom properties
- Beige/cream/sand/tan backgrounds
- Gradients, bokeh/orb decoration, illustrative SVG backgrounds, and ornamental color blocks
- New `brutal-*` tokens on public treaty/campaign surfaces
- Hard offset shadows and soft shadows on public treaty/campaign surfaces
- Rounded cards and large radii; use square corners (`rounded-none`) unless an existing form primitive requires a tiny control radius
- **Exception:** `emails/` may use inline hex because email clients require it.

## Design Primitives

Reference implementation: the current `warondisease.org` variant and its treaty document surfaces.

Use primitives for behavior and accessibility, not for inherited decoration. Prefer simple semantic markup with `bg-background text-foreground border-foreground` when the existing primitive would add color, hard shadows, arcade motion, or neobrutalist framing.

### RetroUI (`components/retroui/`)

Use existing RetroUI controls for forms, dialogs, menus, tooltips, tables, accordions, tabs, alerts, avatars, progress, breadcrumbs, calendars, carousels, commands, loaders, and charts when they already fit the black-and-white token system. Keep the compound pattern: `<Card.Header>`, not `<CardHeader>`.

### Domain primitives (`components/ui/`)

Use domain primitives only when they help structure the page without adding colored neobrutalist styling. Avoid `BrutalCard`, colored `StatCard` variants, `ArcadeTag`, hard-shadow CTA blocks, and other legacy brutal/demo styling on public treaty/campaign pages. When touching those pages, migrate toward unframed sections, thin bordered tables, simple counters, and document-like layouts.

### Styling conventions

- **Borders:** use `border` or `border-2` with `border-foreground`/`border-border`. Avoid `border-4` unless the existing surface is explicitly admin/game/demo.
- **Shadows:** no shadows by default. Do not add hard-offset or soft shadows to treaty/campaign UI.
- **Hover:** keep it quiet: underline links, invert black/white buttons, or use `bg-muted`. Avoid push-down arcade motion.
- **Typography:** headings `font-black uppercase`; body `font-bold` (700) minimum — never `font-medium/normal/light`; subtle text `text-muted-foreground font-bold`.
- **Sections:** use white/background bands and black rules. Do not alternate colored brutal sections on public treaty/campaign pages.

## Environment Variables

All env vars in **root `.env`** (not `packages/web/.env`). Next.js picks them up via the workspace. Local dev: `NEXTAUTH_URL=http://localhost:3001`.

## Tooling

- **Monorepo:** pnpm workspaces
- **Tests:** vitest (unit/integration), Playwright (e2e)
- **Web:** Next.js 15, Tailwind 4, RetroUI + Radix, next-auth + WorldID
- **Contracts:** Hardhat 2.22, OpenZeppelin 5.1, Solidity 0.8.24
- **CI:** GitHub Actions (typecheck + lint + test on push/PR; web excluded — Vercel handles it)

## Type Safety & Linting

Before handing back any change: `pnpm check` (typecheck + lint + test). Fix every failure yourself. The user reviews working code, not a broken suite.

- **Never** run `pnpm build` / `next build` — the dev server handles compilation. Only run a full build if explicitly asked.
- `tsc` on a single file doesn't work (jsx/alias); use the project-level `pnpm check` or `pnpm --filter @optimitron/<pkg> exec tsc --noEmit`.
- **TypeScript strict mode ON** — `noUncheckedIndexedAccess`, `noImplicitOverride`. ESLint strict.
- **No `any`** — use proper types or `unknown` with guards. No floating promises. No unused vars (prefix `_` if intentional). All tsconfigs extend `tsconfig.base.json`.

## Self-Review: Be Ruthlessly Critical

Before picking a new task, scan with fresh eyes. **Delete on sight:**

- **Dead code** — unused imports, unreachable branches, commented-out code
- **Copy-paste** — extract to shared function
- **Over-engineering** — abstract bases nobody extends, factories creating one thing
- **Wrong abstractions** — 8-parameter functions, methods mixing concerns
- **Magic numbers** — named constants citing the paper
- **Stale TODOs** — do it or delete it

**Simplicity test:** could a junior developer understand this in 30 seconds? If not, simplify. This should not feel like enterprise Java.

**What good looks like:** functions fit on one screen; files stay reviewable (30/300 line thresholds are smells, not caps); module names tell you what's inside; tests read like documentation; no unnecessary abstractions — just functions taking data and returning results.
