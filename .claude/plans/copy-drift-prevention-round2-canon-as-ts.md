# Copy-drift prevention — round 2 recommendation (canon-as-TypeScript-module)

Slug: `copy-drift-prevention-round2-canon-as-ts`
Created: 2026-05-15
Origin: `/autoplan` round 2 (CEO + Eng + DX, both Claude subagent and Codex). All 6 reviewers independently converged on killing the original 6-layer plan AND the round-1 Revised MVP. This file captures the consensus recommendation for side-by-side comparison with the parallel agent's plan. The dual-voice transcripts live in `.claude/plans/copy-drift-prevention.md` (sections "Claude subagent critique (round 2)" through "Cross-phase themes").

## Brief

Stop AI agents (and humans) from writing degraded paraphrases of canonical Wishonia copy into user-facing surfaces. Do it by making canon **importable as a TypeScript module**, not by gating every edit with a hook. The single durable enforcement gate is one CI ESLint rule that forbids long public prose in route/page/email files unless imported from `@/lib/copy/`. CI covers all actors (Claude, Codex, Cursor, OpenClaw, humans, PR contributors). Claude-only `PreToolUse` hooks cover the least reliable boundary.

**Success metric (per CEO round 2):** "Mike's hours spent re-litigating copy" — weekly. Not "layers shipped," not "drift incidents per month." If Mike's hours arguing about copy go down vs the baseline week, the gate works.

## Current state (ASCII)

```
                       ┌───────────────────────────────────────────────────────────┐
                       │  CANON (authoritative wording)                            │
                       │   manual.warondisease.org pages                           │
                       │   parameters-calculations-citations.ts WHEREAS clauses    │
                       │   WELFARE_CLAIM_TEXT (already centralized in WelfareClaim)│
                       └────────────────────┬──────────────────────────────────────┘
                                            │ NOT a TypeScript module — agents must
                                            │ retrieve via MCP/manual, then paraphrase
                                            ▼
              ┌───────────────────────────────────────────────────────────────────┐
              │  Claude / Codex / Cursor / OpenClaw / humans writing copy         │
              │  Path A: codex exec ─► enforce-manual-search-in-copy-dispatch.mjs │
              │          (only single-quoted prompts; double-quoted bypass)       │
              │  Path B: Claude Edit/Write/MultiEdit ─► NO HOOK                   │
              │  Path C-Z: every other editor/agent/contributor ─► NO HOOK        │
              └─────────────────────────────────────────┬─────────────────────────┘
                                                        ▼
              ┌───────────────────────────────────────────────────────────────────┐
              │  USER-FACING SURFACES (drift lands here)                          │
              │    routes.ts:727 — current trigger incident lives                 │
              │    app/**/page.tsx, components/**, lib/email/**, emails/**        │
              └───────────────────────────────────────────────────────────────────┘
```

## Proposed state (ASCII)

```
                       ┌───────────────────────────────────────────────────────────┐
                       │  CANON IS NOW IMPORTABLE                                  │
                       │   packages/web/src/lib/copy/canon.ts                      │
                       │     export const WELFARE_CLAIM = "..."                    │
                       │     // canon-source: https://manual.warondisease.org/...  │
                       │     export const HUMANITY_V_GOVERNMENT_DESCRIPTION = "...│
                       │     export const EMPLOYEES_TAGLINE = "..."                │
                       │     export const THREE_COUNTS_NEGLIGENT_MASS_HOMICIDE     │
                       │       = "Three counts of negligent mass homicide..."      │
                       └────────────────────┬──────────────────────────────────────┘
                                            │ named imports, type-checked
                                            ▼
              ┌───────────────────────────────────────────────────────────────────┐
              │  Anyone writing copy                                              │
              │    Path A-Z: edit code locally ──► VS Code ESLint LSP shows       │
              │                                    warning at edit time           │
              │              ──► CI lint fails on PR push (deterministic)         │
              └─────────────────────────────────────────┬─────────────────────────┘
                                                        ▼
              ┌───────────────────────────────────────────────────────────────────┐
              │  CI GATE: eslint-plugin-optimitron/no-uncanonized-public-prose    │
              │  Scope: routes.ts + app/**/page.tsx + lib/email/** + emails/**    │
              │  Predicate: StringLiteral OR TemplateLiteral where                │
              │    - parent NOT JSXAttribute (className/href/src/alt/aria-*/etc.) │
              │    - parent NOT Import/ExportDeclaration                          │
              │    - parent NOT CallExpression to known-allow                     │
              │      (fetch, URL, new RegExp, console.*, t() i18n)                │
              │    - length ≥ 80 chars                                            │
              │    - ≥ 10 words OR ≥ 2 sentence terminators (., !, ?)             │
              │  Fix: import from @/lib/copy/canon OR // canon-allow: <url>       │
              │  Phase 1: warn-only. Phase 2: error after .logged-out.md diff     │
              │           proves zero rendered-output change.                     │
              └───────────────────────────────────────────────────────────────────┘
```

## Step list (5-day day-by-day order from round-2 Eng + DX consensus)

### Day 1 — Phase A residue (pre-req hook fixes only)

- **1.1.** Patch `.claude/hooks/enforce-codex-protocol.mjs:61` and `.claude/hooks/enforce-manual-search-in-copy-dispatch.mjs:74` to extract prompts from BOTH single AND double-quoted bash args. (~1 hour) — closes the existing single-quote-only loophole.
- **1.2.** Drop Layer 4 (PR-review skill prompt augment) and Layer 6 (one-shot audit) from Phase A. Reasons: skills decay (per CLAUDE.md:67 they are discretionary not deterministic); the audit's TF-IDF similarity is inadequate for paraphrase detection (round-1 consensus). If the canon-as-TS rule is in place by Day 4, the audit becomes a migration-targets list, not enforcement. Generate that list inline during Day 4 migration instead of as a standalone script.
- **1.3.** Self-test: run the patched hooks against a fixture with a double-quoted prompt and confirm bypass detection works.

### Day 2 — Build the canon TypeScript module (hand-curated, checked in)

- **2.1.** Create `packages/web/src/lib/copy/canon.ts`. Hand-curated, NOT auto-generated. Each export carries an adjacent `// canon-source: <manual-url> @ <YYYY-MM-DD>` comment.
- **2.2.** Seed with the 10-15 worst clusters surfaced today. Concretely (from the parallel work already done in `WelfareClaim.core.ts` and the manual citations in the original plan's Research log):
  - `WELFARE_CLAIM` (already in WelfareClaim.core.ts — re-export here for the consolidated import surface)
  - `HUMANITY_V_GOVERNMENT_DESCRIPTION` ("Three counts of negligent mass homicide against the governments of Earth. The body count, the bill, and the only remedy that works on actual humans.")
  - `EMPLOYEES_TAGLINE` ("A public accountability primitive. Named individuals and institutions are assigned specific tasks...")
  - `HUMANITY_V_GOVERNMENT_FULL_DAMAGES_PER_CAPITA_LABEL` (already exists as a parameter — re-export for string contexts)
  - Treaty preamble whereas clauses (one named export per clause)
  - The trigger incident's canonical replacement
- **2.3.** Add `// canon-locked: do-not-edit-without-canon-source-comment` file header that the (later) ESLint rule honors as a second-rule gate.

### Day 3 — Build the ESLint rule (narrow scope, warn-only)

- **3.1.** Create `eslint-plugin-optimitron/rules/no-uncanonized-public-prose.js` (single rule, single file, ~150 lines). Use the AST predicates above (StringLiteral/TemplateLiteral with parent-type filtering and length/word predicates). Use `@typescript-eslint/utils` `ESLintUtils.RuleCreator` so the rule is TypeScript-aware.
- **3.2.** Add a SECOND rule `canon-edits-require-source-comment` (~30 lines) that only fires on `packages/web/src/lib/copy/canon.ts`: every exported string literal must have a preceding line comment matching `/^\s*\/\/\s*canon-source:\s*https?:\/\/\S+/`. This locks down canon.ts so agents can't add a "canon" export without citing the source. Closes the eng-consensus "canon.ts is the new attack surface" finding.
- **3.3.** Wire into `eslint.config.mjs` via a NEW narrow `tseslint.config()` entry:
  ```ts
  {
    files: [
      "packages/web/src/lib/routes.ts",
      "packages/web/src/app/**/page.tsx",
      "packages/web/src/lib/email/**/*.tsx",
      "packages/web/src/lib/email/**/*.ts",
      "packages/web/emails/**/*.tsx",
      "packages/web/src/lib/copy/canon.ts",
    ],
    plugins: { optimitron: optimitronPlugin },
    rules: {
      "optimitron/no-uncanonized-public-prose": "warn",
      "optimitron/canon-edits-require-source-comment": "error",
    },
  }
  ```
  CRITICAL: do NOT un-ignore `packages/web/**` globally. The eng phase warned this lights up `recommendedTypeChecked` across ~10K files.
- **3.4.** Block message for `no-uncanonized-public-prose`:
  > "Long public prose ({first 50 chars}...) must be imported from `@/lib/copy/canon`. Available exports: {grep-extracted list of canon.ts named exports}. Or add `// canon-allow: <manual-url>` comment immediately above if this is intentionally new copy citing a manual page. See packages/web/src/lib/copy/canon.ts:1."
- **3.5.** Bypass syntaxes — REDUCE to TWO:
  - Inline: `// canon-allow: <https-url>` on the line above (requires URL, not just a reason — DX consensus said `trivial:` is too easy to overuse)
  - File-level: `/* eslint-disable optimitron/no-uncanonized-public-prose -- <reason> */` (standard ESLint disable, reviewable in PR)
- **3.6.** Write RuleTester fixtures (12 cases minimum): import declaration (valid), href/src/className/alt/aria-* attribute (valid), template literal quasi with mixed canon+drift (invalid — the trigger incident), `<ParameterValue>` descendant (valid), `// canon-allow:` adjacent (valid), JSX text node prose (invalid), short string under threshold (valid), error message in `throw new Error(...)` (valid via CallExpression skip), SQL fragment in template literal (valid via length+word-count predicate ruling out), the actual routes.ts:727 line pre-fix (invalid), the same line post-fix using canon import (valid), file disable comment (valid).
- **3.7.** Test against current `packages/web/src/lib/routes.ts` to confirm the rule fires on the trigger incident and gets ~5-15 false positives, not the 106 the round-1 raw-regex-length predicate produced.

### Day 4 — Migrate the worst clusters + escalate to error

- **4.1.** Run the new rule (warn mode) against `packages/web/src/lib/routes.ts` + `packages/web/src/app/**/page.tsx`. Generate the migration list inline (no separate audit script — Day 1 already deleted Layer 6 because the ESLint rule's own output IS the audit).
- **4.2.** For each violation: either replace with `import { CANONICAL_NAME } from "@/lib/copy/canon"` and use that, OR add `// canon-allow: <manual-url>` with a real source URL.
- **4.3.** Run `pnpm --filter @optimitron/web copy:preview` BEFORE and AFTER migration. Diff `git diff packages/web/src/app/**/page.logged-out.md`. If the diff is empty → zero rendered-output change → safe to escalate.
- **4.4.** Flip the rule from `"warn"` to `"error"` in `eslint.config.mjs`. CI now blocks drift at merge.

### Day 5 — Cleanup + measurement

- **5.1.** Add a `pnpm lint:copy` script in `packages/web/package.json` that runs ESLint with this plugin scoped to the files above only. Fast (no project-wide TypeScript service), under 5s.
- **5.2.** Document in CLAUDE.md under a new "Copy canon" section (NOT under "Hook-enforced rules" — DX consensus said that section doesn't scale). One paragraph: "Long public prose must be imported from `@/lib/copy/canon` or carry `// canon-allow: <manual-url>`. Add new canon exports only with a `// canon-source: <url>` comment. Block messages name the available exports. Tighten/loosen via `eslint.config.mjs`."
- **5.3.** Add a tiny "Copy drift" row to TODO.md tracking metric: "founder-hours arguing about copy this week" baseline = today's count, target = trending down. Re-measure weekly.

## Deleted from the original plan

- **Layer 1 (PreToolUse Edit/Write/MultiEdit hook):** deferred indefinitely. Re-evaluate only if 6 weeks of CI data shows late-CI failures common enough that editor-time friction is justified. The 3s PreToolUse budget + AST-parse + MCP roundtrip is over budget per eng review; CI is the right boundary.
- **Layer 2 (`no-inline-prose-in-page-files`):** replaced by the single `no-uncanonized-public-prose` rule above. Round-1 consensus showed the raw length+regex predicate false-positives at 106 candidates in routes.ts alone; the new predicate set narrows that to ~5-15.
- **Layer 3 (`no-hardcoded-numbers-in-jsx`):** separate provenance problem, not canon prose drift. Codex CEO round 2 said split it out. If wanted later, lives in its own plan.
- **Layer 4 (PR-review skill prompt augment):** dropped. Discretionary skills decay; CI is deterministic. DX subagent: 4/10.
- **Layer 5 (`enforce-plan-first-for-new-tools.mjs`):** all 3 phases × 2 voices = 6/6 reviewers said delete. Conflates copy integrity with workflow governance. If desired separately, new plan file `.claude/plans/plan-first-for-new-tools.md`.
- **Layer 6 (one-shot existing-drift audit script):** absorbed into Day 4. The ESLint rule's `--quiet` output IS the migration list; a separate script is duplication.
- **In-process disk cache `.claude/.copy-drift-cache.json`:** not needed. No MCP roundtrip in the new design (ESLint rule is local AST predicates only).
- **`trivial:` bypass:** not used for copy canon. DX consensus: too easy for agents to overuse, invisible in code review. Use `// canon-allow: <url>` inline or `eslint-disable` with reason — both visible in diff.

## Files to touch

| Path | Action | Phase |
|---|---|---|
| `.claude/hooks/enforce-codex-protocol.mjs` | edit (line 61: extract single OR double-quoted) | Day 1 |
| `.claude/hooks/enforce-manual-search-in-copy-dispatch.mjs` | edit (line 74: same fix) | Day 1 |
| `packages/web/src/lib/copy/canon.ts` | create (hand-curated, ~10-15 exports w/ canon-source comments) | Day 2 |
| `eslint-plugin-optimitron/index.js` | create | Day 3 |
| `eslint-plugin-optimitron/package.json` | create | Day 3 |
| `eslint-plugin-optimitron/rules/no-uncanonized-public-prose.js` | create (~150 lines + RuleTester suite) | Day 3 |
| `eslint-plugin-optimitron/rules/canon-edits-require-source-comment.js` | create (~30 lines) | Day 3 |
| `eslint.config.mjs` | edit (add narrow tseslint.config entry, NO global un-ignore) | Day 3 |
| `packages/web/src/lib/routes.ts` | edit (migrate to canon imports / canon-allow) | Day 4 |
| `packages/web/src/app/**/page.tsx` | edit (migrate matching prose) | Day 4 |
| `packages/web/package.json` | edit (add `lint:copy` script) | Day 5 |
| `CLAUDE.md` | edit (new "Copy canon" section, NOT under Hook-enforced rules) | Day 5 |
| `TODO.md` | edit (add weekly metric row) | Day 5 |
| `package.json` | edit (lint-staged include `.tsx`, root lint scope) | Day 3 |

**~4-5 days total** vs the original plan's ~3 days for Revised MVP and indefinite Phase B/C. Net: similar time-cost, dramatically simpler enforcement surface, covers all actors (not just Claude+Codex), single mental model, deterministic.

## Risks

1. **`packages/web/src/lib/copy/canon.ts` becomes the new attack surface.** Mitigation: `canon-edits-require-source-comment` ESLint rule errors on canon.ts edits without `// canon-source:` adjacency. Reviewable in PR diffs.

2. **AST predicate false-positives.** Some legitimate inline prose will fire (rare new feature pages with no manual precedent yet). Mitigation: `// canon-allow: <url>` requires a real URL pointing to a manual page or a `## Mike approved` plan section explaining the intentional new copy. Audit `.claude/copy-drift-bypass.log` weekly (Day 5 measurement).

3. **`pnpm --filter @optimitron/web copy:preview` failing during Day 4 migration.** Mitigation: dev server must be up; if `pnpm dev:fast` is unhealthy, fix that first (per CLAUDE.md). Migration aborts if snapshots can't be generated.

4. **Other agent's parallel plan diverges.** Mitigation: this file. After both plans exist, Mike compares, picks one, the loser becomes a `// considered:` comment in canon.ts or a deleted file.

5. **CI determinism vs canon staleness.** canon.ts is hand-curated with `// canon-source: <url> @ <date>` comments. If a manual page changes, canon.ts goes stale silently. Mitigation: a `pnpm canon:check` script (Day 5 stretch) does an `if-modified-since` HEAD request on each `canon-source` URL and warns on staleness. Run nightly in CI; don't block on it (just open an issue / append to TODO.md).

6. **Layer 5 governance hole.** Reviewers all said delete from this plan; but the underlying need (don't dissuade /autoplan for new-tool work) was real. Mitigation: that's a memory rule (`feedback_do_not_dissuade_autoplan_for_new_tools.md`) already, not a hook. If Mike wants hook enforcement, separate plan.

## Research log

- **Manual canon source #1:** `https://manual.warondisease.org/knowledge/appendix/humanity-v-government.html` — meta description "Three counts of negligent mass homicide against the governments of Earth. The body count, the bill, and the only remedy that works on actual humans." (fetched 2026-05-15 during round-2 review)
- **Manual canon source #2:** `https://manual.warondisease.org/knowledge/strategy/humanity-todo-list.html` — "A public accountability primitive. Named individuals and institutions are assigned specific tasks..." (fetched 2026-05-15)
- **Existing centralization pattern:** `packages/web/src/components/shared/WelfareClaim.tsx:1` + `packages/web/src/components/shared/WelfareClaim.core.ts` — the WelfareClaim component already separated string constants into a `.core.ts` file for non-JSX import. This pattern is the model for `lib/copy/canon.ts`.
- **Existing hook bug (round-1 catch, round-2 confirm):** `.claude/hooks/enforce-codex-protocol.mjs:61` and `.claude/hooks/enforce-manual-search-in-copy-dispatch.mjs:74` both use `[...command.matchAll(/'([\s\S]*?)'/g)]` which only catches single-quoted prompts. Day 1 patches this. (Round-1 plan claimed Layer 1 would inherit the fix; round-2 plan extracts it to a Day 1 pre-req.)
- **ESLint custom rule docs:** https://eslint.org/docs/latest/extend/custom-rules (live as of 2026). Flat-config + `meta.type: "problem"` + `create(context)` returning AST visitor. `@typescript-eslint/utils` `ESLintUtils.RuleCreator` for TS-aware rules.
- **`eslint.config.mjs:5` currently:** ignores `packages/web/**`. Round-1 Codex critique caught that un-ignoring globally cascades `recommendedTypeChecked` errors. Round-2 Eng (both voices) confirmed: use narrow `tseslint.config()` entry instead of un-ignoring.
- **`package.json:50` lint-staged scope:** currently only `.ts`, not `.tsx`. The narrow `tseslint.config()` entry above doesn't need this widened, because ESLint runs on those specific globs regardless of lint-staged's scope.
- **`pnpm --filter @optimitron/web copy:preview`** existing infrastructure: generates `app/**/page.logged-out.md` snapshots that diff cleanly when migrating canon. Round-2 Eng (subagent) named this as the migration safety net.
- **Original plan's research log** lives in `.claude/plans/copy-drift-prevention.md` lines 228-271 — all cited URLs and file:line refs are valid and re-usable for this plan.

## ALERTS

(empty)

## Agent log

- 2026-05-15: round-2 /autoplan (CEO + Eng + DX, both Claude subagent and Codex) converged on this plan. Original plan at `.claude/plans/copy-drift-prevention.md` retains the full dual-voice transcript and consensus tables. A parallel agent is producing an independent plan for the same problem; this file exists for side-by-side comparison.

## Mike approved

**Approved 2026-05-15** — Mike delegated the choice to me ("use your best judgment, I don't know what to do") after I surfaced that my parallel `copy-i18n-migration.md` plan was reviewed against a greenfield assumption that missed the existing `packages/web/src/messages/en-US/war-on-disease.json` work. I picked this plan based on the cross-cycle reviewer consensus: my autoplan #2 CEO reviewers (Claude subagent + Codex) independently arrived at the same architecture this plan documents; their conclusions plus this plan's own CEO + Eng + DX dual-voice reviews = 8 independent reviewers converging on the hand-curated canon.ts + narrow ESLint rule shape. My alternative plans at `.claude/plans/copy-i18n-migration.md` and `.claude/plans/copy-drift-prevention.md` are marked SUPERSEDED with pointers here. Implementing agent should confirm with Mike verbally before starting Day 1 work; this approval reflects architecture choice, not "start coding now."
