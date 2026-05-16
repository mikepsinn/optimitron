# Login Form UX Fixes Plan

## Research log

Research date: 2026-05-14.

WebSearch queries run:
- `site:authjs.dev email provider sendVerificationRequest Auth.js rate limit magic link`
- `site:next-auth.js.org providers email sendVerificationRequest NextAuth rate limit magic link`
- `site:authjs.dev reference nextjs signIn email provider sendVerificationRequest`
- `site:authjs.dev changelog Auth.js email provider signIn rate limit magic link`
- `Auth.js Email provider sendVerificationRequest documentation`
- `NextAuth.js Email Provider sendVerificationRequest documentation`
- `Auth.js signIn redirect false error documentation next-auth react signIn`
- `site:authjs.dev rate limit sign in Auth.js`
- `site:authjs.dev abuse protection rate limiting Auth.js email provider`
- `site:authjs.dev security rate limit Auth.js`
- `site:next-auth.js.org rate limit email provider NextAuth`
- `next-auth v4.24.13 signin email createVerificationToken sendVerificationRequest GitHub`
- `unpkg next-auth@4.24.13 core routes signin.js sendVerificationRequest`

WebFetch / docs checked:
- https://authjs.dev/getting-started/authentication/email, fetched 2026-05-14. No visible last-updated date. Current Auth.js docs say email/magic-link login sends a verification token, requires a database for verification tokens, and redirects to a check-email page after the request. No built-in rate-limit pattern found.
- https://authjs.dev/reference/core/providers/email, fetched 2026-05-14. No visible last-updated date. Current provider API exposes `sendVerificationRequest(params)` and params include `identifier`, `url`, `token`, `expires`, `provider`, `theme`, and `request`.
- https://authjs.dev/reference/nextjs/react, fetched 2026-05-14. No visible last-updated date. Current Auth.js/NextAuth React API says client `signIn()` handles CSRF, can return `SignInResponse` when `redirect: false`, and v5 deprecates `callbackUrl` in favor of `redirectTo`.
- https://next-auth.js.org/providers/email, fetched 2026-05-14. No visible last-updated date. v4 docs show `EmailProvider({ sendVerificationRequest(...) { ... } })` as the customization point for magic-link email delivery.
- https://next-auth.js.org/getting-started/client#using-the-redirect-false-option, fetched 2026-05-14. No visible last-updated date. v4 docs say `redirect: false` is available for `credentials` and `email` providers and returns `{ error, status, ok, url }`.
- https://github.com/nextauthjs/next-auth/security/advisories/GHSA-5jpx-9hw9-2fx4, published 2025-10-27. Relevant recent advisory for email sign-in delivery. Affected `<4.24.12`; repo has `^4.24.11` in `packages/web/package.json`, but installed package observed locally is `next-auth@4.24.13`, which is patched. This plan should not downgrade or loosen email identifier handling.
- https://github.com/nextauthjs/next-auth/releases/tag/next-auth%404.24.14, released 2026-04-14. Last-six-month release found; bugfix is GitHub OAuth issuer handling, not email/magic-link rate limiting.
- https://app.unpkg.com/next-auth%404.24.11/files/src/core/routes/signin.ts, fetched 2026-05-14. v4 source confirms email sign-in normalizes the email, calls the sign-in callback with `verificationRequest: true`, then calls the email sign-in helper. The exact helper source was not cleanly fetched, but current app wiring and v4 docs still make `sendVerificationRequest` / adapter verification-token creation the relevant server path.

React / react-hook-form search: skipped. `AuthForm.tsx` is a custom client component using `next-auth/react` directly, not React Hook Form and not a React server-action form, so RHF or `useFormStatus` guidance would add abstraction without helping this bug.

Codebase research:
- Read `packages/web/AGENTS.md`: Prisma is allowed in `@optimitron/web`; public UI should migrate toward simple treaty style.
- Read `docs/h2ewd.md` before proposing public confirmation copy.
- Read `packages/web/src/components/auth/AuthForm.tsx` in full. Current email flow uses `pendingAction` and derives `isLoading = pendingAction !== null` at line 70. The email input is disabled only while pending at line 318, and submit is disabled only while pending at line 324. `handleSubmit` resets `pendingAction` in `finally` at line 176, so after successful send the form is re-enabled while the success alert remains. Success rendering is an `AlertCard` plus optional footer above the form at lines 236-245. Google renders before the divider and email form at lines 275-296. Spacing hotspots are container `p-6 sm:p-7` / `p-5`, heading `mb-5`, alert/footer/referral `mb-4`, outer `space-y-4`, email form `space-y-4`, label wrapper `space-y-2`.
- Read `packages/web/src/app/auth/signin/page.tsx`. Magic-link verification error string is `That magic link is invalid or has expired.`.
- Read AuthForm callers with `rg "AuthForm" packages/web/src -n`. Callers vary `callbackUrl`, `compact`, `variant`, `hideContainer`, title/subtitle, and button labels:
  - `/auth/signin` uses default container, default labels, default variant, providers from server, referral/share query params.
  - `TreatyVoteFlow.tsx` uses `compact`, `hideContainer`, `title={null}`, campaign labels, `emailSuccessFooter`, and vote callback/ref/share params.
  - `ReferendumSignatureBox.tsx` uses `compact`, sometimes `variant="document"`, custom finish-voting labels, referendum callback, and referral code.
  - `TreatyNameSignatureBox.tsx` uses `callbackUrl="/treaty"` and `compact`.
  - `HumanityVGovernmentVerdictVote.tsx` uses `compact`, `variant="document"`, custom finish-voting labels.
  - `RepresentedPersonConversionForm.tsx` and `EndorseForm.tsx` use `compact`, `hideContainer`, verify labels, and route callbacks.
  - Wishocracy prompt components use `compact` and wishocracy callback/referral.
- Read server auth path:
  - `packages/web/src/lib/auth.ts` wires `EmailProvider({ sendVerificationRequest: sendMagicLinkEmail })`.
  - `packages/web/src/lib/email/magic-link-email.ts` sends the React email through Resend and already reads `prisma.user.findUnique`.
  - There is no app server action named `sendMagicLink`; the client posts through NextAuth's email provider by calling `signIn("email", { email, callbackUrl, redirect: false })`.
  - `packages/db/prisma/schema.prisma` has `VerificationToken` with `identifier`, `token`, `expires`, `createdAt`, `updatedAt`, `deletedAt`, `@@unique([identifier, token])`, and indexes on `expires` / `deletedAt`. No schema change is needed for the first implementation.
- Existing test coverage found no direct `AuthForm` tests. Existing auth tests mock `sendMagicLinkEmail` in `packages/web/src/lib/__tests__/auth-callbacks.test.ts`.

## Brief

Fix the shared login form so one successful magic-link request becomes a terminal, non-clickable confirmation state; add a server-side per-email rate limit so scripted repeat requests do not send repeated magic-link emails; and reduce vertical spacing around the shared auth form so vote/slider flows keep the submit control above the fold on common mobile viewports.

This is one coordinated change because the client hide prevents normal double-click/retry behavior, the server limit prevents bypasses, and the spacing pass keeps the new confirmation state in the same visual slot as the removed controls.

## Current state ASCII diagram

Email request flow:

```text
AuthForm client
  email submit
    |
    v
next-auth/react signIn("email", { email, callbackUrl, redirect: false })
    |
    v
NextAuth email provider route
    |
    +--> normalize email / signIn callback
    |
    v
verification token created by adapter
    |
    v
EmailProvider.sendVerificationRequest
    |
    v
packages/web/src/lib/email/magic-link-email.ts
    |
    +--> prisma.user.findUnique(email)
    |
    v
sendReactEmail(scope: "magic_link", skipSuppressionCheck: true)
    |
    v
Resend
```

Current form state machine:

```text
[before-submit]
  pendingAction=null
  isLoading=false
  error=""
  infoMessage=""
  form visible: Google + divider + email input + submit
        |
        | submit email
        v
[submitting]
  pendingAction="magic"
  isLoading=true
  input/button disabled only while request is in flight
        |
        | success
        v
[submitted]
  pendingAction=null
  isLoading=false
  infoMessage="Check your email for a sign-in link."
  success alert appears above the still-visible form
  form is clickable again -> repeat sends possible
        |
        | user clicks submit again
        v
[submitting again]

[submitting]
        |
        | error
        v
[error]
  pendingAction=null
  isLoading=false
  error alert visible
  form visible and clickable again
```

Current layout stack:

```text
framing element / slider shell
  py-* and/or space-y-* from caller
    |
    v
AuthForm container
  p-5 or p-6 sm:p-7
  optional title block mb-5
  optional alert mb-4
  optional footer mb-4
  optional referral mb-4
  outer controls space-y-4
    Google button
    divider
    form space-y-4
      label/input space-y-2
      submit button
```

## Proposed state ASCII diagram

Email request flow with server limit:

```text
AuthForm client
  email submit
    |
    v
signIn("email", { email, callbackUrl, redirect: false })
    |
    v
NextAuth email provider route
    |
    v
rate-limit guard at server email path
  preferred insertion: createAuthAdapter().createVerificationToken wrapper
  fallback/defense-in-depth: sendMagicLinkEmail() guard before sendReactEmail
    |
    +--> deny if same normalized email has >=1 token/send in 60s
    +--> deny if same normalized email has >=5 tokens/sends in 24h
    |
    v
allowed: create token, send one email
denied: throw EmailSignin / signIn result error, no email send
```

Proposed form state machine:

```text
[before-submit]
  hasSubmitted=false
  pendingAction=null
  error=""
  form visible: Google + divider + email input + submit
        |
        | submit email
        v
[submitting]
  hasSubmitted=false
  pendingAction="magic"
  controls disabled while request is in flight
        |
        | success
        v
[submitted]
  hasSubmitted=true
  pendingAction=null
  error=""
  controls hidden: no Google, no divider, no email input, no submit
  centered confirmation rendered in the controls slot
  vertical position replaces the old form block instead of adding above it
        |
        | no visible resubmit path
        v
[terminal confirmation]

[submitting]
        |
        | error or rate-limited response
        v
[error]
  hasSubmitted=false
  pendingAction=null
  error alert visible
  full form restored for correction/retry
```

Proposed layout stack:

```text
caller shell
  keep existing shell shape, but reduce only auth-facing vertical excess
    |
    v
AuthForm
  smaller padding for compact/hideContainer contexts
  smaller heading/alert/referral margins
  controls gap reduced from space-y-4 to compact-aware gap
    |
    +-- before submit: Google / divider / email / submit
    |
    +-- after success: centered confirmation in same controls area
```

## Step list

- [ ] Add focused `AuthForm` tests in `packages/web/src/components/auth/AuthForm.test.tsx` or the repo's nearest existing component-test convention:
  - mock `next-auth/react` `signIn`;
  - assert initial render shows Google, email input, and submit when providers are enabled;
  - assert successful email submit calls `signIn("email", { email: trimmedEmail, callbackUrl, redirect: false })`;
  - assert after success the email input, submit button, divider, and Google button are gone and a centered confirmation remains;
  - assert a rejected/error `signIn` response restores the form and shows the error;
  - assert Google/demo loading behavior still disables other controls while pending.
- [ ] Update `packages/web/src/components/auth/AuthForm.tsx`:
  - introduce `hasSubmitted` state separate from `pendingAction`;
  - clear `hasSubmitted` at the start of a new submit attempt and whenever an error is set;
  - set `hasSubmitted=true` only after `signIn("email", ...)` returns without `result?.error`;
  - do not clear `hasSubmitted` in `finally`;
  - render the confirmation inside the main controls stack when `hasSubmitted` is true;
  - hide Google, demo, divider, email input, and submit button when `hasSubmitted` is true;
  - keep initial `initialError` behavior restoring/showing the form.
- [ ] Keep confirmation copy concise and existing-label compatible. Prefer reusing the current message text unless Mike wants copy changed:
  - main: `Check your email for a sign-in link.`
  - if `emailSuccessFooter` exists, render it under the confirmation in the same centered block.
- [ ] Add a server rate-limit helper in `packages/web/src/lib/auth/magic-link-rate-limit.server.ts` or `packages/web/src/lib/email/magic-link-rate-limit.server.ts`:
  - normalize email to lowercase/trimmed to match NextAuth's email-provider normalization expectations;
  - constants: `MAGIC_LINK_SHORT_WINDOW_MS = 60 * 1000`, `MAGIC_LINK_SHORT_CAP = 1`, `MAGIC_LINK_DAILY_WINDOW_MS = 24 * 60 * 60 * 1000`, `MAGIC_LINK_DAILY_CAP = 5`;
  - query existing `VerificationToken` rows by `identifier`, `deletedAt: null`, and `createdAt >= cutoff`;
  - use count thresholds carefully depending on insertion point:
    - if checking before `createVerificationToken`, deny when `shortCount >= 1` or `dailyCount >= 5`;
    - if checking inside `sendMagicLinkEmail` after token creation, deny when `shortCount > 1` or `dailyCount > 5` because the current request may already have inserted a token.
- [ ] Preferred server insertion: wrap `adapter.createVerificationToken` inside `createAuthAdapter()` in `packages/web/src/lib/auth-adapter.ts`:
  - call the helper before delegating to `adapter.createVerificationToken`;
  - throw a typed/local `MagicLinkRateLimitError` or ordinary `Error` with an internal message;
  - do not add a Prisma schema/table change without Mike approval.
- [ ] Add defense-in-depth in `packages/web/src/lib/email/magic-link-email.ts` if the adapter wrapper cannot reliably type against the NextAuth adapter:
  - call the helper before `sendReactEmail`;
  - accept the minor downside that rate-limited attempts may leave unused token rows;
  - still prevents duplicate email sends, which is the required security property.
- [ ] Update `packages/web/src/app/auth/signin/page.tsx` error mapping only if implementation can distinguish rate-limit errors through NextAuth's returned `error` code. Proposed user-facing string: `We already sent that email a sign-in link. Wait a minute, then try again.`
  - Do not replace the existing `Verification` string: `That magic link is invalid or has expired.`
  - If NextAuth v4 collapses server send failures to generic `EmailSignin`, keep the client fallback generic unless a safe custom error code is verified.
- [ ] Add server tests:
  - unit-test the rate-limit helper with mocked Prisma counts for allowed, 60-second denied, and 24-hour denied cases;
  - if using `createAuthAdapter` wrapper, extend `packages/web/src/lib/__tests__/auth-callbacks.test.ts` or create a focused auth-adapter test that verifies the delegate is not called when over limit;
  - if using `sendMagicLinkEmail` fallback, test that over-limit path does not call `sendReactEmail`.
- [ ] Reduce spacing in `AuthForm.tsx` with compact-aware classes:
  - `containerClassName`: consider compact defaults of `p-4 sm:p-5` instead of default `p-6 sm:p-7`; document variant `p-4` instead of `p-5`;
  - title wrapper: `mb-4` default, `mb-3` compact instead of fixed `mb-5`;
  - alerts/footer/referral: `mb-3` compact instead of fixed `mb-4`;
  - outer controls: compact `space-y-3` instead of fixed `space-y-4`;
  - form: compact `space-y-3` instead of fixed `space-y-4`;
  - label/input wrapper: `space-y-1.5` compact instead of fixed `space-y-2`.
- [ ] Audit caller spacing after the shared reductions:
  - `TreatyVoteFlow.tsx` auth shells at lines around 625-664 and 1001-1012 use `contentClassName="max-w-2xl justify-center py-10 sm:py-12"` plus local `space-y-4`; propose reducing auth-state shell content padding to `py-6 sm:py-8` if mobile screenshots still push the submit below the fold;
  - `HumanityVGovernmentVerdictVote.tsx` wraps `AuthForm` in `mt-5`; propose `mt-4` only if needed;
  - avoid changing all callers blindly; most benefit should come from shared compact AuthForm spacing.
- [ ] Verification after implementation:
  - run focused component/server tests added above;
  - run `pnpm --filter @optimitron/web exec tsc --noEmit` or `typecheck:fast` only, not `next build`;
  - capture UI screenshots before commit per AGENTS: at minimum `/auth/signin`, treaty vote auth prompt, and one document variant auth prompt on mobile and desktop;
  - generate/update `packages/web/output/playwright/review/latest.html`;
  - ask Mike to review screenshots and changed copy before committing.

## Risks

- NextAuth v4 may collapse thrown email-provider errors to `EmailSignin`, making it hard to show a specific rate-limit string without deeper customization. The plan preserves a generic client error unless a specific code path is verified.
- Counting `VerificationToken` rows is good enough for the initial no-schema-change guard, but it is not a perfect send log. It counts token creation, not guaranteed email delivery. This is acceptable for abuse prevention because it errs on suppressing repeated sends.
- The `VerificationToken` model lacks an `identifier` index. For current expected auth volume this is acceptable; adding an index would be a Prisma schema change and needs explicit human approval.
- Race condition: two truly concurrent requests can both pass a count-before-insert check. If that becomes material, use a DB-backed lock/claim row or schema-supported uniqueness window, but that is beyond this first plan and would require schema approval.
- Hiding Google after email success is requested, but it removes a fallback path if the user mistyped their email and only notices after submit. Error paths restore the form; successful typo correction would require reload or a future "Use another email" control, which the user did not request.
- Spacing reductions in shared `AuthForm` affect all callers, including Wishocracy and endorsement/plaintiff flows. Screenshots should cover campaign-critical and document variants.
- User-facing confirmation/rate-limit copy falls under copy-review rules. Do not commit copy changes until Mike approves them.

## Files to touch

- `packages/web/src/components/auth/AuthForm.tsx`
- `packages/web/src/components/auth/AuthForm.test.tsx` or nearest existing component-test location
- `packages/web/src/lib/auth-adapter.ts`
- `packages/web/src/lib/auth/magic-link-rate-limit.server.ts` or `packages/web/src/lib/email/magic-link-rate-limit.server.ts`
- `packages/web/src/lib/__tests__/auth-callbacks.test.ts` or a new focused auth-adapter/rate-limit test file
- `packages/web/src/lib/email/magic-link-email.ts` only if adapter-level insertion is not sufficient or for defense-in-depth
- `packages/web/src/lib/email/__tests__/magic-link-email.test.ts` only if `sendMagicLinkEmail` receives the guard
- `packages/web/src/app/auth/signin/page.tsx` only if a distinct rate-limit error can be surfaced safely
- `packages/web/src/components/landing/TreatyVoteFlow.tsx` only if shared AuthForm spacing is not enough after screenshot review

## ALERTS

## Agent log

## Mike approved (round 2 — supersedes round 1 scope)

Round 1 included a server-side rate-limit + race-condition design. Mike rejected the rate-limit framing: the actual bug was the form staying clickable after submit, not absent rate limiting. Drop the rate-limit work entirely.

Approved scope:
1. Hide the email input, submit button, AND Google button after a successful sign-in-link send. Render a centered confirmation in their slot at the same vertical position.
2. Confirmation copy: `"Sign-in link sent. Check spam if you don't see it within 60 seconds."` (decided in chat).
3. ADD an `aria-live="polite"` (or `role="status"`) region announcing the confirmation to screen readers (critique caught this).
4. Spacing pass on the AuthForm container per the original plan: reduce vertical gap between slider/framing element and submit button so submit stays above the fold on common mobile viewports.
5. On error, restore the form so the user can correct + retry.
6. Run `pnpm --filter @optimitron/web copy:preview` after source changes to regenerate the affected page.logged-out.md snapshots.

NOT in scope (deferred):
- Server-side rate limiting on magic-link sends. Mike's call: the hide-form-after-submit fix is sufficient because the bug was client-side button-mashing, not scripted abuse.
- Race-condition handling on concurrent submits. Same reasoning.
- Retry UX for delivery failures (the critique's point 2). User can hard-reload if needed; we ship without an explicit retry button until we see signal it matters.

## Codex critique (round 1)

### 1. Rate-limit window and legitimate retry behavior

The 60-second short window is directionally right for accidental double-clicks, but the plan is too absolute about ">=1 token/send in 60s" without designing the retry experience. A user can hit a real network failure after the server creates a `VerificationToken` or even after Resend accepts the email, while `AuthForm.tsx` catches the client-side error and restores the form. Their immediate second attempt would then be denied by the token-count guard even though, from the user's point of view, no email was sent. That is a hostile bounce-back case.

The daily cap of 5 does stop 10 sequential sends to the same normalized address, assuming the count-before-insert race does not fire. It does not stop 10-message abuse across 10 addresses, and it does not stop two concurrent same-address requests from both passing a pre-insert count. That may be acceptable for this first fix, but the plan should say "per-address duplicate-send mitigation", not "abuse protection" in the broader sense.

If the UI becomes terminal after success, the plan needs a deliberate retry policy: either keep the form hidden but offer an explicit "Use another email" or "Send again after 60 seconds" control, or state that reload is the only retry path and make the server error copy usable. Right now it proposes terminal UI plus a server limit, which is good for preventing repeated sends but bad for the genuine "email did not arrive / request failed" path.

### 2. `hasSubmitted` state across navigation, reloads, and focus return

`hasSubmitted` is in-memory client state only. If the user opens their mail app and returns to the same tab without unloading the page, the terminal confirmation state should remain. If they hard reload, navigate away and back, or the browser discards the page, `hasSubmitted` resets and the form returns. That is not inherently wrong, but the plan should explicitly rely on server-side enforcement for those reset cases.

The plan does not handle the "navigate away mid-submit" case. The request may already have reached NextAuth, may be aborted before token creation, or may have sent the email while the component is gone. When the user returns, the UI cannot know which happened. That reinforces the need for server behavior that distinguishes "we already sent it; check your inbox" from "we failed before sending; you can retry".

There is also a focus-management issue tied to the state machine: after success, the focused submit button is removed. Without moving focus to the confirmation region, keyboard and screen-reader users can end up with focus effectively dumped on the document body.

### 3. Server-side enforcement location and race behavior

`packages/web/src/lib/auth.ts` currently wires `EmailProvider({ sendVerificationRequest: sendMagicLinkEmail })`, and `packages/web/src/lib/auth-adapter.ts` currently only overrides `createUser`. The plan's preferred `createAuthAdapter().createVerificationToken` wrapper is the cleanest no-email-send insertion point, but it has no request context: no IP, no user agent, no callback URL, no host, and no delivery result. It can only rate-limit by token identifier.

The race condition is not a future theoretical edge. It is part of the bug class: two fast submits from the same browser or two tabs can hit separate serverless invocations. With a count-before-insert helper, both can see zero rows and both can send. With a post-insert `sendMagicLinkEmail` guard, two concurrent inserts can make both senders see `count > 1` and deny both, leaving the user with no email and two token rows. The plan's "if that becomes material" risk language undersells this.

If the first implementation stays schema-free, the plan should still require an atomic same-identifier critical section. Options to evaluate: a short Postgres advisory lock around count/create for `VerificationToken`, or a direct adapter override that does the count and `prisma.verificationToken.create` in one transaction. If that is too much for round 1, the plan should explicitly accept that this only reduces ordinary repeat sends and does not close concurrent repeat sends.

### 4. Spacing-pass blast radius

The plan correctly identifies many `AuthForm` callers, but some proposed shared spacing changes will not affect the most important cramped contexts. In `TreatyVoteFlow.tsx`, both auth prompts pass `hideContainer` and `title={null}`, so changing the AuthForm container padding and title margin does nothing there. The larger vertical cost in that route is the caller shell (`contentClassName="max-w-2xl justify-center py-10 sm:py-12"`), the explanatory copy block, and the remaining AuthForm control gaps.

Shared AuthForm spacing still has broad blast radius: `/auth/signin`, `TreatyVoteFlow`, `ReferendumSignatureBox`, `TreatyNameSignatureBox`, `HumanityVGovernmentVerdictVote`, `RepresentedPersonConversionForm`, `EndorseForm`, `WishocracyStatusBar`, and `WishocracyAuthPromptCard` all render the same component with different combinations of `compact`, `document`, and `hideContainer`. The plan says to avoid caller changes blindly, which is good, but the screenshot list should include at least one `hideContainer` grid context (`RepresentedPersonConversionForm` or `EndorseForm`) and one Wishocracy card if shared spacing changes land. Otherwise the "compact-aware" change can look fine in the treaty prompt while degrading another embedded surface.

Also, be careful with the wording "smaller padding for compact/hideContainer contexts": `hideContainer` currently resolves to just `w-full`, so there is no padding there to reduce. The implementation should use named class variables for `compact`, `document`, and `hideContainer` rather than editing the existing strings in place and hoping each caller benefits.

### 5. NextAuth advisories and version drift

Fresh WebSearch check on 2026-05-15:

- https://github.com/nextauthjs/next-auth/security/advisories lists GHSA-5jpx-9hw9-2fx4 published Oct 27, 2025, then older advisories from Nov 20, 2023 and earlier. I found no other nextauthjs/next-auth GitHub security advisory published in the last 12 months.
- https://github.com/nextauthjs/next-auth/security/advisories/GHSA-5jpx-9hw9-2fx4 says the email misdelivery advisory affects `<4.24.12` and `<5.0.0-beta.30`, patched in `4.24.12` and `5.0.0-beta.30`.
- https://github.com/nextauthjs/next-auth/releases/tag/next-auth%404.24.14 shows `next-auth@4.24.14` as the latest GitHub release, released Apr 14, 2026, with a GitHub OAuth issuer bugfix.

So the plan is right that the locked `4.24.13` is patched for GHSA-5jpx-9hw9-2fx4, but wrong if it implies `4.24.13` is still current. Local repo evidence is `packages/web/package.json` with `next-auth: ^4.24.11` and `pnpm-lock.yaml` resolving `next-auth@4.24.13`; a fresh non-frozen install would likely move to `4.24.14`. The plan should either add a small dependency-update step to move the lockfile to 4.24.14, or explicitly state that this UX/rate-limit change is verified against the current lockfile and not trying to upgrade NextAuth.

The 4.24.14 release notes do not indicate magic-link behavior changed, so I would not block this plan on a NextAuth upgrade. I would block it on not saying "4.24.13 is current."

### 6. Confirmation accessibility

The plan needs an accessibility requirement, not just centered confirmation copy. `AlertCard` currently renders a plain `div` with no `role`, no `aria-live`, and no focus target. If the success message moves inside the controls slot and the form controls disappear, screen readers may not announce that anything changed.

Add one of these to the plan: render the confirmation in a `role="status"` / `aria-live="polite"` region, or wrap the `AlertCard` with that role for this state. For errors, prefer `role="alert"` if the shared AlertCard can support it without unwanted side effects. Also move focus to the confirmation region after success with a ref and `tabIndex={-1}`, or at least test that focus is not left on a removed button.

### 7. Testing strategy gaps

The prompt says the plan does not mention tests, but the current plan does include a decent component/server test list. The missing tests are the ones that protect the hard edge cases above:

- `AuthForm` success confirmation is announced via `role="status"` or `aria-live`, and focus moves to the confirmation after the submit button disappears.
- A rejected `signIn("email")` response restores the full form and does not set `hasSubmitted`.
- A double submit while `pendingAction === "magic"` only calls `signIn` once from the component layer.
- Hard reload/navigation reset is covered by server tests, not by pretending `hasSubmitted` persists.
- Rate-limit helper tests cover boundary times exactly at 60s and just outside 60s, exactly at the daily cap and just below it, lower/trimmed normalization, and `deletedAt: null`.
- Adapter-level tests prove the delegate is not called when limited and is called exactly once when allowed.
- Concurrency needs either a real test of the chosen atomic mechanism or an explicit documented limitation. A mock count test is not enough to prove the race is handled.
- If the guard ends up in `sendMagicLinkEmail`, test the bad race-adjacent case where the current request has already inserted a token: one valid first request must still send, an over-limit request must not call `sendReactEmail`, and a Resend failure must not lock out legitimate immediate retry unless that is an intentional product choice.

## Codex critique summary

Top 3 issues by severity:

1. Server race: the current count-before-insert / post-insert fallback plan can still send duplicates or, worse, deny both concurrent sends. Decide whether round 1 needs an atomic same-identifier lock; if not, document the limitation honestly.
2. Retry UX: terminal client state plus `VerificationToken`-count limiting can punish network or delivery failures. The plan needs a clear resend/use-another-email path or explicit copy for the reload-and-wait behavior.
3. Accessibility: replacing live form controls with a confirmation needs `aria-live`/`role="status"` and focus management. Without that, the visual fix can be invisible to assistive tech.
