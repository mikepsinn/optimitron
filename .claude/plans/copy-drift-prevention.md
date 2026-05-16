<!-- /autoplan restore point: /c/Users/m/.gstack/projects/mikepsinn-optimitron/feature-optimize-earth-root-delay-stats-autoplan-restore-20260515-131411.md -->
# Copy-drift prevention (5 write-time enforcement layers)

**STATUS: SUPERSEDED on 2026-05-15 by `.claude/plans/copy-drift-prevention-round2-canon-as-ts.md`** —
This plan was the round-1 output (5 prevention layers). Round-2 /autoplan (CEO + Eng + DX × Claude subagent + Codex = 6 reviewers) on this plan converged on a simpler architecture: hand-curated `packages/web/src/lib/copy/canon.ts` module + one narrow ESLint rule. Mike's Phase 4 final-gate choice pivoted to `.claude/plans/copy-i18n-migration.md` (now also SUPERSEDED), but the parallel agent's round-2 plan at `copy-drift-prevention-round2-canon-as-ts.md` is the actual landing point: simpler than i18n migration, sharper than these 5 layers, complementary to the existing scoped `packages/web/src/messages/en-US/war-on-disease.json`.

The pre-req fix in this plan's Phase A (patching existing hook regex for double-quoted prompt extraction at `.claude/hooks/enforce-codex-protocol.mjs:61` + `.claude/hooks/enforce-manual-search-in-copy-dispatch.mjs:74`) IS preserved — the round-2 plan's Day 1 carries it forward.

---

Slug: `copy-drift-prevention`
Created: 2026-05-15
Status: SUPERSEDED — see header
Originally superseded: `~/.gstack/projects/mikepsinn-optimitron/m-feature-optimize-earth-root-delay-stats-design-20260515-124401.md` (the embedding-tool design, killed by /autoplan Phase 1 dual-voice CEO review on the same day)

## Brief

Stop Claude (and Codex) from writing degraded paraphrases of canonical Wishonia copy into user-facing surfaces. Replace the proposed `@xenova/transformers` embedding audit tool with **write-time prevention** at the moment of edit, so bad copy cannot land.

Four prevention layers (1-4) cover the copy-drift surface; a fifth layer (5) prevents recurrence of the meta-failure that caused this work — Claude dissuading Mike from `/autoplan` for new-tool work that warrants the ceremony. A sixth layer (6) is a one-shot grep audit of existing drifts in the codebase that landed before any of layers 1-5 existed.

**Trigger incident (2026-05-15):** Claude wrote *"Since 1900 they spent fortunes on war and left the sick in line"* into `packages/web/src/lib/routes.ts:724` while the manual already had *"Three counts of negligent mass homicide against the governments of Earth. The body count, the bill, and the only remedy that works on actual humans."* The existing `enforce-manual-search-in-copy-dispatch.mjs` hook caught NONE of it because it only fires on `codex exec` / `codex review`, not on Claude's direct `Edit`/`Write` tool calls.

## Current state (ASCII)

```
                       ┌───────────────────────────────────────────────────────────┐
                       │  CANON (authoritative wording, voice-calibrated)          │
                       │   ┌─────────────────────────────────┐                     │
                       │   │ manual.warondisease.org pages   │                     │
                       │   │ parameters-calculations-        │                     │
                       │   │   citations.ts WHEREAS clauses  │                     │
                       │   │ treaty preamble                 │                     │
                       │   │ WELFARE_CLAIM_TEXT (centralized)│                     │
                       │   └─────────────────────────────────┘                     │
                       └────────────────────┬──────────────────────────────────────┘
                                            │ canonical phrasings
                                            ▼
              ┌───────────────────────────────────────────────────────────────────┐
              │  Claude / Codex writing copy                                      │
              │                                                                   │
              │  Path A: codex exec ... ────► enforce-manual-search-in-copy-      │
              │                               dispatch.mjs  ─────► BLOCKED on    │
              │                               (.claude/hooks/...)    miss        │
              │                                                                   │
              │  Path B: Edit/Write/MultiEdit ────► NO HOOK ─────► UNBLOCKED     │
              │   (Claude direct)                                                 │
              │                                                                   │
              │  Path C: Mike's keyboard ────► (n/a; human writer)                │
              └─────────────────────────────────────────┬─────────────────────────┘
                                                        │ drifted prose
                                                        ▼
              ┌───────────────────────────────────────────────────────────────────┐
              │  USER-FACING SURFACES                                             │
              │  packages/web/src/                                                │
              │    app/**/page.tsx           ◄── prose strings (often inline)     │
              │    components/**/*.tsx       ◄── prose strings                    │
              │    lib/routes.ts             ◄── NavItem.description/tagline      │
              │    lib/messaging.ts          ◄── slider prompts, share copy      │
              │    lib/email/**/*.tsx        ◄── email subjects + body            │
              │    emails/**                 ◄── email markup                     │
              │  app/**/page.logged-out.md   ◄── auto-generated snapshots         │
              └───────────────────────────────────────────────────────────────────┘
                                                        │
                                                        ▼
                          Mike sees the drift, argues with Claude,
                          spends hours fixing or arguing for fixes.
```

**Drift cost:** every degraded paraphrase that reaches `main` is a small conversion-rate tax on treaty-vote signing (the campaign KPI). Mike's stated frustration this session: *"it takes me forever to fucking either deal with it myself or fucking argue with you to get it all fixed."*

## Proposed state (ASCII)

```
                       ┌───────────────────────────────────────────────────────────┐
                       │  CANON  (unchanged from current state)                    │
                       └────────────────────┬──────────────────────────────────────┘
                                            │
                                            ▼
              ┌───────────────────────────────────────────────────────────────────┐
              │  Claude / Codex writing copy — NOW GATED                          │
              │                                                                   │
              │  Path A: codex exec ────► enforce-manual-search-in-copy-          │
              │                          dispatch.mjs (existing) ──► BLOCKED      │
              │                                                                   │
              │  Path B: Edit/Write/MultiEdit ────► LAYER 1 (NEW)                │
              │   (Claude direct)         enforce-manual-search-on-edit.mjs       │
              │                           ──► PreToolUse: hash diff strings,      │
              │                               run mcp__optimitron-tasks__         │
              │                                 searchManual, BLOCK if no match   │
              │                               AND no centralized-module import    │
              │                                                                   │
              │  Path D: TaskCreate / Write of new                                │
              │   tool/package/script  ────► LAYER 5 (NEW)                       │
              │                          enforce-plan-first-for-new-tools.mjs    │
              │                          ──► PreToolUse: detect new-tool pattern, │
              │                              BLOCK without .claude/plans/<slug>.md│
              │                              + ## Mike approved marker            │
              │                                                                   │
              │  Path C: Mike's keyboard ────► (still ungated; trust the human)  │
              └─────────────────────────────────────────┬─────────────────────────┘
                                                        │
                                                        ▼
              ┌───────────────────────────────────────────────────────────────────┐
              │  STRUCTURAL GATES (lint-staged + pre-commit)                      │
              │                                                                   │
              │   LAYER 2 (NEW): ESLint rule `no-inline-prose-in-page-files`      │
              │   Triggers in: routes.ts, app/**/page.tsx                         │
              │   Blocks: string literals >40 chars matching multi-word prose     │
              │           UNLESS imported from messaging.ts / lib/copy/*.ts /     │
              │           centralized component module                            │
              │                                                                   │
              │   LAYER 3 (NEW): ESLint rule `no-hardcoded-numbers-in-jsx`        │
              │   Triggers in: app/**, components/**                              │
              │   Blocks: JSX text matching $[\d,]+ / \d+% / \d+ trillion etc.   │
              │           UNLESS wrapped in <ParameterValue param={X}>            │
              └─────────────────────────────────────────┬─────────────────────────┘
                                                        │
                                                        ▼
              ┌───────────────────────────────────────────────────────────────────┐
              │  PR REVIEW (Codex)                                                │
              │                                                                   │
              │   LAYER 4 (PROMPT UPDATE): augment existing review skill prompt   │
              │   For every new/modified user-facing string in the diff:          │
              │   call mcp__optimitron-tasks__searchManual; flag non-matches.     │
              └─────────────────────────────────────────┬─────────────────────────┘
                                                        │
                                                        ▼
              ┌───────────────────────────────────────────────────────────────────┐
              │  EXISTING-DRIFT CLEANUP (one-shot, separate)                      │
              │                                                                   │
              │   LAYER 6 (NEW): scripts/grep-existing-drifts.mjs                 │
              │   One-shot grep audit. No embeddings, no models. Walks copy paths,│
              │   extracts prose strings, calls searchManual on each, writes      │
              │   markdown report of likely-drifted strings with file:line refs.  │
              │   Mike + Claude walk the report, centralize the worst clusters    │
              │   via WelfareClaim-pattern components. One time.                  │
              └───────────────────────────────────────────────────────────────────┘
```

## Step list

### Layer 1 — `enforce-manual-search-on-edit.mjs` (PreToolUse hook on Edit/Write/MultiEdit)

- 1.1. Create `.claude/hooks/enforce-manual-search-on-edit.mjs` modeled on `.claude/hooks/enforce-codex-protocol.mjs:1` (~180 lines, same JSON-on-stdin / `process.exit(2)` block pattern).
- 1.2. Register in `.claude/settings.json` (or wherever hooks are registered) for `PreToolUse` on `Edit` / `Write` / `MultiEdit`.
- 1.3. Logic: parse `hookData.tool_input.file_path`. Filter to `packages/web/src/{app,components,lib/routes.ts,lib/messaging.ts,lib/email,emails}/**`. For Edit/MultiEdit: diff `old_string` vs `new_string`, extract NEW prose strings (multi-word, >40 chars). For Write: extract all prose strings. For each new prose string:
  - Skip if string matches an import or template literal that pulls from a centralized module (heuristic: surrounding 200 chars contain `from "@/components/shared/WelfareClaim"` or `from "@/lib/messaging"` or similar).
  - Skip if string is wrapped in JSX-attribute context (className, href, etc.) — not user-visible prose.
  - Otherwise: call `mcp__optimitron-tasks__searchManual` with the string content (max 200 chars sent). If top hit's score >0.7, allow with note. If 0.3-0.7, allow with warning printed to stderr. If <0.3, BLOCK with: *"no manual canon found for new prose '{first 80 chars}…' — either use existing centralized module (e.g., `<WelfareClaim />`), or cite the manual page if intentionally new copy, or prefix the user prompt with `trivial: <reason>` to bypass."*
- 1.4. Bypass: `trivial: <12+ char reason>` prefix in the user's last chat message OR a `// canon-allow: <reason>` line comment immediately above the string.
- 1.5. Self-test: write a degraded paraphrase to `routes.ts` (e.g., "spent fortunes on war"), verify hook blocks. Write the manual's canonical, verify hook allows.

### Layer 2 — ESLint rule `no-inline-prose-in-page-files`

- 2.1. Create `eslint-plugin-optimitron/` workspace (or extend existing eslint config) with custom rule.
- 2.2. Rule logic: walk the AST for `StringLiteral` and `TemplateElement` nodes. Filter by file path (only fires in `routes.ts`, `app/**/page.tsx`, `app/**/page.*.tsx`). Skip strings <40 chars. Skip strings matching `/^[A-Z_][A-Z0-9_]+$/` (constants). Skip strings inside `className`, `href`, `src`, `id`, `aria-*`. Otherwise: if string is multi-word prose (regex `/\b[A-Z][a-z]+\b.*\b[a-z]+\b/`), ERROR with: *"Inline prose forbidden in route/page files; centralize via messaging.ts, lib/copy/*.ts, or a shared component module. See WelfareClaim pattern."*
- 2.3. Allowlist exception: a top-of-file comment `/* eslint-disable optimitron/no-inline-prose-in-page-files -- <reason> */` permits per-file bypass.
- 2.4. Wire into existing `eslint.config.js` and `lint-staged` pre-commit pipeline.
- 2.5. Self-test: run on current `routes.ts` — expect violations on every NavItem description. Auto-fix is NOT possible; this is a forcing function for manual centralization.

### Layer 3 — ESLint rule `no-hardcoded-numbers-in-jsx`

- 3.1. Same plugin as layer 2.
- 3.2. Rule logic: walk JSX `JSXText` and `JSXExpressionContainer` text content. Skip if inside `<ParameterValue>` JSX element. ERROR if text matches `/(\$[\d,]+(?:\.\d+)?(?:\s*(?:million|billion|trillion|M|B|T))?|\d+(?:\.\d+)?\s*%)/` with: *"Hardcoded number in JSX; wrap in <ParameterValue param={X}> so the citation dialog renders. See packages/web/src/components/shared/ParameterValue.tsx."*
- 3.3. Allowlist exception: `{/* parameter-allow: <reason> */}` adjacent comment node.
- 3.4. Self-test: lint current `app/donate/page.tsx` and `app/treaty/page.tsx` — expect violations on dollar amounts not currently wrapped.

### Layer 4 — Augment existing Codex PR-review skill prompt

- 4.1. Locate the existing PR-review skill file (likely `~/.claude/skills/gstack/review/SKILL.md` or `.claude/skills/code-review/...`). If multiple exist, only update the one most-used for optimitron PRs.
- 4.2. Append to the skill prompt: *"For every new or modified user-facing string in this diff (specifically: changes to `packages/web/src/{app,components,lib/routes.ts,lib/messaging.ts,lib/email,emails}/**`), call `mcp__optimitron-tasks__searchManual` with the string content. Report any string that matches the manual at score <0.5 as: 'COPY-DRIFT: new string {file:line} does not match manual canon (top hit: {url} score={score}). Verify intentional, or centralize via WelfareClaim-style component.' This check runs after correctness/security review, not before."*
- 4.3. Self-test: run the updated review skill against a synthetic PR that adds a degraded paraphrase to `routes.ts`. Verify the COPY-DRIFT report is included.

### Layer 5 — `enforce-plan-first-for-new-tools.mjs` (PreToolUse hook on Write/Edit/TaskCreate)

- 5.1. Create `.claude/hooks/enforce-plan-first-for-new-tools.mjs` modeled on `.claude/hooks/enforce-codex-protocol.mjs:1`.
- 5.2. Register in `.claude/settings.json` for `PreToolUse` on `Write`, `Edit`, `MultiEdit`, `TaskCreate`.
- 5.3. Detect "new-tool work" via:
  - Write to a NEW `packages/*/src/**` directory (directory does not exist yet on disk; check via `existsSync`)
  - Write to a new `scripts/**/*.{mjs,ts,py}` file (file does not exist yet; size threshold can't be predicted, so trigger on filename pattern alone for new scripts)
  - Write to a new `.github/workflows/*.yml` file
  - Write to a new `eslint-plugin-*/` or `eslint.config.*` file with custom rule definitions
  - TaskCreate with `subject` or `description` matching `/build|implement|scaffold|create.*(tool|script|package|workflow|rule|hook)/i`
- 5.4. Block unless ONE of:
  - A plan file exists at `.claude/plans/<slug>.md` OR `~/.gstack/projects/<slug>/plans/<slug>.md` (slug = kebab of work topic) WITH a `## Mike approved` section
  - The user's last chat message contains `trivial: <12+ char reason>`
  - The Write is to one of: the plan file itself, a memory file, `MEMORY.md`, a hook file (so this hook doesn't block its own iteration)
- 5.5. Block message: *"This is new-tool / new-package work. Per `[[do-not-dissuade-autoplan-for-new-tools]]` memory: invoke `/autoplan` first to produce a plan file at `.claude/plans/<slug>.md`, run it through reviewers, get Mike to add `## Mike approved` section. Then proceed. Or prefix with `trivial: <reason>` if this is genuinely a one-file <50-line change."*
- 5.6. Self-test: try to Write a new file at `packages/copy-audit/src/embed.ts` — verify block. Try with this plan file's Mike-approved marker in place — verify allow.

### Layer 6 — `packages/web/scripts/grep-existing-drifts.mjs` (one-shot existing-drift audit)

- 6.1. Create script. Pure Node. No embeddings. No new deps.
- 6.2. Walk `packages/web/src/{app,components,lib/routes.ts,lib/messaging.ts,lib/email,emails}/**`. Extract string literals + JSX text content. Filter to multi-word prose >40 chars.
- 6.3. For each extracted string, call `mcp__optimitron-tasks__searchManual` via the existing MCP server (or fall back to fetching `https://manual.warondisease.org/assets/json/search-index.json` and doing the TF-IDF locally; the manual-search server is just a wrapper around the same index).
- 6.4. Emit `output/copy-drift-audit-{timestamp}.md`: one section per string, showing `{file:line}`, the candidate text, top 3 manual matches with scores, suggested action (`use canon X` / `intentionally new` / `centralize`).
- 6.5. Run once. Mike + Claude walk the report. Centralize the worst clusters (~10-15 expected) via `WelfareClaim`-pattern components. Then delete the script (or keep as a periodic-rerun option).

## Files to touch

| Path | Action | Layer |
|---|---|---|
| `.claude/hooks/enforce-manual-search-on-edit.mjs` | create | 1 |
| `.claude/settings.json` (or wherever hooks are configured) | edit (register hook) | 1, 5 |
| `eslint-plugin-optimitron/rules/no-inline-prose-in-page-files.js` | create | 2 |
| `eslint-plugin-optimitron/rules/no-hardcoded-numbers-in-jsx.js` | create | 3 |
| `eslint-plugin-optimitron/index.js` | create or edit | 2, 3 |
| `eslint-plugin-optimitron/package.json` | create | 2, 3 |
| `eslint.config.js` (root) | edit (add plugin + rules) | 2, 3 |
| `~/.claude/skills/gstack/review/SKILL.md` (or equivalent) | edit (append copy-drift section) | 4 |
| `.claude/hooks/enforce-plan-first-for-new-tools.mjs` | create | 5 |
| `packages/web/scripts/grep-existing-drifts.mjs` | create | 6 |
| `packages/web/package.json` | edit (add `audit:copy-drift` script) | 6 |
| `CLAUDE.md` | edit (document new hooks under Hook-enforced rules section) | 1, 5 |
| `.claude/codex-delegation.md` | edit (cross-ref the new plan-first hook + memory) | 5 |

## Risks

1. **Layer 1 false-positives.** The hook calls `searchManual` for every new prose string. If the top-hit score is below the 0.3 threshold for a genuinely-new copy line (e.g., new feature page with no manual precedent), the hook blocks legitimate work. Mitigation: the `trivial:` bypass + the `// canon-allow:` line-comment bypass. Acceptance criterion: in the first week, count the number of `trivial:` bypasses Mike has to type — if it's >5/day, the threshold is wrong.

2. **Layer 1 perf on bulk edits.** A MultiEdit touching 20 strings calls `searchManual` 20 times. The MCP call is fast (TF-IDF over a static JSON index, ~50ms) but adds latency. Mitigation: cache `searchManual` results in-memory per session, keyed by string hash. Acceptance: hook overhead <2s per Edit.

3. **Layer 2 false-positives on prose that legitimately belongs inline.** Heading text, button labels, page titles. Some of these are <40 chars (skipped) but some aren't. Mitigation: the per-file disable comment + length threshold tuning. The `routes.ts` migration will need a one-shot pass to centralize or allowlist every existing inline string.

4. **Layer 3 conflict with non-parameter numbers.** Some numbers in copy are part of a static string (e.g., year "2026", count "3" in "Three counts"). Mitigation: regex excludes single small integers; only matches money / percentages / large units. Year-numbers go to allowlist.

5. **Layer 5 over-triggers on the meta-work that builds these layers.** This plan file itself describes "create eslint-plugin-optimitron/" which would trigger Layer 5 against itself. Mitigation: Layer 5 explicitly allows Writes to hook files, plan files, memory files, MEMORY.md. The bootstrap is `trivial: implementing approved plan-file copy-drift-prevention.md layer 1 hook`.

6. **Layer 6 false sense of completeness.** Mike + Claude walk the report once, centralize ~10 clusters, declare done. Drift continues in surfaces the script didn't walk (PR descriptions, GitHub issues, OG share metadata generated at runtime). Mitigation: the report explicitly lists which paths were walked + which were not. Out-of-scope drift surfaces are flagged for layers 1+4 to catch on subsequent edits.

7. **MCP availability assumption.** Layers 1, 4, 6 all call `mcp__optimitron-tasks__searchManual`. If the MCP server is unavailable (network issue, auth expiry, server down), the hook either has to fail-open (defeats the purpose) or fail-closed (blocks all copy edits indefinitely). Mitigation per `feedback_rule_coverage_across_actors`: hook MUST have a static-fallback path that fetches `https://manual.warondisease.org/assets/json/search-index.json` directly and runs TF-IDF locally. If both fail, hook fail-closes with a clear "manual unreachable; cannot verify canon; run `mcp status optimitron-tasks` and retry" message.

8. **Codex review prompt drift.** Layer 4 augments an existing skill prompt; if Mike or another agent re-edits that skill file later, the copy-drift step might be removed. Mitigation: add a project-local `voice-critic` subagent prompt that ALSO includes the same step, so the rule lives in two places. Per `feedback_promote_violated_text_rules_to_hooks` this is also a candidate for being moved into a hook eventually.

## Research log

**Existing dispatch-time hook (the pattern to extend):**
- `.claude/hooks/enforce-codex-protocol.mjs:1` — 180 lines, JSON-on-stdin, `process.exit(2)` blocks with stderr message. Pre-existing pattern for "block dispatch unless plan-first acknowledged."
- `.claude/hooks/enforce-codex-protocol.mjs:60` — uses `[...command.matchAll(/'([\s\S]*?)'/g)]` regex which ONLY catches SINGLE-quoted prompts; double-quoted prompts produce empty `promptCandidate` and fall through to no-bypass block. **This is a known limitation — Layer 1's hook will use a more robust prompt-extraction approach (parse tool_input directly, not the bash command string).**
- `.claude/codex-delegation.md` — the doc backing the codex-protocol hook. Layer 5 will reference it for the plan-first protocol.

**Existing manual-search infrastructure:**
- `packages/web/src/lib/manual-search.server.ts` — `retrieveManualContext()` function backing both `mcp__optimitron-tasks__searchManual` and `mcp__optimitron-tasks__askWishonia`. TF-IDF over the manual + parameters.
- Static manual index endpoint: `https://manual.warondisease.org/assets/json/search-index.json` (mentioned in CLAUDE.md "Manual-search before proposing copy" as the fallback for agents without MCP access).
- Manual page format: `https://manual.warondisease.org/<path>` (confirmed by curl during 2026-05-15 office-hours phase 2.75 landscape).

**Canon source #1 (Wishonia voice + canonical phrasings):**
- `https://manual.warondisease.org/knowledge/appendix/humanity-v-government.html` — fetched 2026-05-15. Meta description: *"Three counts of negligent mass homicide against the governments of Earth. The body count, the bill, and the only remedy that works on actual humans."* H1: "Humanity v. Government." This is the canonical phrasing for the `humanityVGovernmentLink` route.
- `https://manual.warondisease.org/knowledge/strategy/humanity-todo-list.html` — fetched 2026-05-15. Meta description: *"A public accountability primitive. Named individuals and institutions are assigned specific tasks (sign the treaty, embed the widget, fund the prize pool). A live death-counter runs next to every unfulfilled task. Anonymous inaction becomes named inaction, priced in humans per day."* This is the canonical for `presidentManagementLink` / `/employees`.

**Canon source #2 (centralization patterns the project already uses):**
- `packages/web/src/components/shared/WelfareClaim.tsx:1` — current canonical example of the centralization pattern. Component composes `<ParameterValue>` for the dollar + exports `WELFARE_CLAIM_TEXT` for string-only contexts. This is the model for all future centralization.
- `packages/web/src/components/shared/WelfareClaim.core.ts` (recently extracted by the in-flight other-agent's work per Codex's read of the file) — string constants in a separate core file so they can be imported without pulling the React component into non-JSX contexts.
- `packages/data/src/parameters/parameters-calculations-citations.ts` — WHEREAS clauses are canon-by-construction for legal/treaty surfaces.

**Canon source #3 (ParameterValue component for citations):**
- `packages/web/src/components/shared/ParameterValue.tsx` — referenced by Codex CEO review on 2026-05-15. Already provides the click-to-see-source-dialog Mike wants for all numeric values. Layer 3's ESLint rule enforces its use.
- `packages/data/src/parameters/format-parameter.ts:42` — `fmtParam(param, figures)` helper used in `routes.ts` for parameter-derived strings in string-only contexts. Not relevant for Layer 3 (which fires on JSX) but relevant for Layer 2 allowlists.

**ESLint custom rule docs (third-party):**
- ESLint custom-rule-creation guide (live as of 2026): `https://eslint.org/docs/latest/extend/custom-rules` — confirmed flat-config + `meta.type: "problem"` + `create(context)` returning AST visitor pattern is the current recommended approach.
- The `no-restricted-syntax` built-in rule (`https://eslint.org/docs/latest/rules/no-restricted-syntax`) could partly substitute for Layer 2 / 3, but custom rules give better error messages and per-rule disable comments.

**Claude Code hook API:**
- Hooks receive JSON via stdin per `~/.claude/docs/hooks.md` (or the CC docs equivalent). The existing `enforce-codex-protocol.mjs` reads `hookData.tool_input.command` for Bash hooks; for Edit/Write hooks we'd read `hookData.tool_input.file_path`, `hookData.tool_input.old_string`, `hookData.tool_input.new_string`. PreToolUse hooks block via `process.exit(2)` with stderr message.
- `PreToolUse` hook registration in `.claude/settings.json` (project-local) or `~/.claude/settings.json` (user-global). For Layer 1 + 5, project-local (so the rule lives with the repo).

**Past CLAUDE.md rules this plan operationalizes:**
- CLAUDE.md "Manual-search before proposing copy" rule (existing) — Layers 1 + 4 + 6 enforce it.
- CLAUDE.md "`<ParameterValue>` for every user-facing number" rule (existing) — Layer 3 enforces it.
- CLAUDE.md "Reuse before rewrite" rule (existing) — Layer 2 enforces it for prose (forces centralization import before allowing new inline prose).

**Memory entries cited by /autoplan Phase 1 reviewers (informing this plan):**
- `feedback_fix_root_cause_not_symptom.md` — Codex CEO and Claude subagent both cited. Embedding tool is symptom; missing-hook is root cause.
- `feedback_promote_violated_text_rules_to_hooks.md` — the meta-rule that this entire plan is an instance of.
- `feedback_default_to_simplest_workflow.md` — cited by Claude subagent to argue against the embedding tool.
- `feedback_match_fix_scope_to_report_scope.md` — Mike reported one drift instance; the embedding tool was an over-built universal lint scope.
- `feedback_do_not_dissuade_autoplan_for_new_tools.md` (NEW, 2026-05-15) — Layer 5 enforces this rule at the Write/TaskCreate boundary.

## ALERTS

(empty)

## Agent log

(empty)

## Claude subagent critique (round 1)

Independent senior engineer review, 2026-05-15, no prior chat context.

**CRITICAL: Layer 1 heuristic whitelists the trigger incident.**
`routes.ts:727` is `description: \`${WELFARE_CLAIM_TEXT} Since 1900 they spent fortunes on war...\``. The file imports `WELFARE_CLAIM_TEXT` at line 25. The proposed heuristic ("skip if surrounding 200 chars contain `from "@/components/shared/WelfareClaim"`") would WHITELIST this file — the hook would **allow the exact failure mode it was designed to catch.** Fix: import-presence is necessary but not sufficient — the rule must run searchManual on the interpolated-suffix tokens regardless of imports.

**HIGH: Layer 5 `trivial:` prefix is a backdoor.** The existing `enforce-codex-protocol.mjs:67-71` regex-matches `trivial:` with zero verification that the cited plan actually approves the action. Anyone can type `trivial: implementing approved plan-file foo.md` for any work. Fix: Layer 5 must grep the referenced plan for `## Mike approved` AND verify the target write path appears in the plan's "Files to touch" table.

**HIGH: Layers not independent.** Layers 1/4/6 all share `mcp__optimitron-tasks__searchManual`. One MCP failure or scoring-threshold issue weakens three layers simultaneously. Layers 2/3 share the missing ESLint integration. Layer 5 has chicken-and-egg with Layer 1.

**HIGH: ESLint can't ship without prerequisites.** `eslint.config.mjs:5` explicitly ignores `packages/web/**`. Layer 2 cannot ship without un-ignoring web, which lights up every other ESLint rule across ~10K files. Plan calls this "one-shot pass to centralize or allowlist" but doesn't budget it (multi-day refactor with its own drift risk). Fix: ship Layer 2/3 as `warn` initially, scope strictly to `routes.ts` + `app/**/page.tsx` (NOT `components/**`), define escalation criterion.

**HIGH: MVP ordering is backwards.** Best-value-per-hour ranking: Layer 4 (30 min, prompt edit, zero risk) → Layer 6 (1 day, one-shot audit) → defer Layer 1 until evidence shows what patterns actually need write-time blocking → defer Layers 2/3 behind ESLint un-ignore prerequisite. **Layer 5 should be split to its own plan** per `feedback_match_fix_scope_to_report_scope` — it conflates copy-drift with autoplan-meta-enforcement.

**HIGH: Net friction calc not honest.** Plan adds 5 sources of friction but doesn't budget false-positive cost. Layer 1: ~500ms-2s per Edit, ~50s/day. Layer 2 false-positives on un-ignored `packages/web/**` could cost 1-2 days mechanical centralization across ~50 pages. Layer 5 ad-hoc files Mike makes all the time → high false-positive rate likely.

**MEDIUM: Test plan gaps.** Layer 1 self-test only tests positive/negative; missing bypass paths (`trivial:`, `// canon-allow:`, JSX-attribute skip, MultiEdit fan-out, MCP-down fallback, middle-of-string insertion, WELFARE_CLAIM_TEXT-interpolation case). Layer 2/3 have no `RuleTester` unit tests. Layer 5 self-test chicken-egg (writing the new file is what the hook would block).

**MEDIUM: Performance — in-memory cache is meaningless.** Hook runs as fresh node process per tool call; in-memory cache lives 1 invocation. Plan needs disk cache at `.claude/.copy-drift-cache.json`, keyed by string-hash, TTL ~1 day.

**Hidden failure modes flagged:**
- `enforce-codex-protocol.mjs:60` regex-only-catches-single-quoted-prompts limitation NOT fixed by Layer 1 (that's a separate fix; plan misleading on this)
- Layer 1 / existing-hook double-block when Claude calls Bash to run codex (no coordination)
- Layer 4 `voice-critic` backup is passive text, not deterministic enforcement (violates `feedback_promote_violated_text_rules_to_hooks`)
- Layer 6 TF-IDF inadequate for paraphrase ("spent fortunes" vs "negligent mass homicide" share few rare tokens → score <0.3 against BOTH canon and non-canon → false negatives swamp signal)

## Codex critique (round 1)

Independent senior engineer review, 2026-05-15, no prior chat context. Codex tried to `apply_patch` this section but the sandbox is read-only; appended here verbatim.

> This plan is trying to make a copy-quality problem impossible by turning every copy edit into a compliance workflow. That only works if the gates are narrow, deterministic, cheap, and correct on the trigger incident. This draft is not there yet.
>
> The layers are not independent. Layers 1, 4, and 6 all depend on the same manual-search path (`mcp__optimitron-tasks__searchManual` / static index), so one bad index, auth failure, or scoring threshold weakens three layers at once (`.claude/plans/copy-drift-prevention.md:141`, `.claude/plans/copy-drift-prevention.md:163`, `.claude/plans/copy-drift-prevention.md:187`). Layers 2 and 3 also share the same currently-missing ESLint integration. Layer 5 creates a bootstrap hazard: it exempts hook files, but it still detects new ESLint/plugin/script work and requires a Mike-approved plan marker. That is fine after approval, but its own self-test is chicken-and-egg until the approval marker exists.
>
> Layer 1 does not actually prove it catches the incident. The current trigger string is a template-literal suffix after centralized canon: `routes.ts` imports `WELFARE_CLAIM_TEXT` from `WelfareClaim.core` (`packages/web/src/lib/routes.ts:25`) and then appends "Since 1900..." in the same template literal (`packages/web/src/lib/routes.ts:727`). The proposed skip says "surrounding 200 chars contain `from "@/components/shared/WelfareClaim"`". If that check is truly local, it misses the import because the import is 700 lines away and the actual path is `WelfareClaim.core`; if it becomes file-level, it whitelists the exact drifted suffix. Either way, the centralization heuristic is unsafe. It must validate each literal segment after each interpolation, not the whole template or file.
>
> Layer 1 also under-specifies real edit shapes. MultiEdit is not a single `old_string` / `new_string` pair in practice, but the plan describes it that way. A 50-sentence Write should not produce 50 independent MCP calls under a 3s hook timeout; `.claude/settings.json` already runs fresh Node processes with 3s timeouts for similar hooks (`.claude/settings.json:59`, `.claude/settings.json:64`). The "in-memory per session" cache is meaningless because every hook invocation is a new process. Use a disk cache for the manual index and batch local TF-IDF checks.
>
> Layer 2 should not ship as error on day one. Simulating the proposed length/regex gate on current `routes.ts` produced about **106 current candidates: 88 double-quoted strings plus 18 template-literal strings**. Examples include OG alt text (`packages/web/src/lib/routes.ts:55`), the home route description (`packages/web/src/lib/routes.ts:197`), parameter-derived treaty copy (`packages/web/src/lib/routes.ts:694`), and social-preview copy (`packages/web/src/lib/routes.ts:733`). The plan says this "will need a one-shot pass" but does not budget it. It also ignores current wiring: root ESLint excludes `packages/web/**` (`eslint.config.mjs:5`), root lint only targets `packages/*/src/**/*.ts` (`package.json:20`), and **lint-staged only sees `.ts`, not `.tsx`** (`package.json:50`).
>
> Layer 3 has immediate false positives on the current donate page. The three hardcoded matches are all "1% Treaty" branding/name text (`packages/web/src/app/donate/page.tsx:43`, `packages/web/src/app/donate/page.tsx:69`, `packages/web/src/app/donate/page.tsx:111`). The real numeric claims on the page are already parameter-backed. This rule must start as warn/report.
>
> The test plan is too thin. There is no RuleTester suite for the ESLint rules and no stdin-fixture tests for hook JSON. Add cases for import declarations, href/src/className skips, template-literal quasis, `WelfareClaim.core` suffix drift, `ParameterValue` descendants, adjacent allow comments, MultiEdit arrays, middle insertions, MCP unavailable, disk-cache fallback, 50 strings, and Layer 5 writing its own hook. Also fix existing Bash prompt extraction: **both current hooks only parse single-quoted prompts** (`.claude/hooks/enforce-codex-protocol.mjs:61`, `.claude/hooks/enforce-manual-search-in-copy-dispatch.mjs:74`).
>
> Layer 4 is not a reliable backstop. The plan wants to update a review skill prompt, and the risk mitigation suggests a `voice-critic` subagent backup, but subagents/skills are discretionary workflow, not deterministic enforcement (`CLAUDE.md:67`). Layer 6 is useful as inventory, but TF-IDF is weak for paraphrase detection; the incident itself is a semantic paraphrase with different wording. Treat Layer 6 as an audit queue, not proof that drift is gone.
>
> MVP recommendation: do not ship all five friction sources at once. First ship Layer 6 as a one-shot report plus a deterministic PR/diff audit in warn mode, fix the existing double-quote prompt parsing, and add a disk-cached manual-index helper. Then run Layer 2/3 as warning-only to measure noise and cleanup cost. Only after that data should Layer 1 block writes. Otherwise Mike trades hours fixing drift for hours fighting hooks, lint errors, bypass comments, and bot-review flags.

## Dual-voice consensus

Both reviewers (Claude subagent + Codex), independently, reached the same conclusions:

| Finding | Subagent | Codex | Consensus |
|---|---|---|---|
| Layer 1 import-heuristic whitelists trigger incident (CRITICAL) | ✅ | ✅ | **CONFIRMED** — fatal bug; redesign required |
| Layers 1/4/6 share single MCP dependency | ✅ | ✅ | **CONFIRMED** — not independent |
| ESLint un-ignore prerequisite not budgeted (~106 violations in routes.ts alone) | ✅ | ✅ | **CONFIRMED** — multi-day cleanup |
| Layer 3 false-positives on "1% Treaty" branding | ✅ | ✅ | **CONFIRMED** — must start as warn |
| MCP-down fail-closed is wrong (offline work) | ✅ | implied via disk-cache requirement | **CONFIRMED** — fail-open with audit log |
| No persistent cache (fresh-process hook) | ✅ | ✅ | **CONFIRMED** — needs disk cache |
| Layer 4 voice-critic backup is hand-waving | ✅ | ✅ | **CONFIRMED** — drop or replace with hook |
| Layer 6 TF-IDF inadequate for paraphrase | ✅ | ✅ | **CONFIRMED** — treat as audit queue, not proof |
| MVP ordering backwards: ship Layer 4 + 6 first | ✅ | ✅ | **CONFIRMED** — defer 1/2/3 behind evidence |
| Layer 5 should split to own plan | ✅ | indirectly (bootstrap hazard) | Subagent strong, Codex weak — surface as taste decision |
| `enforce-codex-protocol.mjs:60` single-quote-only limitation NOT fixed by Layer 1 | ✅ | ✅ + Codex also flagged `enforce-manual-search-in-copy-dispatch.mjs:74` has SAME bug | **CONFIRMED** — separate fix prereq; existing hook bug bigger than plan acknowledged |
| Test plan missing RuleTester + hook fixtures | ✅ | ✅ | **CONFIRMED** — add unit-test scaffolding |
| `lint-staged` only sees `.ts` not `.tsx` (per `package.json:50`) | — | ✅ | Codex caught alone — plan blind spot |
| Root lint scope only `packages/*/src/**/*.ts` (`package.json:20`) | — | ✅ | Codex caught alone — plan blind spot |
| Layer 5 `trivial:` prefix backdoor (no plan-slug verification) | ✅ | — | Subagent caught alone — hook needs hardening |

## Revised MVP — based on dual-voice consensus

Shipping order changes from `1 → 2 → 3 → 4 → 5 → 6` to:

**Phase A (this week, ~1 day):**
1. **Pre-req fix:** Patch existing `enforce-codex-protocol.mjs:61` AND `enforce-manual-search-in-copy-dispatch.mjs:74` to extract prompts from both single AND double-quoted bash args. (~1 hour) — closes the existing single-quote-only loophole that the new Layer 1 work would otherwise inherit.
2. **Layer 4:** Augment existing Codex PR-review skill prompt with copy-drift check. (~30 min) — catches drift at the surface Mike currently sees it.
3. **Layer 6:** One-shot existing-drift audit script, run once, treated as **audit queue** not proof of completeness. TF-IDF will produce false negatives on paraphrase — output is "novel — verify intent" labels, not "drift gone" assertions. (~1 day)

**Phase B (next week, ~2 days, if Phase A surfaces new drift):**
4. **Layer 1 (redesigned):** Per-template-literal-segment validation (NOT file-level or surrounding-200-chars heuristic). Disk-cached manual index (`.claude/.copy-drift-cache.json`, 1-day TTL). Fail-OPEN on MCP-down with audit log. Batch parallel `searchManual` with concurrency 5. RuleTester-equivalent unit-test scaffold with all bypass-path coverage.

**Phase C (deferred, behind explicit Mike-approved scope):**
5. **Layers 2/3 (ESLint rules):** Requires prereq: un-ignore `packages/web/**` in `eslint.config.mjs:5`, widen `package.json:20` lint scope to include `.tsx`, widen `package.json:50` lint-staged to include `.tsx`. Then estimated 1-2 days of mechanical centralization of ~106 existing violations in `routes.ts` alone (more across `app/**/page.tsx`). Ship rules as `warn` initially, escalation to `error` when warnings count <20.
6. **Layer 5 (split to own plan):** Conflates copy-drift with autoplan-meta-enforcement. Move to a separate plan file `.claude/plans/plan-first-for-new-tools.md` with its own approval cycle.

**Removed from this plan:**
- Layer 5 entirely → new plan
- Layer 4 `voice-critic` backup → drop (passive text, not enforcement)
- Layer 1 surrounding-200-chars-import-skip heuristic → replaced with per-segment validation

**Total Phase A budget: ~1 day** (vs ~3 days for the original 5-layer ship-everything-at-once). Phase B/C gated on Phase A evidence — concrete failure data before adding write-time friction.

## Claude subagent critique (round 2)

Second-pass independent CEO/strategist review, 2026-05-15, no prior chat context. Re-derived the round-1 findings independently AND pushed further into a strategic reframe.

**CRITICAL — wrong problem, or at least wrong framing.** Six gates can't beat one good import. The actual incident is that the canonical "Three counts of negligent mass homicide" phrasing sits unimported in a manual page nobody's code reads. The agent reached for invention because the canon wasn't on the path of least resistance.

**Strategic reframe proposed.** Build `packages/web/src/lib/copy/canon.ts` exporting `WELFARE_CLAIM`, `HUMANITY_V_GOVERNMENT_TAGLINE`, `EMPLOYEES_TAGLINE`, etc., sourced from the manual at build time (or hand-mirrored with `// canon-source: <url>` comments). Then a single ESLint rule: long string literals in `routes.ts` / `app/**/page.tsx` must be imported from `lib/copy/` or carry `// canon-allow: <url>`. **One layer replaces 1, 2, 4, 6** and eliminates the entire MCP-dependency / TF-IDF-paraphrase-detection problem the round-1 consensus already flagged as broken.

**HIGH — unmeasured premises driving design.** The plan asserts drift "is a small conversion-rate tax on treaty-vote signing" but cites zero conversion data. Mike's actual stated cost was *his own time arguing* — a labor cost, not a campaign KPI cost. State explicitly: "Primary KPI: Mike's hours spent re-litigating copy." Drop the conversion-rate framing until measured.

**HIGH — six-month regret scenarios.**
- **Treaty stalls and pivots copy strategy:** the hooks fight every iteration. Mike's `trivial:` usage hits 20/day, hooks disabled, infra rots.
- **Treaty fails:** Mike spent the week before launch building ESLint rules instead of recruiting plaintiffs / chasing signatures. **The actual regret.**
- **Treaty passes:** the six layers are dead weight on a maintenance codebase.

**HIGH — alternatives never considered.** Plan jumped from "embedding tool (killed)" to "six hooks." Missing:
- Auto-inject manual context into every Claude session-start via `SessionStart` hook (prevention not detection; no per-edit latency).
- Generate `lib/copy/` from the manual at build time. Canon becomes a typed import. Drift becomes a type error.
- "Canon ratchet" in CI: maintain `canon.json` of file→canonical-text pairs; CI fails if a file's text moves further from the recorded canon (Levenshtein, not embeddings).
- Just centralize the worst 10 strings via WelfareClaim pattern (already in flight per git status). Stop there.

**HIGH — Layer 5 must be removed entirely, not deferred inside.** Round-1 consensus already said split. Split-deferral that lives in the same plan file gets re-litigated. Delete from this plan outright before approval.

**MEDIUM — cross-actor coverage gaps.** Plan covers Claude (Edit/Write) and Codex (dispatch + PR review). Does not cover Cursor, OpenClaw/GPT, human contributors via VS Code, GitHub web editor. The ONLY actor-independent enforcement layer is CI. Move ESLint rules + deterministic copy-diff check to CI. The Claude-specific PreToolUse hook is at best a fast-feedback dev aid, not the primary gate.

**Verdict.** Ship with major revisions — and only Phase A. Before greenlighting Phase B/C, write a 1-page counter-design proposing canon-as-TypeScript-module + one ESLint import-rule. If that counter-design loses on the merits, fine, proceed. If it wins, save 2-3 days of hook engineering and get a stronger gate (compile-time type error beats runtime hook every day). Layer 5 deleted from this plan entirely. Success metric: "Mike's hours arguing about copy go down," measured weekly — not "six layers shipped."

## Codex critique (round 2)

Second-pass adversarial CEO review, 2026-05-15. Re-derived round-1 findings AND pushed further to a strategic reframe.

> **Verdict: kill this plan as written.** Ship a smaller replacement: **canon-as-TypeScript plus CI lint**.
>
> The plan assumes the bottleneck is "agents paraphrase canon during edits." That is unproven. The more likely bottleneck is that canon is not easy to import. If the correct phrase lives in a manual page, an MCP search result, or tribal memory, every writer is forced to become a copy retrieval system. That guarantees drift. The fix is not six enforcement layers. The fix is to make canonical campaign copy a first-class TypeScript module with named exports, then forbid long public prose unless imported from approved copy modules.
>
> The plan's unmeasured premises are doing too much work: how many vote-conversion losses come from paraphrased nav descriptions, how often agents edit those strings, how often Mike or humans do, how many false positives hooks would create, how stale the manual canon is, and whether searchManual similarity scores correlate with "good copy." None of that is measured. The plan converts one painful incident into a compliance architecture.
>
> A `packages/web/src/lib/copy/campaign.ts` module with exports like `HUMANITY_V_GOVERNMENT_DESCRIPTION`, plus a single ESLint rule in CI that says "public long-form prose in route/page/component/email files must come from approved copy modules" would replace most of Layers 1, 2, 4, and 6. It also covers Claude, Codex, Cursor, OpenClaw, Mike's keyboard, and outside PR contributors. Claude-only hooks cover the least reliable boundary: one editor's tool path. CI covers the merge boundary. That is the correct enforcement point.
>
> Layer 3 is related but separate: parameter-backed numbers are a data provenance problem, not canon prose drift. Keep it as a warning/report rule after measuring current violations. Do not bundle it into the copy plan.
>
> Layer 5 does not belong here. Plan-first-for-new-tools is governance for agent workflow. Copy drift is product copy integrity. Bundling them makes the plan look like a response to "today was annoying" rather than a focused conversion-risk fix. Split it or kill it.
>
> Six-month regret scenarios. **If the treaty campaign takes off,** this plan becomes a drag. More contributors, more rapid copy iteration, more partner-specific surfaces. Claude-only hooks and searchManual gates slow the people closest to distribution while still letting non-Claude paths through until CI catches them late, if at all. **If the campaign stalls,** this plan burns scarce founder/agent time on preventing marginal copy drift instead of testing vote flow, share conversion, org embedding, plaintiff onboarding, and message propagation. **If the treaty passes or gets major institutional traction,** the canon will change fast. Manual-search-based enforcement will fight legitimate evolution unless the canon source is importable, reviewable, versioned, and tested like product code.
>
> This also violates Mike's default-to-simplest-workflow rule. The simplest durable workflow is: canonical copy lives in TS, public UI imports it, CI rejects unapproved long prose, copy preview shows diffs. Add write-time hooks only after CI data proves late failures are frequent enough to justify editor friction.
>
> **Kill the six-layer plan.** Replace with one narrow plan: create canonical TS copy modules for the worst campaign surfaces, add one CI ESLint rule forbidding non-imported long public prose, run a one-shot report to migrate existing offenders, and leave agent-hook theater out until there is measured evidence it is needed.

## Dual-voice consensus (round 2)

Both round-2 reviewers (Claude subagent + Codex), independently, converged on a strategic reframe that goes BEYOND the round-1 Revised MVP:

| Round-2 finding | Subagent | Codex | Consensus |
|---|---|---|---|
| **KILL the 6-layer plan as written** | ✅ | ✅ | **CONFIRMED — both vote kill** |
| **Reframe: canon-as-TypeScript-module is the missing layer** | ✅ (`packages/web/src/lib/copy/canon.ts`) | ✅ (`packages/web/src/lib/copy/campaign.ts`) | **CONFIRMED — replaces Layers 1, 2, 4, 6** |
| Single CI ESLint rule beats Claude-only PreToolUse hooks (cross-actor coverage) | ✅ | ✅ | **CONFIRMED — CI is the correct enforcement point** |
| Layer 5 must be DELETED entirely from this plan (round-1 said "split" — round-2 says delete and start a separate plan if needed) | ✅ | ✅ | **CONFIRMED — Layer 5 unrelated to copy integrity** |
| Layer 3 (parameter numbers) is a separate provenance problem | weak | ✅ | Codex strong, subagent weak — keep as separate concern |
| Premise unmeasured: drift cost is "Mike's hours arguing", not treaty-vote conversion | ✅ | ✅ | **CONFIRMED — restate success metric** |
| 6-month regret: any treaty outcome punishes this infra | ✅ | ✅ | **CONFIRMED — opportunity cost too high during campaign window** |
| Mike's `feedback_default_to_simplest_workflow.md` violated even by Revised MVP | ✅ | ✅ | **CONFIRMED — Phase A is closer but still misses the canon-as-TS reframe** |

## ⚠️ USER CHALLENGE — Phase 4 final approval needs Mike's call

The round-1 Revised MVP (Phase A/B/C) is what the plan currently proposes. Round-2 dual-voice review **independently rejects even the Revised MVP** and proposes a different first step: build `packages/web/src/lib/copy/canon.ts` + add ONE CI ESLint rule that forbids long public prose unless imported from `lib/copy/`.

Mike's three options at the final gate:

**Option A — Accept the round-2 reframe.** Replace the entire plan with:
1. Create `packages/web/src/lib/copy/` with TypeScript exports for the canonical strings (Humanity v. Government tagline, Welfare claim text, Employees tagline, Three counts of negligent mass homicide, etc.) — seeded from the manual.
2. Add one ESLint rule: in `routes.ts` / `app/**/page.tsx` / `components/**/*.tsx` / `lib/email/**` / `emails/**`, string literals >40 chars matching prose pattern must be imported from `@/lib/copy/`. Run as `warn` initially, escalate to `error` after migration.
3. Migrate the ~10 worst clusters of existing inline prose into `lib/copy/`. Use existing WelfareClaim-pattern centralization.
4. Drop everything else (Layers 1, 2, 3, 4, 5, 6 as written). ~1 day work. Covers all actors (Claude, Codex, Cursor, OpenClaw, humans, PR contributors) at the CI boundary.

**Option B — Keep the Revised MVP (round-1 consensus).** Phase A this week (fix hook double-quote bug + Layer 4 + Layer 6), Phase B if Phase A surfaces new drift, Phase C deferred. Both rounds confirmed Phase A is non-controversial; round-2 just thinks Option A's canon-as-TS step should precede Phase B.

**Option C — Hybrid.** Ship Phase A (cheap, non-controversial) AND start building `lib/copy/canon.ts` concurrently. Defer Phase B/C until canon-as-TS-module is in place and we have data on whether CI alone is sufficient.

**Recommendation: Option C.** Phase A is 1 day, low risk, captures most of the value (PR-review skill + audit script). Canon-as-TS-module is the strategic reframe both round-2 reviewers converge on. Option B alone misses the reframe; Option A throws away Phase A's cheap wins. Option C does both.

## Eng review — Claude subagent (round 2)

Independent senior engineer review, 2026-05-15. Read the plan + the two enforcement hooks + `eslint.config.mjs` + `package.json` + `WelfareClaim.tsx`.

**Architecture findings**

- **HIGH — plan understates Layer 1 effort by ~3x.** "Per-template-literal-segment validation" is implementable but the plan doesn't name the AST parser. In a 3s PreToolUse process you need a parser that boots <300ms. Right answer: bundle `@babel/parser` + `@babel/traverse` (~2MB devDep), walk `TemplateLiteral.quasis[]` (each `TemplateElement.value.cooked` is your candidate), validate each cooked chunk independently. This is ~400 lines, not the "~180 lines modeled on enforce-codex-protocol" the plan claims. Budget Layer 1 at 2 days minimum, not 1.

- **MEDIUM — disk cache concurrency.** `.claude/.copy-drift-cache.json` plus parallel hook invocations = torn writes. FIX: sharded files keyed by hash prefix (`.claude/.copy-drift-cache/ab/abc123.json`) — no lock needed because each key writes its own file. Simpler than `proper-lockfile`.

- **CRITICAL — un-ignoring `packages/web/**` in `eslint.config.mjs:5` blast radius is far worse than plan states.** `recommendedTypeChecked` is on → `no-floating-promises`, `no-misused-promises`, `no-unsafe-*` cascade across every React component with `onClick={async () => ...}`, every `fetch().then()`, every Prisma call with implicit `any`. Not "lights up ESLint" but hundreds-to-thousands of errors. The plan's "1-2 day mechanical centralization" budget evaporates. FIX: don't un-ignore globally — add a second `tseslint.config()` entry scoped explicitly to `packages/web/src/lib/routes.ts` + `packages/web/src/app/**/page.tsx` with ONLY the custom plugin rules. 5-line config change, not a 2-day refactor.

- **HIGH — Round-2 reframe's "long prose vs incidental long string" distinction is the rule's correctness gate.** A length+prose-regex rule false-positives on OG image alt-text URLs, `aria-label` text, error messages, SQL fragments. FIX: AST rule = `StringLiteral` / `TemplateLiteral` where (a) parent is NOT `JSXAttribute` with name in `{className,href,src,id,alt,aria-*,type,role,name,key,htmlFor}`, (b) parent is NOT `Import`/`Export`, (c) parent is NOT `CallExpression` to known-allow functions (`fetch`, `URL`, `new RegExp`, `console.*`), (d) length ≥80 chars (not 40), (e) contains ≥2 sentence terminators OR ≥10 words. Even so expect ~20% false-positive rate → ship as `warn`, not `error`.

**Test plan findings**

- **MEDIUM — RuleTester scaffolding missing.** Required `valid`/`invalid` fixtures: import declarations (valid), href/src/className skips, template-literal quasis, the trigger incident itself (must FAIL — `description: \`${WELFARE_CLAIM_TEXT} drifted suffix...\``), ParameterValue descendants, adjacent allow comments, JSX text nodes. 12 cases minimum.

- **MEDIUM — hook integration tests missing.** Need `vitest` + `execa` running hook scripts with piped stdin: Edit, Write, MultiEdit array, MCP-unreachable, MCP-slow, disk-cache corrupted, concurrent invocations. 8-10 fixtures.

- **HIGH — canon migration silent breakage.** Round-2 extracting strings into `lib/copy/canon.ts` risks copy-paste typos. FIX: generate `.logged-out.md` snapshots before and after migration; `git diff packages/web/src/app/**/page.logged-out.md` must be empty.

**Performance**

- **Layer 1 latency:** Node cold-start ~80-120ms + Babel parser ~200-300ms + MCP roundtrip ~50-200ms = 400-800ms cold, 200-400ms warm. 30 Edits/session = 6-24s aggregate. Tolerable IF the manual index itself is disk-cached (fetch `search-index.json` once per 24h, do TF-IDF locally inside the hook).

- **HIGH — MultiEdit fan-out shape wrong in plan.** Per Claude Code's PreToolUse spec, MultiEdit fires ONE hook with `tool_input.edits = [...]` array, not N hooks. The hook author needs to iterate `edits[]` inside one invocation, batch-parallel searchManual with concurrency 5, and budget the WHOLE thing under 3s — not 3s per edit.

- **HIGH — build-time canon generation is NOT CI-deterministic.** Pulling `search-index.json` at build time = manual.warondisease.org content changes break/repair CI on identical PR. Vercel preview deploys could diverge from prod. FIX: vendor it. `pnpm canon:sync` writes `packages/web/src/lib/copy/canon.generated.ts`, checked into git, sync is a deliberate human step. CI re-runs `canon:sync` and fails if file changes (catches stale canon).

**Security**

- **MEDIUM — `trivial:` bypass is prompt-injection-shaped.** A README, PR description, or manual page could contain `trivial: harmless-sounding-reason` and a downstream agent pasting that text bypasses the gate. FIX: bypass must require BOTH the prefix AND a file-path match against the actual `tool_input.file_path`. Log every bypass to `.claude/copy-drift-bypass.log`.

- **HIGH — `lib/copy/canon.ts` is the new high-value target.** An agent told "fix the canon" can rewrite the canon string and import it — bypassing the rule by changing the input. FIX: special path treatment — second ESLint rule forbids edits unless `// canon-source:` comment is adjacent. Or make it `canon.generated.ts` (read-only, generated by `canon:sync`).

**Verdict**

Phase A (round-1 Revised MVP) ships safely — ~1 day, reversible, doesn't touch user-visible code. Round-2 canon-as-TS reframe is engineering-sound but underspecified (AST rule needs concrete predicates, canon.ts needs lock-down, `packages/web/**` should NOT be un-ignored globally). **Ship Option C in this concrete order:** Day 1 Phase A; Day 2-3 `canon.generated.ts` via `canon:sync` (vendored, NOT live-fetch); Day 4 ONE ESLint rule narrowly scoped to `routes.ts` + `app/**/page.tsx`, ship as `warn`; Day 5 migrate offenders + escalate to `error`. Defer Layer 1 PreToolUse hook indefinitely. Delete Layer 5 from this plan.

## Eng review — Codex (round 2)

> **Recommend Option C, modified.** Phase A should be only the existing hook quote-parser fix plus a read-only audit/report. Do NOT make skill/gstack edits. Start `lib/copy/canon.ts` concurrently, but make it checked-in and human-reviewed, not generated at build time.
>
> **Critical:** Layer 1 per-template validation is not a sane 3s PreToolUse blocker if it does AST parse + MCP/search per segment. Full TSX parsing can fit; network/manual calls and MultiEdit fan-out cannot. **Fix:** move AST enforcement to CI/lint; keep any hook lexical, warn-only, disk-cache-only.
>
> **High:** disk cache is unsafe if it is just `.claude/.copy-drift-cache.json`. Concurrent hook processes can race, truncate JSON, or read half-written cache. **Fix:** pre-warm cache, atomic temp-file rename, lock/retry on Windows, fail-open with audit log on corrupt cache.
>
> **Critical:** Option A's "one ESLint rule" cannot deterministically distinguish canonical prose from incidental long strings across URLs, SQL, JSON, errors, diagnostics, and metadata. AST knows syntax, not intent. **Fix:** scope rule to known public-copy positions: JSX text, route `description`/`tagline`/`cta`, metadata fields, email subject/body. Skip obvious URLs and non-public files. Start warn-only.
>
> **High:** un-ignoring `packages/web/**` in root `eslint.config.mjs` is a trap. Root lint currently excludes web, root `lint` only targets `.ts`, and lint-staged misses `.tsx`. Turning web on under the root type-aware config will surface unrelated workspace noise before copy enforcement. **Fix:** dedicated web copy-lint config/script first; do not un-ignore all web under root ESLint as a prerequisite.
>
> **Medium:** Phase A hook parser patches should not break `copy:preview` if done narrowly. `copy:preview` is a `pnpm` command, existing hooks skip first-token `pnpm`; generated snapshots are written by the renderer, not Claude Edit/Write. **Fix:** preserve first-token skip before parsing; add fixture tests for `pnpm --filter @optimitron/web copy:preview -- --routes=/...`.
>
> **Critical:** build-time canon generation from `manual.warondisease.org/assets/json/search-index.json` is not CI-deterministic. The remote index can change, fail, reorder, or drift mid-build. **Fix:** checked-in canon TS with `canonSource` URL/hash/date comments; separate `sync:canon` command opens a diff for review.
>
> **High:** Option B's Revised MVP still spends effort on discretionary review prompts and MCP similarity scoring. That catches some drift but does not make correct copy easy to import. **Fix:** use audit output to choose migration targets, not as an enforcement architecture.
>
> **High:** Option A oversells "type error." TS will not know a literal is bad prose. The durable gate is lint plus imports, not typechecking. **Fix:** call it a CI copy-policy violation and design it with measured false-positive budgets.
>
> **Option C, modified.** Keep the cheap existing-hook repair, run a one-shot audit to seed the migration queue, and build the checked-in canon TS module plus targeted warn-only copy lint. Kill Phase B write-time blocking unless CI data proves late failures are frequent enough to justify editor friction.

## Eng dual-voice consensus (round 2)

| Finding | Subagent | Codex | Consensus |
|---|---|---|---|
| **Option C is the right call, modified from the bare Option C in plan** | ✅ | ✅ | **CONFIRMED — narrow Phase A, build canon.ts concurrent, defer write-time Layer 1** |
| canon.ts is **CHECKED IN, NOT build-time generated** (CI determinism) | ✅ (canon.generated.ts via canon:sync) | ✅ (human-reviewed, canon-source comments) | **CONFIRMED — but minor disagreement on auto-sync vs hand-curated** |
| Do NOT un-ignore `packages/web/**` in `eslint.config.mjs:5`; scope ESLint config to routes.ts + app/**/page.tsx only | ✅ | ✅ | **CONFIRMED — narrow tseslint.config() entry** |
| ESLint rule must use AST predicates (parent type, JSXAttribute skips, length ≥80, ≥10 words / ≥2 sentence terminators) | ✅ (concrete predicate list) | ✅ (scope to copy positions) | **CONFIRMED — both gave AST predicates; ship as `warn`** |
| Layer 1 AST-parse + MCP per template segment is too expensive for 3s PreToolUse | ✅ (~400 lines, 2-day budget) | ✅ (move to CI/lint, keep hook lexical/warn-only) | **CONFIRMED — Layer 1 as designed is over-budget** |
| MultiEdit fires ONE hook invocation with `edits` array (plan misdescribes shape) | ✅ | implied | **CONFIRMED — iterate edits[] within one invocation** |
| Disk cache needs sharded files OR atomic-rename + lock; flat JSON unsafe | ✅ (sharded) | ✅ (atomic-rename, lock, fail-open) | **CONFIRMED — flat JSON unsafe** |
| Canon migration must verify no rendered-output change via `.logged-out.md` diff | ✅ | implied | **CONFIRMED — use existing snapshot infra** |
| `lib/copy/canon.ts` itself is a new attack surface; lock it down | ✅ (special-path rule) | implied (human-reviewed, canon-source comments) | **CONFIRMED — canon.ts edits gated separately** |
| `trivial:` bypass prompt-injection-shaped; tie to file-path match | ✅ | — | Subagent caught alone — hook hardening needed |
| Phase A hook patches reversible, don't break `pnpm copy:preview` | ✅ | ✅ | **CONFIRMED — Phase A safe** |
| Option A's "type error" framing oversells what TS can detect | implied | ✅ | Codex strong — frame as CI copy-policy, not typechecking |

**Codex narrowed Phase A further:** "Phase A should be ONLY the existing hook quote-parser fix plus a read-only audit/report. Do NOT make skill/gstack edits." This drops Layer 4 (PR-review skill prompt augment) from Phase A. Subagent kept Layer 4 in Phase A. → Taste decision for the final gate.

## DX review — Claude subagent (round 2)

DX target users: AI agents (Claude Code, Codex, Cursor, OpenClaw) AND humans. Block messages, bypass mechanics, error formats ARE the DX surface.

**Scores (out of 10):**
| Option | DX | Reason |
|---|---|---|
| **A — canon-as-TS + 1 CI rule** | **8.5** | Single mental model. CI catches all actors. Best TTHW. |
| B — Revised MVP (audit + PR-skill) | 4 | Diagnostics not enforcement; drift still ships through. |
| C — Hybrid | 7 | Best if Phase A narrowed to ONLY the hook quote-fix; worse if Layer 4 PR-skill bundled. |

**TTHW:** Option A — agent edits, ESLint LSP underlines (humans <30s in editor), CI fails (agents next cycle, 5-10 min, then <60s on retry). Option B — agent doesn't notice until human reviews PR (skills are discretionary per CLAUDE.md:67). Option C — same as A after canon-as-TS lands, but drift ships during the gap.

**Bypass surface fragmentation (CRITICAL).** The original 6-layer plan introduces FIVE escape syntaxes: `trivial:` prompt prefix, `// canon-allow:` line comment, `/* eslint-disable ... */` file-level disable, `{/* parameter-allow: */}` JSX comment, `## Mike approved` plan-file section. Five distinct mental models. Not guessable, not discoverable from any one block message. Option A collapses to ~2 (`// canon-allow:` inline + `eslint-disable` file). 9/10 vs 3/10 for B.

**Block-message quality.** Option A's ESLint message ("Inline prose forbidden in route/page files; centralize via messaging.ts...") scores 6/10 — missing the actual available exports. Adding `"Available canon exports: WELFARE_CLAIM, HUMANITY_V_GOVERNMENT_DESCRIPTION, EMPLOYEES_TAGLINE. See packages/web/src/lib/copy/canon.ts:1."` lifts it to 9/10. Concrete improvement.

**Docs scalability.** CLAUDE.md "Hook-enforced rules" is one paragraph today. Adding 5 layers each with block message + bypass syntax + scope makes it a 200-line table. Pattern doesn't scale. Option A's single rule fits in 2 lines.

**Migration / loosening.** Option A: edit `eslint.config.mjs`, change `error` to `warn`, push. One file, reviewable, versioned. Option B: 3 config locations (hook scripts + skill prompt + audit script).

**Cross-platform tooling.** Option B's flat disk cache `.claude/.copy-drift-cache.json` has Windows concurrent-write issues + not `.gitignore`'d in plan. Option A's only artifact is `canon.ts` — OS-neutral, deterministic.

**Reusability.** Option A's pattern (`lib/copy/` + ESLint rule "long prose must be imported from approved modules") is portable to any product. Could be a published `eslint-plugin-copy-canon`. Option B is glued to Wishonia + manual.warondisease.org + MCP.

**Measurement.** Both CEO rounds named the metric: "Mike's hours spent re-litigating copy" — weekly. Option A measures via `git log --grep "drift" | wc`. Option B needs bypass-count log + false-positive log + hook-overhead histogram + MCP-uptime. Three dashboards Mike won't build.

**Recommendation: Option A modified** — `packages/web/src/lib/copy/canon.ts` hand-curated with `// canon-source: <url>` comments, checked in (NOT generated). ONE ESLint rule via narrow `tseslint.config()` entry scoped to `routes.ts` + `app/**/page.tsx` + `lib/email/**`. Ship as `warn`, escalate to `error` after `.logged-out.md` snapshot diff is clean. Block message names the available exports. Drop Layer 4 PR-skill augment from Phase A — skills decay, and you now have CI. Keep the hook quote-fix itself (1hr pre-req).

**Friction-asymmetry mitigation:** add `pnpm lint:copy` available in a pre-edit hook for AI agents — lexical scan only (<100ms, no AST parse, no MCP), so agents see the block at edit time without burning the 3s PreToolUse budget. Same rule, two delivery surfaces, one source of truth.

## DX review — Codex (round 2)

> **DX verdict: Option C, modified.** The default gate should be boring, actor-independent CI/lint. Write-time hooks should be fast feedback only after data proves late CI failures are common enough to justify blocking edits.
>
> **TTHW:** for an AI agent hitting the first block, target is <30 seconds. Layer 1 hits that only if the block names: exact string, exact file, canonical import/example, and exact bypass syntax. The current Layer 1 message makes the agent infer whether to use `WelfareClaim`, `messaging.ts`, `lib/copy`, a manual URL, or `trivial:`. In practice: 20-40s for a careful agent, longer if MCP is down. Humans slower because hook errors during editor actions are less expected than CI lint failures.
>
> **Block-message score:** Layer 1 is **6.5/10**. Problem statement 8, cause 6 (score <0.3 is hidden, similarity failure ≠ bad copy), concrete fix 7 (too many choices), escape hatch 8, docs link 2. Layer 5 is **5/10** — unrelated governance block inside a copy plan, will feel arbitrary.
>
> **Bypass surface is not defensible as written.** `trivial:`, `// canon-allow:`, `eslint-disable`, `## Mike approved` are four mental models: prompt prefix, source comment, linter pragma, plan approval marker. Fragmentation. Keep two escape classes: local source-level allow (with reason + source URL), and plan-level approval for broad migrations. Do not use `trivial:` for copy canon — too easy for agents to overuse, too invisible in code review.
>
> **Docs scalability weak.** A CLAUDE.md "Hook-enforced rules" section updated by Layers 1 and 5 may work for two rules; at ten it becomes a policy junk drawer. Scalable unit is a rule registry: id, paths, owner, failure text, bypass syntax, escalation stage, metrics. CLAUDE.md should summarize and link, not become the enforcement manual.
>
> **Migration needs explicit stages:** report-only → warn local lint → warn CI → error CI → optional editor hook. Rules need config knobs: path scope, min word count, allowed AST positions, approved copy modules, canon file protection, suppression expiry. Tightening = PR with before/after violation counts. Loosening = false-positive reason, not silent threshold drift.
>
> **Cross-platform risk real.** Flat `.claude/.copy-drift-cache.json` is a bad cache especially on Windows: concurrent process writes, antivirus/indexer timing, path separator drift, rename semantics differ from Linux CI. Prefer checked-in canon modules + deterministic lint. If a cache exists: sharded files OR atomic temp-file rename with retry, normalize paths to POSIX internally, fail open with audit logging locally. CI must not depend on live manual fetches or local hook cache state.
>
> **Measurement first-class:** bypass count by rule and actor, drift incidents detected post-merge, false-positive rate, median + p95 time-to-resolve-block, CI failures caused by copy rules, canon imports added, stale canon edits. Success metric is fewer founder-hours arguing about degraded copy.
>
> **DX ratings:** Option A 7/10 (strong actor-independent shape but oversells one ESLint rule, needs careful scoping). Option B 4/10. Option C 8/10 if modified, 6.5/10 as written. Keep the cheap audit/quote-parser fixes, build checked-in canon TS, add targeted warn-only CI lint, escalate with data. Defer write-time blocking and delete Layer 5.
>
> **Recommendation: Option C modified.**

## DX dual-voice consensus (round 2)

| Finding | Subagent | Codex | Consensus |
|---|---|---|---|
| **Bypass surface fragmentation is critical** (5 syntaxes → 2 needed) | ✅ (5 listed) | ✅ (4 listed) | **CONFIRMED — collapse to local-allow + plan-approval** |
| **Drop `trivial:` for copy canon** (too easy to overuse, invisible in review) | implied | ✅ explicit | **CONFIRMED** |
| canon.ts must be **CHECKED IN, hand-curated, with `// canon-source: <url>` comments** — NOT build-time generated | ✅ | ✅ | **CONFIRMED — eng + DX phases all agree** |
| ESLint rule narrow scope via `tseslint.config()` entry, NOT un-ignoring `packages/web/**` | ✅ | ✅ | **CONFIRMED — already from eng phase** |
| Ship `warn` first, escalate to `error` after `.logged-out.md` diff clean | ✅ | ✅ | **CONFIRMED** |
| Layer 5 deleted from this plan | ✅ | ✅ | **CONFIRMED — third phase to converge on this** |
| Migration stages: report-only → warn-local → warn-CI → error-CI → (optional) editor-hook | implied | ✅ explicit | **CONFIRMED — explicit escalation gates** |
| Measurement is first-class: bypass count, FP rate, time-to-resolve, founder-hours | ✅ | ✅ | **CONFIRMED — metric is "Mike's hours arguing about copy"** |
| Rule registry beats CLAUDE.md "Hook-enforced rules" growing unbounded | implied | ✅ | Codex strong — adopt rule registry pattern |
| Block message must name available `lib/copy/` exports | ✅ | ✅ | **CONFIRMED — concrete fix in message** |
| Optional `pnpm lint:copy` lexical pre-edit hook (<100ms, no AST/MCP) for agent fast feedback | ✅ | partially (write-time after CI data) | Subagent strong — defer until CI data justifies it |
| Option A vs Option C modified | A 8.5 / C 7 | A 7 / C 8 (modified) | **DISAGREE on order, AGREE on substance** — surface as taste decision |

## Cross-phase themes

These appeared independently across CEO + Eng + DX rounds:

1. **Kill or radically narrow the 6-layer plan.** All three phases (6 reviewers) independently say this.
2. **Canon-as-TypeScript-module is the missing layer.** All three phases.
3. **CI is the right enforcement boundary, not Claude-only PreToolUse hooks.** CEO + Eng + DX all agree.
4. **Delete Layer 5 from this plan.** All three phases — strongest signal in the entire review.
5. **Ship `warn` first, escalate with data.** Eng + DX.
6. **`canon.ts` checked in, hand-curated, NOT generated.** Eng + DX.
7. **Drop the `trivial:` bypass for copy canon.** DX (explicit), Eng (implicit via prompt-injection concern).

## Mike approved

*(awaiting Mike's review of round-2 CEO + Eng + DX consensus and the three options — autoplan Phase 4 final approval gate)*
