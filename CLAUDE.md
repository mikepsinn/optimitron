@AGENTS.md

# Claude Code Notes

`AGENTS.md` is canonical. Read `docs/SYSTEM_MAP.md`, then the relevant package `AGENTS.md`. This file contains only Claude-specific workflow.

## Research And Copy

- For user-facing copy, call `mcp__optimitron-tasks__searchManual` before drafting. Use `askWishonia` only when synthesis is needed. If MCP is unavailable, search `https://manual.warondisease.org/assets/json/search-index.json` and say the fallback was used.
- Never hand-edit `page.logged-out.md` or `*.email.md`. Generate them with `pnpm --filter @optimitron/web copy:preview` or `email:preview-md`.
- Update `TODO.md` in the commit that closes or creates its work. Commit messages include `todo-touched: <item>` or `todo-skipped: <reason>`.
- Ask the human owner only for copy approval, a strategic fork, or a ship/redraft/abandon decision. Decide ordinary engineering details from code and tests.
- For a non-trivial cross-system change, show the current and proposed flow before editing.

## Claude Tools

- Project agents: `.claude/agents/voice-critic.md`, `cold-stranger-ux.md`, `pr-comment-triager.md`, `test-auditor.md`.
- Project skills: `.claude/skills/qa-editorial`, `.claude/skills/verify-slide`.
- Use gstack for generic review, investigation, QA, design review, and shipping when installed. See `SETUP.md` if its binaries are missing.
- The remaining hooks are advisory except the snapshot hand-edit safety gate. Do not add hooks unless the human owner asks.

## Local Runtime

- Environment variables live in root `.env`; local `NEXTAUTH_URL` is `http://localhost:3001`.
- `pnpm --filter @optimitron/web dev:watch` keeps the canonical port 3001 server warm and writes `packages/web/.dev-watcher.log`.
- Run ad-hoc Playwright from `packages/web` so its dependencies resolve.

## Testing Rules

Write tests for branching logic, transaction/state transitions, boundary conversion, authorization, and real regressions. Do not test framework passthroughs, transcribe implementations, assert mocks called mocks, or add symmetry/documentation tests.

Tests must not depend on wall-clock time, real network or LLM calls, randomness, unordered Prisma results, shared mutable state, sleeps, or retries. Inject or mock at the real boundary.

Run the affected package tests. Run `pnpm check` for shared schemas or types. Never skip an existing failure; report a failure you cannot reproduce.
