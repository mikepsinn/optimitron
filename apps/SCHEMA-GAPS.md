# DIH apps → `@optimitron/db`

## Deployables

`warondisease` · `dfda` · `wishocracy` · focused app shells. See `apps/README.md`.

**One tip PR into `main`** for site apps + site-kit (stacked per-app PRs are superseded).

## Product split

| App | After sign-in |
|---|---|
| warondisease | Full campaign dashboard (referrals, treaty, badges, orgs) via site-kit |
| wishocracy | Allocation results + edit pairs/categories only — **not** WoD gamification |

## Canonical mappings (existing schema — no DIH compatibility tables)

| Product need | Use |
|---|---|
| 1% Treaty YES/NO | `Referendum` slug `one-percent-treaty` (managed seed) + `ReferendumVote` — constant: `TREATY_REFERENDUM_SLUG` from `@optimitron/db` |
| Public profile / handle | `Person.handle`, `Person.displayName`, `Person.image`, … via `User.personId` |
| Referral share ID | `User.referralCode` (fallback when no handle) |
| Referrals | `ReferralInvitation` + `referredByUserId` on `ReferendumVote` |
| Org affiliation | `OrganizationMember` |
| Wishocracy pairs | `WishocraticItem` + `WishocraticAllocation` + `WishocraticItemInclusion` (jurisdiction `US`) — catalog in `@optimitron/data` wishocratic items registry; ensure via `@optimitron/db` |
| Fundraising | `Task` + `TaskFunding*` when donate is wired |
| Stripe webhook | Verify-only until `TaskFundingPayment` metadata |
| Email prefs | `User.newsletterSubscribed` + `User.unsubscribedScopes` |

## Intentionally not added

| Surface | Why |
|---|---|
| DIH `Vote` / `Campaign*` / `Donation` tables | Parallel to ReferendumVote / TaskFunding — do not recreate |
| DIH `WishocraticPairAllocation` / `WishocraticCategorySelection` | Use Optimitron Wishocratic* models |
| Extra `User.name` / `User.username` columns | Live on `Person` |
| Wishocracy WoD dashboard clone | Wishocracy is allocations-only product |

## Intentionally deferred

| Surface | Behavior |
|---|---|
| Cron drip emails | Auth-gated no-op until EmailLog template mapping |
| militaryAllocationPercent | Not on ReferendumVote |
| Crowdfunding Campaign UI | Retired; TaskFunding on optimitron web |
| Mapping donate → `TaskFundingPayment` | Still verify-only Stripe |
| Global rename `/u/[username]` → `/people/{handle}` | Separate SEO PR |
