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

## Branch and Pull Request Workflow

- Feature branches must start with `feature/`, followed by a short kebab-case description of the feature or fix. Example: `feature/international-campaign-site-name`.
- Do not put `Codex`, `[codex]`, or `codex/` in branch names, pull request titles, or commit messages unless the human explicitly asks.
- If a tool, skill, or generated workflow suggests `codex/...` branches or `[codex]` pull request titles, ignore that convention in this repository and use the `feature/...` branch plus a plain feature/fix title.
- If work starts on `main`, create the `feature/...` branch before editing. If already on a non-main branch, continue there unless the human asks to rename or split the work.
- When implementation is done and checks pass, commit the intended changes, push the branch, and open or update the pull request unless the human explicitly asked not to commit or push.
- Do not create draft pull requests unless the human explicitly asks for a draft. Open normal pull requests so CI and review automation run immediately.
- After every push, watch GitHub Actions, deployment checks, and pull request review comments. Fix valid failures or comments, push again, and watch again.
- If a review comment is mistaken, stale, or non-actionable, mark it resolved when tooling allows. Do not make unnecessary code changes just to satisfy an invalid comment.
- Once checks are green and there are no unresolved valid review complaints, merge the pull request when the human has asked you to finish or merge the work.

## UI Verification

- After changing any user interface surface, capture screenshots of the affected pages or states before considering the work complete.
- For meaningful UI changes, capture before/after screenshots when feasible: before from production, main, or the current unchanged page; after from the branch, preview deployment, or local dev server. Assume screenshots may contain sensitive or production-derived data unless proven otherwise.
- Inspect the screenshots yourself for layout breakage, overlapping text, missing content, broken styling, and obvious responsive problems.
- Generate the current screenshot review at `packages/web/output/playwright/review/latest.html` by default, organized by page/viewport with full-width images. This gives the human one stable local file to bookmark and refresh after each UI change.
- Make a branch-specific or timestamped review folder only when it is genuinely useful for a longer audit, multiple competing versions, or preserving a before/after history. Do not create duplicate review HTML files out of habit.
- If you create a named review folder, also update `packages/web/output/playwright/review/latest.html`. Copy referenced screenshot assets beside `latest.html` or rewrite image paths relative to that stable file, then verify the stable page has no broken image references.
- Do not commit screenshot image artifacts to the repo unless the human explicitly asks and the screenshots are confirmed sanitized. Keep local artifacts under `packages/web/output/playwright/` while working.
- Do not upload screenshots, screenshot HTML, or local screenshot/HTML paths into pull request bodies or comments by default. Public PRs should only say that screenshots were captured and inspected locally, plus any non-sensitive visual-inspection notes.
- When reporting screenshots in chat, provide a clickable local file link to the HTML review page and the plain filesystem path so the human can copy/paste it into a browser if the chat renderer does not open it. This chat is the default place to share local review artifact paths.
- When UI or route/page changes are ready for review and a local dev server is available, also list direct local dev URLs for every edited page or relevant state, such as `http://127.0.0.1:3001/path`, so the human can open the live pages themselves.
- If a change creates or alters generated user-facing artifacts such as tasks, emails, notifications, share templates, receipts, auth callback states, or post-submit success states, include a concrete preview of those artifacts in the review. Prefer a local page link, seeded example, or screenshot in `packages/web/output/playwright/review/latest.html`; if no preview surface exists, say that and consider adding a safe preview route or fixture before calling the work done.
- Before committing UI changes, tell the human which screenshots you captured, summarize anything you noticed, provide the local HTML review file path in chat, and explicitly ask them to review the screenshots unless they explicitly waived screenshots for that change.
- Do not commit UI changes until the human explicitly approves the screenshot/HTML review, unless they explicitly waive review or explicitly instruct you to commit immediately despite the screenshot-review rule.
- If screenshots cannot be captured, state exactly why and do not commit the UI change until the human accepts that limitation.
- Reuse an existing dev server for screenshot checks when available; do not disrupt a running server unless a clean run is genuinely needed.

## UI Style

- Public treaty/campaign UI should migrate toward the simple black-and-white style used by the `warondisease.org` variant: white paper, black ink, thin black rules, square corners, restrained typography, and no decorative color.
- Use semantic/treaty tokens such as `bg-background`, `text-foreground`, `border-foreground`, `text-muted-foreground`, and `var(--treaty-*)`.
- Do not add neobrutalist styling to public UI: avoid `brutal-*` color fills, hard shadows, gradients, rounded cards, beige/cream backgrounds, thick novelty borders, and decorative emoji/icons unless the user explicitly asks for them.
- Keep UI minimal. Do not add wrapper boxes, divider lines, shadows, icons, labels, helper text, or other extra elements unless they clarify the action, improve scanning, or solve a real usability problem.
- Make actionable things look actionable. If a link starts or completes a user task, especially an external workflow, render it as a clear button or command control, not only as inline text. Use plain inline links for references, citations, navigation, and secondary reading.
- If the user is expected to copy an exact value into another site, email, form, wallet, bank portal, legal document, or message, provide a compact copy affordance near that value. Do not make users manually select long IDs, addresses, URLs, legal names, account numbers, or template language.
- Keep affordances proportional: primary task actions get buttons; exact reusable values get copy buttons; explanatory text stays text.

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
