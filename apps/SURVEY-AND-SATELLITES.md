# Survey host, embeds, and satellite apps

Decisions for site apps beyond warondisease / dfda / wishocracy.

## Origins

| Domain                       | Role                                                                                                                 |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **trialabundancesurvey.org** | Canonical **survey host**: vote UI, `/embed`, `embed.js`, lite participant home, survey-branded email                |
| **acceleratedmedicine.org**  | Case for cures + **donations** + embed survey (no need to own the instrument)                                        |
| **curedao.org**              | Landing as today + outbound product links. **No donate. No money ask.** Optional embed later                         |
| **warondisease.org**         | Campaign: full dashboard (scores, badges, soldiers). May embed or deep-link the survey; not the partner embed origin |

Shared Neon / `@optimitron/db` for users + `ReferendumVote` (slug `one-percent-treaty`). Origin ≠ database.

## Why survey is not on warondisease.org

Partner embeds load a URL. `warondisease.org` reads as joining a faction.

`trialabundancesurvey.org` reads as a research instrument. That matches the nervous-nonprofit use case.

## Post-vote / email (no bait-and-switch)

1. After vote → stay on **trialabundancesurvey.org** thank-you + **lite** dashboard (status, share survey, referral for survey growth).
2. Email from **Survey Team / Trial Abundance Survey**, content about the response—not War on Disease by default.
3. Soft optional CTA to WoD campaign dashboard (“see full impact”) — never a hard redirect.
4. Full scores / badges / soldiers → **warondisease.org/dashboard** after opt-in click.
5. Donate → **acceleratedmedicine.org** only when they choose that path (not shoved into survey thank-you).

## Embed product

| Piece                       | Purpose                                          |
| --------------------------- | ------------------------------------------------ |
| `@optimitron/survey-embed`  | React `<SurveyEmbed ref=… />` for monorepo sites |
| `embed.js` on survey origin | WordPress / static: inject iframe                |
| `/embed` on survey app      | Framed lite vote UI; `?ref=` for referral        |

Dogfood order: survey host → acceleratedmedicine → curedao (optional) → external WordPress.

## MVP route lists

### `@apps/trialabundancesurvey`

`/`, `/embed`, `/auth/*`, `/dashboard` (lite), `/faq`, `/privacy`, `/terms` + vote/auth APIs.

### `@apps/acceleratedmedicine`

`/`, `/donate`, `/donate/success`, `/privacy`, `/terms`, `/about` + Stripe; homepage embeds survey.

### `@apps/curedao`

`/`, `/about`, `/privacy`, `/terms`; outbound links to WoD / dfda / wishocracy / survey. No donate.

## Non-goals (v1)

- Full DIH gamification dashboard on the survey host
- Hard redirect survey → WoD
- Donate CTAs on CureDAO
- Third full DIH fork per brand (thin apps + shared packages only)
