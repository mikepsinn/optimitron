# AEOSP Endorse Registration Plan

## Research log

- `.claude/codex-delegation.md:117-132` defines the plan-first protocol sections this file must use: Brief, Research log, current/proposed ASCII diagrams, Step list, Risks, Files to touch, ALERTS, and Agent log.
- `TODO.md:421-441` is the controlling product note: organizations must endorse, embed, and recruit; partner copy should stay neutral where necessary; partner orgs should become "Authorized Earth Optimization Services Providers"; the onboarding form itself must stay professional, with AEOSP framing reserved for campaign-facing pages, snippets, and the badge artifact.
- `TODO.md:305-309` explicitly preserves "AEOSP / Authorized Earth Optimization Services Provider" as intentional corporate-org-chart satire, not jargon to scrub.
- `CLAUDE.md:21-37` gives the Wishonia voice: deadpan, data-first, dry understatement, short sentences, no startup-bro copy.
- `CLAUDE.md:41-43` requires manual-search before proposing user-facing copy and parameter lookup before typing public numbers. Manual-search was attempted through `mcp__local_optimitron__searchManual` for "Authorized Earth Optimization Services Provider AEOSP organization endorsement partner badge 1% Treaty"; the MCP call returned "user cancelled MCP tool call", so no manual result was used.
- `CLAUDE.md:165-175` and `CLAUDE.md:216-230` set the UI rule: campaign UI should optimize for voting/referral/endorsement, use black-and-white treaty style, make actions look actionable, and avoid new neobrutalist styling.
- `packages/web/AGENTS.md` says `packages/web` may use Prisma at runtime, must use the root black-and-white treaty style for user-facing UI, and must screenshot UI changes before commit.
- `packages/data/AGENTS.md` says `packages/data` must not import Prisma runtime code; this plan should not touch `packages/data` unless a real parameter change is needed.
- `packages/web/src/app/endorse/page.tsx:171-239` renders the current `/endorse` page: campaign copy, then `EndorseForm` with `referendumSlug` and manageable orgs.
- `packages/web/src/app/endorse/page.tsx:241-257` already tells orgs that after joining they get a member link, email starter, website button, iframe, action checklist, and grant request draft.
- `packages/web/src/app/endorse/EndorseForm.tsx:57-84` owns the current client-side form state, existing-org/new-org mode, pending count, and auth state.
- `packages/web/src/app/endorse/EndorseForm.tsx:157-168` builds a `PendingOrganizationEndorsementDraft` with `clientDraftId`, `organizationName`, `website`, `originUrl`, `referendumSlug`, timestamp, and `version: 1`.
- `packages/web/src/app/endorse/EndorseForm.tsx:171-199` posts an existing managed organization to `/api/referendums/[slug]/organization-position`.
- `packages/web/src/app/endorse/EndorseForm.tsx:201-264` keeps the current migration-sensitive flow: unauthenticated new orgs are saved locally, auth resumes sync, authenticated submits post immediately, and failures preserve drafts.
- `packages/web/src/app/endorse/EndorseForm.tsx:322-367` renders the current confirmation: "Organization joined", org name, and links to organization tools / survey task.
- `packages/web/src/app/endorse/EndorseForm.tsx:369-460` shows the current fields: existing organization selector when available, or new organization name and website.
- `packages/web/src/lib/storage.ts:45-55` defines the persisted pending endorsement draft shape. Keep this shape compatible so existing browser drafts still sync.
- `packages/web/src/lib/organization-endorsement-sync.ts:66-75` maps a draft to the API payload: `{ newOrganization, position: "YES", statement }`.
- `packages/web/src/lib/organization-endorsement-sync.ts:94-124` posts one pending draft; `packages/web/src/lib/organization-endorsement-sync.ts:126-172` locks and syncs all pending drafts.
- `packages/web/src/app/api/referendums/[slug]/organization-position/route.ts:19-35` defines the API body shape: `organizationId` or `newOrganization`, `position`, and optional `statement`.
- `packages/web/src/app/api/referendums/[slug]/organization-position/route.ts:90-173` creates a new organization with owner, normalizes URLs/images, defaults type to `NONPROFIT`, and currently creates the org as `OrgStatus.APPROVED`.
- `packages/web/src/app/api/referendums/[slug]/organization-position/route.ts:196-242` upserts `OrganizationReferendumPosition` and currently sets the position status to `APPROVED`.
- `packages/web/src/app/api/referendums/[slug]/organization-position/route.ts:244-270` creates the organization treaty activation task and returns `organizationId` and `taskId`.
- `packages/db/prisma/schema.prisma:5088-5152` has enough organization fields for this work: name, slug, status, website, logo URLs, creator, members, and referendum positions.
- `packages/db/prisma/schema.prisma:5190-5240` has `OrganizationReferendumPosition` with organization, referendum, position, statement, approval status, timestamps, and a unique `(organizationId, referendumId)` key.
- `packages/web/src/app/organizations/[id]/page.tsx:65-87` already builds organization survey URL, member referral URL, iframe HTML, button HTML, and email starter.
- `packages/web/src/app/organizations/[id]/page.tsx:121-194` already shows tools only for `org.status === "APPROVED"` and uses `OrganizationCopyField` for copyable artifacts.
- `packages/web/src/components/organizations/OrganizationCopyField.tsx:40-72` is the copy affordance to reuse for badge image URL and HTML embed code.
- `packages/web/src/components/organizations/OrganizationSurveyFrame.tsx:29-45` is the existing iframe preview surface.
- `packages/web/src/components/organizations/OrganizationGrantCalculator.tsx:20-28` has hardcoded calculator defaults. `packages/web/src/components/organizations/OrganizationGrantCalculator.tsx:254-271` builds the current outreach grant draft.
- `packages/web/src/lib/email/post-vote-share-email.ts:38-40` sets the existing "promoted to Humanity Manager" corporate-promotion email subject.
- `packages/web/src/lib/humanity-manager-promotion-content.tsx:49-71` establishes the corporate promotion frame: "Humanity Manager" at Earth Optimization Services LLC.
- `packages/web/src/lib/humanity-manager-promotion-content.tsx:113-151` establishes the subordinate-humanity-manager and Earth Optimization Points joke. AEOSP should rhyme with this, not become generic partner-program copy.
- `packages/data/src/parameters/parameters-calculations-citations.ts:9105-9117`, `:9175-9187`, and `:9440-9451` include broad campaign endorsement/partnership budget parameters, but no parameter specifically for organization endorsement conversion, AEOSP status, or badge generation. Do not add a parameter for this badge unless Mike separately asks for a modeled number.
- `packages/web/src/lib/black-white-text-og-image-response.tsx:235-255` is the existing reusable server-generated black-and-white image response convention.
- `packages/web/src/app/humanity-v-government/opengraph-image.tsx:4-13` is the clean `opengraph-image.tsx` convention to follow: `runtime = "nodejs"`, explicit size/content type, and a helper that returns an image response.
- Next.js docs reviewed: `https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image` documents generating Open Graph images with `opengraph-image.tsx` and `ImageResponse`; `https://nextjs.org/docs/app/api-reference/functions/image-response` documents `ImageResponse` usage and options. No non-Next third-party API is needed.

## Brief

Build a no-schema AEOSP layer around the existing organization endorsement flow. The form stays a serious "join as an organization" application, but once an org has an approved YES position on the 1% Treaty, the campaign can call it an Authorized Earth Optimization Services Provider, give it a copyable badge, and give managers embed/download/share snippets.

Committed decisions:

- Badge format: server-generated PNG, 640x240 source image, displayed at 320x120 in copy snippets. Visual style is a black-and-white vendor certification plaque: white background, thin black border, square corners, no decorative color, no emoji, no gradients. Copy:
  - `AUTHORIZED`
  - `EARTH OPTIMIZATION SERVICES PROVIDER`
  - `{Organization Name}`
  - `International Campaign to End War and Disease`
  - `1% Treaty campaign participant`
- Badge generation: generated server-side with the repo's `opengraph-image.tsx` / `ImageResponse` convention. No checked-in static image asset. The PNG URL is stable enough to use like a static asset.
- Badge URL: `/organizations/[id-or-slug]/aeosp-badge/opengraph-image`.
- Badge display: organization tools page shows a badge preview, a direct PNG link, a download link to that same PNG, and copyable HTML:
  `<a href="https://warondisease.org/organizations/{slug}"><img src="https://warondisease.org/organizations/{slug}/aeosp-badge/opengraph-image" alt="{org} is an Authorized Earth Optimization Services Provider for the International Campaign to End War and Disease" width="320" height="120" style="border:0;max-width:100%;height:auto;" /></a>`
- `/endorse` form fields: keep the existing minimal professional form. Existing managed org selector if logged in; otherwise new organization name required and website optional. Do not add AEOSP, badge, grant, or corporate-satire language inside the form fields.
- Submission boundary: no new Next Server Action for this iteration. Keep the existing API route as the server-side action boundary because pending local drafts sync through it after auth and partner orgs already depend on this path.
- Data shape: keep `PendingOrganizationEndorsementDraft` version 1 and the existing API body. Do not change pending localStorage draft version unless a new submitted field is actually added.
- Confirmation copy: after a successful submit, show the AEOSP framing because the org is already through the form. Use the direct corporate-satire line there: "Your organization is now an Authorized Earth Optimization Services Provider." Then send them to organization tools for badge, link, iframe, and email starter.
- AEOSP placement: exact "Authorized Earth Optimization Services Provider" wording appears in confirmation, organization tools, badge image, and copyable badge/share snippets. The initial `/endorse` hero and form stay professional; pre-submit copy may say "campaign badge" but not lead with AEOSP.
- Database shape: no Prisma schema change. AEOSP status is derived from existing data: `Organization.status === APPROVED` plus an approved, non-deleted YES `OrganizationReferendumPosition` for `TREATY_REFERENDUM_SLUG`. No `aeospStatus`, no `badgeGeneratedAt`, no migration.
- Migration path: existing organizations that already joined through `/endorse` automatically qualify if they have approved org status and approved YES treaty position. Existing browser drafts still sync because their draft shape and API payload remain compatible.

## Current state ASCII diagram

```text
Visitor
  |
  v
/endorse page
  |
  +--> EndorseForm
        |
        +--> unauthenticated new org
        |      |
        |      v
        |   localStorage pending_organization_endorsements (version 1)
        |      |
        |      v
        |   sign in -> syncPendingOrganizationEndorsements()
        |
        +--> authenticated new/existing org
               |
               v
        POST /api/referendums/[slug]/organization-position
               |
               +--> Organization (APPROVED)
               +--> OrganizationReferendumPosition (YES, APPROVED)
               +--> optional treaty activation Task
               |
               v
        confirmation -> /organizations/[id]
                           |
                           +--> survey URL
                           +--> email starter
                           +--> website button
                           +--> iframe
                           +--> grant calculator
```

## Proposed state ASCII diagram

```text
Visitor
  |
  v
/endorse page
  |
  +--> professional form, same fields and same API payload
        |
        v
POST /api/referendums/[slug]/organization-position
        |
        +--> existing Organization + OrganizationReferendumPosition data
        |
        v
confirmation
  |
  +--> "Authorized Earth Optimization Services Provider"
  +--> Open organization tools
        |
        v
/organizations/[id-or-slug]
  |
  +--> existing survey tools
  +--> AEOSP badge section
        |
        +--> preview image
        +--> copy badge image URL
        +--> copy badge HTML embed
        +--> download PNG link
        |
        v
/organizations/[id-or-slug]/aeosp-badge/opengraph-image
  |
  +--> derives eligibility from Organization.status + approved YES position
  +--> returns 640x240 PNG badge
```

## Step list

- [ ] Re-read this plan and `## ALERTS` before editing.
- [ ] Keep current branch policy: if implementation starts on `main`, create a `feature/aeosp-endorse-registration` branch before edits; otherwise continue the current non-main branch.
- [ ] Add a pure badge helper in `packages/web/src/lib/organization-aeosp-badge.ts` for badge constants, badge URL construction, badge embed HTML construction, and HTML escaping. It should not import Prisma.
- [ ] Add a server helper in `packages/web/src/lib/organization-aeosp-badge.server.ts` that loads an eligible org by id or slug. Eligibility is `deletedAt: null`, `status: APPROVED`, and at least one non-deleted `OrganizationReferendumPosition` for `TREATY_REFERENDUM_SLUG` with `position: YES` and `status: APPROVED`.
- [ ] Add `buildOrganizationAeospBadgeUrl(organizationSlugOrId: string)` in `packages/web/src/lib/site.ts`, mirroring `buildOrganizationSurveyUrl()` but pointing at `WAR_ON_DISEASE_CONFIG.canonicalOrigin`.
- [ ] Add `packages/web/src/lib/organization-aeosp-badge-image-response.tsx` to render the 640x240 black-and-white badge. Use dynamic font sizing/truncation so long organization names do not overflow. Prefer the existing Libre Baskerville font approach from `black-white-text-og-image-response.tsx` if reuse is clean; otherwise keep the helper local and small.
- [ ] Add `packages/web/src/app/organizations/[id]/aeosp-badge/opengraph-image.tsx`. Export `runtime = "nodejs"`, `revalidate = 300`, `size = { width: 640, height: 240 }`, and `contentType = "image/png"`. Return `notFound()` or a simple non-eligible image response only after deciding which behavior is better for partner embeds; recommended: `notFound()` so unapproved orgs cannot display a fake certification.
- [ ] Update `packages/web/src/app/organizations/[id]/page.tsx` to compute `qualifiesForAeosp` from the already-loaded referendum positions or the new helper. Add an "Authorized Earth Optimization Services Provider" tools section only when qualified.
- [ ] In that tools section, show the badge preview image, direct PNG URL copy field, HTML embed copy field, and same-origin download link. Reuse `OrganizationCopyField` for exact values.
- [ ] Keep existing survey URL, email starter, website button, iframe, manager referral link, profile editor, and grant calculator behavior intact.
- [ ] Update `packages/web/src/app/endorse/EndorseForm.tsx` saved state copy. Keep "Organization joined." but add the post-submit AEOSP line and point the main CTA to `organizationHref#aeosp-badge` with label `Open Badge and Tools`.
- [ ] Update only neutral pre-submit text in `packages/web/src/app/endorse/page.tsx` if needed: "After joining" may say the tools page includes a campaign badge, but the initial page and form should not lead with "AEOSP".
- [ ] If the legal "What joining does" bullets need to mention the badge, update `packages/web/src/messages/en-US/war-on-disease.json` with neutral "public campaign badge" wording, not the full AEOSP title. Let the generated content pipeline update snapshots later; do not hand-edit `.logged-out.md`.
- [ ] Add focused tests for `organization-aeosp-badge` helpers: embed HTML escapes org names, builds canonical `warondisease.org` URLs, and preserves `width="320"` / `height="120"`.
- [ ] Add focused tests for `organization-aeosp-badge.server`: approved org + approved YES position qualifies; pending org, rejected position, non-YES position, deleted org, and missing treaty position do not qualify.
- [ ] Run focused tests for the new helper/server files.
- [ ] Run the existing organization endorsement API tests if the route or data assumptions are touched.
- [ ] Run typecheck for `@optimitron/web`.
- [ ] Run copy preview for affected `/endorse` and `/organizations/[id]` surfaces; commit generated snapshots only if the implementation actually changes user-facing copy.
- [ ] Capture screenshots for `/endorse`, the saved confirmation state, and an approved organization tools page with the AEOSP badge section. Use the stable review file at `packages/web/output/playwright/review/latest.html`.
- [ ] Inspect screenshots for overflow, overlapping text, broken image references, long organization names, and mobile layout.
- [ ] Before committing UI/copy changes, show Mike the changed copy and screenshot review path and wait for approval, per repo rules.

## Risks

- AEOSP wording could scare off serious nonprofits if shown too early. Mitigation: keep the form and pre-submit labels professional; exact AEOSP title appears only after submit, on tools, in snippets, and on the badge.
- A spam or unreviewed organization could display a badge if eligibility is too loose. Mitigation: derive from approved org status plus approved YES treaty position.
- The current API auto-approves orgs and positions. This plan does not change that. If Mike wants manual review before badge issuance, that is a separate product/security decision and likely needs API/admin flow changes.
- Dynamic image caching can make renamed org badges stale for a few minutes. Mitigation: set `revalidate = 300`; do not store `badgeGeneratedAt` just to solve short-lived image cache staleness.
- Long organization names can overflow the badge. Mitigation: dynamic font sizing, max line count, and ellipsis/truncation rules in the image helper.
- Exact partner embed HTML can become stale if canonical route helpers change. Mitigation: centralize badge URL/embed builders in one helper and test them.
- Adding a schema field for AEOSP status would require explicit human approval and is not needed for the current requirement. Derived status preserves existing data and migration safety.
- Adding tests that freeze paragraph copy would create maintenance drag. Mitigation: test eligibility and embed contracts, not long prose.

## Files to touch

- Create `packages/web/src/lib/organization-aeosp-badge.ts`
- Create `packages/web/src/lib/organization-aeosp-badge.server.ts`
- Create `packages/web/src/lib/organization-aeosp-badge-image-response.tsx`
- Create `packages/web/src/app/organizations/[id]/aeosp-badge/opengraph-image.tsx`
- Modify `packages/web/src/lib/site.ts`
- Modify `packages/web/src/app/organizations/[id]/page.tsx`
- Modify `packages/web/src/app/endorse/EndorseForm.tsx`
- Modify `packages/web/src/app/endorse/page.tsx` only for neutral pre-submit "campaign badge" copy if needed
- Modify `packages/web/src/messages/en-US/war-on-disease.json` only if the legal "What joining does" bullet should mention the badge
- Add `packages/web/src/lib/__tests__/organization-aeosp-badge.test.ts`
- Add `packages/web/src/lib/__tests__/organization-aeosp-badge.server.test.ts`
- Generated after implementation, not hand-edited: relevant `page.logged-out.md` copy-preview snapshots under `packages/web/src/app/`
- Do not touch `packages/db/prisma/schema.prisma`
- Do not touch `packages/data/src/parameters/parameters-calculations-citations.ts` for this feature

## ALERTS

## Agent log

## Codex critique (round 1)

### 1. Badge generation: the OG route approach is feasible, but the plan is underspecified for badge semantics

The server-rendered PNG approach is technically feasible. Existing routes prove both sides of the claim: `packages/web/src/app/humanity-v-government/opengraph-image.tsx` uses the simple `runtime`, `revalidate`, `size`, and `contentType` convention, and `packages/web/src/app/people/[id]/opengraph-image.tsx` proves dynamic `params` plus `ImageResponse` works for per-record images. A generated route is better than a checked-in static asset because the badge needs the current organization name and current authorization status.

But the plan is mixing two different jobs: Open Graph social cards and inline partner-site badges. `1200x630` is right for social previews, not a small certification plaque. The proposed `640x240` source displayed at `320x120` is reasonable for an inline retina badge. If this badge is also supposed to look good in Slack/Twitter/Facebook unfurls, that needs a separate `1200x630` social image route or a separate metadata path. Do not pretend one size solves both.

The plan also only handles one per-org variation: organization name. It does not handle member count or year. That may be correct, but it needs to be explicit. `Organization.members` is account/member-manager data, not the nonprofit's real-world membership size, so putting "member count" on the badge would be misleading. A "certified since 2026" year is also not clean with the current schema: `OrganizationReferendumPosition.createdAt` is submission time, `updatedAt` mutates on later status changes, and there is no `approvedAt` or `aeospCertifiedAt`. Either omit member count/year from the badge for this iteration, or flag schema work as requiring explicit human approval.

### 2. Embed mechanism: absolute HTTPS is good; CSP and self-hosting are not handled

The embed snippet should absolutely use `https://warondisease.org/...`, never request-origin and never local dev origin. The proposed `WAR_ON_DISEASE_CONFIG.canonicalOrigin` helper is the right direction, and tests should fail if the generated snippet contains `http://`, `localhost`, or a relative `src`.

The plan does not handle partner CSP. If a partner site has `img-src 'self'` or only allows its CDN, our hosted badge will be blocked. No HTML snippet can bypass that. The tools page needs a plain fallback: "If your site blocks external images, add `https://warondisease.org` to `img-src`, or upload the downloaded PNG to your own site and keep the badge linked to the organization verification page."

That fallback creates a real product conflict: downloaded/self-hosted badges are not revocable. If revocation matters, the plan should not treat the download link as equivalent to the live embed. The live embed is revocable after cache expiry; a copied PNG is not. The badge should include or link to a verification URL so a stale downloaded image is at least checkable.

### 3. Schema impact: no-schema is acceptable only for "currently eligible", not certification history

The current schema can support an active derived AEOSP status: `Organization.status === APPROVED`, `Organization.deletedAt === null`, and one approved non-deleted YES `OrganizationReferendumPosition` for the treaty. The existing `OrgStatus` and `OrganizationReferendumPositionStatus` enums are enough for that current-state check.

The current schema does not support certification history, revocation history, certification reason, revocation reason, certificate ID, certified-by admin, or a reliable certified-at timestamp. If AEOSP is meant to be more than a present-tense marketing label, the plan's "no schema change" decision is too strong. Any fields like `aeospCertifiedAt`, `aeospRevokedAt`, `aeospRevocationReason`, or `aeospCertificateId` must be called out as schema changes requiring explicit human approval. Do not smuggle them into implementation.

### 4. `/endorse` form partition: mostly solid, but keep the satire out of every pre-submit state

The plan is right that the onboarding form itself should stay professional. The current form is minimal and serious: organization selector, organization name, website, verification, and submit. That should remain true. Do not add AEOSP language to field labels, form helper text, auth-save state, validation errors, or the initial hero.

The post-submit confirmation is the first place where the AEOSP joke can appear, and even there it should point immediately to practical tools. "Your organization is now an Authorized Earth Optimization Services Provider" is acceptable only because the submit happened already. The surrounding sentence should still make the next action concrete: badge, member link, website button, iframe, email starter.

### 5. Revocation path: the plan names eligibility, but not operations

This is the weakest part of the plan. A derived eligibility check can revoke the live badge if an admin rejects/deletes the organization position or changes the organization status away from `APPROVED`; existing admin endpoints already have those primitives. But the implementation plan must say that explicitly: reject the treaty position, soft-delete the treaty position, reject the organization, or soft-delete the organization; then the badge route stops authorizing.

The route behavior also needs a product decision. `notFound()` prevents an unapproved org from displaying a valid badge, but partner pages will show a broken image. A "not currently authorized" image makes the revocation visible but is harsher and may create brand/legal friction. Pick one before implementation and test it.

Caching and downloads need to be part of the revocation story. With `revalidate = 300`, a revoked live badge may stay visible for a few minutes. A downloaded PNG may stay visible forever. If the badge is allowed to be downloaded, the badge image should include "Verify at warondisease.org/organizations/{slug}" or the HTML snippet should always link to a page that clearly shows current status.

### 6. Public AEOSP directory: `/signatories` is not a complete certified-org directory

The plan does not create `/partners` or `/aeosp`, and it does not clearly state that AEOSP verification lives somewhere else. Existing `/signatories` is not enough as a certified-provider directory: it mixes humans and organizations, and the current ranking code filters organization entries to those with at least one referred YES voter. An approved organization with zero recruited voters can qualify for the badge but not appear in that leaderboard.

There are two defensible options. The smaller one is to make each badge link to `/organizations/{slug}` and update that public page to visibly show current AEOSP status for eligible orgs. The stronger one is a dedicated `/partners` or `/aeosp` directory that lists all currently certified organizations using the same eligibility helper. If the badge says "authorized", there needs to be a public verification surface that a stranger can understand.

### 7. Brand-protection / cold-stranger risk: AEOSP may sound too real without context

"Authorized Earth Optimization Services Provider" is intentionally part of the Earth Optimization Services LLC corporate-promotion voice, and the TODO explicitly says to keep it. Still, a cold stranger seeing only a partner badge may not read it as satire. In the post-vote email, the joke is obvious because "promoted to Humanity Manager" and the forward-this-email context are absurd. A vendor-style certification badge can look like a real credential.

Mitigation should be part of the plan, not left to taste during implementation. The badge and verification page should include campaign context: "1% Treaty campaign participant" and "International Campaign to End War and Disease" help. The org page should avoid implying legal accreditation, government authorization, or operational vendor approval. Alt text and nearby copy should say what is true: the organization publicly supports the campaign and can recruit its audience.

### 8. Tests and verification: good direction, but add the failure cases that matter

The helper tests are worth adding because the embed contract is easy to break. Add explicit assertions for canonical HTTPS origin, HTML escaping, fixed displayed dimensions, and no localhost/request-origin leakage.

The server eligibility tests should include the revocation cases, not just positive approval: rejected organization, pending organization, deleted organization, rejected position, pending position, deleted position, non-YES position, wrong referendum, missing referendum, and renamed org reflected in the badge content after revalidation.

For screenshots, include a long organization name and at least one mobile viewport. Badge overflow is a likely failure mode. Also capture the non-manager public organization page if it becomes the verification surface, because that is what a stranger clicking a partner badge will see.

## Codex critique summary

Top 3:

1. Revocation is not operationally defined. The plan must decide admin action, route response, cache behavior, and what to do about downloaded/self-hosted badges.
2. The no-schema decision is only safe if the badge omits member count, certified-since year, certificate IDs, and revocation history. Anything beyond current eligibility needs explicit schema approval.
3. Public verification is missing. `/signatories` is not a complete AEOSP directory, so the plan needs either a clear `/organizations/{slug}` verification state or a dedicated `/partners` / `/aeosp` page.
