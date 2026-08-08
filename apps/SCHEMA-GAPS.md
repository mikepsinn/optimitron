# DIH apps → `@optimitron/db`

## Deployables

`warondisease` · `dfda` · `wishocracy` · thin satellites. See `apps/README.md`.

## Canonical mappings (existing schema — no DIH compatibility tables)

| Product need | Use |
|---|---|
| 1% Treaty YES/NO | `Referendum` slug `one-percent-treaty` (managed seed) + `ReferendumVote` — constant: `TREATY_REFERENDUM_SLUG` from `@optimitron/db` |
| Public profile / handle | `Person.handle`, `Person.displayName`, `Person.image`, … via `User.personId` |
| Referral share ID | `User.referralCode` (fallback when no handle) |
| Referrals | `ReferralInvitation` + `referredByUserId` on `ReferendumVote` |
| Org affiliation | `OrganizationMember` |
| Wishocracy pairs | `WishocraticItem` + `WishocraticAllocation` + `WishocraticItemInclusion` (jurisdiction `US`) — catalog in `@optimitron/data`, DIH aliases in `@optimitron/data/wishocratic-dih-aliases`, ensure via `@optimitron/db` |
| Fundraising | `Task` + `TaskFunding*` when donate is wired |
| Stripe webhook | Verify-only until `TaskFundingPayment` metadata |
| Email prefs | `User.newsletterSubscribed` + `User.unsubscribedScopes` |

## Intentionally not added

| Surface | Why |
|---|---|
| DIH `Vote` / `Campaign*` / `Donation` tables | Parallel to ReferendumVote / TaskFunding — do not recreate |
| DIH `WishocraticPairAllocation` / `WishocraticCategorySelection` | Use Optimitron Wishocratic* models |
| Extra `User.name` / `User.username` columns | Live on `Person` |

## Intentionally deferred

| Surface | Behavior |
|---|---|
| Cron drip emails | Auth-gated no-op until EmailLog template mapping |
| militaryAllocationPercent | Not on ReferendumVote |
| Crowdfunding Campaign UI | Retired; TaskFunding on optimitron web |
