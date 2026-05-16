# Copy i18n migration (TypeScript descriptors + dual renderers + AST migration)

**STATUS: SUPERSEDED on 2026-05-15 by `.claude/plans/copy-drift-prevention-round2-canon-as-ts.md`** —
The parallel agent's plan landed at the same architecture (hand-curated canon TypeScript module + narrow ESLint rule) that my two CEO reviewers (Claude subagent + Codex) independently asked for at autoplan #2 Phase 1. Their plan additionally went through its own /autoplan with CEO + Eng + DX dual voices = 6 independent reviewers converging on the same shape. The methodology failure on mine: I didn't grep for existing in-flight i18n work (`packages/web/src/messages/en-US/war-on-disease.json` already exists for the one-percent-treaty referendum site) before writing the plan, so my plan + the CEO reviews evaluated against a greenfield assumption that doesn't match reality. Their plan is shorter (~210 lines vs my ~450), more concretely scoped (Day 1-5 task list with verifiable AST predicates), and complements the existing scoped `messages/en-US/war-on-disease.json` rather than replacing it. Mike delegated the choice ("use your best judgment, I don't know what to do") after I surfaced the methodology failure; I picked theirs based on the cross-cycle reviewer consensus.

Pre-req work that's still independently valuable regardless of which plan ships: patching `.claude/hooks/enforce-codex-protocol.mjs:61` + `.claude/hooks/enforce-manual-search-in-copy-dispatch.mjs:74` for double-quoted prompt extraction (~1 hour). The other agent's plan Day 1 covers this.

---

Slug: `copy-i18n-migration`
Created: 2026-05-15
Status: SUPERSEDED — see header
Originally superseded: `.claude/plans/copy-drift-prevention.md` (the 5-layer write-time-enforcement plan, superseded after Mike's Phase 4 user-challenge: structural rewrite is preferable to gates around the messy architecture). The prevention plan's pre-req fix (existing-hook single-quote bug) is still independently needed; cross-referenced under Dependencies.

## Brief

Migrate all user-facing copy in `packages/web/src/{app,components,lib/routes.ts,lib/messaging.ts,lib/email,emails}/**` from scattered inline strings into a centralized TypeScript message registry. Single source of truth. Every dollar amount, percentage, ratio, and parameter-derived number stored as **parameter identity** (a typed string key into `parameters-calculations-citations.ts`), not as a flattened formatted value. Two renderers materialize the descriptors: rich (JSX with `<ParameterValue>` citation-dialog wrappers) and plain text (for route meta, OG text, email subjects, copy-preview snapshots, logs).

The migration script uses TypeScript AST (`ts-morph`) to walk existing copy surfaces, trace interpolation expressions (`fmtParam(X)`, `WELFARE_CLAIM_AMOUNT_TEXT`, hardcoded numbers) back to parameter identities, and emit MessageDescriptor entries. Ambiguous cases (multiple parameters with same display value) produce a manual-review report.

Architecture credit: Codex's option E from the 2026-05-15 architecture Q&A — none of my four proposed options (A/B/C/D) were structurally correct; Codex pointed out that D's "embed React component in message data" pattern contaminates server/build contexts, and E ("store parameter identity, decide React vs text at render time") is the load-bearing insight.

**End state:** Mike's stated goals from the 2026-05-15 frustration message — *"automated way to make sure that we're always using the strongest available phrasing... only have to change it like in one place... all the parameter values are have a parameter value component that is. Has like a pop up model"* — all satisfied at the architecture level. No drift can happen because there's nowhere to put inline drift; every number gets the citation dialog by construction; updating copy means editing one entry in `messages/en.ts`.

## Current state (ASCII)

```
            ┌─────────────────────────────────────────────────────────────────┐
            │  CANON (authoritative source-of-truth, voice-calibrated)        │
            │   ┌─────────────────────────────────────────────────────────┐   │
            │   │ packages/data/src/parameters/                           │   │
            │   │   parameters-calculations-citations.ts                  │   │
            │   │     ◄── generated from dih_models/parameters.py         │   │
            │   │     ◄── exports ~200 named Parameter objects            │   │
            │   │     ◄── each has value, unit, source URL, calc URL,     │   │
            │   │         manual page, citation, displayName, CI, fmtCfg  │   │
            │   │   format-parameter.ts                                   │   │
            │   │     ◄── fmtParam(p, figures) returns "$36.5T/year"      │   │
            │   │     ◄── fmtParamValueOnly(p, figures) returns "36.5T"   │   │
            │   └─────────────────────────────────────────────────────────┘   │
            │   manual.warondisease.org (Wishonia voice canon)                │
            │   parameters-calculations-citations.ts WHEREAS clauses          │
            └─────────────────────────────────────────────────────────────────┘
                                          │ canon flows down
                                          ▼
   ┌─────────────────────────────────────────────────────────────────────────┐
   │  COPY SURFACES (today: scattered, drift-prone)                          │
   │                                                                         │
   │  packages/web/src/                                                      │
   │    lib/routes.ts                                                        │
   │      ◄── ~248 NavItem.description/tagline/cta strings inline           │
   │      ◄── parameter-derived strings use fmtParam(X) interpolated         │
   │           into template literals: `... ${fmtParam(GLOBAL_GOVT...)} ...` │
   │      ◄── value is FLATTENED to text; <ParameterValue> dialog lost       │
   │      ◄── if parameter value changes, string is stale                    │
   │                                                                         │
   │    lib/messaging.ts                                                     │
   │      ◄── slider prompts, share copy, referral text — same shape         │
   │                                                                         │
   │    app/**/page.tsx                                                      │
   │      ◄── prose strings inline in JSX                                    │
   │      ◄── numbers: SOMETIMES wrapped in <ParameterValue>, sometimes      │
   │           hardcoded as raw JSX text ("$36.5 trillion", "1% Treaty")     │
   │                                                                         │
   │    components/shared/WelfareClaim.{tsx,core.ts}                         │
   │      ◄── CURRENT BEST PATTERN: component composes ParameterValue        │
   │           + WELFARE_CLAIM_TEXT string constant exported for routes.ts   │
   │      ◄── pattern proves it works; only applied to ONE phrase so far     │
   │                                                                         │
   │    emails/**, lib/email/**/*.tsx                                        │
   │      ◄── inline subjects + body strings; partial parameter wiring       │
   └─────────────────────────────────────────────────────────────────────────┘
                                          │ scattered, drift-prone
                                          ▼
   Claude or Codex writes degraded paraphrase → lands on main →
   Mike notices weeks later → manual fix or argument cycle.
```

## Proposed state (ASCII)

```
            ┌─────────────────────────────────────────────────────────────────┐
            │  CANON (unchanged — parameters-calculations-citations.ts)       │
            └─────────────────────────────────────────────────────────────────┘
                                          │ canon flows down
                                          ▼
   ┌─────────────────────────────────────────────────────────────────────────┐
   │  MESSAGE REGISTRY (single source of truth for copy)                     │
   │                                                                         │
   │  packages/web/src/messages/                                             │
   │    types.ts                                                             │
   │      export type MessageDescriptor = {                                  │
   │        template: string;                          // "... {amount} ..." │
   │        slots: Record<string, SlotDescriptor>;                           │
   │        description?: string;                       // for translators   │
   │      };                                                                 │
   │      export type SlotDescriptor =                                       │
   │        | { kind: "parameter"; param: ParameterName; figures?: number;   │
   │            valueTransform?: "stripPerYear" | "round" | "asPercent";     │
   │            display?: "withUnit" | "valueOnly" }                         │
   │        | { kind: "link"; href: string; rel?: "internal" | "external" } │
   │        | { kind: "emphasis"; style?: "strong" | "em" }                  │
   │        | { kind: "verbatim"; text: string };                            │
   │      export type MessageRegistry = Record<string, MessageDescriptor>;   │
   │                                                                         │
   │    en.ts                                                                │
   │      export const messages = {                                          │
   │        welfareClaim: {                                                  │
   │          template: "You pay governments {amount} a year to maximize     │
   │                     median healthy life years and median after-tax      │
   │                     inflation-adjusted income.",                        │
   │          slots: {                                                       │
   │            amount: { kind: "parameter",                                 │
   │                      param: "GLOBAL_GOVERNMENT_EXPENSE_ANNUAL",         │
   │                      figures: 3, valueTransform: "stripPerYear" }       │
   │          },                                                             │
   │        },                                                               │
   │        // ... ~500 entries after migration ...                          │
   │      } as const satisfies MessageRegistry;                              │
   │                                                                         │
   │      export type MessageKey = keyof typeof messages;                    │
   └─────────────────────────────────────────────────────────────────────────┘
                                          │
                          ┌───────────────┴───────────────┐
                          ▼                               ▼
   ┌──────────────────────────────────────┐ ┌─────────────────────────────────┐
   │  RICH RENDERER (JSX, client/server)  │ │  TEXT RENDERER (plain string)   │
   │                                      │ │                                 │
   │  render-rich.tsx                     │ │  render-text.ts                 │
   │    <RichMessage                      │ │    renderMessageText(           │
   │      messageKey="welfareClaim" />    │ │      "welfareClaim"             │
   │                                      │ │    )                            │
   │    ──► resolves slot.param via       │ │    ──► returns:                 │
   │        parameter-registry lookup     │ │        "You pay governments     │
   │    ──► renders <ParameterValue       │ │         $36.5 trillion a year   │
   │          param={X}                   │ │         to maximize median      │
   │          figures={slot.figures}      │ │         healthy life years..."  │
   │          valueOverride={transformed} │ │                                 │
   │        > inside the template         │ │  Used in:                       │
   │                                      │ │    routes.ts NavItem.descrip    │
   │  Used in:                            │ │    generateMetadata() OG text   │
   │    app/**/page.tsx                   │ │    email subjects + bodies      │
   │    components/**/*.tsx               │ │    JSON-LD blocks               │
   │                                      │ │    copy-preview snapshots       │
   │                                      │ │    logs, tests, share cards     │
   └──────────────────────────────────────┘ └─────────────────────────────────┘
                          │                               │
                          ▼                               ▼
   ┌─────────────────────────────────────────────────────────────────────────┐
   │  COPY SURFACES (post-migration: every surface routes through registry)  │
   │  • routes.ts uses renderMessageText for NavItem fields                  │
   │  • page.tsx uses <RichMessage messageKey="..."/> for body prose         │
   │  • email subjects use renderMessageText                                 │
   │  • email bodies use <RichMessage> (React Email supports JSX)            │
   │  • copy-preview snapshots regenerate from registry deterministically    │
   └─────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
   ┌─────────────────────────────────────────────────────────────────────────┐
   │  ENFORCEMENT (post-migration; minimal because architecture prevents     │
   │  drift by construction)                                                 │
   │                                                                         │
   │  ESLint rule: dollar/percent/ratio-looking literals in message          │
   │    template strings rejected unless backed by a parameter slot          │
   │                                                                         │
   │  ESLint rule: long-prose string literals in routes.ts / app/**/page.tsx │
   │    rejected unless via renderMessageText / <RichMessage>                │
   │                                                                         │
   │  PreToolUse hook on Edit/Write to messages/en.ts: each new template     │
   │    runs through manual-search; flags low-canon-match strings for        │
   │    review BEFORE landing                                                │
   └─────────────────────────────────────────────────────────────────────────┘
```

## Step list

### Phase A — Foundation (~2 days)

- A1. Scaffold `packages/web/src/messages/` directory: `types.ts`, `en.ts` (initially ~5 entries), `parameter-registry.ts`, `render-rich.tsx`, `render-text.ts`, `index.ts`.
- A2. `parameter-registry.ts`: export `getParameterByName(name: ParameterName): Parameter` using `parameters-calculations-citations.ts`'s `parameters` object + `ParameterName = keyof typeof parameters`. Type-safe lookup with compile-time guarantee.
- A3. `render-rich.tsx`: `<RichMessage messageKey={K} {...slotOverrides} />` reads descriptor from `messages[K]`, resolves each `kind: "parameter"` slot to `<ParameterValue param={resolved} figures={slot.figures} valueOverride={transformed}>{slot.template-segment}</ParameterValue>`, splices into template at `{slot}` markers. `kind: "link"` → `<Link href={...}>`; `kind: "emphasis"` → `<strong>`/`<em>`; `kind: "verbatim"` → escape hatch. Server-component compatible (no client-only deps).
- A4. `render-text.ts`: `renderMessageText(key: MessageKey, overrides?): string` resolves parameter slots via `formatParameterValueText(param, slot)` (new helper that adapts existing `fmtParam` + transforms). Returns plain string for non-JSX contexts.
- A5. Implement 5 proof-of-concept entries in `en.ts`: `welfareClaim`, `humanityVGovernmentDescription` (the trigger incident), `presidentManagementDescription`, `votePromptSlider`, `prizePoolHeadline`.
- A6. Update `WelfareClaim.tsx` + `WelfareClaim.core.ts` to consume `messages.welfareClaim` instead of carrying their own `WELFARE_CLAIM_TEXT` constant. Validates the dual-renderer story end-to-end on the file that established the pattern.
- A7. Unit tests for renderers: snapshot test for `<RichMessage messageKey="welfareClaim" />`, text test for `renderMessageText("welfareClaim")`, parameter-substitution test, transform tests (stripPerYear, round, asPercent), slot-override test.
- A8. Run `pnpm --filter @optimitron/web copy:preview` to confirm `.md` snapshots regenerate identically (proves no rendered-page regression on the 5 migrated entries).

### Phase B — AST migration tool (~1 day)

- B1. New `packages/web/scripts/i18n-migrate/` workspace-internal tool. Uses `ts-morph` (not regex) for typed TypeScript AST manipulation. Justified by Codex's recommendation + the need to resolve symbol references back to parameter exports.
- B2. `walk-routes.ts`: load `routes.ts` via ts-morph, find every `NavItem` literal, extract `description`, `tagline`, `cta`, `socialPreview` fields. For each, capture the template literal's quasis (literal segments) + expressions (interpolations).
- B3. `walk-pages.ts`: walk `app/**/page.tsx`, extract JSX text + string literals matching multi-word prose pattern (>40 chars, multi-word).
- B4. `extract-slots.ts`: for each captured interpolation expression, classify it:
  - `fmtParam(IDENT, ...)` → `{ kind: "parameter", param: IDENT, figures: <arg2 or default 3>, display: "withUnit" }`
  - `fmtParamValueOnly(IDENT, ...)` → same but `display: "valueOnly"`
  - `Math.round(IDENT.value).toLocaleString(...)` → `{ kind: "parameter", param: IDENT, valueTransform: "round" }`
  - `IDENT.value * 100` (with `%` literal nearby in template) → `valueTransform: "asPercent"`
  - Identifier matching a known constant (e.g., `WELFARE_CLAIM_AMOUNT_TEXT`) → look up the constant's source-of-truth parameter via a seed map; emit as `param: GLOBAL_GOVERNMENT_EXPENSE_ANNUAL` with `valueTransform: "stripPerYear"`.
  - Anything else → flag as `requires-manual-review` with full expression text dumped to report.
- B5. `parameter-match.ts`: for hardcoded numbers in the literal segments (e.g., "$604", "$101 trillion", "272%", "37 trillion"): format every parameter via every common combination (figures 1-4, display withUnit/valueOnly, transforms identity/round/asPercent/stripPerYear) into a lookup table. Match the hardcoded number against the lookup. Emit slot if **unique exact match**; emit "ambiguous" with all candidates if multiple match; emit "unknown" if no match.
- B6. `generate-message-entries.ts`: for each migrated copy surface, emit a draft `MessageDescriptor` entry. Generate suggested message-key from the source location (e.g., `routes.ts:humanityVGovernmentLink.description` → key `humanityVGovernmentDescription`). Output to `packages/web/src/messages/en.candidates.ts` (draft file, not real `en.ts`) + `packages/web/scripts/i18n-migrate/output/migration-report-{timestamp}.md` with three sections: AUTO-MIGRATED (high confidence, ready to merge into en.ts), MANUAL-REVIEW (ambiguous parameter matches; Mike + Claude resolve), UNKNOWN (hardcoded numbers that match no parameter; Mike confirms intentional or wires new parameter).
- B7. Self-test: run migration tool against current `routes.ts`. Verify the `humanityVGovernmentLink.description` containing both `WELFARE_CLAIM_TEXT` and "Since 1900 they spent fortunes on war..." appears in the report as: (a) the `WELFARE_CLAIM_TEXT` portion AUTO-MIGRATED to the welfareClaim canonical key, (b) the "Since 1900..." trailing prose flagged as UNKNOWN / no-canonical-match (because there's no canon for that phrase — the manual's canonical is the entirely different "negligent mass homicide" framing).

### Phase C — routes.ts migration (~1 day)

- C1. Run migration tool against `routes.ts`. Review `migration-report-*.md`.
- C2. Mike + Claude walk the report:
  - AUTO-MIGRATED entries: spot-check a sample (~10%), merge to `en.ts`.
  - MANUAL-REVIEW entries: pick the right parameter for ambiguous matches, edit the descriptor.
  - UNKNOWN entries: each is a candidate for "promote to canon" (add to manual + parameters file), "centralize into a parameter", or "verify intentional and add as `kind: verbatim` slot." Mike's call per cluster.
- C3. Replace `routes.ts` `NavItem.description/tagline/cta` field values with `renderMessageText("messageKey")` calls. Imports added; inline strings deleted.
- C4. Run `pnpm check` + `pnpm --filter @optimitron/web copy:preview` to verify no regression in route metadata + snapshots.
- C5. Visual review: load several routes locally (per CLAUDE.md "Verify the deployed state" rule), confirm meta descriptions match expectation.

### Phase D — page.tsx migration (~1.5 days, multiple batches)

- D1. Run migration tool against `app/**/page.tsx` in batches: highest-traffic pages first (`/`, `/treaty`, `/employees`, `/humanity-v-government`, `/plaintiffs`, `/donate`, `/share`).
- D2. Same walk + accept/manual-review/unknown flow as Phase C.
- D3. Replace JSX prose strings with `<RichMessage messageKey="..." />`. Where `<ParameterValue>` was already in use, the migration extracts it to a slot descriptor and the rich renderer reconstitutes it (no visible diff).
- D4. Per-batch `pnpm check` + `copy:preview` + visual local review.

### Phase E — Lint + cleanup (~0.5 days)

- E1. ESLint custom rule: in `packages/web/src/messages/en.ts`, reject any template string containing literal `$\d+`, `\d+%`, `\d+ (trillion|billion|million)` patterns unless an adjacent `{slot}` references a `kind: "parameter"` slot. Forces all numbers to flow through the parameter registry.
- E2. ESLint custom rule: in `packages/web/src/lib/routes.ts` + `packages/web/src/app/**/page.tsx`, reject prose string literals >40 chars unless inside a `renderMessageText()` call or `<RichMessage>` JSX. Prerequisite: un-ignore `packages/web/**` in `eslint.config.mjs:5` (this is the same prereq the prevention plan flagged; not avoidable).
- E3. Delete now-unused helpers: `formatWelfareClaimAmountText` from `WelfareClaim.core.ts` (replaced by transform), the standalone `WELFARE_CLAIM_TEXT` constant (replaced by `messages.welfareClaim`).
- E4. Update CLAUDE.md "Hook-enforced rules" + "Reuse before rewrite" sections to point to the new messages registry. Update "Manual-search before proposing copy" rule to specify: "for new copy, add to `messages/en.ts` — never inline."

### Phase F — PreToolUse hook on messages/en.ts edits (~0.5 days)

- F1. Create `.claude/hooks/enforce-manual-search-on-messages-edit.mjs` — fires on `Edit`/`Write`/`MultiEdit` to `packages/web/src/messages/**`. For each NEW template string added, runs `mcp__optimitron-tasks__searchManual`. Score <0.3 → BLOCK with "no canon for this phrasing; either cite the manual page or `trivial: <reason>` to bypass." Score 0.3-0.7 → warn. Score >0.7 → allow.
- F2. Disk-cached manual index (per the prevention plan's Codex critique) at `.claude/.copy-drift-cache.json`, TTL 1 day.
- F3. Fail-OPEN with audit log on MCP-down (per prevention plan's reviewer consensus: fail-closed bricks offline work).

## Files to touch

| Path | Action | Phase |
|---|---|---|
| `packages/web/src/messages/types.ts` | create | A |
| `packages/web/src/messages/en.ts` | create + grow incrementally | A → D |
| `packages/web/src/messages/parameter-registry.ts` | create | A |
| `packages/web/src/messages/render-rich.tsx` | create | A |
| `packages/web/src/messages/render-text.ts` | create | A |
| `packages/web/src/messages/index.ts` | create | A |
| `packages/web/src/messages/__tests__/*.test.ts` | create | A |
| `packages/web/src/components/shared/WelfareClaim.tsx` | edit (consume from registry) | A |
| `packages/web/src/components/shared/WelfareClaim.core.ts` | delete or shrink | A → E |
| `packages/web/scripts/i18n-migrate/walk-routes.ts` | create | B |
| `packages/web/scripts/i18n-migrate/walk-pages.ts` | create | B |
| `packages/web/scripts/i18n-migrate/extract-slots.ts` | create | B |
| `packages/web/scripts/i18n-migrate/parameter-match.ts` | create | B |
| `packages/web/scripts/i18n-migrate/generate-message-entries.ts` | create | B |
| `packages/web/scripts/i18n-migrate/migrate.ts` | create (CLI entry) | B |
| `packages/web/package.json` | edit (add `migrate:i18n` script, add `ts-morph` dep) | B |
| `packages/web/src/lib/routes.ts` | edit (replace inline with `renderMessageText`) | C |
| `packages/web/src/app/**/page.tsx` | edit (replace inline with `<RichMessage>`) | D |
| `packages/web/src/lib/messaging.ts` | edit (deprecate, migrate exports to registry) | D |
| `packages/web/src/lib/email/**/*.tsx` | edit (replace inline with `<RichMessage>` / `renderMessageText`) | D |
| `eslint-plugin-optimitron/rules/no-bare-numbers-in-message-template.js` | create | E |
| `eslint-plugin-optimitron/rules/no-inline-prose-in-page-files.js` | create (carries over from prevention plan, scoped to require registry) | E |
| `eslint-plugin-optimitron/index.js` | create | E |
| `eslint-plugin-optimitron/package.json` | create | E |
| `eslint.config.mjs` | edit (un-ignore `packages/web/**` partial OR scope new rules) | E |
| `.claude/hooks/enforce-manual-search-on-messages-edit.mjs` | create | F |
| `.claude/settings.json` | edit (register new hook) | F |
| `CLAUDE.md` | edit (point Reuse/Manual-search rules to registry) | E |
| `TODO.md` | edit (track migration progress per phase) | A → F |

## Risks

1. **AST migration tool silently mis-classifies an interpolation.** `extract-slots.ts` heuristics for `Math.round` / `IDENT.value * 100` / known constants are best-effort. Misclassification produces wrong parameter wiring → render shows wrong value. Mitigation: every AUTO-MIGRATED entry gets a `// migrated:from <file:line>` comment so Mike + Claude can spot-check, and Phase C/D require running `copy:preview` after batches to catch rendered-output regressions. Acceptance: <2% of AUTO-MIGRATED entries produce visibly-wrong output on snapshot diff.

2. **`ts-morph` performance on large files.** `routes.ts` is ~1500 lines. Initial AST parse + symbol resolution is the slow part; per-NavItem walk is fast. Estimate: ~5s for routes.ts, ~15s for full `app/**/page.tsx` sweep. Acceptable for a migration tool that runs occasionally.

3. **React Server Component vs Client Component split for `<RichMessage>`.** `<RichMessage>` must work in BOTH server components (e.g., `app/**/page.tsx` defaults) AND client components (`"use client"` files). `<ParameterValue>` is currently a client component (uses dialog hover state). Mitigation: `<RichMessage>` itself is server-component-safe (just renders template + slots); the `<ParameterValue>` child becomes a client island at render time, which Next.js 15 RSC handles natively per `next-intl` documentation (`https://next-intl.dev/docs/getting-started/app-router`).

4. **Parameter ambiguity in hardcoded-number matching.** `$1` could match `BULLET_COST_556_NATO`, `BED_NETS_COST_PER_DALY`, or several others. The migration tool surfaces these as MANUAL-REVIEW; Mike picks the right one per cluster. Worst case: ~50 ambiguous cases over the full migration (estimate based on `routes.ts` containing ~106 candidate strings per Codex's count in the prevention-plan critique). Budget: ~1-2 hours of manual review per ~50 cases.

5. **Existing `WELFARE_CLAIM_AMOUNT_TEXT` / `formatWelfareClaimAmountText` helpers.** These were extracted by another agent on 2026-05-15 into `WelfareClaim.core.ts`. The migration needs a seed map that knows: `WELFARE_CLAIM_AMOUNT_TEXT` ≈ `fmtParam(GLOBAL_GOVERNMENT_EXPENSE_ANNUAL)` with `/year` stripped. Mitigation: hardcode the seed map in `extract-slots.ts` with explicit entries per known canonical constant; tested in Phase B self-test.

6. **Bundle size of message registry in client bundle.** ~500 entries × ~200 bytes each = ~100KB raw. With template strings + slot descriptors, probably ~150KB. Mitigation options: (a) accept it — 150KB gzips to ~30KB; most pages won't hit the full registry; tree-shaking by message key works if `<RichMessage messageKey="literal-string" />` lets the bundler trace. (b) split by feature area (`messages/routes.ts`, `messages/treaty.ts`, etc.). Decide after Phase A measures actual bundle impact.

7. **Loss of standard i18n tooling.** Translation services (Crowdin, Lokalise, Phrase) expect JSON. TypeScript descriptors aren't readable by their UIs. For the campaign's current English-only state this is acceptable. For future Spanish/French/Mandarin: add a ~50-line script that exports `en.ts` → `en.json` in standard format, runs in CI on registry changes. Translators work against the JSON; humans + AI write the parallel `es.ts` / `fr.ts` files from translated JSON. Plan does NOT build this now; tracked in TODO.md for when actual translation work begins.

8. **Hook bootstrap (Phase F) requires the prevention plan's pre-req fix.** The PreToolUse hook for `messages/en.ts` needs the existing `enforce-codex-protocol.mjs:61` + `enforce-manual-search-in-copy-dispatch.mjs:74` single-quote-extraction bug fixed first — otherwise codex dispatches with double-quoted prompts touching messages/en.ts silently bypass the hook. Pre-req fix is ~1 hour of work, independent of this plan; tracked under Dependencies.

9. **Migration creates new drift opportunity.** Codex is the agent that wrote the original degraded paraphrases. Running Codex through the migration tool risks new drift in the generated `en.candidates.ts`. Mitigation: the migration tool only EXTRACTS existing copy; it doesn't generate new copy. The "Mike + Claude walk the report" step in Phase C2 / D2 is the human gate where canon-misses get caught (Layer F hook on messages/en.ts catches them at the Edit boundary too).

10. **Snapshot-test churn during migration.** Every batch of migrated pages regenerates `.md` snapshots. Reviewers will see large snapshot diffs that are noise (same rendered output, different generation path). Mitigation: validate snapshots are IDENTICAL before and after each batch's migration; non-identical diff is a regression to fix before commit.

## Research log

**Codex architecture Q&A (2026-05-15) — option E recommendation:**
- Codex's full output: `C:\Users\m\.claude\projects\E--code-optimitron\eeccc0b3-7cf1-4c2e-8c85-904874952f49\tool-results\b2nfnlinp.txt:5` — "Pick E: TypeScript structured message descriptors with typed parameter slots, but no React components in the message data."
- Codex's hinge: `packages/data/src/parameters/parameters-calculations-citations.ts:2` is generated TypeScript with stable named exports + `parameters` / `ParameterName = keyof typeof parameters` type-derivation. This enables slot.param to be a typed string identity, not a flattened value.

**Existing parameter / centralization infrastructure:**
- `packages/data/src/parameters/parameters-calculations-citations.ts:2` — generated header confirms upstream is `dih_models/parameters.py`; means TS file is regenerated on python-side parameter changes (the registry stays in sync automatically).
- `packages/data/src/parameters/parameters-calculations-citations.ts:10` — `SourceType = 'external' | 'calculated' | 'definition'` (typed source).
- `packages/data/src/parameters/parameters-calculations-citations.ts:57` — `parameterName: "GLOBAL_DISEASE_DEATHS_ANNUAL"` example shows `parameterName` field is the key used for cross-reference.
- `packages/data/src/parameters/parameters-calculations-citations.ts:73+` — `export const ADAPTABLE_TRIAL_COST_PER_PATIENT: Parameter = {...}` pattern shows named export per parameter.
- `packages/data/src/parameters/format-parameter.ts:42` — `fmtParam(param, figures = 3): string` is the existing string formatter; `valueTransform: "stripPerYear"` etc. will wrap this.
- `packages/web/src/components/shared/ParameterValue.tsx` — existing React component the rich renderer wraps each parameter slot in.
- `packages/web/src/components/shared/WelfareClaim.tsx:1` — current best-practice example of the centralization pattern (composes ParameterValue + exports WELFARE_CLAIM_TEXT constant).
- `packages/web/src/components/shared/WelfareClaim.core.ts` — recently-extracted (2026-05-15, by another agent) string constants module; uses `formatWelfareClaimAmountText` helper that the migration tool will seed-map.

**Next.js 15 App Router i18n landscape (May 2026):**
- `https://next-intl.dev/docs/getting-started/app-router` — next-intl is the canonical Next.js 15 App Router i18n library. Native Server Component support via `getTranslations()`. ~2KB bundle. `setRequestLocale` enables static rendering with locale-based routing. Plan deliberately does NOT use next-intl directly (Option E uses custom renderers) but DOES borrow its server-component compatibility patterns.
- `https://trybuildpilot.com/910-next-intl-vs-i18next-vs-lingui-2026` — comparison: next-intl purpose-built for Next.js with first-class App Router + Server Components support, ICU format, TypeScript integration catches missing keys at compile time. Lingui has tinier runtime (~5KB) via compile-time message extraction. react-i18next has historical baggage; works with App Router via next-i18next v16 wrapper.
- `https://www.locize.com/blog/next-i18next-v16/` — next-i18next v16 confirms standard tooling (Crowdin/Lokalise) expect JSON. Option E's loss-of-standard-tooling risk (Risks #7) verified against current ecosystem.

**ts-morph (the AST tool the migration uses):**
- `https://ts-morph.com/` (last visited 2026-05-15) — ts-morph wraps TypeScript Compiler API with typed accessors. Stable, ~5 years mature. Used by codemods at Facebook/Meta scale. Picked over `jscodeshift` (heavier, less TS-aware) and raw TypeScript Compiler API (lower-level, more boilerplate).

**Prior /autoplan cycle artifacts (autoplan #1 on copy-drift-prevention plan):**
- `.claude/plans/copy-drift-prevention.md` — superseded by this plan. Captures the CEO + Eng dual-voice critiques that motivated this pivot. Cross-reference for the prevention-layer ideas (pre-req hook fix, Layer 4 PR-review prompt) that are still independently valuable.
- `feedback_do_not_dissuade_autoplan_for_new_tools.md` memory entry (2026-05-15) — the meta-rule that this plan's own existence honors (didn't dissuade Mike from running /autoplan on the i18n pivot).

**Memory entries that inform this plan:**
- `feedback_promote_violated_text_rules_to_hooks` — Phase F PreToolUse hook on messages/en.ts is the active enforcement (replaces passive CLAUDE.md "Manual-search before proposing copy" rule).
- `feedback_match_fix_scope_to_report_scope` — informed the decision to keep the migration tool's scope to MIGRATION only (not generation). The "audit and replace" loop Mike named is the human-in-the-loop step, not an AI-only loop.
- `feedback_fix_root_cause_not_symptom` — endorsed by the autoplan #1 dual-voice consensus; this plan applies it one layer up (architecture-level prevention rather than gate-level prevention).

## Dependencies

- **Prevention plan pre-req fix (independent of this plan, ship anyway):** patch `.claude/hooks/enforce-codex-protocol.mjs:61` AND `.claude/hooks/enforce-manual-search-in-copy-dispatch.mjs:74` to extract both single AND double-quoted bash prompts. ~1 hour. Blocks Phase F if not done.
- **Existing pnpm workspace must accept new `packages/web/src/messages/` namespace and new `eslint-plugin-optimitron/` workspace.** Standard pnpm `workspaces` field in root `package.json` handles this — no special config needed.
- **`@types/node` + `ts-morph` deps** in `packages/web/package.json` for the migration tool.
- **Future actual i18n work** (Spanish/French/Mandarin translation) is OUT OF SCOPE for this plan. The JSON-export script needed for translator workflows is tracked in `TODO.md` as a follow-up when translation actually starts.

## ALERTS

(empty)

## Agent log

(empty)

## Claude subagent critique (round 1)

*(to be filled in by autoplan Phase 1 CEO + Phase 3 Eng dual-voice review)*

## Codex critique (round 1)

*(to be filled in by autoplan Phase 1 CEO + Phase 3 Eng dual-voice review)*

## Dual-voice consensus

*(to be filled in after both critiques complete)*

## Mike approved

*(awaiting autoplan Phase 4 final approval gate)*
