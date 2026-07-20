# Development Queue

Production Task rows are the canonical operational development queue. This
file intentionally contains no checklist, status, handoff, or standing policy.

Root: [Optimize Optimitron: engineering
program](https://optimitron.com/tasks/cmrh79s7h000604jtqfckws4t)
(`optimitron:dev`, `cmrh79s7h000604jtqfckws4t`).

Use the Codex-registered production Optimitron MCP server, not the local site
or repository environment variables:

1. Call `getMe` to confirm the authenticated identity.
2. Call `getQueueAudit` before trusting queue rankings.
3. Call `listTasks` with `parentTaskId` set to
   `cmrh79s7h000604jtqfckws4t` and `visibility: "all"` to inspect development
   children.
4. Call `searchTasks` by stable task key and title before creating work.
5. Use `getTask`, `getBlockers`, and `getNextAction` for current scope,
   dependencies, and priority.
6. Record dependencies with `TaskEdge`; link plans, comments, commits, and
   pull requests to the owning production task.

Planning ownership remains intentionally separate:

- `docs/PRD.md`: target-state product contracts.
- `docs/FEATURES.md`: current maturity and evidence.
- `docs/ROADMAP.md`: strategic sequence and gates.
- Production Task rows: operational work and status.
