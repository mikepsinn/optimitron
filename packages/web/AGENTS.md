# AGENTS.md — @optimitron/web

## Scope

Next.js 15 application — auth, dashboard, API routes, task system, treaty pages, prize page, and all user-facing UI. This is the monolithic consumer of all other packages.

## Key Areas

- `src/app/` — Next.js App Router pages and API routes
- `src/components/` — React components, form/dialog primitives, and public UI surfaces
- `src/lib/` — Server-side logic, Prisma queries, task system, auth
- `src/lib/tasks/` — Treaty signer network, policy model import, impact scoring, milestones
- `scripts/` — CLI tools (import-treaty-policy-model.ts, etc.)

## Dependencies

Imports from ALL `@optimitron/*` packages. This is the integration layer.

## Rules

- **Prisma is OK here.** This is the only package that uses Prisma client at runtime.
- **Follow the design system.** See root `CLAUDE.md` for the War on Disease black-and-white treaty style, approved tokens, and component guidance.
- **Migrate public UI away from neobrutalist styling.** New or touched treaty/campaign/dashboard surfaces should use simple semantic/treaty tokens: `bg-background`, `text-foreground`, `border-foreground`, `text-muted-foreground`, and `var(--treaty-*)`. Avoid adding `brutal-*` fills, hard shadows, gradients, rounded cards, beige/cream backgrounds, and decorative color.
- **Use primitives for behavior, not decoration.** Reuse existing RetroUI/domain components when they already fit the simple black-and-white style. If a primitive adds colored neobrutalist chrome, prefer a simpler semantic layout or migrate the primitive usage.
- **Metadata from routes.ts.** Use `getRouteMetadata()` — don't hardcode page titles.
- **Wishonia's voice.** All user-facing copy is in Wishonia's voice. Read `docs/h2ewd.md` before writing or rewriting public copy.
- **Conversion copy, not internal narration.** Speak directly to the audience, tell them what to do, and show the value of doing it. Keep it concise, funny where appropriate, and allergic to generic nonprofit/consultant language.
- **No implementation leaks in copy.** Do not expose internal planning terms like "site variant", "program graph", "initiative landing page", "approved organizations get", route policy language, or admin labels unless the user explicitly wants that exact wording surfaced.
- **Treat every empty state as an action surface.** If the user needs to invite humans, embed a survey, vote, assign Earth optimization tasks, or check status, show the useful control before explaining the absence of data.
- **Contrast rules.** Black-and-white treaty surfaces must keep text legible through semantic/treaty tokens. Use color only where it carries functional meaning, such as admin status, charts, games/demos, or email-client markup.
- **Prefer the Playwright wrapper.** For web verification, use `pnpm --filter @optimitron/web run e2e -- <mode>` instead of calling Playwright or `next build` directly.
- **Treaty screenshots use the wrapper.** Use `pnpm --filter @optimitron/web run e2e -- treaty-screenshots --reporter=list` for the treaty vote/post-vote screenshot audit; do not call `pnpm exec playwright ...` directly for that spec.
- **Reuse an existing dev server when available.** The wrapper checks `BASE_URL`, `http://127.0.0.1:3001`, and `http://localhost:3001` first and reuses that server before falling back to a production build.
- **Do not build just to run e2e** if a suitable dev server is already running.
- **Protect an existing dev server from routine churn.** Reuse it for small verification steps; if a clean build, restart, or separate run is genuinely needed, that is fine, but escalate from narrow checks to heavier ones only when necessary.
- **Screenshot every UI change before committing.** After changing pages, components, layouts, visual styling, or user-facing states, capture screenshots of the affected surface, inspect them for layout/text/styling problems, then tell the human where the screenshots are and ask them to review before committing.
- **Use side-by-side screenshot review pages.** For meaningful before/after UI changes, generate a local HTML comparison under `packages/web/output/playwright/` with the before and after images side by side. If true before screenshots are not practical, make an after-only review page and say so.
- **Treat screenshots as sensitive by default.** Local and preview environments may be connected to production or production-derived databases. Do not commit or upload screenshot artifacts unless the human explicitly asks and the screenshots are confirmed sanitized.
- **Report local review links.** Summarize screenshot coverage in the PR comment/body or handoff, include affected URLs/viewports, preview URLs when safe, local screenshot/HTML paths, and your own visual inspection notes. Provide a clickable local file link plus the plain path for the HTML review page.
- **If screenshot verification is blocked, say why.** Do not commit UI changes without screenshots unless the human explicitly accepts the limitation.
- **Do not freeze long-form copy in E2E.** Browser tests should assert behavior, route transitions, data contracts, analytics-critical parameters, accessibility roles, and the presence/absence of coarse UI states. Avoid exact prose, magic-number, or paragraph-level assertions unless the wording itself is the contract being tested. Put exact copy parity in focused unit/doc tests, seeded-template tests, or screenshot review instead.

## Off-Limits

- Library package internals (`packages/optimizer/src/*`, `packages/wishocracy/src/*`, etc.)
- Smart contract code (`packages/treasury-*/contracts/*`)
- Only import from other packages via their public exports
