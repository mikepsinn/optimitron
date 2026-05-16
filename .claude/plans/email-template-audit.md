## Research log

### Protocol and local rules read

- Read `.claude/codex-delegation.md`.
  - Plan-first protocol requires this exact shape: Research log first, Brief, Current state ASCII diagram, Proposed state ASCII diagram, Step list, Risks, Files to touch, ALERTS, Agent log.
  - Plan-first protocol also requires WebSearch/WebFetch for current vendor/API/tool assumptions before drafting state diagrams.
  - Do not implement during this phase.
- Read `packages/web/AGENTS.md`.
  - Email/user-facing copy is public-facing and must stay campaign-first.
  - Avoid exact long-form prose assertions in broad browser tests; use focused email/template tests and generated `.email.md` previews for exact copy.
  - Do not run `next build`.
- Read canonical registry: `packages/web/src/lib/tasks/share-templates.ts`.
  - Recipient modes are `leader`, `humanity`, `one_human`, and `peer`.
  - Defaults are:
    - `leader` -> `lumbergh`
    - `humanity` -> `polite-reminder`
    - `one_human` -> `lumbergh-one-human`
    - `peer` -> `most-important-secret`
  - `getUsableShareTemplates()` filters by recipient mode plus non-empty `requiredTokens`.
  - `renderTemplate()` throws on unresolved placeholders, so migration should fail loudly if a template references a token the email path does not provide.

### Grep commands run

- `rg --files packages/web/src/lib/email packages/web/src/lib/tasks`
- `rg -n "SHARE_TEMPLATES|share-templates|renderTemplate|getUsableShareTemplates|pickDefaultShareTemplateId|getShareTemplate|buildTaskShareTokens" packages/web/src/lib/email packages/web/src/lib/tasks`
- `rg -n -g "*.ts" -g "*-react-email.tsx" "SHARE_TEMPLATES|share-templates|renderTemplate|getUsableShareTemplates|pickDefaultShareTemplateId|getShareTemplate|buildTaskShareTokens|Sign now|Vote yes|haven.?t voted|You haven.?t voted|Take 30 seconds|Please vote|Sign the 1% Treaty|vote on the 1% Treaty|late on a 30-second task|Dear President|Forward this|I love you" packages/web/src/lib/email`
- `rg -n -g "*-email.server.ts" -g "*-react-email.tsx" -g "*.email.md" "SHARE_TEMPLATES|share-templates|renderTemplate|getUsableShareTemplates|pickDefaultShareTemplateId|getShareTemplate|buildTaskShareTokens|Sign now|Vote yes|haven.?t voted|You haven.?t voted|Take 30 seconds|Please vote|Sign the 1% Treaty|vote on the 1% Treaty|late on a 30-second task|Dear President|Forward this|I love you" packages/web/src/lib/tasks`
- `rg -n "CampaignShareFooter|ShareFooter|EmailShareMessage|buildShareFooterText|buildShareMessage|getShareMessageParts|buildHumanReminderMessage|buildPresidentReminderMessage" packages/web/src`

### Local files read

- `packages/web/src/lib/tasks/share-templates.ts`
- `packages/web/src/lib/tasks/render-template.ts`
- `packages/web/src/lib/tasks/accountability.ts`
- `packages/web/src/lib/email/share-footer.tsx`
- `packages/web/src/lib/email/react-email-components.tsx`
- `packages/web/src/lib/email/post-vote-share-email.ts`
- `packages/web/src/lib/email/post-vote-share-react-email.tsx`
- `packages/web/src/lib/email/referral-first-conversion-email.ts`
- `packages/web/src/lib/email/referral-first-conversion-react-email.tsx`
- `packages/web/src/lib/email/monthly-chain-digest-email.ts`
- `packages/web/src/lib/email/monthly-chain-digest-react-email.tsx`
- `packages/web/src/lib/email/monthly-chain-digest.server.ts`
- `packages/web/src/lib/email/magic-link-render.ts`
- `packages/web/src/lib/email/preview-registry.ts`
- `packages/web/src/lib/email/task-notification.ts`
- `packages/web/src/lib/share-message.ts`
- `packages/web/src/lib/tasks/task-assignment-notification-email.server.ts`
- `packages/web/src/lib/tasks/task-assignment-react-email.tsx`
- `packages/web/src/lib/tasks/task-comment-notification-email.server.ts`
- `packages/web/src/lib/tasks/task-comment-notification-react-email.tsx`

### External WebSearch/WebFetch

Searches run on May 14, 2026:

- `site:react.email/docs best practices React Email components CSS responsive email 2026`
- `React Email best practices transactional emails 2025 accessibility preview plaintext`
- `site:react.email/docs components Tailwind React Email 2026`
- `site:react.email/docs utilities render plain text React Email 2026`

External sources used:

- React Email render utility docs: https://react.email/docs/utilities/render
  - Search result was crawled 6 days before May 14, 2026; no visible page-level last-updated date in fetched page.
  - Relevant point: React Email documents converting rendered email to plain text; the docs say plain-text email matters for recipients who cannot or choose not to view HTML email.
  - Audit impact: every migration must preserve the current `renderReactEmailBody()` HTML plus text path and verify generated `.email.md` previews, not only visual React output.
- React Email Tailwind component docs: https://react.email/docs/components/tailwind
  - Search result was crawled 6 days before May 14, 2026; no visible page-level last-updated date in fetched page.
  - Relevant point: docs show the current Tailwind wrapper is under React Email and mention Tailwind CSS 4.1.12 for the component.
  - Audit impact: this migration should not add new email CSS or styling framework changes. Keep it to copy sourcing.
- React Email changelog: https://react.email/docs/changelog
  - Visible recent entries include React Email 6.0.0 on April 16, 2026, Render 2.0.6 on April 9, 2026, and Tailwind 2.0.7 on March 31, 2026.
  - Relevant point: React Email 6.0.0 unified components and rendering utilities into the `react-email` package.
  - Repo state: `packages/web/package.json` currently declares `@react-email/components` `^1.0.9` and `react-email` `^5.2.9`; `pnpm-lock.yaml` resolves `@react-email/components` 1.0.10 and `react-email` 5.2.10.
  - Audit impact: do not combine this copy registry migration with a React Email 6 package migration. Note the package drift as a separate future dependency task.

### Current code findings

- No file under `packages/web/src/lib/email` imports `packages/web/src/lib/tasks/share-templates.ts`.
- `packages/web/src/lib/tasks/share-templates.ts` is currently used by task/accountability code and tests, not by outbound email modules.
- `packages/web/src/lib/share-message.ts` is the current hardcoded source for the generic "I love you..." referral/share message.
- `packages/web/src/lib/email/share-footer.tsx` renders `EmailShareMessage` from `getShareMessageParts(referralUrl)` and `buildShareFooterText()` from `buildShareMessage(referralUrl)`.
- `packages/web/src/lib/email/react-email-components.tsx` renders `CampaignShareFooter` from `buildShareMessage(referralUrl)` plus `EmailShareMessage`.
- `packages/web/src/lib/email/post-vote-share-react-email.tsx` embeds `EmailShareMessage`.
- `packages/web/src/lib/email/referral-first-conversion-react-email.tsx`, `packages/web/src/lib/tasks/task-assignment-react-email.tsx`, and `packages/web/src/lib/tasks/task-comment-notification-react-email.tsx` embed `CampaignShareFooter`.
- `packages/web/src/lib/email/monthly-chain-digest-react-email.tsx` has two direct hardcoded reminder builders:
  - `buildHumanReminderMessage(referralUrl)` -> one-human overdue voter reminder.
  - `buildPresidentReminderMessage()` -> leader overdue treaty signature reminder.
- Generated preview snapshots currently contain the hardcoded prose:
  - `packages/web/src/lib/email/monthly-chain-digest.email.md`
  - `packages/web/src/lib/email/post-vote-share.email.md`
  - `packages/web/src/lib/tasks/task-assignment.email.md`
  - `packages/web/src/lib/tasks/task-comment-notification.email.md`
- Potential registry issue discovered during audit: `sincere` and `task-notification` bodies reference `{treaty_url}`, but their `requiredTokens` do not list `treaty_url`. Any migration using either variant should fix or account for this before relying on `getUsableShareTemplates()`.

## Brief

The audit deliverable is a future implementation plan to migrate outbound email reminder/share prose away from hardcoded strings and onto the canonical `SHARE_TEMPLATES` registry in `packages/web/src/lib/tasks/share-templates.ts`.

The implementation phase should not rewrite all email content. It should only move reminder/share copy used by email share kits, digest reminder blocks, task assignment/comment footers, and post-vote/referral emails to registry-backed rendering while preserving HTML plus plain-text output and preview snapshots.

## Current state ASCII diagram

```text
packages/web/src/lib/tasks/share-templates.ts
  |-- used by tasks/accountability.ts and accountability tests
  `-- NOT used by outbound email modules today

packages/web/src/lib/share-message.ts
  |-- hardcoded generic "I love you..." referral message
  |
  |--> packages/web/src/lib/email/share-footer.tsx
  |      |-- EmailShareMessage()
  |      `-- buildShareFooterText()
  |
  `--> packages/web/src/lib/email/react-email-components.tsx
         `-- CampaignShareFooter()
              |-- monthly-chain-digest-react-email.tsx
              |-- referral-first-conversion-react-email.tsx
              |-- task-assignment-react-email.tsx
              `-- task-comment-notification-react-email.tsx

packages/web/src/lib/email/post-vote-share-react-email.tsx
  `-- EmailShareMessage() -> share-message.ts hardcoded prose

packages/web/src/lib/email/monthly-chain-digest-react-email.tsx
  |-- buildHumanReminderMessage() -> hardcoded one_human reminder
  |-- buildPresidentReminderMessage() -> hardcoded leader reminder
  `-- CampaignShareFooter() -> share-message.ts hardcoded prose

Generated snapshots:
  |-- email/monthly-chain-digest.email.md
  |-- email/post-vote-share.email.md
  |-- tasks/task-assignment.email.md
  `-- tasks/task-comment-notification.email.md
```

## Proposed state ASCII diagram

```text
packages/web/src/lib/tasks/share-templates.ts
  |-- registry of all reminder/share variants
  |-- recipient mode filter: leader | humanity | one_human | peer
  |-- requiredTokens validated before render
  `-- renderTemplate() throws on unresolved placeholders

              +--------------------------------+
              | email template render helper   |
              | tokens + template id + mode    |
              +--------------------------------+
                         |
                         v
packages/web/src/lib/email/share-footer.tsx
  |-- EmailShareMessage() -> SHARE_TEMPLATES variant
  `-- buildShareFooterText() -> same rendered variant

packages/web/src/lib/email/react-email-components.tsx
  `-- CampaignShareFooter() -> same SHARE_TEMPLATES variant
       |-- monthly-chain-digest-react-email.tsx
       |-- referral-first-conversion-react-email.tsx
       |-- task-assignment-react-email.tsx
       `-- task-comment-notification-react-email.tsx

packages/web/src/lib/email/post-vote-share-react-email.tsx
  `-- one_human SHARE_TEMPLATES variant

packages/web/src/lib/email/monthly-chain-digest-react-email.tsx
  |-- one_human SHARE_TEMPLATES variant for late employee reminders
  |-- leader SHARE_TEMPLATES variant for late president reminders
  `-- CampaignShareFooter() -> one_human SHARE_TEMPLATES variant

Generated snapshots are regenerated from registry-backed React Email output.
```

## Step list

- [ ] Migrate `packages/web/src/lib/email/share-footer.tsx`.
  - Recipient mode: `one_human`.
  - Template variant: `sincere`.
  - Reason: this file owns `EmailShareMessage()` and `buildShareFooterText()`, the compact forwardable message currently backed by `share-message.ts`.
  - Required implementation detail: pass `target_name` as a generic recipient value such as `you` or add an explicit named-recipient input; pass `treaty_url` as the referral URL; fix `sincere.requiredTokens` to include `treaty_url` or do not rely on `getUsableShareTemplates()` for this variant until fixed.
  - Verification: `packages/web/src/lib/email/__tests__/share-footer.test.ts` plus regenerated email previews that include this footer.

- [ ] Migrate `packages/web/src/lib/email/react-email-components.tsx`.
  - Recipient mode: `one_human`.
  - Template variant: `sincere`.
  - Reason: `CampaignShareFooter()` is the shared footer used by digest, referral-first-conversion, task assignment, and task comment emails.
  - Required implementation detail: build share-channel URLs from the same rendered registry body used in the visible email and plaintext fallback so SMS, WhatsApp, mailto, and X do not drift.
  - Verification: existing email tests that assert footer text, plus generated `.email.md` previews.

- [ ] Migrate `packages/web/src/lib/email/post-vote-share-react-email.tsx`.
  - Recipient mode: `one_human`.
  - Template variant: `sincere`.
  - Reason: the email is a forward kit to two humans after a YES vote; it currently embeds `EmailShareMessage()`.
  - Required implementation detail: keep the body forward-friendly and keep the button URL equal to the same referral URL used in the rendered template.
  - Verification: `packages/web/src/lib/email/__tests__/post-vote-share-email.test.ts` and `packages/web/src/lib/email/post-vote-share.email.md`.

- [ ] Migrate `packages/web/src/lib/email/referral-first-conversion-react-email.tsx`.
  - Recipient mode: `one_human`.
  - Template variant: `sincere`.
  - Reason: the message tells the referrer to keep sharing after first conversion and includes `CampaignShareFooter()`.
  - Required implementation detail: this module can inherit most rendering changes through `CampaignShareFooter()`, but still needs preview/test review because its copy context frames the share ask.
  - Verification: `packages/web/src/lib/email/__tests__/referral-first-conversion-email.test.ts` and regenerated preview markdown.

- [ ] Migrate `packages/web/src/lib/email/monthly-chain-digest-react-email.tsx`.
  - Recipient mode and template variant for late employee reminders: `one_human` -> `lumbergh-one-human`.
  - Recipient mode and template variant for late president reminders: `leader` -> `lumbergh`.
  - Recipient mode and template variant for the footer: `one_human` -> `sincere`.
  - Reason: this file contains the only direct hardcoded reminder builders found in the audit, plus it uses `CampaignShareFooter()`.
  - Required implementation detail: decide whether digest reminders use rich task-derived tokens or a smaller low-token variant. `lumbergh-one-human` and `lumbergh` preserve the registry defaults but require more tokens than the digest currently carries. If implementation cannot provide truthful tokens, switch the specific digest reminder entries to a lower-token registry variant and document why in this plan before coding.
  - Verification: `packages/web/src/lib/email/__tests__/monthly-chain-digest-email.test.ts` and `packages/web/src/lib/email/monthly-chain-digest.email.md`.

- [ ] Migrate `packages/web/src/lib/email/monthly-chain-digest-email.ts`.
  - Recipient modes and variants: same as monthly digest React component: `one_human` -> `lumbergh-one-human`, `leader` -> `lumbergh`, footer `one_human` -> `sincere`.
  - Reason: the preview fixture must provide whatever token data the React email needs to render registry-backed digest reminders.
  - Required implementation detail: keep preview fixture values obviously sample data and avoid fake production stats that look real.
  - Verification: `/dev/email/monthly-chain-digest?raw=1&full=1` and regenerated markdown preview.

- [ ] Migrate `packages/web/src/lib/email/monthly-chain-digest.server.ts`.
  - Recipient modes and variants: same as monthly digest React component.
  - Reason: production digest publishing must pass real token data for overdue employee and president reminders, not just preview data.
  - Required implementation detail: if using `lumbergh` for president reminders, enrich `loadOverduePresidentSnapshot()` or add a small token-building layer with real signer/task data. Do not invent placeholder military ratios or death counts in production emails.
  - Verification: focused monthly digest tests with realistic input; no `next build`.

- [ ] Migrate `packages/web/src/lib/tasks/task-assignment-react-email.tsx`.
  - Recipient mode: `one_human`.
  - Template variant: `sincere`.
  - Reason: this email includes `CampaignShareFooter()` when `recipientReferralUrl` is present.
  - Required implementation detail: keep task assignment body dynamic from the task description; only migrate the share footer prose.
  - Verification: `packages/web/src/lib/tasks/__tests__/task-assignment-notification-email.test.ts` and `packages/web/src/lib/tasks/task-assignment.email.md`.

- [ ] Migrate `packages/web/src/lib/tasks/task-assignment-notification-email.server.ts`.
  - Recipient mode: `one_human`.
  - Template variant: `sincere`.
  - Reason: preview fixture currently includes share/recruitment prose in the sample task description and passes `recipientReferralUrl` to the footer.
  - Required implementation detail: keep the fixture focused on showing the assignment email and the registry-backed footer. Do not duplicate the share-template body in the sample task description.
  - Verification: assignment email preview and test snapshots.

- [ ] Migrate `packages/web/src/lib/tasks/task-comment-notification-react-email.tsx`.
  - Recipient mode: `one_human`.
  - Template variant: `sincere`.
  - Reason: this email includes `CampaignShareFooter()` when `recipientReferralUrl` is present.
  - Required implementation detail: preserve sender signature behavior; do not replace actual comment text with registry prose.
  - Verification: `packages/web/src/lib/tasks/__tests__/task-comment-notification-email.test.ts` and `packages/web/src/lib/tasks/task-comment-notification.email.md`.

- [ ] Migrate `packages/web/src/lib/tasks/task-comment-notification-email.server.ts`.
  - Recipient mode: `one_human`.
  - Template variant: `sincere`.
  - Reason: preview fixture sends the footer through `recipientReferralUrl`.
  - Required implementation detail: keep comment message fixture separate from share-template output.
  - Verification: comment notification preview and tests.

- [ ] Update `packages/web/src/lib/tasks/share-templates.ts` only as needed for email rendering correctness.
  - Recipient modes and variants involved: `sincere` (`one_human`), `lumbergh-one-human` (`one_human`), `lumbergh` (`leader`).
  - Required implementation detail: add missing `treaty_url` to `sincere.requiredTokens` if `sincere` remains the compact share email variant. Audit any selected variant body for placeholders missing from `requiredTokens` before relying on filters.
  - Verification: `packages/web/src/lib/tasks/accountability.test.ts` plus any new focused email-template rendering tests.

- [ ] Regenerate affected email markdown snapshots after implementation.
  - Recipient modes and variants covered: all selected variants above.
  - Required command: `pnpm --filter @optimitron/web email:preview-md`.
  - Expected changed snapshots:
    - `packages/web/src/lib/email/monthly-chain-digest.email.md`
    - `packages/web/src/lib/email/post-vote-share.email.md`
    - `packages/web/src/lib/email/referral-first-conversion.email.md`
    - `packages/web/src/lib/tasks/task-assignment.email.md`
    - `packages/web/src/lib/tasks/task-comment-notification.email.md`
  - Verification: inspect generated markdown for unresolved `{token}` placeholders and plaintext/HTML parity.

## Risks

- The registry was built for task reminder dialogs, not email rendering. Some variants are much longer than the current compact email share footer. Mike should approve the chosen variant, especially `sincere` versus `lumbergh-one-human`, before implementation.
- `sincere` currently references `{treaty_url}` without listing `treaty_url` in `requiredTokens`. `task-notification` has the same apparent issue. This can make `getUsableShareTemplates()` falsely accept a template that later fails at `renderTemplate()`.
- Monthly digest leader reminders currently lack enough structured token data for the default `leader` template `lumbergh`. Providing truthful tokens may require more data plumbing from overdue signer tasks.
- Replacing the compact current share message with registry text may alter conversion behavior. This is a copy/product decision, not just a refactor.
- Email plaintext must continue to mirror HTML. React Email docs still treat plaintext output as important for clients or users that do not render HTML.
- Do not merge this with a React Email 6 package migration. The repo is on `@react-email/components` 1.0.x and `react-email` 5.2.x; React Email 6 unification is a separate dependency upgrade.
- Generated `.email.md` snapshots will change and need human copy review before any future commit because these are user-facing copy changes.
- Dashboard share surfaces still import `packages/web/src/lib/share-message.ts`. This plan only covers email modules. If the product goal becomes one campaign-wide share-copy source, add a separate dashboard migration step rather than smuggling it into the email audit.

## Files to touch

### Expected source changes for migration

- `packages/web/src/lib/tasks/share-templates.ts`
- `packages/web/src/lib/tasks/render-template.ts`
- `packages/web/src/lib/tasks/accountability.ts`
- `packages/web/src/lib/email/share-footer.tsx`
- `packages/web/src/lib/email/react-email-components.tsx`
- `packages/web/src/lib/email/post-vote-share-react-email.tsx`
- `packages/web/src/lib/email/referral-first-conversion-react-email.tsx`
- `packages/web/src/lib/email/monthly-chain-digest-react-email.tsx`
- `packages/web/src/lib/email/monthly-chain-digest-email.ts`
- `packages/web/src/lib/email/monthly-chain-digest.server.ts`
- `packages/web/src/lib/tasks/task-assignment-react-email.tsx`
- `packages/web/src/lib/tasks/task-assignment-notification-email.server.ts`
- `packages/web/src/lib/tasks/task-comment-notification-react-email.tsx`
- `packages/web/src/lib/tasks/task-comment-notification-email.server.ts`

### Generated preview snapshots expected to change

- `packages/web/src/lib/email/monthly-chain-digest.email.md`
- `packages/web/src/lib/email/post-vote-share.email.md`
- `packages/web/src/lib/email/referral-first-conversion.email.md`
- `packages/web/src/lib/tasks/task-assignment.email.md`
- `packages/web/src/lib/tasks/task-comment-notification.email.md`

### Focused tests expected to change

- `packages/web/src/lib/email/__tests__/share-footer.test.ts`
- `packages/web/src/lib/email/__tests__/post-vote-share-email.test.ts`
- `packages/web/src/lib/email/__tests__/referral-first-conversion-email.test.ts`
- `packages/web/src/lib/email/__tests__/monthly-chain-digest-email.test.ts`
- `packages/web/src/lib/tasks/__tests__/task-assignment-notification-email.test.ts`
- `packages/web/src/lib/tasks/__tests__/task-comment-notification-email.test.ts`
- `packages/web/src/lib/tasks/accountability.test.ts`

### Email module files audited but no migration change expected

- `packages/web/src/lib/email/batch.ts`
- `packages/web/src/lib/email/can-send.server.ts`
- `packages/web/src/lib/email/coordination-feedback-note.ts`
- `packages/web/src/lib/email/email-log.server.ts`
- `packages/web/src/lib/email/email-urls.ts`
- `packages/web/src/lib/email/from-address.ts`
- `packages/web/src/lib/email/inbound-monitor-forward.ts`
- `packages/web/src/lib/email/inbound-received-dispatch.ts`
- `packages/web/src/lib/email/inbound-reply.ts`
- `packages/web/src/lib/email/inbound-unsubscribe.ts`
- `packages/web/src/lib/email/magic-link-email.ts`
- `packages/web/src/lib/email/magic-link-react-email.tsx`
- `packages/web/src/lib/email/magic-link-render.ts`
- `packages/web/src/lib/email/placeholders.ts`
- `packages/web/src/lib/email/preview-envelope.ts`
- `packages/web/src/lib/email/preview-registry.ts`
- `packages/web/src/lib/email/render-react-email.ts`
- `packages/web/src/lib/email/resend-webhook.ts`
- `packages/web/src/lib/email/resend.ts`
- `packages/web/src/lib/email/scopes.ts`
- `packages/web/src/lib/email/send-deduped-email.server.ts`
- `packages/web/src/lib/email/suppression.server.ts`
- `packages/web/src/lib/email/task-notification.ts`
- `packages/web/src/lib/email/unsub-token.ts`
- `packages/web/src/lib/email/unsub-url.ts`
- `packages/web/src/lib/email/wishonia-signature.ts`

## ALERTS

## Agent log

## Codex critique (round 1)

This is a useful audit, but the migration plan is not ready to execute as written. The hardcoded-copy inventory is mostly right; the variant/data mapping is the weak part. The plan treats "template exists" as close to "template is usable from this email path", and those are not the same thing.

### Variant existence versus usable tokens

- `sincere` exists and supports `leader`, `humanity`, and `one_human`. It is buildable for `post-vote-share-react-email.tsx`, `share-footer.tsx`, and `CampaignShareFooter()` only if the implementation renders with an explicit token bag containing both `target_name` and `treaty_url`. Those modules currently have `referralUrl`, but they do not have a real target name. Passing `target_name: "you"` would render "Hi you.", which is not a neutral refactor of the current no-name forward message. The plan should either require a no-name email-share variant that preserves the current copy shape, or require a real named-recipient input before choosing `sincere`.
- The plan calls out `sincere.requiredTokens` missing `treaty_url`, but that is not just a one-template cleanup. Many registry bodies rely on `{treaty_url}` while leaving it out of `requiredTokens` because `buildTaskShareTokens()` always returns a default URL. If email rendering skips `buildTaskShareTokens()` and uses ad hoc minimal token bags, the email helper must validate every placeholder in the selected body before rendering, not rely only on `requiredTokens`.
- `lumbergh-one-human` exists and supports `one_human`, but it is not buildable from the current monthly digest employee data. It requires `target_name`, `deaths_from_delay`, `trial_capacity_multiplier`, `eradication_years_status_quo`, `eradication_years_treaty`, `treaty_hale_gain`, and `lifetime_income_gain`. The digest input has display names/counts/referral URL, and the server currently selects only `recipientName` for overdue invitations. There is no truthful `deaths_from_delay` value in that path.
- `lumbergh` exists and supports `leader` and `humanity`, but it is not buildable from the current monthly digest president data. It requires `target_name`, `deaths_from_delay`, `mil_to_trials_ratio`, and `mil_synonym`. The server snapshot currently returns only president display name and country label. It does not fetch country code, due date/current delay, military budget, current lives lost, or a military-to-trials ratio source.
- `post-vote-share-react-email.tsx` currently only composes `EmailShareMessage(referralUrl)`. If `EmailShareMessage` is migrated centrally, this file may not need a separate direct migration step. If it does get a direct step, the plan should say whether it is replacing the shared component or just verifying the inherited behavior.

### Recipient modes are section-level, not email-level

- The plan is right that monthly digest cannot be handled as one email-level template. It has at least three distinct copy surfaces: late employee reminder, late president reminder, and the share footer. Those need independent `recipientMode` and template decisions.
- The plan partially handles this for `monthly-chain-digest-react-email.tsx`, but it still phrases later steps as "same as monthly digest React component" without specifying the data contract each section must receive. The input type and server loader need per-section token state or selected low-token variants; otherwise the React component cannot know whether it can render the rich template.
- The employee reminder currently says `Hi [name]`, so `one_human` is defensible. If the product intent is "personal-chain content" rather than a named-human reminder, the plan should explicitly decide between `humanity` and `one_human` instead of assuming the default one-human Office Memo variant.
- `peer` should not be used for these email footers unless the desired output is the no-link "most important secret" prompt. The current post-vote and footer flows need a referral URL, so `one_human` or a dedicated email-share mode is the right family.

### Token-building cost is under-scoped

- `buildTaskShareTokens()` is task-shaped. It needs task/title/target/delay/loss inputs and optionally country, budgets, leader handle, citizen name, and treaty URL. Generic referral emails do not have task context. The plan needs to say "render selected low-token email variants with explicit token bags" or add a proper `buildEmailShareTokens()` helper. It should not invite fake task values just to satisfy `buildTaskShareTokens()`.
- The monthly digest data expansion is more than a small implementation detail. For employee reminders, the current invitation query would at least need created-at/delay semantics and a defensible lives-lost model, or the plan should choose a low-token variant. For president reminders, `loadOverduePresidentSnapshot()` would need task due dates plus country/leader budget data, or the plan should choose a leader-compatible low-token variant such as a `target_name` + `treaty_url` template.
- The plan's line "decide whether digest reminders use rich task-derived tokens or a smaller low-token variant" is too late and too vague. That decision determines the source changes, test fixtures, preview snapshots, and production failure behavior. It should be a phase-zero decision before any migration step.

### Tests need a real strategy

- Existing tests assert specific copy strings. Monthly digest tests look for "You are late on a 30-second task" and "Dear President [name]"; share footer tests look for "vote on this stupid treaty"; post-vote tests assert the forward prompt and URL behavior. Switching to `sincere`, `lumbergh`, or `lumbergh-one-human` will change those strings.
- Listing tests under "Verification" is not enough. The plan should choose one of two strategies per module:
  - Preserve current output by adding/selecting an email-share variant that matches the old copy closely, then keep most assertions stable.
  - Accept copy changes, update tests to assert the selected `templateId`, `recipientMode`, essential URL/button behavior, plaintext/HTML parity, and no unresolved `{token}` placeholders.
- Because these are user-facing copy changes, generated `.email.md` snapshot updates need human copy review before commit. The plan says that in Risks, but the step list should make it an explicit gate.

### Phasing should be per-email, but not in the current order

- This should not be all-or-nothing. The safest order is:
  1. Add/verify a tiny render helper that validates body placeholders against the supplied token bag and can render an explicitly chosen template.
  2. Migrate the generic `EmailShareMessage` / `buildShareFooterText` path with a low-token or copy-preserving variant, because the data is already available (`referralUrl`) and this covers post-vote/share footers.
  3. Verify `post-vote-share-react-email.tsx` as an inherited consumer, not as a separate behavior rewrite unless needed.
  4. Migrate task assignment/comment footers through `CampaignShareFooter()` only after the shared footer output is approved.
  5. Leave monthly digest last, because it is the only proposed migration that may require new server data and new digest input fields.
- The current step list starts as per-file, but the shared footer change will fan out into several email previews at once. The plan should acknowledge that as a shared rollout, not pretend each consumer can be independently migrated after `CampaignShareFooter()` changes.

### Backstop policy is missing

- "renderTemplate throws" is a good development invariant, but it is not a production policy. If a monthly cron send hits an unbuildable rich template, should the whole email fail, should the optional reminder block be omitted, or should it fall back to a low-token template? The plan needs to say.
- Recommended policy: tests/previews fail loud on unresolved placeholders; production rendering validates the selected template before send; optional reminder/footer blocks fall back to a pre-approved low-token template for the same mode or are skipped with logging; required post-vote/share email content should fail the send only if no approved fallback exists.
- Do not let `getUsableShareTemplates()` silently pick a different template in production unless the chosen fallback is visible in tests. Random fallback would make email copy hard to review and snapshot.

## Codex critique summary

1. The selected variants exist, but `lumbergh-one-human` and `lumbergh` are not buildable from the current monthly digest data. Monthly digest needs either explicit data-fetch expansion or lower-token variants before implementation.
2. `sincere` is only safe for footer/post-vote paths if the plan defines a real token policy. Current modules have `referralUrl`, not a recipient name, and "Hi you." would be a copy regression.
3. The plan needs explicit test and fallback strategy: update/preserve string assertions intentionally, fail loud in previews/tests, and define what production does when a chosen template cannot render.

## Mike approved (round 2)

Mike's decision: use lumbergh + expand data fetch. ~5 lines of new code to extend the monthly-chain-digest Prisma query.

Approved scope:
1. Monthly chain digest migrates to use `lumbergh` template variant from `packages/web/src/lib/tasks/share-templates.ts`. Extend the data-fetch path in `monthly-chain-digest.server.ts` to include `recipient.person.displayName` (the `target_name` token) and to compute `deaths_from_delay` from existing task delay metrics.
2. Other emails identified in the round-1 plan (post-vote-share, referral-first-conversion, task-comment-notification) migrate to recipient-mode-matched templates whose `requiredTokens` are already buildable from each module's current data shape.
3. Rendered output text changes for the lumbergh-style emails. Re-run `pnpm --filter @optimitron/web email:preview-md` after source changes to regenerate the `.email.md` snapshots.
4. Tests update: existing `monthly-chain-digest-email.test.ts` string assertions get updated to match the lumbergh template variant. Other email tests follow.

NOT in scope: A/B testing infrastructure, instrumented click-through, variant rotation. The "expand data fetch" path is the cheap reasonable default; A/B testing can layer on later if we want data.

NOT in scope: changing `share-templates.ts` itself. Use what's there.
