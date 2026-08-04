@AGENTS.md

# Claude Code Notes

`AGENTS.md` is canonical. Read `docs/SYSTEM_MAP.md`, then the relevant package `AGENTS.md`. This file contains only Claude-specific workflow.

## Research And Copy

- For user-facing copy, call the Optimitron MCP `searchManual` tool before drafting. Use `askWishonia` only when synthesis is needed. If MCP is unavailable, search `https://manual.warondisease.org/assets/json/search-index.json` and say the fallback was used.
- **Use the hosted Optimitron connector, never a local MCP server.** Task, person, and organization writes must land in the production database. A local server exposes identically-named tools backed by a different database, so writes appear to succeed and are invisible on optimitron.com. If you see more than one Optimitron MCP server offering `createTask` or `proposeTaskBundle`, stop and ask which is production before writing.
- Never hand-edit `page.logged-out.md` or `*.email.md`. Generate them with `pnpm --filter @optimitron/web copy:preview` or `email:preview-md`.
- Use the production `optimitron:dev` task tree as the operational queue. Update the owning task's comments/status and link the implementation PR; do not maintain a parallel Markdown checklist.
- Ask the human owner only for copy approval, a strategic fork, or a ship/redraft/abandon decision. Decide ordinary engineering details from code and tests.
- `ParameterValue.valueOverride` may summarize related canonical evidence; do not force its trigger and dialog values to match (for example, `95%` may open the canonical 6,650-disease count and confidence interval).
- For a non-trivial cross-system change, show the current and proposed flow before editing.

## Claude Tools

- Project agents: `.claude/agents/voice-critic.md`, `cold-stranger-ux.md`, `pr-comment-triager.md`, `test-auditor.md`.
- Project skills: `.claude/skills/qa-editorial`, `.claude/skills/verify-slide`.
- The remaining hooks are advisory except the snapshot hand-edit safety gate. Do not add hooks unless the human owner asks.

## Local Runtime

- Environment variables live in root `.env`; local `NEXTAUTH_URL` is `http://localhost:3001`.
- `pnpm --filter @optimitron/web dev:watch` keeps the canonical port 3001 server warm and writes `packages/web/.dev-watcher.log`.
- Run ad-hoc Playwright from `packages/web` so its dependencies resolve.

## Testing Rules

Write tests for branching logic, transaction/state transitions, boundary conversion, authorization, and real regressions. Do not test framework passthroughs, transcribe implementations, assert mocks called mocks, or add symmetry/documentation tests.

Tests must not depend on wall-clock time, real network or LLM calls, randomness, unordered Prisma results, shared mutable state, sleeps, or retries. Inject or mock at the real boundary.

Run the affected package tests. Run `pnpm check` for shared schemas or types. Never skip an existing failure; report a failure you cannot reproduce.
