# Font Size Validation Plan

## Research log

Repo-internal findings:

- `TODO.md:140-156` defines the scope: add email Playwright validation first, then web ESLint validation, with a long-term token migration option.
- `.claude/codex-delegation.md:117-132` requires this plan file shape: research log, brief, current/proposed ASCII diagrams, step list, risks, files to touch, ALERTS, and agent log.
- `packages/web/e2e/contrast-audit.spec.ts:1-23` is the closest reusable pattern: Playwright test, audit helper imports, page discovery, custom violation collection, and a JSON report.
- `packages/web/e2e/contrast-audit.spec.ts:306-341` shows the failure/reporting shape to copy: collect all violations, print a human-readable table, then assert zero.
- `packages/web/e2e/utils/audit-helpers.ts:123-135` already provides `writeAuditReport(name, data)`, so the email font-size audit should write `playwright-report/email-font-size-audit.json`.
- `packages/web/scripts/run-playwright.mjs:30-58` has mode routing. CI `smoke` currently includes contrast but not email font-size validation. `packages/web/scripts/run-playwright.mjs:83-126` reuses/provisions the base URL, so the new audit should run through this wrapper.
- `.github/workflows/ci.yml:186-194` runs web Playwright smoke and visual review; `.github/workflows/ci.yml:152-164` runs web typecheck/test/build but no web lint step.
- `packages/web/e2e/email-screenshots.spec.ts:1-18` explains why email tests should use `/dev/email/<template>` instead of directly importing email builder modules.
- `packages/web/e2e/email-screenshots.spec.ts:43-48` shows the existing raw-email render path used by Playwright.
- `packages/web/src/app/dev/email/[template]/route.ts:11-24` documents the preview route modes. `?raw=1&full=1` returns full envelope plus body without mobile wrapper.
- `packages/web/src/app/dev/email/[template]/route.ts:75-98` resolves templates through `getEmailPreview`, renders either full or body-only HTML, and returns HTML.
- `packages/web/src/lib/email/preview-registry.ts:1-11` says the registry is the aggregate source of every previewable outbound email. `packages/web/src/lib/email/preview-registry.ts:22-36` currently lists six template IDs.
- Generated email markdown snapshots confirm the current preview URLs but do not include computed font sizes: for example `packages/web/src/lib/email/post-vote-share.email.md:2-4`, `packages/web/src/lib/email/monthly-chain-digest.email.md:2-4`, and `packages/web/src/lib/tasks/task-comment-notification.email.md:2-4`.
- `packages/web/src/components/adaptive/email-styles.ts:34-45` has 13px and 12px eyebrow styles; `packages/web/src/components/adaptive/email-styles.ts:76-84` has 13px muted paragraph and 14px small muted paragraph. The guard will catch these unless they are raised or explicitly marked as footnotes in rendered HTML.
- More current sub-14 email styles exist outside `adaptive/email-styles.ts`: `packages/web/src/lib/email/react-email-components.tsx:65-76`, `packages/web/src/lib/email/react-email-components.tsx:100-116`, `packages/web/src/lib/email/react-email-components.tsx:275-308`, `packages/web/src/lib/email/preview-envelope.ts:271-274`, `packages/web/src/lib/email/monthly-chain-digest-react-email.tsx:137-146`, `packages/web/src/lib/email/monthly-chain-digest-react-email.tsx:213-222`, and `packages/web/src/lib/tasks/task-comment-notification-react-email.tsx:89-99,124-144`.
- Root ESLint is flat config with TypeScript rules, but it explicitly ignores `packages/web/**`: `eslint.config.mjs:1-6`. Root lint only targets `packages/*/src/**/*.ts`, not TSX: `package.json:17-24`.
- Web ESLint is currently only `packages/web/.eslintrc.json:1-3` extending `next/core-web-vitals`, and `packages/web/package.json:21` runs `next lint`.
- `packages/web/package.json:40-42` exposes `copy:preview`, `copy:preview:all`, and `email:preview-md`; implementation should not require these in the font audit itself, but current email snapshots should be regenerated when email markup changes.

Web/vendor research:

- Search query: `WCAG 2.2 resize text 200 percent success criterion 1.4.4 font size minimum`
  - W3C WCAG 2.2 SC 1.4.4 says text must resize to 200 percent without loss of content/functionality, but it does not define a minimum author font size. It is useful context, not a 14px mandate: https://www.w3.org/TR/wcag/ (`turn3view0`, lines 502-509).
- Search query: `Material Design 3 typography body medium 14sp label large 14sp body small 12sp`
  - Android Developers' Material 3 type scale lists `bodyMedium` 14/20, `labelLarge` 14/20, and smaller 12/11 variants for bodySmall/labels. This supports 14px as a pragmatic default floor while still allowing explicit footnote exceptions: https://developer.android.com/develop/ui/compose/designsystems/material3 (`turn3view2`, lines 944-959).
- Search query: `Apple Human Interface Guidelines typography minimum text size 11 pt`
  - Apple HIG Typography search result shows Dynamic Type guidance and platform minimums such as iOS/iPadOS 17pt default and 11pt minimum. This argues for scalable/legible text and explicit exceptions, not for making 11px acceptable in this app: https://developer.apple.com/design/human-interface-guidelines/typography.
- Search query: `Playwright Page evaluate locator evaluateAll docs JavaScript DOM computed style`
  - Playwright documents `page.evaluate()` as the bridge for running DOM code in the browser context, which is exactly what the computed font-size walker needs: https://playwright.dev/docs/evaluating (`turn3view3`, lines 92-107).
- Search query: `ESLint custom rule create RuleTester docs flat config local plugin`
  - ESLint flat config supports local/virtual plugins and custom rules: https://eslint.org/docs/latest/use/configure/plugins (`turn3view4`, lines 241-319). ESLint also documents `RuleTester` for custom rule tests: https://eslint.org/docs/latest/extend/custom-rule-tutorial (`turn3view5`, lines 518-522, 618-642).
- Search query: `Next.js 15 ESLint flat config next/core-web-vitals docs next lint removed`
  - Current Next docs recommend ESLint CLI with flat config and note `next lint` removal in Next 16, while still documenting `eslint-config-next/core-web-vitals`: https://en.nextjs.im/docs/pages/api-reference/config/eslint/ (`turn5view0`, lines 229-305, 344-348, 438-475).

Decision summary from research:

- Set the shared default floor at 14 CSS px for email and web. This is stricter than WCAG's minimum-size language because WCAG does not provide one, but it matches common UI body/label floor guidance and protects mobile/email readability.
- Do not create a separate lower email threshold. Email is often read on mobile and forwarded out of app context, so the same 14px floor is the right default.
- Permit sub-14 text only through explicit, reviewable exceptions: `data-allow-small="footnote"` in rendered email HTML, and `eslint-disable-next-line optimitron/min-font-size -- <reason>` in JSX.
- Defer token migration. The guard should exist before a broad semantic-token cleanup so the cleanup has a failing/passing contract and does not hide current violations behind renamed constants.

## Brief

Add automated font-size guardrails so campaign emails and web JSX stop shipping tiny text by accident. The first layer is a Playwright audit that renders every email preview and fails on visible computed text below 14px unless an ancestor explicitly marks it as a footnote. The second layer is a fast ESLint rule for web JSX that catches obvious small Tailwind classes and inline React font sizes before runtime.

## Current state ASCII diagram

```text
Email source files
  |
  v
EMAIL_PREVIEWS registry
  |
  +--> /dev/email/[template]?raw=1            -> email screenshots
  |
  +--> /dev/email/[template]?raw=1&full=1     -> *.email.md snapshots
  |
  `--> no computed font-size audit

Web JSX/TSX
  |
  +--> packages/web/.eslintrc.json -> next/core-web-vitals
  |       |
  |       `--> package script exists, but CI web-validate does not run web lint
  |
  `--> root eslint.config.mjs ignores packages/web/**
```

## Proposed state ASCII diagram

```text
EMAIL_PREVIEWS registry
  |
  +--> /dev/email?format=json
  |       |
  |       v
  |   email-font-size-audit.spec.ts
  |       |
  |       +--> page.goto(/dev/email/<slug>?raw=1&full=1)
  |       +--> TreeWalker over visible text nodes
  |       +--> getComputedStyle(text parent).fontSize
  |       +--> allow only ancestor data-allow-small="footnote"
  |       `--> playwright-report/email-font-size-audit.json
  |
  `--> existing screenshots and markdown snapshots stay unchanged

Web JSX/TSX
  |
  +--> packages/web/eslint.config.mjs
  |       |
  |       `--> local virtual plugin: optimitron/min-font-size
  |              |
  |              +--> className: text-xs, text-[Npx] where N < 14
  |              +--> style: fontSize number/string px where N < 14
  |              `--> explicit eslint-disable-next-line with reason for exceptions
  |
  `--> web-validate runs package web lint before build/playwright
```

## Step list

- [ ] Add a dev-only email template index route at `packages/web/src/app/dev/email/route.ts`.
  - Return 404 in production, matching `packages/web/src/app/dev/email/[template]/route.ts`.
  - For `GET /dev/email?format=json`, return `{ templates: listEmailPreviewTemplateIds() }`.
  - This avoids importing email builder modules from Playwright while still using the canonical registry.

- [ ] Add `packages/web/e2e/email-font-size-audit.spec.ts`.
  - Single test fetches `/dev/email?format=json`, loops through every template, and navigates to `/dev/email/${slug}?raw=1&full=1`.
  - Use `page.evaluate()` with a `TreeWalker` over `NodeFilter.SHOW_TEXT`.
  - For each non-empty visible text node, find the nearest parent element, skip script/style/template/noscript, skip hidden ancestors (`display:none`, `visibility:hidden`, zero client rect), and parse `getComputedStyle(parent).fontSize` as CSS px.
  - A node passes when computed size is `>= 14` or any ancestor has `data-allow-small="footnote"`.
  - Report each violation with template, text snippet, computed size, selector/path, tag name, and whether any nearby allow attribute was malformed.
  - Reuse `writeAuditReport("email-font-size-audit", ...)` for a JSON artifact.

- [ ] Wire the email font audit into `packages/web/scripts/run-playwright.mjs`.
  - Add mode `email-font-size`.
  - Include `e2e/email-font-size-audit.spec.ts` in `all`.
  - Include it in CI `smoke` so `.github/workflows/ci.yml:186-187` catches regressions through the existing smoke command.
  - Keep local behavior using the existing wrapper so it reuses port 3001 instead of starting surprise servers.

- [ ] Make current email HTML satisfy the audit.
  - Raise non-footnote labels and section-eyebrows from 11/12/13px to 14px.
  - Add `data-allow-small="footnote"` only to actual footnote-like email metadata: unsubscribe/legal footer, preview-only envelope header, and signature tagline when it remains below 14px.
  - Do not use the opt-out for campaign instructions, section labels, buttons, or long-form body copy.
  - Regenerate `.email.md` snapshots only if rendered email text or preview markup changes in a way snapshots show.

- [ ] Add a package-local ESLint custom rule.
  - Create `packages/web/eslint-rules/min-font-size.mjs`.
  - Implement as an ESLint rule, not `no-restricted-syntax`, because the threshold requires parsing class tokens and literal style values.
  - Flag static JSX `className` content containing `text-xs` or `text-[Npx]` where `N < 14`, including variant-prefixed tokens such as `sm:text-[13px]`.
  - Inspect literal strings inside common class helpers (`cn`, `clsx`, arrays, objects, conditionals) when the string value is statically visible.
  - Flag JSX `style={{ fontSize: 13 }}`, `style={{ fontSize: "13px" }}`, and object properties named `fontSize` with px/number values below 14.
  - Do not attempt to resolve CSS variables, imported constants, template expressions with runtime values, or Tailwind config aliases in the first pass.

- [ ] Wire the rule through package-local ESLint config.
  - Create `packages/web/eslint.config.mjs` using Next's core web vitals config plus a local virtual plugin named `optimitron`.
  - Enable `optimitron/min-font-size` as `error` for `src/**/*.{ts,tsx}`.
  - Replace or retire `packages/web/.eslintrc.json` so editors and CI use one web ESLint config.
  - Update `packages/web/package.json` `lint` away from `next lint` to ESLint CLI, consistent with current Next docs and future Next 16 behavior.
  - Add a web lint step to `.github/workflows/ci.yml` before build/playwright. If full web lint exposes unrelated existing debt, add a narrower `lint:font-size` script and wire that first, then track broad web lint separately.

- [ ] Add focused tests for the custom ESLint rule.
  - Use ESLint `RuleTester`.
  - Valid cases: `text-sm`, `text-[14px]`, `text-[16px]`, `fontSize: 14`, `fontSize: "14px"`, dynamic values the rule intentionally cannot resolve, and an `eslint-disable-next-line optimitron/min-font-size -- <reason>` exception.
  - Invalid cases: `text-xs`, `sm:text-xs`, `text-[13px]`, `md:text-[12px]`, `fontSize: 13`, `fontSize: "13px"`, and nested helper strings such as `cn("text-[12px]")`.

- [ ] Verification commands for implementation phase only.
  - `pnpm --filter @optimitron/web run e2e -- email-font-size --reporter=list`
  - `pnpm --filter @optimitron/web run lint`
  - If email rendered content changes: `pnpm --filter @optimitron/web run email:preview-md`
  - Do not run `next build`; use the existing wrapper and CI path.

## Risks

- The web lint setup is currently fragmented. Migrating `packages/web` from `next lint`/`.eslintrc` to flat ESLint may reveal unrelated lint debt or dependency-version mismatch (`next` is 15.5.15 while `eslint-config-next` is 14.2.35).
- If full web lint is too noisy, the fallback is a narrow `lint:font-size` script that runs only the local rule. That still enforces this plan without turning the work into a general ESLint migration.
- Email computed-style walking can false-positive hidden/responsive duplicate text unless the walker skips hidden ancestors and zero-rect elements.
- `data-allow-small="footnote"` can become a loophole. Keep it limited to unsubscribe/legal/metadata/signature-tagline text; do not allow it on ordinary campaign copy.
- Static ESLint cannot catch runtime class names, CSS modules, inherited font-size from parent CSS, or Tailwind config changes. The email Playwright audit catches computed email output; web runtime font-size coverage remains a future Playwright/a11y audit if needed.
- Changing email font sizes may affect screenshots and generated markdown review artifacts. Treat those as user-facing generated artifacts and review them before commit.

## Files to touch

- Create: `packages/web/src/app/dev/email/route.ts`
- Create: `packages/web/e2e/email-font-size-audit.spec.ts`
- Modify: `packages/web/scripts/run-playwright.mjs`
- Modify as needed for current email violations: `packages/web/src/components/adaptive/email-styles.ts`
- Modify as needed for current email violations: `packages/web/src/lib/email/react-email-components.tsx`
- Modify as needed for current email violations: `packages/web/src/lib/email/preview-envelope.ts`
- Modify as needed for current email violations: `packages/web/src/lib/email/monthly-chain-digest-react-email.tsx`
- Modify as needed for current email violations: `packages/web/src/lib/email/wishonia-signature.ts`
- Modify as needed for current email violations: `packages/web/src/lib/tasks/task-comment-notification-react-email.tsx`
- Possibly modify: `packages/web/src/lib/email/share-footer.tsx`, `packages/web/src/lib/email/coordination-feedback-note.ts`, `packages/web/src/lib/tasks/task-notifications.server.ts`
- Create: `packages/web/eslint-rules/min-font-size.mjs`
- Create: `packages/web/eslint-rules/min-font-size.test.mjs`
- Create: `packages/web/eslint.config.mjs`
- Delete or retire: `packages/web/.eslintrc.json`
- Modify: `packages/web/package.json`
- Modify: `.github/workflows/ci.yml`
- Modify if dependency/config migration requires it: `pnpm-lock.yaml`

## ALERTS

## Agent log

## Codex critique (round 1)

### 1. The 14px rule is a product guardrail, not WCAG compliance

The plan gets close, but it still talks like "14px" is an accessibility threshold. It is not. WCAG 2.2 SC 1.4.4 requires text to resize to 200 percent without loss of content or functionality; it does not mandate a minimum authored pixel size: https://www.w3.org/TR/wcag/#resize-text. That distinction matters because a Tailwind `text-xs` class is usually `0.75rem`, which remains user-scalable even though its default rendered size is 12px.

Re-verified 2026-05-15:

- Material 3 lists `bodyMedium` and `labelLarge` at 14/20, but also has `bodySmall` 12/16, `labelMedium` 12/16, and `labelSmall` 11/16: https://developer.android.com/develop/ui/compose/designsystems/material3.
- Apple HIG says to follow platform default and minimum sizes and support Dynamic Type; it gives iOS/iPadOS 17pt default and 11pt minimum, not a universal 14px floor: https://developer.apple.com/design/human-interface-guidelines/typography.
- Web.dev's December 16, 2025 fluid-typography guidance focuses on preserving user control, zoom, and user default font-size response, not banning every sub-14 default size: https://web.dev/articles/baseline-in-action-fluid-type.

So the plan should state: "Optimitron campaign surfaces use a house default floor of 14 CSS px for rendered prose, labels, and CTAs, plus separate checks that web text remains user-scalable." Do not call the 14px floor a WCAG rule. Also, the plan should avoid a repo-wide web ban until scope is settled. Current `rg` shows many `text-xs` and sub-14 sizes in admin, demo, chart, badge, and Sierra/game surfaces; making all of those illegal is not the same problem as preventing tiny campaign/email body copy.

### 2. The text-node computed-style approach catches inheritance, but only for the active rendering mode

Walking text nodes and reading `getComputedStyle(parentElement).fontSize` is the right runtime primitive for email HTML. It does catch CSS inheritance:

- If a parent sets `font-size: 12px` and a child only contains text, the child's computed `fontSize` resolves to 12px.
- If the text node's immediate parent has a class or inline style, the parent computed style resolves the actual applied value.
- If a child inherits from a grandparent, `getComputedStyle(child).fontSize` still returns the inherited computed value.

But the plan overclaims media-query and dark-mode coverage. A single `page.goto("/dev/email/foo?raw=1&full=1")` audit only checks the current viewport and current `colorScheme`. If email CSS later includes `@media (max-width: ...)` font changes, the default project may miss them. If email CSS later includes `@media (prefers-color-scheme: dark)`, the default light pass will miss it. Current email sources do not appear to define dark-mode font-size variants, so the plan should either say dark mode is out of scope for font-size or add a real dark `colorScheme` pass.

The minimum implementation should mirror the contrast spec's viewport discipline: desktop plus a mobile 390x844 pass, or an explicit statement that inline email styles make viewport differences irrelevant until email CSS starts using responsive font sizes. Without that, "handles media queries" is unproven.

### 3. The plan says "reuse contrast-audit", but mostly describes a sibling audit

`packages/web/e2e/contrast-audit.spec.ts` has useful patterns: scoped page discovery, a global violation accumulator, desktop/mobile passes, console summary, final JSON via `writeAuditReport`, and failing with a path to the JSON artifact. The proposed email audit only truly reuses `writeAuditReport`; it otherwise creates a new route index and a separate text-node walker.

That may be fine, but the plan should be honest and concrete:

- Reuse `writeAuditReport("email-font-size-audit", ...)`.
- Reuse the contrast audit's global `allViolations` plus `afterAll` summary shape.
- Reuse the contrast audit's desktop/mobile split if claiming responsive coverage.
- Reuse the email screenshot spec's `/dev/email/<template>?raw=1` route discipline and "no direct imports from Playwright" rationale.

Do not copy the contrast audit's page-auth/demo machinery into an email-only audit. Also do not duplicate the contrast audit's copy-pasted desktop/mobile loops if a small helper can collect violations for one viewport and template list.

### 4. The ESLint custom rule is materially bigger than the plan admits

There is no existing custom-rule infrastructure to extend. Root `eslint.config.mjs` ignores `packages/web/**`; `packages/web` has only `.eslintrc.json` extending `next/core-web-vitals`; `packages/web/package.json` still runs `next lint`; CI typechecks/tests/builds web but does not run web lint.

Creating `optimitron/min-font-size` is not just "add a rule." The plan proposes parsing Tailwind class tokens, variant prefixes, `cn`/`clsx`, arrays, objects, conditionals, JSX `style`, object properties, and disable comments with reasons. That is an AST project plus tests plus a web ESLint migration. It will also create a huge initial violation set if run broadly over `src/**/*.{ts,tsx}`.

The plan should weigh a cheaper first guard:

- Email: Playwright computed-style audit. This is the real regression guard.
- Web: start with a small explicit scanner or lint-staged/CI script for public campaign TSX only, matching `text-xs`, `text-[Npx]` where N < 14, and simple `fontSize` literals. Let it report findings without requiring a flat-config migration.
- Only graduate to a custom ESLint rule after deciding the scope, exception policy, and whether admin/demo/chart microcopy is exempt.

If the plan keeps ESLint, it should narrow scope to public campaign surfaces first and explicitly exclude admin, demo/Sierra, SVG chart labels, email-client wrappers, and internal tool tables unless Mike wants those migrated too.

### 5. The exception story is still a loophole

The plan moved from a vague "opt-out class" to `data-allow-small="footnote"`, which is better, but still not enforceable enough. It needs a named policy:

- Exact attribute: `data-allow-small="footnote"` or a more specific `data-email-small-text="footnote"`. Pick one and never accept aliases.
- Allowed locations: unsubscribe/legal footer, preview-only envelope metadata, and maybe Wishonia signature tagline. Not campaign instructions, CTAs, headings, section labels, or body copy.
- Ownership: only email rendering helpers such as `preview-envelope`, signature/footer helpers, and reviewed email components may add it.
- Audit behavior: report malformed attributes and include the nearest allowed ancestor in the JSON so reviewers can see whether an exemption caused the skip.

For JSX lint exceptions, `eslint-disable-next-line optimitron/min-font-size -- reason` is not automatically enforced by a custom rule. If the plan requires reasons, it needs either an ESLint-comments policy/plugin or a separate scanner. Otherwise that "reason" requirement is just documentation.

### 6. The 12px bug should be the regression proof, not just an anecdote

Commit `d400035f` says the shipped bug was `EMAIL_STYLES.smallMutedParagraph` at 12px applied to a roughly 200-word Humanity Manager promotion block because the `muted` flag was misused. The current preview registry includes `post-vote-share`, which renders `HumanityManagerPromotionEmail`, so an email Playwright audit over `/dev/email/post-vote-share?raw=1&full=1` would have caught the visible paragraph at 12px if it had existed today and was not exempted.

The planned ESLint rule would not reliably catch that regression unless it also scanned plain TS style constants and tracked how `EMAIL_STYLES.smallMutedParagraph` flows into rendered React Email. A Tailwind-focused `text-xs` rule would miss it entirely. This is the strongest argument for implementing the email Playwright audit first and treating web lint as a second, narrower guard.

Make the validation case explicit in the plan: temporarily restoring `smallMutedParagraph: "12px"` and `PromoText muted` on the Humanity Manager long paragraph should fail the email audit on `post-vote-share`, with a violation snippet from "You probably do not have time to persuade...". Without that proof, the plan has not shown it prevents the exact bug that triggered this work.

## Codex critique summary

Top 3 changes I would make before implementation:

1. Reframe `>=14px` as an Optimitron default readability floor, not WCAG compliance, and add a separate scalability/zoom note from current Web.dev/WCAG guidance.
2. Ship the email Playwright computed-style audit first, with desktop/mobile coverage and the 12px Humanity Manager paragraph as the required regression test case.
3. Downgrade the custom ESLint rule from "definitely build" to "evaluate after a narrow scanner," because this repo has no custom ESLint infrastructure and a broad web rule will produce noisy violations outside the campaign/email problem.

## Mike approved (round 2)

Simpler approach: extend the existing `packages/web/e2e/contrast-audit.spec.ts` with a font-size walker. ~30 lines of incremental code. Walks every text node on every public route + every email preview; fails if computed `font-size < 14px` unless the node has a `data-allow-small="footnote"` opt-out attribute. The 12px humanity-manager paragraph becomes the regression test case.

NO new spec file. NO custom ESLint rule (deferred until evidence shows the Playwright audit misses something). NO new infrastructure. Just extend an existing test that already walks every route via Playwright.

Trivial-tier dispatch.

## Mike approved (round 3) — flip warn-only to fail-closed

Round 2 landed the audit but as `console.warn`. Mike 2026-05-14: *"Warning seems pointless. We're just going to ignore those forever. We should either make it errors and fix them now and Or Reduce the strictness or something."*

Goal: the font-size audit must FAIL the CI job on any violation, just like the contrast audit already does. Pre-existing violations get fixed before the gate flips on. The rule is fail-closed; the only escape hatch is the `data-allow-small="footnote"` attribute applied to legitimate footnote chrome.

### Step list

- [ ] Run the audit against the live local dev server (already at :3001) to inventory every current violation: `pnpm --filter @optimitron/web exec playwright test e2e/contrast-audit.spec.ts --reporter=list`. Capture the full violation list from stdout AND `packages/web/output/playwright-report/contrast-audit.json` (the `fontSizeViolations` array).
- [ ] Categorize each violation into one of three buckets, in priority order:
  1. **PROSE** — actual content text the user reads (paragraphs, body copy, instructions, headings). Fix by bumping the className/style to `text-sm` (14px) or `text-base` (16px). Never use the opt-out for prose.
  2. **FOOTNOTE CHROME** — citation lines, parameter unit labels, scoreboard fine print, "n=NNN" voter counts, source disclaimers, legal/preview-only envelope metadata. Wrap the smallest containing element in `data-allow-small="footnote"`. Document each opt-out site in the commit message.
  3. **LEGACY/OUT-OF-SCOPE** — admin tables, Sierra demo slides, internal devtools/`/dev/*` pages. If the route is genuinely out of campaign scope, exempt the whole route in `contrast-audit.spec.ts` by adding it to a `FONT_SIZE_AUDIT_EXEMPT_PATHS` set (NOT a global threshold change — explicit, named, with a comment). Prefer fixing over exempting; the exemption set should hold ≤5 entries.
- [ ] After every violation is either fixed or explicitly exempted, flip both warn blocks in `packages/web/e2e/contrast-audit.spec.ts` (around L379-383 and L507-512) from `console.warn(...)` to `expect(fontSizeViolations.length, ...).toBe(0)`, mirroring the contrast assertion shape exactly. Drop the "WARN-ONLY" comment.
- [ ] Update `TODO.md:140` to mark the validation pass landed and the warn-only ratchet closed.

### Verification

- `pnpm --filter @optimitron/web exec playwright test e2e/contrast-audit.spec.ts --reporter=list` must pass green locally.
- `pnpm check` clean.
- Don't run `next build`.

### Risks

- The 12px Humanity Manager regression case from round 2 must still fail-then-pass: keep `EMAIL_STYLES.smallMutedParagraph` whatever it currently is, but confirm the audit catches it if reintroduced. Don't break the regression intent.
- Be careful not to scatter `data-allow-small="footnote"` on borderline body copy to silence the audit. If you find yourself adding more than ~10 opt-outs across the codebase, STOP and re-categorize: most of those probably belong in PROSE → bump size.
- The audit walks `/demo#<slide>` — Sierra demo slides may have a lot of tiny chrome. Exempting all demo slides via the exemption set is acceptable since they're not campaign surfaces.

### Files likely to touch

- `packages/web/e2e/contrast-audit.spec.ts` (flip warn → fail, possibly add exemption set)
- `packages/web/src/components/adaptive/email-styles.ts` (raise sub-14 styles)
- `packages/web/src/lib/email/react-email-components.tsx`, `preview-envelope.ts`, `monthly-chain-digest-react-email.tsx`, `task-comment-notification-react-email.tsx` (per round-1 research log; raise or opt-out)
- Various campaign surfaces with `text-xs` / `text-[12px]` / inline `fontSize: 12`-`13` — fix in place
- `TODO.md` (close the ratchet)

Mike-approved tier: real work but well-scoped. Dispatch as a single Codex task.
