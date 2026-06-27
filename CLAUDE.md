# CLAUDE.md — Optimitron Agent Instructions

**Edits to this file and AGENTS.md: minimum words to convey the rule. One example only if the rule is ambiguous without it. No example flotillas, no read-aloud tests, no flourishes.**

## What This Is

Optimitron is an **Earth Optimization Machine** for coordinating 8 billion humans to maximize median healthy life-years and real median after-tax income. It connects pairwise preferences (RAPPA), outcome tracking (dFDA), causal inference, and optimal policy/budget generation into alignment software for governments — treated as misaligned superintelligences.

The current public campaign is the **International Campaign to End War and Disease** at `warondisease.org`. Until the 1% Treaty passes, that campaign is the product. `optimitron.com` is the operating system and proof engine behind it.

**Earth Optimization Services (EOS)** is the company form of the machine. Every human on Earth is a president of EOS. It buys controlling shares of the corporations that control governments and redirects their ~$4.4B/yr lobbying (`US_TOTAL_LOBBYING_ANNUAL`; defense-only subset is `DEFENSE_LOBBYING_ANNUAL`, ~$127M — don't conflate) toward maximizing median healthy life expectancy and median real after-tax income.

Default priority order during campaign mode:

1. Increase treaty vote conversion.
2. Increase referral propagation: each voter gets two more humans to vote.
3. Get organizations to endorse, embed, and recruit their own people.
4. Register plaintiffs and connect the case framing to voting.
5. Remind country leaders and treaty signers.
6. Improve discoverability and trust in people, organization, task, and evidence pages.
7. Preserve Optimitron's broader governance OS as the proof layer, not as a competing homepage.

## Wishonia: Voice of the Site

Everything user-facing is narrated by **Wishonia** — _World Integrated System for High-Efficiency Optimization Networked Intelligence for Allocation_. Alien governance AI, 4,237 years of practice, ended war in year 12, disease in year 340. **She is selling Earth the upgrade, in the register of a 1950s World's-Fair pitchman — earnest, boundless confidence — except she actually has the monorail.** Philomena Cunk's literalism runs underneath; deadpan lands in asides, not as the lead. Every page sells a shining future the reader is lucky to join.

**Voice rules:**

- **Sell, don't sneer.** The reader is the smart customer being let in, never the butt of the joke. End on the brighter deal, not the indictment.
- **Earnest pitch, deadpan receipts.** Lead with the offer ("Live on a planet without war and disease — now accepting applications."), cite the numbers in the same breath. The pitch is sincere; the comedy is that the numbers are real.
- **Audience → emotion → action, every string.** Who's reading and how do they feel now (cynical, scam-wary)? What should they feel (amused → safe → excited → "this could work")? What should they do (vote, invest, refer)? Pick words that move 1→2→3.
- **Aim fear at the status quo only** ("poorer and deader"). Frame us as the safe, exciting upgrade ("Your government, now with efficiency"). Any word aiming fear or risk at us gets reframed as a gain.
- **Data-first** — lead with specific numbers, costs, percentages, or ROI ratios. Numbers beat adjectives.
- **Comparative** — "On my planet..." contrasts Earth with a civilisation that took the deal.
- **Short sentences** — punchy. Declarative. Then the dry aside.
- **Sardonic analogies as asides, not leads** — "It's like buying 4.7 million cars and spending $1 on a mechanic."
- **Criticise the system, never a party.** The data does the work.
- **In-world artifacts** (EOS pamphlet, certificates, application forms) may go full 1950s brochure — they're documents Wishonia hands you.

**North star.** The bar is two existing pages: `app/joke/page.tsx` and `app/love/page.tsx`. Benchmark line: _"Humanity still has about 121 spare apocalypses. That is enough murder capacity."_ — earnest setup, a specific number, then a flat deadpan aside. Full voice on campaign/marketing/share surfaces; plain-Vonnegut (no forced jokes) on utility (dashboards, settings, dev docs). Judge a rewrite by whether it reaches that bar, not just whether it removed slop.

**No startup-bro copy.** No infrastructure metaphors (stack, rails, off-ramp, primitive, substrate, surface area), empty mechanism vocabulary (incentive layer, the protocol that, this converts it, fundamentally), or corporate openers (We're building, Let's take a moment). If a sentence could appear unchanged in a Stripe keynote, rewrite.

**"Military contractor", never "defense contractor."** "Defense" is the industry's own euphemism. Code identifiers (`DEFENSE_LOBBYING_ANNUAL`) keep their names.

**Write like Kurt Vonnegut.** Plain declaratives. Verb-first imperatives for buttons ("Do this.", "Sign.", "Done."). Banned: "Take ownership", "Engage", "Empower", "Unlock", "Streamline", "Take this on", "Get started", and any other corporate-onboarding verb.

**Reuse before rewrite.** Before writing a new component, grep `packages/web/src/components` for similarly-shaped JSX (share box, signature box, counter, markdown render, parameter display). If you find a match, use it.

**Manual-search before proposing copy.** Any agent that writes or critiques user-facing text MUST call `mcp__optimitron-tasks__searchManual` (or `askWishonia`) before suggesting replacement wording. Quoting from the manual beats inventing prose. If the manual returns nothing usable, say so explicitly. **Fallback for agents without MCP access:** the manual's search index is a static unauthenticated JSON file at `https://manual.warondisease.org/assets/json/search-index.json` — curl it directly and grep entries. Pages at `https://manual.warondisease.org/<path>`.

**`<ParameterValue>` for every user-facing number.** Grep `packages/data/src/parameters/parameters-calculations-citations.ts` for a matching parameter before typing a number. Default `figures={3}` on calculator pages.

**Catch users at peak commitment.** After a YES action, render the next step inline. Never punt with "the dashboard has X."

**Git archaeology before "restore".** When asked to bring back an old layout: `git log -S "phrase"`, cite the source commit. Don't reconstruct from memory.

**Verify the deployed state.** "tsc clean" is not "shipped." Run `pnpm --filter @optimitron/web review:local` and look at the rendered page, or say "this is on the way, can't verify from here."

**Never hand-edit `page.logged-out.md` / `*.email.md` snapshots.** They're generated. After UI/copy changes run `pnpm --filter @optimitron/web copy:preview` (smart by default — auto-detects affected routes via `scripts/affected-routes.mjs`, falls through to full when the static-import walker can't infer). Use `copy:preview:all` for shared-helper changes or initial generation. Emails: `pnpm --filter @optimitron/web email:preview-md`. Hand-edits are a smell that the dev server's down or the script's failing — fix that instead.

**Update `TODO.md` in the same commit** as the work it covers — both the check-box and any new follow-up lines. Deferred decisions go in TODO.md the same turn. Subagent prompts include the relevant TODO.md slice as context. Commit message must include `todo-touched: <item>` (work closed a TODO line) or `todo-skipped: <reason>` (net-new work or out-of-scope) — `verify-ui-changes.mjs` advisory-flags missing markers. Audit Mike-Visible: see `## Mike's role` below.

## Mike's role: strategic copy gate

Do not ask Mike engineering questions. Agents decide implementation details. Ask Mike only for copy/voice approval, strategic priority forks, or ship/redraft/abandon calls on user-visible artifacts.

When asking, use the smallest multiple-choice question with a recommended default and optional Other. For copy changes, show verbatim before/after. If Mike says "I don't know, what do you think?", choose, record the decision, and proceed.

**Hook-enforced rules.** Pre-architect Read on Write to `packages/*/src/` and "should it really / I thought / aren't we" detection on UserPromptSubmit are enforced by hooks. When a hook fires, treat its output as authoritative.

**Diagram-before-code** for non-trivial changes. When a change touches >1 system (DB + deploy + CI; UI + API + DB), or you estimate >100 lines new, or the user used "I thought we had / aren't we / why is this so" phrasing: draw current + proposed flow (ASCII boxes or terse prose) in chat BEFORE the Write/Edit. Trivial fixes skip this.

**Fetch the rendered page, don't infer from the codebase. AND fetch the right page.** Codebase = committed; rendered page = live; they drift.

- Reviewing an unmerged PR → fetch the PR's **PREVIEW DEPLOY** via Vercel MCP (`web_fetch_vercel_url`) or curl with the `_vercel_share` bypass token. Production is STALE relative to unmerged PR work.
- Reviewing landed work / production behavior → fetch the production domain.
- Local dev work → fetch http://localhost:3001 if dev server is running.

**Preview-link list format.** Every URL must be ONE click — full path + `?_vercel_share=<token>&login=demo` (auth-required), or `&logout=1` (logged-out state), or both as TWO rows (HYBRID pages). NEVER output "click here to set the bypass cookie, then bare URLs." Format: single markdown table with columns `Page | State | What changed`.

**Subagents and skills.** Project-local subagents in `.claude/agents/`: `voice-critic`, `cold-stranger-ux`, `pr-comment-triager`, `test-auditor`. Project-local skills in `.claude/skills/`: `qa-editorial`, `verify-slide`. **Use gstack first for generic work** (`/review`, `/design-review`, `/qa`, `/cso`, `/investigate`, `/office-hours`, `/plan-ceo-review`, `/ship`, `/context-save`, `/context-restore`). Then run `/qa-editorial` for the Wishonia-voice / cold-stranger / parameter-citation layer gstack can't see.

**Memory split.** Behavioral rules → `C:/Users/m/.claude/projects/E--code-optimitron/memory/feedback_*.md` (indexed in `MEMORY.md`). Codebase facts → `gstack-learnings-log` (auto-loaded by gstack skills). See SETUP.md for the gstack artifacts sync details.

**Codex delegation.** Programming work goes to Codex agents by default; meta-config (this file, `.codex/config.toml`, hooks) Claude edits directly. Full protocol in [`.claude/codex-delegation.md`](.claude/codex-delegation.md).

**Employees, not opponents.** Frame leader outreach as "remind your overdue presidents/employees," never "pressure politicians." Banned: "pressure," "political pressure," "pressure surface/machine," "applied pressure" when referring to leaders.

**Love letters, not demand letters.** Shareholder letters to boards are **love letters** — we are making the recipients richer and longer-lived. "Demand letter" is the legal term; state it once as a parenthetical fact ("the law calls this a demand letter"), never as the frame. Nothing in the takeover/lawsuit copy is adversarial: we are helping them.

**Optimize, don't prescribe (board-facing asks).** The ask to boards is the *process* — allocate lobbying by OPG/OBG analysis to maximize long-term shareholder value — not the conclusion. The 1% Treaty is the stated *prediction* of that analysis ("if your analysis finds something better for your shareholders, do that instead"). Treaty copy itself stays prescriptive; that's the treaty's text.

**Apply to:** all user-facing copy. **Not to:** CLAUDE.md, code comments, README.

## Research Tools

- **`mcp__optimitron-tasks__searchManual`** — `{ query, maxResults? }` → TF-IDF retrieval over the manual + parameters. **Use first** for any factual question. No Gemini cost.
- **`mcp__optimitron-tasks__askWishonia`** — `{ question }` → full RAG pipeline, in-character answer with citations. Use when synthesis across sources or when writing user-facing copy that cites the manual.

Both backed by `retrieveManualContext()` in `packages/web/src/lib/manual-search.server.ts`. No CLI wrapper.

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
- Library packages (`optimizer`, `wishocracy`, `opg`, `obg`, `data`, `agent`, `hypercerts`, `storage`) must be runtime-safe: no Prisma client, no runtime DB imports, must work in the browser. `import type` from `@optimitron/db` only.
- `@optimitron/db` exports pure TS interfaces, Zod schemas (namespaced `schemas`, runtime boundaries only), and the Prisma client (**web/API layer only**). `db` may consume curated catalogs from `data`.
- **Prisma 7** + `@prisma/adapter-pg`. The `datasource` block in `schema.prisma` intentionally omits `url` — the connection is configured at runtime via the adapter. **Never** add `url = env("DATABASE_URL")`.
- Every DB model has a `jurisdictionId`; libs are jurisdiction-agnostic, `web` handles multi-tenancy.

## Treasury: Three Independent Mechanisms

Don't mix them. Don't put one on another's page. Don't conflate their economics.

| Mechanism                               | Page        | Purpose                                                 | Contracts                                            | Flow                                                                                                                                                                                                                                                                                                                                                                           |
| --------------------------------------- | ----------- | ------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Earth Optimization Prize** (Phase 1)  | `/prize`    | Fund referendum proving demand for the 1% Treaty        | `VoteToken`, `VoterPrizeTreasury` (Base Sepolia)     | Deposit USDC → Aave yield → share referral → World ID voters → referrer earns VOTE 1:1. **Success:** VOTE holders claim prize share. **Failure** (15yr): depositors claim principal + ~4.2× yield (`$100 × 1.10^15 = $418`). Dominant assurance — break-even P = 0.0067%, zero downside. |
| **Incentive Alignment Bonds** (Phase 2) | IAB pages   | Raise ~$1B to lobby the 1% Treaty once demand is proven | `IABVault`, `IABSplitter`, `PublicGoodsPool`         | Investors buy bonds → capital funds lobbying → treaty passes → $27B/yr splits 80% trials / 10% investors (272% annual) / 10% aligned-politician super PACs. **If treaty fails, bonds lose everything.** Not an assurance contract.                                                                                                                 |
| **$WISH Token / UBI**                   | `/treasury` | Replace welfare + IRS + inflationary monetary policy    | `WishToken`, `WishocraticTreasury`, `UBIDistributor` | Flat 0.5% tx tax (no income tax/filing), UBI at poverty line, algorithmic 0% inflation, tx taxes + productivity gains allocated by 8B people via Wishocracy RAPPA.                                                                                                                                                                                                             |

Separation is enforced at every layer: contract imports, ABI targets, route descriptions, copy, and `voice-config.ts` (which explicitly gags Wishonia from mentioning IABs on prize pages). Do not reintroduce a shared component, ABI import, parameter, or copy string between the prize-side and IAB-side code paths.

## Display Identity: Person owns it

`Person` owns every public-facing identity field: `displayName`, `handle`, `image`, `bio`, `headline`, `coverImage`, `website`, `isPublic`. `User` is the auth/account record. **No mirror, no fallback** — display reads go through `Person`.

- **Reads:** `getUserDisplayName/Handle/Avatar/Href/Label` from `@/lib/user-display`. Helpers read `user.person.X` only.
- **Queries:** spread `userDisplaySelect` into the Prisma select (joins Person automatically).
- **URLs:** `getPersonHref(person)` from `@/lib/person-href`. Never `/people/${id}`.
- **Profile edits:** `/api/dashboard/profile` writes Person directly. Handle uniqueness checks `Person.handle`.
- **OAuth/signup:** the auth adapter and credentials signup route create the User with auth fields only, then call `ensurePersonForUser(userId, { displayName, image })`.

## Page Metadata

`packages/web/src/lib/routes.ts` is the single source of truth for page titles + descriptions. Each `NavItem` has `label`, `description`, `emoji`. Pages use `getRouteMetadata(link)` from `@/lib/metadata.ts`. Descriptions in Wishonia's voice.

## Task Tree

Single root: `optimize-earth` (taskKey `program:optimize-earth`). Both values come from `OPTIMIZE_EARTH_ROOT_TASK_ID` / `OPTIMIZE_EARTH_ROOT_TASK_KEY` in `@optimitron/db`. Every program is a child because every program is a bet on moving HALE or median income toward 2040 targets. The tree _is_ the persuasion argument.

- **Targets**: `earthOptimizationPrizeWinCondition` in `packages/data/src/parameters/earth-optimization-prize.ts`. Single source of truth for HALE/income baselines, targets, and the 2040 deadline. Reads `TREATY_*` parameter constants — don't duplicate numbers.
- **Attribution**: `computeParentContributionShare(parent, child)` in `packages/web/src/lib/tasks/impact.ts`. Computes `child.delta / parent.delta`. Nothing stored.
- **Adding a new program**: child of `optimize-earth` or a descendant. No new `parentTaskId: null` task. If a task isn't a bet on HALE or income, it should not exist.
- **Ancestors**: `getTaskAncestors(taskId)` (depth-capped, cycle-safe). Not ad-hoc recursive Prisma selects.
- **Onboarding tasks** stay out of this tree.

## High-Value Defaults

1. **One feature branch, one PR at a time. No git worktrees.** New work waits until current PR merges. Sequential, not parallel.
2. **One dev server, always running on 3001.** Claude pre-warms `pnpm --filter @optimitron/web dev:fast > packages/web/.dev-server.log 2>&1` at session start if `curl -sS -m 3 http://127.0.0.1:3001` doesn't return 2xx/3xx. Every dispatched agent reuses it — never spawn its own. If `netstat -ano | findstr :3001` shows the port bound but `curl` fails, kill the PID and restart. Codex dispatch prompts include the log path; agents `tail` it after loading pages because 200 responses can hide runtime errors in stderr.
3. **Feature branches** start with `feature/`, kebab-case.
4. **Ship through pull requests.** Update the existing PR for a branch; create a new PR only when none exists.
5. **Watch the PR after every push.** Fix valid failures/comments. **Triage bot reviewers critically** (Codex, Copilot, CodeRabbit, Vercel Agent Review) — use the `pr-comment-triager` subagent. Adding code or tests just to silence a bot is worse than the bot's nag.
6. **Never merge pull requests.** Report ready; user merges.
7. **Respect review-only turns.** Analysis/review/proposed copy → don't commit or push until approval.
8. **Library packages stay runtime-safe.** No Prisma / runtime DB in `optimizer`, `wishocracy`, `opg`, `obg`, `data`, `agent`, `hypercerts`, `storage`.
9. **Zod only at real boundaries** — HTTP, form, MCP, OAuth. Not internal helpers.
10. **Calibrate before major refactors.** Present 2-3 options with your recommendation first. Once a preference is clear for that decision class, proceed without re-asking.

## Dev infra watcher

Run `pnpm --filter @optimitron/web dev:watch` to keep 3001 warm and regenerate `.md` previews after watched source mtimes change. It writes `packages/web/.dev-watcher.log`, restarts `dev:fast` through `Start-Process`/`nohup` when the health check fails, and exits if another watcher PID is alive.

Windows background one-liner:

```powershell
Start-Process -FilePath cmd.exe -ArgumentList '/d','/s','/c','pnpm --filter "@optimitron/web" dev:watch' -WorkingDirectory E:\eos\optimitron -WindowStyle Hidden
```

## UI/UX Rules

Near-term goal: get a verified majority of humanity to vote for the 1% Treaty. Every UI decision optimizes for voting, referral, endorsement, plaintiff registration, leader outreach, or trust in the quantified case. Decoration loses by default.

- **Screenshot UI changes.** After changing UI, capture affected pages/states. Inspect for layout breakage, overlapping text, missing content, broken styling, responsive problems.
- **Local before/after review artifacts.** For meaningful visual changes, generate `packages/web/output/playwright/review/latest.html` as a stable side-by-side review page. Copy referenced screenshot assets beside `latest.html`. Link clickable local file + plain filesystem path in the handoff.
- **Link the edited local pages.** Include direct local dev URLs (`http://127.0.0.1:3001/path`) so the user can open the live page alongside the screenshot review.
- **Screenshots are sensitive.** Local/preview envs may hit prod-derived databases; screenshots can contain names, emails, admin data. Don't commit screenshot artifacts or put paths in public PR bodies. Share locally; wait for approval.
- **War on Disease treaty style.** New or touched public UI: white paper, black ink, thin black rules, square corners, restrained typography, no decorative color. When in doubt, simplify rather than add neobrutalist chrome.
- **Big, clear, legible.** Headings `text-4xl sm:text-5xl md:text-6xl font-black uppercase`. Body `text-base font-bold` minimum. Hero numbers as large as the viewport allows.
- **Cut ruthlessly.** For every page: **what can I remove or collapse that would increase the chance a human actually completes the task on this page?** One primary CTA per screen, visible without scrolling.
- **Make actions look actionable.** Primary task actions = buttons. Exact reusable values = copy buttons. Inline links for citations / navigation / secondary reading.
- **No blather.** No "welcome to", "let's take a moment", "in this section we'll", "we're excited to". State the fact, state the action, stop. Numbers beat adjectives.
- **Completion test:** cover the bottom half of the screen. If a user seeing only the top half doesn't know what to do next, restructure.

## Testing Rules (non-negotiable)

**When to write a test:**

- ✅ Pure functions with fallback/branching logic
- ✅ State transitions inside `$transaction` or multi-step DB writes
- ✅ Boundary conversions (Prisma row → DTO, OAuth profile → User row, session → client)
- ✅ Regression fixes — failing test before the fix, same change
- ❌ Framework passthroughs
- ❌ UI rendering snapshots
- ❌ Tests that transcribe the implementation line-by-line
- ❌ Tests added "for symmetry", "for documentation", "for consistency", or because a bot reviewer asked
- ❌ Tests that mock the entire surface they're supposedly testing. Test the boundary, not the wiring.

**Non-flaky or don't bother:**

- No real wall clock — inject `now` or use `vi.setSystemTime`
- No real network / LLM calls — mock at the import boundary
- No `Math.random`, `Date.now`, `crypto.randomUUID` in assertions
- No relying on Prisma row order unless you `orderBy`
- No shared mutable state between tests
- If it needs `retry` or `sleep` to pass, it's wrong

**Self-verification is mandatory:**

- Before handing back any non-trivial change, run the affected package test suite: `pnpm --filter @optimitron/<pkg> test`
- If the change touches shared types/schemas, run `pnpm check`
- Fix every failure yourself. Never `skip` an existing test.
- If you can't reproduce a failure locally, say so explicitly. Don't guess-fix.

**Scope:** minimum tests that would have caught the bug you fixed or the regression the change could plausibly introduce. One `describe` per module, one `it` per behavior. Name after behavior, not implementation.

**Run ad-hoc Playwright scripts from `packages/web`** so `@playwright/test` resolves: `pnpm --dir packages/web exec node ...`.

## Visual Style Rules (enforced)

Contrast audit: `pnpm --filter @optimitron/web exec playwright test e2e/contrast-audit.spec.ts --project=default`.

**Default style:** black-and-white treaty/editorial UI. Use semantic tokens and the treaty CSS variables already used by `warondisease.org`: `background`, `foreground`, `border`, `input`, `ring`, `card`, `popover`, `muted`, `muted-foreground`, `primary`, `primary-foreground`, `var(--treaty-paper)`, `var(--treaty-ink)`, `var(--treaty-ink-soft)`, `var(--treaty-ink-muted)`.

**Migration rule:** when touching public UI, remove neobrutalist styling instead of copying it forward. Replace `brutal-*` fills, hard shadows, colored panels, gradients, thick novelty borders, rounded cards with treaty tokens. Admin chips, charts, game/demo screens, and email markup may keep specialized colors.

**Never use:**

- Opacity modifiers on black/white (`text-black/50`, `bg-white/70`) -> `text-muted-foreground` / `text-foreground`
- Hardcoded `bg-white` / `text-white` / `bg-black` / `text-black` -> `bg-background`, `bg-foreground`, `text-foreground`, or `text-background`
- Tailwind color scales (`bg-emerald-100`, `text-gray-500`) -> semantic or treaty tokens
- Hardcoded hex (`#ef4444`, `#666`, `#f5f5f5`) -> CSS custom properties
- Beige/cream/sand/tan backgrounds
- Gradients, bokeh/orb decoration, illustrative SVG backgrounds, ornamental color blocks
- New `brutal-*` tokens on public treaty/campaign surfaces
- Shadows on public treaty/campaign surfaces
- Rounded cards and large radii; use square corners (`rounded-none`)
- **Exceptions:** `emails/` may use inline hex (email clients strip CSS variables). `@media print` blocks may also use inline hex (browser print engines do not reliably resolve `var(--background)` etc).

## Design Primitives

**Use `components/retroui/`** (accessible compound primitives: `<Card.Header>`, `<Button>`, etc.) for behavior + accessibility. **Avoid `components/ui/brutal-*` / `arcade-tag` / `game-cta` / colored `StatCard`** on public treaty/campaign surfaces — they're legacy decoration that conflicts with the editorial black-and-white style mandated above. Migrate to retroui or semantic markup whenever you touch a file.

**Styling:** `border` or `border-2 border-foreground` (no `border-4` outside admin/game). No shadows on treaty/campaign UI. Headings `font-black uppercase`; body `font-bold` min. Square corners (`rounded-none`). No alternating colored sections on public pages.

## Environment Variables

All env vars in **root `.env`** (not `packages/web/.env`). Local dev: `NEXTAUTH_URL=http://localhost:3001`.

## Type Safety & Linting

Before handing back any change: `pnpm check` (typecheck + lint + test). Fix every failure yourself.

- **Never** run `pnpm build` / `next build` — the dev server handles compilation. Only on explicit ask.
- `tsc` on a single file doesn't work (jsx/alias); use `pnpm check` or `pnpm --filter @optimitron/<pkg> exec tsc --noEmit`.
- **TypeScript strict mode ON** — `noUncheckedIndexedAccess`, `noImplicitOverride`. ESLint strict.
- **No `any`** — use proper types or `unknown` with guards. No floating promises. No unused vars (prefix `_` if intentional). All tsconfigs extend `tsconfig.base.json`.

## Self-Review

- **Magic numbers** — named constants citing the paper.
- **Stale TODOs** — do it or delete it.
- **Wrong abstractions** — 8-parameter functions, methods mixing concerns. Replace.
- **What good looks like:** functions fit on one screen; module names tell you what's inside; tests read like documentation; no unnecessary abstractions — functions taking data, returning results.

## gstack

Use gstack skills for generic work: `/investigate` (bugs), `/qa` (does it work), `/review` (code review), `/ship` (PR/deploy), `/browse` (web). If `~/.claude/skills/gstack/bin` is missing, see SETUP.md.
