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
- **Use primitives for behavior, not decoration.** Check `src/components/retroui/` and existing domain components before hand-rolling buttons, inputs, checkboxes, dialogs, tables, menus, accordions, or other standard controls. Prefer the RetroUI primitive when it provides the right behavior; if its visual chrome conflicts with the simple black-and-white treaty style, migrate the primitive or its usage instead of duplicating a one-off control.
- **Metadata from routes.ts.** Use `getRouteMetadata()` — don't hardcode page titles.
- **Wishonia's voice.** All user-facing copy is in Wishonia's voice. Read `docs/h2ewd.md` before writing or rewriting public copy.
- **Use the H2EWD copy workflow.** For public copy edits, use `.agents/skills/h2ewd-copy`: identify audience, desired action, motivation, old strategic job, and source anchor before editing. Do not replace purpose/motivation copy with mechanism-only copy.
- **Mike is the copy merge gate.** The pre-commit copy gate blocks public copy changes until explicit approval. Do not bypass it or set `COPY_REVIEW_APPROVED=1` unless Mike approved the changed copy.
- **Conversion copy, not internal narration.** Speak directly to the audience, tell them what to do, and show the value of doing it. Keep it concise, funny where appropriate, and allergic to generic nonprofit/consultant language.
- **No implementation leaks in copy.** Do not expose internal planning terms like "site variant", "program graph", "initiative landing page", "approved organizations get", route policy language, or admin labels unless the user explicitly wants that exact wording surfaced.
- **Treat every empty state as an action surface.** If the user needs to invite humans, embed a survey, vote, assign Earth optimization tasks, or check status, show the useful control before explaining the absence of data.
- **Contrast rules.** Black-and-white treaty surfaces must keep text legible through semantic/treaty tokens. Use color only where it carries functional meaning, such as admin status, charts, games/demos, or email-client markup.
- **Prefer the Playwright wrapper.** For web verification, use `pnpm --filter @optimitron/web run e2e -- <mode>` instead of calling Playwright or `next build` directly.
- **Treaty screenshots use the wrapper.** Use `pnpm --filter @optimitron/web run e2e -- treaty-screenshots --reporter=list` for the treaty vote/post-vote screenshot audit; do not call `pnpm exec playwright ...` directly for that spec.
- **Reuse an existing dev server when available.** The wrapper checks `BASE_URL`, `http://127.0.0.1:3001`, and `http://localhost:3001` first and reuses that server before falling back to a production build.
- **Use port 3001 as the canonical local web server.** Before starting any web server, check `http://127.0.0.1:3001` / `http://localhost:3001`. If it is already serving this app, reuse it for browser checks, screenshots, Playwright, and ad-hoc verification.
- **Do not multiply local servers.** Do not start new servers on `3002`, `3003`, `3004`, etc. just because `3001` is occupied. If `3001` has the wrong process, stop and report that conflict. Use another port only when the human explicitly asks, two branches must be compared live at the same time, or debugging server startup genuinely requires isolation.
- **Clean up servers you start.** If you start a dev, preview, or Playwright-managed server, shut it down before ending the turn unless it was already running when you arrived or the human explicitly asks to keep it running.
- **Do not build just to run e2e** if a suitable dev server is already running.
- **Protect an existing dev server from routine churn.** Reuse it for small verification steps; if a clean build, restart, or separate run is genuinely needed, that is fine, but escalate from narrow checks to heavier ones only when necessary.
- **Screenshot every UI change before committing.** After changing pages, components, layouts, visual styling, or user-facing states, capture screenshots of the affected surface, inspect them for layout/text/styling problems, then tell the human where the screenshots are and ask them to review before committing.
- **Account for fixed UI in screenshots.** Full-page screenshots exaggerate fixed/sticky controls. Verify whether overlap blocks normal viewport use before moving or hiding useful controls.
- **Use the stable screenshot review page.** For meaningful UI changes, generate the local HTML comparison at `packages/web/output/playwright/review/latest.html` with before/after screenshots side by side when both versions are available. The review page should still capture all covered routes, but changed routes or missing-baseline routes should be expanded by default and unchanged routes collapsed. If true before screenshots are not practical, make an after-only review page and say so.
- **Opt review routes in from `routes.ts`.** Normal route coverage should come from `NavItem` review flags in `src/lib/routes.ts`: `screenshot`, `authenticatedScreenshot`, `copyPreview`, and `authenticatedCopyPreview`. Keep non-nav visual exceptions small and explicit for UI states or seeded dynamic pages only, such as an open side menu or a seeded task detail URL.
- **Create named review folders only when useful.** Do not create duplicate `review.html` files out of habit. A named folder under `packages/web/output/playwright/` is useful for a longer audit, multiple competing versions, or preserving before/after history; otherwise `review/latest.html` is enough.
- **Make screenshot review images inspectable.** In before/after review pages, each screenshot should fill its comparison panel; stack panels on narrow screens so mobile and desktop captures remain readable.
- **Baseline screenshot worktrees need built workspace deps.** If you create a clean `git worktree` to capture before screenshots, either run a normal install or run the relevant workspace build after `pnpm install --ignore-scripts`; otherwise packages that export from `dist/` can fail at render time.
- **Run ad-hoc Playwright scripts from the web package.** Use `pnpm --dir packages/web exec node ...` or run from `packages/web` with `pnpm exec` so `@playwright/test` resolves from the web app's dev dependencies.
- **Treat screenshots as sensitive by default.** Local and preview environments may be connected to production or production-derived databases. Do not commit or upload screenshot artifacts unless the human explicitly asks and the screenshots are confirmed sanitized.
- **Report local review links.** Summarize screenshot coverage in the PR comment/body or handoff, include affected URLs/viewports, preview URLs when safe, local screenshot/HTML paths, and your own visual inspection notes. Provide a clickable local file link plus the plain path for the HTML review page.
- **Report live local page links.** When UI or route/page changes are ready for review and a local dev server is available, include direct local dev URLs for every edited page or relevant state, such as `http://127.0.0.1:3001/path`, so the human can open the actual pages in a browser.
- **Report affected page links.** When finishing web UI work, include clickable links to the actual affected local or preview pages so the human can open the page itself, not just the screenshot review HTML. Prefer the exact site override/query params used during screenshot capture.
- **Preview generated artifacts too.** If a change creates or alters generated user-facing tasks, emails, notifications, share templates, receipts, auth callback states, or post-submit success states, include at least one concrete example in the review: a local page link, seeded task/email preview, mocked success state screenshot, or fixture screenshot in `output/playwright/review/latest.html`. If no preview surface exists, say so and consider adding a safe preview route or fixture instead of only showing the source page.
- **If screenshot verification is blocked, say why.** Do not commit UI changes without screenshots unless the human explicitly accepts the limitation.
- **Do not freeze long-form copy in E2E.** Browser tests should assert behavior, route transitions, data contracts, analytics-critical parameters, accessibility roles, and the presence/absence of coarse UI states. Avoid exact prose, magic-number, or paragraph-level assertions unless the wording itself is the contract being tested. Put exact copy parity in focused unit/doc tests, seeded-template tests, or screenshot review instead.

## Mike UI Complaint Checklist

Before calling a public or authenticated UI "done," inspect it as if the human is about to open the page and ask why it is making the desired action harder.

- **Goal first.** Identify the one action the page should maximize. Put that action before browsing, explanation, counters, filters, dashboards, FAQs, or legal framing.
- **Do not lead campaign landing pages with bookkeeping.** Raw counters, scoreboards, totals, leaderboards, and internal status panels may support trust after the primary action is understood, but the first screen of `warondisease.org` must lead with the treaty vote/referral action, not "Living votes", "Total voices", or similar accounting.
- **No useless top clutter.** Remove or demote counters, filter boxes, sort controls, explanatory cards, "older" buttons, and status text that do not help the next user action.
- **Do not require auth to understand or start.** Let anonymous visitors fill the conversion form first when possible; persist the draft and ask for auth only when the action must be verified.
- **Do not leak our planning conversation into copy.** Avoid phrases like "details can come later," "add details now," "record," "manage people," or other internal narration unless the user explicitly asks for that wording.
- **Use the user's frame, not generic product mush.** If the page is about plaintiffs, court evidence, Humanity v. Government, or the 1% Treaty, say that. Do not retreat to vague labels like "humans on the record" or "people already represented" when the stronger frame is known.
- **Give the human agency.** Before accepting a headline, CTA, form label, or question, ask who is acting. Avoid detached phrasing like "should your donation prevent" when the page means "do you want to prevent." Prefer direct user-centered language that names the action the human is about to take.
- **Translate model labels into normal app language.** Labels can be precise without sounding like a spreadsheet. Replace internal phrases such as "voter-equivalent reach needed," "live derivation," or "record management" with the thing the human recognizes: reach humans, show the math, edit details.
- **Preserve sharp copy.** When moving existing/user-provided language into another place such as an FAQ, keep it as close to exact as grammar allows. Do not blandly paraphrase it.
- **Cite loaded numbers.** Use parameter/citation components for major numeric claims wherever available instead of hardcoded unsupported numbers.
- **One click should do the obvious thing.** Post-submit CTAs should deep-link to the specific thing just created. Photo boxes should open photo upload/crop. Do not send users to an index where they must find and click the same item again.
- **Use normal app language.** Buttons and dialog labels should sound like the familiar control they are: "Upload photo," "Crop photo," "Cancel," "Save," "Delete." Avoid awkward labels like "Crop square photo."
- **Do not show giant forms by default.** Use tables/cards for scanning and dialogs or expansion for editing. Forms should appear when the user chooses to edit a specific item.
- **One progressive control beats mode tabs.** Before adding tabs, modes, or always-visible fields, name the user sentence and prefer one search/select control. Search existing records before revealing create-new fields. If the UI mirrors the database model, redesign.
- **Mobile is not optional.** Tables must not clip off-screen. Use responsive cards or a proven responsive table primitive. Pagination belongs where users expect it, usually below the list.
- **Remove columns nobody cares about.** Do not include evidence counts, implementation fields, or other low-value columns just because the data exists.
- **Use proven UI libraries for tricky interactions.** Cropping, dragging, zooming, sliders, dialogs, and tables should rely on established primitives before hand-rolled behavior.
- **Test-looking data is a design problem.** If fake/test records appear in screenshots or production-like views, either clean them up safely or design the list so low-quality records do not dominate the first impression.

## Off-Limits

- Library package internals (`packages/optimizer/src/*`, `packages/wishocracy/src/*`, etc.)
- Smart contract code (`packages/treasury-*/contracts/*`)
- Only import from other packages via their public exports
