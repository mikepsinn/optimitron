# Task funding: assurance-contract escrow

## Brief

Make task funding conditional the way the campaign already preaches: pledge =
card saved, $0 charged; charge fires only when the target fully funds; payout
on verified claim (existing PR #97 rail, unchanged); automatic refund if the
target expires/cancels. Instant "pay now" checkout stays as a secondary
option. Mike-approved direction 2026-07-03 ("finish up assurance contract
escrow now"). Plain assurance (refund) only — dominant assurance
(refund+bonus) is the Prize's mechanic; treasury separation applies.

## Current state (verified in code)

```
PLEDGE (TaskFundingPledge)        PAY NOW (TaskFundingPayment)
  promise only, no card             Stripe Checkout, charged NOW
  calledAt/fulfilledAt: never set   held via transfer_group
  THRESHOLD_MET -> event row,       payout on verified claim
  nothing collects                  (advisory-lock rail, PR #97)
                                    NO auto-refund if task dies
```

## Proposed state

```
PLEDGE  -> SetupIntent: card saved, $0. Copy: "Charged only when this
           task is fully funded."
FULLY FUNDED (paid + pledged >= target)
        -> off-session PaymentIntent per pledge (per-task advisory lock;
           over-pledge buffer for the ~2-5% card declines)
        -> decline: pledge marked DECLINED, calledAt email flow sends a
           pay-now link (the never-used calledAt machinery gets its job)
        -> each successful charge CREATES a TaskFundingPayment
           (+ CommerceOrder), source PLEDGE_CALL -> whole existing
           payment/payout lifecycle reused unchanged
VERIFIED CLAIM -> payout (existing rail, no changes)
TARGET EXPIRED/CANCELLED -> cron refunds all PAID payments on the target,
           voids uncharged pledges; webhook charge.refunded already
           handles the bookkeeping
```

## Schema additions (verified against schema 2026-07-03; Mike approved
## implementation: "go ahead and implement it now")

- `User.stripeCustomerId String? @unique` — verified: only CommerceOrder has
  a per-order `stripeCustomerId`; off-session charges need a durable
  per-user customer.
- `TaskFundingPledge`: `stripeSetupIntentId String? @unique`,
  `stripePaymentMethodId String?`, `cardBrand String?`, `cardLast4 String?`,
  `declinedAt DateTime?`. Enum `TaskFundingPledgeStatus` (verified values:
  ACTIVE, CANCELLED, EXPIRED, CALLED, FULFILLED) += `DECLINED` only —
  card-saved is discriminated by `stripeSetupIntentId != null` on ACTIVE.
- `TaskFundingPayment`: `pledgeId String? @unique` + relation; new enum
  `TaskFundingPaymentSource { CHECKOUT PLEDGE_CALL }`, field `source`
  default CHECKOUT.
- `TaskFundingTarget.expiresAt` — verified: already exists. No change.

## Step list

- [ ] Verify existing Stripe customer handling (store checkout) — reuse or add
- [ ] Schema + migration (sign-off first)
- [ ] SetupIntent API routes (create, webhook `setup_intent.succeeded`)
- [ ] Pledge form UI: Stripe Elements card save + "charged only if fully
      funded" copy (Mike copy gate)
- [ ] Charge-at-threshold worker under the per-task advisory lock
      (`withTaskFundingLock` — reuse from task-payouts.server.ts); creates
      CommerceOrder + TaskFundingPayment per pledge
- [ ] Webhook: `payment_intent.succeeded` / `payment_intent.payment_failed`
      (off-session) → payment/pledge state
- [ ] Decline recovery: calledAt email with pay-now link
- [ ] Refund-on-expiry cron + target cancel path; extend admin
      /admin/task-payouts view with a funding-refunds section
- [ ] Progress UI: show saved-card pledges distinctly ("pledged — charged at
      goal"); tests for charge-at-threshold race (two targets, partial
      declines), refund sweep, boundary conversions
- [ ] copy:preview regen; verify on preview deploy

## Risks

- Off-session charges hit SCA (`authentication_required`) in EU — the
  decline-recovery email IS the fallback path; don't fight it
- Charge-at-threshold must be idempotent (idempotency key per pledge+target
  generation) and serialized per task — reuse the advisory-lock pattern
- Don't let pledge totals unlock worker payouts before charges settle:
  "fully funded" for payout purposes counts PAID payments only (existing
  behavior — keep it)
- Stripe customer/PM storage = PCI-scope stays inside Stripe Elements

## Files to touch

- packages/db/prisma/schema.prisma (+ migration)
- packages/web/src/lib/task-funding/{payments,pledges}.server.ts
- packages/web/src/app/api/stripe/webhook/route.ts
- packages/web/src/app/api/tasks/[id]/pledge/* (SetupIntent flow)
- packages/web/src/app/api/cron/* (charge worker + refund sweep)
- packages/web/src/components/task-funding/* (pledge form, progress states)
- packages/web/src/lib/emails/* (decline-recovery email)

## ALERTS

(empty)

## Agent log

(empty)
