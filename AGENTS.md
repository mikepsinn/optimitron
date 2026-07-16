# AGENTS.md — Instructions for AI Agents

**Read this FIRST before making any changes.**

**Edits to this file and CLAUDE.md: minimum words to convey the rule. One example only if the rule is ambiguous without it. No example flotillas.**

## Core Working Rules

- Read the relevant package `AGENTS.md` before editing package files.
- Never import Prisma client in library packages (optimizer, wishocracy, opg, obg, data, agent, hypercerts, storage)
- Use `import type` for cross-package type imports
- Follow existing patterns — read surrounding code before writing new code
- Changes to the Prisma schema or exported `@optimitron/db` types require explicit human approval.
- If the human says `optimize earth`, follow `docs/OPTIMIZE_EARTH_PROTOCOL.md`.
- Load `docs/SYSTEM_MAP.md` before cross-package architecture work.

## Mission Focus

- North star: raise median healthy life expectancy and median real after-tax income to the `earthOptimizationPrizeWinCondition` targets by 2040. Programs are EV-ranked under the `optimize-earth` task root; the **1% Treaty** campaign at `warondisease.org` is the current highest-EV program — a ranked bet, not an axiom. If the analysis finds a better bet, the queue reorders and the product follows (`docs/ROADMAP.md`).
- Two Now tracks run in parallel (`docs/ROADMAP.md`): the treaty campaign, and the Daily Companion Loop dogfood (`docs/PRD.md` §3). Campaign wins ties.
- **Canonical campaign priority order** (the one copy — other docs point here):
  1. Increase treaty vote conversion.
  2. Increase referral propagation: each voter gets two more humans to vote.
  3. Get organizations to endorse, embed, and recruit their own people.
  4. Register plaintiffs and connect the case framing to voting.
  5. Remind country leaders and treaty signers — they are paid by the citizenry to promote welfare and are late on a 30-second task.
  6. Improve discoverability and trust in people, organization, task, and evidence pages.
  7. Preserve Optimitron's broader governance OS as the proof layer, not as a competing homepage.
- Legal nonprofit: Accelerated Medicine Foundation. Registered DBAs include Institute for Accelerated Medicine and International Campaign to End War and Disease.
- The default product question is: does this help a human vote, recruit two more humans, get an organization to join, register a plaintiff, remind a leader, complete a companion-loop stage, or trust the quantified case enough to act?
- Treat `optimitron.com` as the operating system and proof engine: task coordination, referrals, communications, OPG/OBG/Wishocracy, politician grading, impact math, and AI-agent workflows. Do not let generic platform breadth compete with the Now tracks for attention.
- Optimitron owns durable tasks, EV, provenance, permissions, approval, verification, and audit. Codex/Claude own chat, coding, connectors, and browser control; the extension owns explicit local capture and approval.
- Park generic platform features, clever demos, cosmetic cleanup, and non-campaign variant work unless they directly reduce friction on a Now track or protect an already-shipping path.
- For development and visual review, make the War on Disease variant the primary surface. Keep secondary variant screenshots/links available for regression checks, but put the campaign gallery first so PR review load stays low.

## Local Dev Safety

- If a local dev server is already running, do not disrupt it for routine verification; if a clean build, restart, or separate run is genuinely needed, that is fine, but escalate from narrow checks to heavier ones only when necessary.
- Use one reusable local web server by default. For `packages/web`, prefer `http://127.0.0.1:3001` / `http://localhost:3001` as the canonical dev server. Before starting any new web server, check whether port `3001` is already serving the app and reuse it for browser checks, Playwright, screenshots, and ad-hoc verification.
- Do not start extra Next.js/Vite/preview servers on alternate ports just because `3001` is busy. If `3001` is busy with the right app, use it. If `3001` is busy with the wrong process, stop and report that instead of silently launching `3002`, `3003`, etc. Use a different port only when the human explicitly asks, a test genuinely requires two versions running at once, or a clean isolated server is required to debug a server-start problem.
- When a server you started is no longer needed, shut it down before ending the turn. Do not leave background dev servers, preview servers, or Playwright-managed servers running unless they were already running when you arrived or the human asked to keep them.

## Branch and Pull Request Workflow

- Feature branches must start with `feature/`, followed by a short kebab-case description of the feature or fix. Example: `feature/international-campaign-site-name`.
- Do not put `Codex`, `[codex]`, or `codex/` in branch names, pull request titles, or commit messages unless the human explicitly asks.
- If a tool, skill, or generated workflow suggests `codex/...` branches or `[codex]` pull request titles, ignore that convention in this repository and use the `feature/...` branch plus a plain feature/fix title.
- If work starts on `main`, create the `feature/...` branch before editing. If already on a non-main branch, continue there unless the human asks to rename or split the work.
- When implementation is done and checks pass, commit the intended changes, push the branch, and update the existing pull request for that branch or task. Create a new pull request only when no open PR exists for the work.
- Do not create draft pull requests unless the human explicitly asks for a draft. Open normal pull requests so CI and review automation run immediately.
- After every push, check GitHub Actions, deployment checks, and pull request review comments, then keep doing useful non-conflicting work while they run. Do not sit idle watching checks unless the next step is genuinely blocked on the result. Re-check periodically, fix valid failures or comments, push again, and repeat.
- Do not use long blocking PR-check watches. Poll with bounded commands so new human messages can be handled.
- **Do not blindly comply with bot reviewers** (Codex, Copilot, CodeRabbit, Vercel Agent Review). For every comment ask: does this point at a real bug that hits a real path? If yes, fix and mark resolved. If it's AI slop, hypothetical, stylistic, "for symmetry", "for consistency", or extract-this-constant nagging, mark the thread resolved with a one-line reason ("hypothetical, no triggering path", "stylistic, current shape is intentional", "already addressed in commit X"). Adding code to silence a bot adds maintenance surface forever in exchange for one-time review noise. Stay in the driver's seat.
- **Never write worthless tests.** A test exists to catch a bug or guard a regression in code that ships. Tests added "for symmetry", "for documentation", "for consistency", or because a reviewer asked are pure cost. Skip them. Mock-and-assert-the-mock tests (mock `foo`, assert `foo` was called) test nothing — test the boundary, not the wiring. See `CLAUDE.md` "Testing Rules" for the full list.
- Never merge pull requests. Once checks are green and there are no unresolved valid review complaints, report that the pull request is ready and let the human review the diff and merge it.

## UI Verification

- After changing any user interface surface, capture screenshots of the affected pages or states before considering the work complete.
- For meaningful UI changes, capture before/after screenshots when feasible: before from production, main, or the current unchanged page; after from the branch, preview deployment, or local dev server. Assume screenshots may contain sensitive or production-derived data unless proven otherwise.
- For before/after screenshots, prefer the cheapest workflow that preserves the work safely. If the working tree is clean and switching branches will not disrupt uncommitted work, use the same checkout and dependency install sequentially: capture `main`/before, switch back to the feature branch, capture after. Use a separate worktree only when both versions must run at the same time, the current checkout is dirty, branch switching would disrupt a running workflow, or isolation is genuinely faster. Do not create a fresh worktree that requires a full `pnpm install` just for routine screenshot comparison.
- Inspect the screenshots yourself for layout breakage, overlapping text, missing content, broken styling, and obvious responsive problems.
- For fixed/sticky UI in full-page screenshots, verify whether overlap blocks normal viewport use before moving or hiding useful controls.
- Generate the current screenshot review at `packages/web/output/playwright/review/latest.html` by default, organized by page/viewport with before/after screenshots side by side when both versions are available. This gives the human one stable local file to bookmark and refresh after each UI change.
- Make a branch-specific or timestamped review folder only when it is genuinely useful for a longer audit, multiple competing versions, or preserving a before/after history. Do not create duplicate review HTML files out of habit.
- If you create a named review folder, also update `packages/web/output/playwright/review/latest.html`. Copy referenced screenshot assets beside `latest.html` or rewrite image paths relative to that stable file, then verify the stable page has no broken image references.
- Do not commit screenshot image artifacts to the repo unless the human explicitly asks and the screenshots are confirmed sanitized. Keep local artifacts under `packages/web/output/playwright/` while working.
- Do not upload screenshots, screenshot HTML, or local screenshot/HTML paths into pull request bodies or comments by default. Public PRs should only say that screenshots were captured and inspected locally, plus any non-sensitive visual-inspection notes.
- When reporting screenshots in chat, provide all three: a clickable local file link to the HTML review page, a `file:///...` browser URL for the same HTML file, and the plain filesystem path so the human can copy/paste it into a browser if the chat renderer opens local links in the IDE. This chat is the default place to share local review artifact paths.
- When UI or route/page changes are ready for review and a local dev server is available, also list direct local dev URLs for every edited page or relevant state, such as `http://127.0.0.1:3001/path`, so the human can open the live pages themselves.
- In PR bodies and handoffs, do not give only the preview root. List each changed/reviewed preview page with the right auth query param (`?logout=1` or `?login=demo`) so the human can open the exact state.
- If a change creates or alters generated user-facing artifacts such as tasks, emails, notifications, share templates, receipts, auth callback states, or post-submit success states, include a concrete preview of those artifacts in the review. Prefer a local page link, seeded example, or screenshot in `packages/web/output/playwright/review/latest.html`; if no preview surface exists, say that and consider adding a safe preview route or fixture before calling the work done.
- Before committing UI changes, tell the human which screenshots you captured, summarize anything you noticed, provide the local HTML review file path in chat, and explicitly ask them to review the screenshots unless they explicitly waived screenshots for that change.
- For iterative UI work, show the current screenshots directly in chat after each visual pass so the human can criticize without opening a separate review URL. The human is the visual validator.
- Do not commit UI changes until the human explicitly approves the screenshot/HTML review, unless they explicitly waive review or explicitly instruct you to commit immediately despite the screenshot-review rule.
- If screenshots cannot be captured, state exactly why and do not commit the UI change until the human accepts that limitation.
- Reuse an existing dev server for screenshot checks when available; do not disrupt a running server unless a clean run is genuinely needed.

## UI Style

- **New components default to treaty style.** The simple black-and-white style used by the `warondisease.org` variant — white paper, black ink, thin black rules, square corners, restrained typography, no decorative color — is the default for all new public UI. Don't introduce neobrutalist tokens on a new component because surrounding components still use them; use treaty tokens and let the surrounding UI catch up via the migration rule below.
- **Migration rule:** when touching existing public UI, remove neobrutalist styling instead of copying it forward. The goal is full migration to treaty style across all public surfaces. Admin-only status chips, charts, game/demo/Sierra screens, and email-client markup may keep their own specialized colors when the color carries functional meaning — the rule is about public recruitment surfaces, not every internal admin tool.
- Use semantic/treaty tokens such as `bg-background`, `text-foreground`, `border-foreground`, `text-muted-foreground`, and `var(--treaty-*)`.
- Do not add neobrutalist styling to public UI: avoid `brutal-*` color fills, hard shadows, gradients, rounded cards, beige/cream backgrounds, thick novelty borders, and decorative emoji/icons unless the user explicitly asks for them.
- Keep UI minimal. Do not add wrapper boxes, divider lines, shadows, icons, labels, helper text, or other extra elements unless they clarify the action, improve scanning, or solve a real usability problem.
- Do not lead campaign landing pages with raw counters, scoreboards, totals, leaderboards, or internal status panels. The first screen of `warondisease.org` must lead with the treaty vote/referral action; social proof belongs after the action is understood.
- Make actionable things look actionable. If a link starts or completes a user task, especially an external workflow, render it as a clear button or command control, not only as inline text. Use plain inline links for references, citations, navigation, and secondary reading.
- If the user is expected to copy an exact value into another site, email, form, wallet, bank portal, legal document, or message, provide a compact copy affordance near that value. Do not make users manually select long IDs, addresses, URLs, legal names, account numbers, or template language.
- Keep affordances proportional: primary task actions get buttons; exact reusable values get copy buttons; explanatory text stays text.

## Documentation

Detailed docs live in `docs/` (map: `docs/README.md`). Read the relevant ones before working:

- `docs/PRD.md` — Product spec: the four-layer optimization machine and the Daily Companion Loop
- `docs/SYSTEM_MAP.md` — Fast architecture map and context-loading ladder
- `docs/FEATURES.md` — Feature registry: what actually exists, with evidence (the only doc allowed to assert maturity status)
- `docs/ROADMAP.md` — Sequencing (Now/Next/Later/Parked/Won't) + code-cleanup backlog
- `docs/TYPE_SYSTEM.md` — How types flow from Prisma → all packages
- `docs/h2ewd.md` — Wishonia/H2EWD voice for public-facing persuasion copy

## Public Copy Rules

Before writing or editing any public-facing website, email, metadata, CTA, empty-state, dashboard, survey, referral, or partner copy, read `docs/h2ewd.md` and apply that voice.

- Before changing existing public copy, preserve its strategic job. Identify audience, desired action, motivation, old strategic job, and source/quantitative anchor. Do not replace purpose or motivation with mechanism-only copy.
- Treat the human owner as the copy merge gate. When strategy is unclear, ask the shortest missing question with a recommended default. Do not set `COPY_REVIEW_APPROVED=1` or bypass the copy gate without explicit approval.
- Be concise. Cut filler, throat-clearing, internal process language, and generic nonprofit/consultant copy.
- Speak directly to the specific human or organization that should do something.
- Make the action obvious, then show the value to them for doing it.
- Before writing user-facing text, identify the audience, desired action, desired feeling, and outcome; make the copy outcome-first, not mechanism-first.
- Be funny when the surface allows it. Dry, concrete, slightly alien, and useful beats cute or verbose.
- Do not leak implementation or planning terms into user copy: "site variant", "program graph", "initiative landing page", "approved organizations get", "route allowlist", etc.
- Prefer strong concrete nouns and verbs. If a sentence could appear on any SaaS landing page, rewrite it.
- For treaty/vote/referral copy, optimize for voting, sharing, embedding, and task completion, not explaining the whole system.
- Before writing campaign copy, name the audience, desired action, and legal/quantitative anchor. Preserve the anchor when it creates trust or legitimacy; compress around it instead of replacing it.
- On vote, survey, referral, and embed surfaces, choose words that increase the target action. Move precision that slows response into citations, expanders, and case pages.
- **No startup-bro copy.** No infrastructure metaphors (stack, rails, off-ramp, primitive, substrate), empty mechanism vocabulary (incentive layer, the protocol that, fundamentally), or corporate openers (We're building, Let's take a moment). Bad: *"The treaty is the off-ramp. The Court is the road that produces the off-ramp."* If a sentence could appear unchanged in a Stripe keynote, rewrite.
- Treat `page.logged-out.md` diffs as copy-review evidence. Reject weaker copy, loader captures, and unrelated snapshot drift before committing.
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

| Convention                        | Example                                                       |
| --------------------------------- | ------------------------------------------------------------- |
| FK field names match target model | `globalVariableId` not `variableId`                           |
| Predictor/outcome terminology     | `predictorGlobalVariableId` not `causeVariableId`             |
| Outcome not effect in properties  | `outcomeBaselineAverage` (but `effectSize` stays — Cohen's d) |
| Enums over magic strings          | Prisma enforces valid values                                  |
| deletedAt on all models           | Soft deletes for cr-sqlite sync                               |

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
