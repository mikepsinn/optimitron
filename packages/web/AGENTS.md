# AGENTS.md — @optimitron/web

## Scope

Next.js 15 application — auth, dashboard, API routes, task system, treaty pages, prize page, and all user-facing UI. This is the monolithic consumer of all other packages.

## Key Areas

- `src/app/` — Next.js App Router pages and API routes
- `src/components/` — React components (RetroUI primitives + custom domain components)
- `src/lib/` — Server-side logic, Prisma queries, task system, auth
- `src/lib/tasks/` — Treaty signer network, policy model import, impact scoring, milestones
- `scripts/` — CLI tools (import-treaty-policy-model.ts, etc.)

## Dependencies

Imports from ALL `@optimitron/*` packages. This is the integration layer.

## Rules

- **Prisma is OK here.** This is the only package that uses Prisma client at runtime.
- **Follow the design system.** See root `CLAUDE.md` for neobrutalist rules, color tokens, and component primitives.
- **Use RetroUI + domain primitives.** Never inline card/section/header styles — use `BrutalCard`, `SectionContainer`, `SectionHeader`, etc.
- **Metadata from routes.ts.** Use `getRouteMetadata()` — don't hardcode page titles.
- **Wishonia's voice.** All user-facing copy is in Wishonia's voice (see CLAUDE.md).
- **Contrast rules.** Every `bg-brutal-*` must pair with `text-brutal-*-foreground`.
- **Prefer the Playwright wrapper.** For web verification, use `pnpm --filter @optimitron/web run e2e -- <mode>` instead of calling Playwright or `next build` directly.
- **Treaty screenshots use the wrapper.** Use `pnpm --filter @optimitron/web run e2e -- treaty-screenshots --reporter=list` for the treaty vote/post-vote screenshot audit; do not call `pnpm exec playwright ...` directly for that spec.
- **Reuse an existing dev server when available.** The wrapper checks `BASE_URL`, `http://127.0.0.1:3001`, and `http://localhost:3001` first and reuses that server before falling back to a production build.
- **Do not build just to run e2e** if a suitable dev server is already running.
- **Protect an existing dev server from routine churn.** Reuse it for small verification steps; if a clean build, restart, or separate run is genuinely needed, that is fine, but escalate from narrow checks to heavier ones only when necessary.
- **Do not freeze long-form copy in E2E.** Browser tests should assert behavior, route transitions, data contracts, analytics-critical parameters, accessibility roles, and the presence/absence of coarse UI states. Avoid exact prose, magic-number, or paragraph-level assertions unless the wording itself is the contract being tested. Put exact copy parity in focused unit/doc tests, seeded-template tests, or screenshot review instead.

## Off-Limits

- Library package internals (`packages/optimizer/src/*`, `packages/wishocracy/src/*`, etc.)
- Smart contract code (`packages/treasury-*/contracts/*`)
- Only import from other packages via their public exports
