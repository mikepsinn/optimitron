# DIH apps → `@optimitron/db`

## Deployables

`warondisease` · `dfda` · `wishocracy` only. See `apps/README.md`.

## Canonical mappings

| Product need | Use |
|---|---|
| 1% Treaty YES/NO | `Referendum` slug `one-percent-treaty` (managed seed) + `ReferendumVote` — constant: `TREATY_REFERENDUM_SLUG` from `@optimitron/db` |
| Referrals | `ReferralInvitation` + `referredByUserId` on vote |
| Org affiliation | `OrganizationMember` |
| Fundraising | Task + TaskFunding* when reintroduced (not crowdfunding “Campaign*” product UI) |
| Stripe webhook | Verify-only on warondisease until TaskFundingPayment metadata |

## Intentionally deferred

| Surface | Behavior |
|---|---|
| Cron drip emails | Auth-gated no-op until EmailLog template mapping |
| militaryAllocationPercent | Not on ReferendumVote |
| Compatibility Vote/Campaign tables | Do not write from apps |
| Shared UI package | Not yet — extract when two apps share a component |
