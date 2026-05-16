## Research log

Viewed on 2026-05-14.

WebSearch queries run:

- `site:neon.tech/docs anonymized branching Neon postgresql_anonymizer`
- `site:neon.tech/docs/learn anonymized branching Neon`
- `site:neon.tech/docs/changelog anonymized branches Neon postgresql_anonymizer`
- `site:neon.com/docs Vercel integration Neon preview deployment branches`
- `site:neon.com/docs/changelog anonymized branches Neon 2026`
- `"Data anonymization APIs" "neon.com/docs"`
- `"Data anonymization" "Neon Docs" "masking_rules"`
- `"Anonymized branches are now supported" "IP Allow" "Private Networking" Neon`

WebFetch / opened Neon sources:

- [Data anonymization - Neon Docs](https://neon.com/docs/workflows/data-anonymization), last updated 2026-02-27. Relevant facts: feature is marked Beta; Neon uses PostgreSQL Anonymizer for static masking; masking runs during branch creation or when rerun; rules are branch-specific; parent branch remains unchanged; branch is unavailable during anonymization; use Random Unique Email for unique email columns; foreign key columns cannot be masked directly, but primary key columns can be anonymized and Neon handles FK constraints during anonymization.
- [Data anonymization API reference - Neon Docs](https://neon.com/docs/workflows/data-anonymization-api), no last-updated date visible in fetched plain-text rendering. Relevant facts: `POST /projects/{project_id}/branch_anonymized` creates an anonymized branch; `masking_rules` accepts `database_name`, `schema_name`, `table_name`, `column_name`, and either `masking_function` or `masking_value`; `start_anonymization: true` starts masking during branch creation; status endpoint states include `created`, `initialized`, `anonymizing`, `anonymized`, and `error`; updating masking rules replaces the full rule array.
- [Data anonymization with GitHub Actions - Neon Docs](https://neon.com/docs/workflows/data-anonymization-github-actions), no last-updated date visible in fetched plain-text rendering. Relevant facts: `neondatabase/create-branch-action@v6` supports a `masking_rules` input and creates a new anonymized branch in one step; that action's `masking_rules` path does not apply rules to an existing branch.
- [Create anonymized branch - Neon API Reference](https://api-docs.neon.tech/reference/createprojectbranchanonymized), visible as "Updated 22 days ago" when opened, approximately 2026-04-22. Relevant facts: endpoint is `POST https://console.neon.tech/api/v2/projects/{project_id}/branch_anonymized`; accepts `masking_rules` and `start_anonymization`; page still labels the endpoint Beta.
- [Start anonymization - Neon API Reference](https://api-docs.neon.tech/reference/startanonymization), visible as "Updated 22 days ago" when opened, approximately 2026-04-22. Relevant facts: endpoint starts anonymization on an anonymized branch; the branch must already be an anonymized branch.
- [Update masking rules - Neon API Reference](https://api-docs.neon.tech/reference/updatemaskingrules), visible as "Updated 23 days ago" when opened, approximately 2026-04-21. Relevant facts: updates masking rules for an anonymized branch and replaces all existing rules.
- [Create branch - Neon API Reference](https://api-docs.neon.tech/reference/createprojectbranch), visible as "Updated 23 days ago" when opened, approximately 2026-04-21. Relevant facts: normal branch creation creates a branch and optional endpoint, but does not make it an anonymized branch.
- [Integrating Neon with Vercel - Neon Docs](https://neon.com/docs/guides/vercel-overview), last updated 2026-02-15. Relevant facts: Vercel-managed and Neon-managed integrations both support preview branching; if custom CI/CD control is needed, Neon points users toward manual connection rather than automated integration.
- [Connecting with the Neon-Managed Integration - Neon Docs](https://neon.com/docs/guides/neon-managed-vercel-integration), last updated 2026-02-15. Relevant facts: the integration creates isolated database branches for preview deployments, names branches like `preview/<git-branch>`, and injects deployment-specific `DATABASE_URL`/`DATABASE_URL_UNPOOLED` into Vercel.
- [One branch per preview - Neon Branching](https://neon.com/branching/branch-per-preview), last updated 2025-07-08. Relevant facts: Vercel preview deployments can spin up a matching Neon branch, inherit schema and data, and inject `DATABASE_URL`.
- [Create Environments with Masked Production Data Using Neon Branches - Neon Blog](https://neon.com/blog/environments-masked-production-data), published 2025-05-15. Relevant facts: shows a SQL-based PostgreSQL Anonymizer flow using `SECURITY LABEL`, `anon.init()`, and `anon.anonymize_database()` on a branch; describes using an anonymized branch as the base for per-PR preview environments.

Relevant Neon changelog entries within the last 12 months:

- [2025-11-21 changelog](https://neon.com/docs/changelog/2025-11-21): branch anonymization APIs became available in the API reference; example uses `POST /branch_anonymized`, masking rules, and `start_anonymization: true`; also notes Data Masking UI fixes.
- [2025-12-05 changelog](https://neon.com/docs/changelog/2025-12-05): added masking options including random unique email and realistic fake data helpers; Vercel integration got quota-error reporting and cleanup safety fixes.
- [2025-12-12 changelog](https://neon.com/docs/changelog/2025-12-12): materialized views are automatically refreshed after anonymizing tables.
- [2026-01-16 changelog](https://neon.com/docs/changelog/2026-01-16): custom masking rules via SQL or API are supported and preserved across Console/API/SQL workflows; foreign key columns are no longer masked directly in the UI.
- [2026-01-30 changelog](https://neon.com/docs/changelog/2026-01-30): anonymization can handle primary-key columns, and Neon handles foreign key constraints during anonymization.
- [2026-02-27 changelog](https://neon.com/docs/changelog/2026-02-27): anonymized branches work with projects using IP Allow or Private Networking.

Assumption checks / contradictions found:

- The prompt says "GA late 2025"; current Neon docs and API pages still mark data anonymization / anonymized branch endpoints as Beta. Treat this as available but not stable enough for silent best-effort privacy.
- The current repo workflow creates or receives a normal Vercel-managed preview branch; Neon API docs say `start_anonymization` applies to anonymized branches. A pure "update masking rules on the existing Vercel branch" approach may fail unless the branch was created as anonymized or the SQL `anon` flow is supported on that branch.
- The prompt lists `ReferendumVote.signatureName`, but current `packages/db/prisma/schema.prisma` has no such field. Current `ReferendumVote` has `publicComment` and `originUrl`, which may contain user-supplied or URL-borne PII.
- The prompt lists `TaskComment.body`, but current `TaskComment` stores the markdown body in `message`.
- `docs/PREVIEW_DATA_PRIVACY.md` does not exist yet.

## Brief

Create an implementation path for masking production-derived PII on Vercel preview database branches in `E:\code\optimitron` before reviewers or teammates interact with preview data.

The existing preview sync job already pulls the Vercel/Neon preview database connection string, applies migrations, and syncs managed data. The plan should add an explicit anonymization rule file and CI step to mask PII in that preview database, plus documentation explaining what is masked, what remains public/synthetic, and how to maintain the rule list when Prisma models change.

Preferred first implementation shape: keep the current Vercel preview branch integration, add `packages/db/prisma/anonymization-rules.sql`, and run that SQL from `.github/workflows/ci.yml` after preview migrations and before managed-data sync. This matches the existing line-661 insertion point and avoids replacing the whole Vercel deploy flow. If the SQL path cannot initialize/use `anon` on Vercel-created branches, pivot to Neon anonymized branch creation via API/GitHub Action and branch-specific Vercel env injection before deployment.

## Current state ASCII diagram

```text
Pull request opened / pushed
          |
          +------------------------------+
          |                              |
          v                              v
 Vercel Git preview deploy        GitHub Actions: ci.yml
          |                       job: sync-preview-managed-data
          |                              |
          v                              v
 Neon/Vercel integration          pnpm dlx vercel pull
 creates preview DB branch        --environment=preview
 from default/prod branch         --git-branch "$PREVIEW_GIT_BRANCH"
          |                              |
          v                              v
 Vercel injects branch            Export DATABASE_URL and
 DATABASE_URL into preview        DATABASE_URL_UNPOOLED
 deployment only                         |
          |                              v
          |                       pnpm db:deploy
          |                       (Prisma migrations)
          |                              |
          |                              v
          |                       pnpm db:sync:managed-data -- --apply
          |                       (campaign/system rows)
          |                              |
          v                              v
 Preview app can read             Summary says migrations and
 production-shaped data           managed data synced
 without a masking gate
```

## Proposed state ASCII diagram

```text
Pull request opened / pushed
          |
          +------------------------------+
          |                              |
          v                              v
 Vercel Git preview deploy        GitHub Actions: ci.yml
          |                       job: sync-preview-managed-data
          |                              |
          v                              v
 Neon/Vercel integration          pnpm dlx vercel pull
 creates preview DB branch        --environment=preview
 from default/prod branch         --git-branch "$PREVIEW_GIT_BRANCH"
          |                              |
          v                              v
 Vercel injects branch            Export DATABASE_URL and
 DATABASE_URL into preview        DATABASE_URL_UNPOOLED
 deployment only                         |
          |                              v
          |                       pnpm db:deploy
          |                       (schema first)
          |                              |
          |                              v
          |                       Apply anonymization rules
          |                       packages/db/prisma/anonymization-rules.sql
          |                       - enable/init anon if supported
          |                       - SECURITY LABEL sensitive columns
          |                       - anon.anonymize_database()
          |                       - non-leaking verification queries
          |                              |
          |                              v
          |                       pnpm db:sync:managed-data -- --apply
          |                       (restore controlled public/synthetic
          |                       campaign/system rows only)
          |                              |
          v                              v
 Preview app reads masked         Summary says migrations,
 production-shaped data           anonymization, and managed
 plus controlled managed rows     data sync completed
```

## Step list

- [ ] Confirm implementation branch scope before editing: stay on the current feature branch, do not create a separate worktree, and do not change Prisma schema or exported `@optimitron/db` types.
- [ ] Re-read `packages/db/AGENTS.md` before touching `packages/db/prisma/anonymization-rules.sql`.
- [ ] Inventory PII columns from the current `packages/db/prisma/schema.prisma`, not the prompt alone. Start with:
  - `User.email`; consider whether `User.password` hashes must be nulled or replaced for preview safety.
  - `Person.displayName`, `Person.firstName`, `Person.middleName`, `Person.lastName`, `Person.email`, `Person.bio`, `Person.headline`.
  - `PersonMemorial.deathLocation`, `PersonMemorial.circumstances`.
  - `PersonMemorialSubmission.memorialMessage`.
  - `PersonMemorialResponsibleParty.name`, `PersonMemorialResponsibleParty.privateNotes`.
  - `PersonMemorialEvidence.title`, `PersonMemorialEvidence.description`, `PersonMemorialEvidence.sourceUrl`.
  - `ReferendumVote.publicComment`, `ReferendumVote.originUrl`; note that `ReferendumVote.signatureName` is absent in the current schema.
  - `CourtCaseParty.displayNameSnapshot`.
  - `Organization.contactEmail`; note that `OrganizationMember` currently contains links/role metadata but no direct name/email field.
  - `Task.description` and any assignee/contact snapshots that can hold private outreach text.
  - `TaskComment.message`; note that `TaskComment.body` is absent in the current schema.
  - `TaskCommunicationEndpoint.email`, `TaskCommunication.recipientEmail`, `TaskCommunicationVariant.signature`, and `ReferralInvitation.email` if they are present in the final schema snapshot.
- [ ] Create `packages/db/prisma/anonymization-rules.sql` as the single checked-in masking rule source. Use quoted Prisma table names where required, keep `ON_ERROR_STOP` compatible with `psql`, avoid printing row values, and use deterministic/static placeholders or PostgreSQL Anonymizer functions that preserve constraints.
- [ ] For unique email columns, use a uniqueness-preserving expression such as a UUID-derived `@preview.invalid` address rather than a small fake email pool.
- [ ] Prefer null/static redaction for free-text fields that may contain testimony, URLs, signatures, comments, or private notes. Use fake realistic values only where the UI benefits from production-like shape and uniqueness/foreign-key constraints allow it.
- [ ] Decide row-exception policy for public figures and managed demo/system records. If column-level masking would destroy public campaign UX, document the tradeoff and either accept fully masked preview names or add explicit post-mask managed-data upserts for synthetic/public records only.
- [ ] Modify `.github/workflows/ci.yml` in `sync-preview-managed-data` around the current migration step:
  - Keep `pnpm db:deploy` first.
  - Add a guarded `Apply preview database anonymization` step using `DATABASE_URL_UNPOOLED` when available, falling back to `DATABASE_URL`.
  - Install or locate `psql` on the Ubuntu runner without logging connection strings.
  - Run `psql "$DATABASE_URL_UNPOOLED" --set ON_ERROR_STOP=1 --file packages/db/prisma/anonymization-rules.sql`.
  - Add non-leaking verification queries that return counts/booleans only.
  - Keep `pnpm db:sync:managed-data -- --apply` after anonymization so controlled campaign/system managed rows are restored after broad masking.
- [ ] Update the GitHub Actions step summary to include anonymization status without echoing emails, URLs, names, or database credentials.
- [ ] Delete temporary pulled `.vercel/*.env*` files at the end of the job or add an explicit cleanup step, because those files can contain deployment secrets.
- [ ] Create `docs/PREVIEW_DATA_PRIVACY.md` explaining:
  - Preview branches are production-shaped but must be treated as non-production and masked.
  - Which columns are masked and why.
  - Which managed records are intentionally restored after masking.
  - How to add a new masking rule when Prisma fields are added.
  - The known Neon Beta limitation and the fallback to true Neon anonymized branches if SQL anonymization on Vercel-created branches is unsupported.
- [ ] Add verification instructions to the doc:
  - Inspect CI summary for anonymization completion.
  - Query only aggregate checks, never raw PII.
  - Check that preview login/demo paths still work if they depend on managed synthetic accounts.
- [ ] Run static checks after implementation:
  - `git diff --check`
  - `pnpm --filter @optimitron/db exec prisma validate`
  - A focused CI/manual dry run against a disposable preview branch before trusting this for real preview reviewers.
- [ ] If the first CI run shows `anon` cannot be initialized on the normal Vercel-created branch, stop and revise the plan to create the preview database via Neon anonymized branch API or `neondatabase/create-branch-action@v6`, then wire the resulting connection string into Vercel before any preview deployment can serve traffic.

## Risks

- Current Neon docs still label data anonymization Beta. The implementation should fail closed if masking does not run, rather than silently serving unmasked preview data.
- There may be a privacy window if Vercel serves a preview deployment before the GitHub `sync-preview-managed-data` job finishes anonymization. Vercel preview protection lowers exposure but does not eliminate teammate/reviewer access. If the window is unacceptable, switch to pre-deployment anonymized branch creation and explicit Vercel env injection.
- The Vercel/Neon automated integration appears to create normal preview branches. Neon API docs restrict `start_anonymization` to anonymized branches. The SQL `anon` path may work, but this must be proven on a disposable preview branch.
- Masking `User.email` or password hashes can break preview auth, demo login, referrals, and magic-link verification flows. Preserve or recreate only synthetic managed accounts if needed.
- Running managed-data sync after anonymization can reintroduce unmasked values if managed data ever contains real PII. The doc must state that managed data is public/synthetic only, or the workflow must run anonymization again after sync.
- Column names in the prompt are stale in at least two places. Blind implementation would miss `TaskComment.message` and chase nonexistent `ReferendumVote.signatureName`.
- Broad `Person` masking may make public-figure/campaign pages less useful in preview. Conditional masking may be difficult with PostgreSQL Anonymizer labels; privacy should win unless Mike explicitly accepts public-figure exceptions.
- Unique constraints require uniqueness-preserving masking. Fake email pools can collide and fail CI.
- Free-text fields can contain arbitrary PII, URLs, private legal notes, or signatures. Realistic fake text is less important than irreversible redaction for those fields.
- Anonymization permanently rewrites data on the branch. Rerunning anonymization does not refresh from the parent branch; fresh production data requires a fresh branch.
- Anonymization can make the branch unavailable during the job and can add storage/write cost for masked columns.
- CI logs and `.vercel/.env.preview.local` can leak secrets if handled carelessly.

## Files to touch

- `packages/db/prisma/anonymization-rules.sql`
  - New SQL masking rule source for preview database anonymization.
  - Should not require Prisma schema changes.
- `.github/workflows/ci.yml` around line 661
  - Add the anonymization step to `sync-preview-managed-data` after migrations and before managed-data sync.
  - Add non-leaking verification and cleanup.
- `docs/PREVIEW_DATA_PRIVACY.md`
  - New operator/reviewer doc for preview data privacy, rule maintenance, and verification.

## ALERTS

## Agent log

## Codex critique (round 1)

### Finding 1 - The proposed flow is not fail-closed

The current workflow and the proposed diagram still allow a privacy window. `.github/workflows/ci.yml:547-683` runs `sync-preview-managed-data` after the PR exists, while Vercel Git preview deployment is a separate parallel path. The current job pulls the preview env at lines 606-610, exports `DATABASE_URL` at lines 612-659, runs migrations at lines 661-665, syncs managed data at lines 667-671, then writes a success summary at lines 673-683. Adding masking between 665 and 667 does not stop the already-starting Vercel preview from serving data before masking completes.

`packages/web/src/lib/prisma.ts:12-18` also confirms the app just consumes `serverEnv.DATABASE_URL` and normalizes SSL mode. There is no app-level guard that says "only connect after anonymization passed." A red GitHub check does not automatically undeploy or block an already-created preview. If the requirement is "do not let an unmasked branch through CI/review," the plan needs a hard gate before the preview app can receive a production-derived connection string, or it needs to disable/avoid automatic Vercel Git previews for this path.

The safer alternatives are:

- Create the anonymized Neon branch before Vercel deployment and inject that exact connection string into the deployment.
- Branch previews from a verified anonymized parent branch, not directly from production.
- Disable public/reviewer access to preview deployments until a masking sentinel has passed.

The current proposed state diagram's final claim, "Preview app reads masked production-shaped data," is not true for the time between Vercel branch injection and CI anonymization success.

### Finding 2 - Neon masking is branch-specific, not a current project-level one-time setting

Fresh doc check on 2026-05-15:

- `https://api-docs.neon.tech/reference/createprojectbranchanonymized` is live. It still documents `POST https://console.neon.tech/api/v2/projects/{project_id}/branch_anonymized`, accepts `masking_rules` and `start_anonymization`, and still labels the endpoint Beta.
- `https://api-docs.neon.tech/reference/startanonymization` is live. It says `POST /projects/{project_id}/branches/{branch_id}/anonymize` starts anonymization only for an anonymized branch; the branch must already be anonymized.
- `https://api-docs.neon.tech/reference/updatemaskingrules` is live. It says `PATCH /projects/{project_id}/branches/{branch_id}/masking_rules` updates rules for the specified anonymized branch and replaces all existing rules.
- `https://api-docs.neon.tech/reference/getmaskingrules` and `https://api-docs.neon.tech/reference/getanonymizedbranchstatus` are live and branch-scoped.
- `https://github.com/neondatabase/create-branch-action` still documents `neondatabase/create-branch-action@v6`, latest release `6.3.1` as of Mar 31, 2026, and a `masking_rules` input.

I did not find a current Neon project-level setting that automatically applies one rule set to every future preview branch. Neon materials still describe anonymization rules as branch-specific. A one-time operational baseline may still be possible, but it is not "project-level masking"; it is "create and maintain an anonymized parent branch, then create preview children from that parent."

The plan needs a parent-branch decision tree:

- If the parent branch is production and has no masking, do not let Vercel create normal preview branches from it.
- If the parent is an anonymized branch and masking already completed, preview children inherit masked data, but they may not inherit anonymized-branch metadata/rules for future reruns.
- If masking rules changed after child branches already exist, those children do not magically refresh. They need recreation or explicit re-anonymization if they are anonymized branches.
- Rerunning anonymization applies rules to the branch's current data, not fresh data from the parent. That matters for stale preview data and for partially failed masking runs.

### Finding 3 - The schema PII inventory is too narrow

The plan's starting inventory catches some obvious fields, but it is not broad enough for the promise implied by "voter = plaintiff = juror" in `docs/ROADMAP.md:75-77` and by the memorial/court schema comments. It should be a deny-by-default inventory of user-authored, user-linked, contact, legal, health, location, token, and raw-message surfaces.

Concrete missing or under-specified surfaces from `packages/db/prisma/schema.prisma`:

- `User.signupLandingUrl`, `countryCode`, `regionCode`, `city`, `postalCode`, `latitude`, `longitude`, income/demographic/health/census fields, skill/interest tags, and `phoneNumber` at lines 1383-1511. These are more sensitive than many names.
- Auth and credential tables: `User.password` at line 1366, `Account.refresh_token`, `access_token`, `id_token`, `session_state`, `oauth_token_secret`, and `oauth_token` at lines 1615-1640, `Session.sessionToken` at line 1666, and `VerificationToken.identifier`/`token` at lines 1693-1697. These should be destroyed, not merely masked.
- `Person.handle`, `image`, `links`, `currentAffiliation`, `website`, `sourceUrl`, and `sourceRef` at lines 753-819. Masking only names/email/bio/headline leaves enough profile linkage to re-identify many people.
- `PersonCondition.conditionName`, `conditionCode`, `sourceUrl`, and public/private flags at lines 896-926. A private condition attached to a human is health data.
- `Measurement.note`, `sourceName`, `latitude`, and `longitude` at lines 2327-2343, plus `InterventionExperience.notes`, `frequencyText`, outcome/side-effect public comments, and dates at lines 2369-2513. This is N-of-1 health data, not safe just because it is not email.
- `Subject.externalId` and `displayName` at lines 2114-2130 can leak identity labels used by analysis/court rows.
- `SurveyResponse` and `QuestionResponse.answer` at lines 6832-6882. Partner survey free text can contain contact details, employer names, health facts, or political views.
- `ReferralInvitation.recipientName`, `recipientEmail`, `messageText`, `inviteToken`, and `originUrl` at lines 3587-3632. The plan mentions `ReferralInvitation.email`, but the real fields are `recipientEmail` and `recipientName`; it also misses tokens and message text.
- `EmailLog.toAddress`, `subject`, `providerMessageId`, `subjectTemplate`, `sendContext`, `errorMessage`, and `dedupeKey` at lines 7021-7069. Provider IDs and send context can be enough to correlate real people and campaigns.
- `ShareAttempt.templateBody`, `renderedMessage`, and `context` at lines 7128-7141. The schema explicitly says `renderedMessage` is "Exact final message content the user saw / sent (per-sender; forensics)." That is user-authored/user-specific content.
- `Task.title`, `description`, `impactStatement`, `roleTitle`, `assigneeAffiliationSnapshot`, `contextJson`, and `completionEvidence` at lines 5275-5327. The plan names `Task.description` but misses title, JSON context, completion evidence, and snapshots.
- `TaskComment.authorNameSnapshot`, `message`, `mediaUrl`, `citationsJson`, and moderation metadata at lines 5542-5588. The plan correctly notes `message`, but should include the surrounding identity and media fields.
- `TaskCommunicationEndpoint.label`, `url`, `email`, `instructions`, and `sourceUrl` at lines 6055-6068; `TaskCommunicationVariant.subject`, `htmlBody`, `textBody`, `senderIdentity`, `signature`, and `footer` at lines 6160-6179; and `TaskCommunication.recipientEmail`, `recipientNameSnapshot`, `senderNameSnapshot`, `unsubscribeToken`, `externalUrl`, `errorMessage`, `providerMessageId`, and `metadataJson` at lines 6242-6317.
- `OrganizationMember` has no direct name/email columns, but it is still a roster. `OrganizationMember.userId` plus `Organization` plus `User`/`Person` relations at lines 5165-5185 can expose who belongs to which organization if user/person masking has any exception.
- `Organization.contactEmail` is included, but `Organization.creatorId`, website/donation/source URLs, and `OrganizationReferendumPosition.statement` at lines 5110-5132 and 5206-5216 can also include personal contact or signatory details for pending org submissions.
- Court/memorial surfaces go beyond the current list: `CourtCase.metadataJson`, `CourtCaseParty.standingTheory` and `metadataJson`, `CourtCaseClaim.argumentMarkdown` and `metadataJson`, `CourtCaseHarm.bodyMarkdown` and `metadataJson`, `CourtCaseEvidence.bodyMarkdown`, `sourceUrl`, `containsSensitiveData`, and `metadataJson` at lines 4341-4704. The plan names only `CourtCaseParty.displayNameSnapshot`.
- `PersonMemorialEvidence.containsSensitiveData` at lines 1197-1201 means evidence should be conditionally destroyed/redacted when true; the plan only lists title/description/source URL.
- `SourceArtifact.payloadJson` at lines 5489-5490 can retain upstream raw payloads. Any masking plan that ignores source artifacts can leave the original PII beside the cleaned first-class columns.
- Web push and connected account records: `WebPushSubscription.endpoint`, keys, `auth`, and `userAgent` around lines 4050-4054, `SocialAccount.accountId`, `username`, and `walletAddress` at lines 6968-6986, and `VoteTokenMint.nullifierHash`/`walletAddress` at lines 4846-4850 are not covered.

This does not mean every field above needs the same mask. It means the plan needs an explicit "not masked because..." decision for each class, especially JSON/raw payload columns.

### Finding 4 - The email/hash policy is underspecified and could preserve the wrong lookup

The plan says to use uniqueness-preserving values for unique email columns, but it does not decide the privacy trade per email surface.

Hashing emails preserves equality and reverse lookup by anyone who knows or guesses the original email, especially if the salt is exposed or weak. PostgreSQL Anonymizer's own docs distinguish pseudonymization/hashing from anonymization and warn that hashed data can still be linked back with the masking function and salt. See `https://postgresql-anonymizer.readthedocs.io/en/latest/masking_functions/` and `https://access.crunchydata.com/documentation/postgresql-anonymizer/2.5.1/masking_functions/`.

Column-level policy should be explicit:

- For `User.email` and `Person.email`, prefer deterministic synthetic addresses derived from row IDs, e.g. stable `@preview.invalid`, not hashes of the original address. Preserve uniqueness; do not preserve lookup by real email.
- If preview auth needs real login, create or restore only synthetic managed accounts after masking. Do not keep production-user emails/password hashes for convenience.
- For `ReferralInvitation.recipientEmail`, `TaskCommunication.recipientEmail`, `TaskCommunicationEndpoint.email`, `EmailLog.toAddress`, and `Organization.contactEmail`, fake or null values are usually better than hashed values because reverse-lookup-by-email is not a feature worth preserving in preview.
- For `VerificationToken.identifier`, `Session.sessionToken`, OAuth tokens, unsubscribe tokens, invite tokens, web push secrets, provider message IDs, and password hashes, the right operation is destroy/null/randomize, not fake-realistic masking.
- For URLs (`signupLandingUrl`, `originUrl`, `externalUrl`, `sourceUrl`, `website`) either redact completely or keep only a safe host/path subset. Query strings can contain referral codes, emails, UTM forensics, tokens, or private form state.
- For free text (`TaskComment.message`, `ShareAttempt.renderedMessage`, memorial testimony, legal standing theories, survey answers, task descriptions, completion evidence, inbound replies), static redaction is safer than fake prose. Free text is where people put names, phone numbers, emails, addresses, diagnoses, and legal facts.
- For JSON/raw payload columns, either null them, replace with `{}`, or use a reviewed JSON scrubber function. The plan cannot assume JSON is safe because first-class columns were masked.

### Finding 5 - The SQL path may be the fastest phase, but it is not the best end state

The plan's "preferred first implementation shape" is pragmatic for a manual/disposable proof, but it is the wrong long-term privacy boundary. Running `anon.anonymize_database()` inside the existing preview sync job is after branch creation and likely after deployment. That is acceptable only as a Phase 1 emergency mitigation if everyone understands the exposure window.

The end state should be one of these:

- Vercel previews are configured to use children of an already-anonymized parent branch.
- CI creates an anonymized branch through Neon before any preview deploy and then injects that exact connection string into Vercel.
- Vercel auto-deploy is blocked until a separate predeploy masking workflow finishes.

The plan should not frame "keep current Vercel preview branch integration and run SQL after migrations" as the preferred final architecture. It is a stopgap.

### Finding 6 - Neon API automation is missing required wiring and ordering

If the plan pivots to Neon API or `neondatabase/create-branch-action@v6`, the current CI job does not have enough state. It only has `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, and a Vercel-pulled `DATABASE_URL`. It does not define `NEON_API_KEY`, `NEON_PROJECT_ID`, `branch_id`, parent branch ID/name, database name, role, endpoint mapping, or a way to tell Vercel to deploy against the action-created branch.

Current Neon API docs also say `start_anonymization` and `masking_rules` updates target anonymized branches. A normal Vercel-created preview branch may not be eligible. The plan should state how it determines whether the branch is already anonymized before calling `PATCH /masking_rules` or `POST /anonymize`, and it should fail before deployment if it is not.

Order of operations matters:

1. Resolve intended parent branch.
2. Ensure the parent is safe or create a new anonymized branch from production with the full rules.
3. Wait for `anonymized_status` to reach success.
4. Run migrations only against the safe branch, or rerun masking after migrations if migrations add PII columns.
5. Run managed-data sync only if it is guaranteed public/synthetic, or run a post-sync masking verification.
6. Expose the connection string to Vercel only after the above succeeds.

The current plan has pieces of this, but not a concrete API sequence.

### Finding 7 - Failure modes are not specified tightly enough

`ON_ERROR_STOP=1` makes `psql` fail, but it does not undo partially applied static masking. A failure during `anon.anonymize_database()` can leave a branch partly masked and partly raw. Worse, if Vercel already deployed, the preview can still be live against that branch even though GitHub Actions failed.

The plan needs explicit failure handling:

- On any masking setup, anonymization, or verification failure, stop before managed-data sync.
- Mark CI failed with a loud summary that says preview data is not safe.
- Do not print raw values in diagnostics.
- Delete, quarantine, or disable the preview branch/deployment if possible.
- Add a non-secret sentinel check so downstream steps can prove masking completed. A CI summary line is not a gate.
- Treat "masking rules applied" and "branch anonymized" as separate states. Updating rules without a completed anonymization pass is not safe.
- Re-run aggregate verification after managed-data sync, because managed data can reintroduce human names, emails, URLs, or message text if a future seed stops being synthetic.

### Finding 8 - The plan needs an immediate phased path

The checklist is too monolithic for something the user wants done soon. A better plan would call out phases:

- Phase 1: checked-in masking rules plus manual/disposable Neon branch validation. Prove `anon` can run, prove the rule list covers the real schema, and prove verification queries are non-leaking.
- Phase 1.5: manually apply the rules to a long-lived anonymized parent branch or create one through the Neon API. Point a single test preview at it.
- Phase 2: CI automation with `psql` or Neon API, but still fail closed and no reviewer access before success.
- Phase 3: replace the after-deploy masking stopgap with predeploy anonymized branch creation or preview children from the anonymized parent.

This makes "do something now" possible without pretending the first SQL insertion fully solves preview privacy.

### Finding 9 - The current citations are mostly still current, but the GA claim remains wrong

The plan's research log is directionally current. The official API reference pages are still live and still document the endpoints the plan listed. The change is in the relative dates: `createprojectbranchanonymized` now shows "Updated 17 days ago" in the fetched API reference, and status/update pages show similar April 2026 update windows. The feature still appears Beta in the API docs.

So the critique is not "the Neon endpoints disappeared." They exist. The critique is that the plan should not rely on stale "GA late 2025" framing from `.claude/codex-delegation.md`; current official docs still say Beta, and the implementation must fail closed.

### Finding 10 - The diagrams hide the actual unsafe state

The current-state diagram is broadly accurate. The proposed-state diagram is misleading because it keeps the same parallel Vercel deploy path but labels the result as safe after a later GitHub Actions step. It needs either:

- A red unsafe interval between "Vercel injects branch DATABASE_URL" and "anonymization verified"; or
- A different diagram where the branch is anonymized before Vercel sees the connection string; or
- A parent/child diagram: `production -> anonymized parent -> preview branch`.

Without that change, the diagram teaches future implementers to put the control at the wrong boundary.

## Codex critique summary

Top 3 issues by severity:

1. The proposed after-deploy/after-branch masking flow is not fail-closed. A Vercel preview can serve unmasked production-derived data before CI masking succeeds, and a failed CI job does not automatically remove the preview.
2. The PII inventory is incomplete. It misses auth/secrets, User location/census/health fields, survey answers, share/email forensics, JSON/raw payloads, organization roster implications, and multiple court/memorial/task communication fields.
3. Neon automation is under-specified. Current docs show branch-scoped Beta anonymization APIs, not a project-level always-on rule set; the plan needs explicit parent-branch handling, branch ID/API wiring, completed-status polling, and partial-failure quarantine.

## Mike approved (round 3)

Decisions:
1. **Fail-closed strategy: block preview until masking succeeds.** Vercel preview gets a placeholder/holding state until the CI masking job reports success. Strongest privacy posture per Mike's call.
2. **PII inventory: mask everything that could identify a real human or carry sensitive data.** Implementation agent reads `packages/db/prisma/schema.prisma` in full, identifies every field that holds user-authored content, identifiers, or sensitive context. The plan's original inventory missed auth secrets, location/census/health, survey answers, share/email forensics, JSON payloads, court/memorial/task communication — fill those gaps.
3. Module location, dispatch boundaries, and Neon API specifics per the round-1 plan stand.

DISPATCH NOTES:
- Schema/migration: do NOT alter `packages/db/prisma/schema.prisma`. The masking lives in a separate SQL file (`packages/db/prisma/anonymization-rules.sql` per the plan).
- Mike side: Mike must add `NEON_API_KEY` to the GitHub `Preview` environment secrets before the masking step can execute. Plan must include this in the user-side handoff section + the docs file.
- The implementation produces code + a docs file. Actual masking runs once Mike completes the dashboard setup.

## Codex round-4 recommendation — pending Mike approval

Mike's verbatim goal statement:

> "I went to this. had this page is like if some shit changes in the production database I dont want it to like. I would like to have like a staging server. I guess too mirror how the app is going to behave once it is connected to the production database. like if we just I dont think we expose much super sensitive data and the tests like technically and like it is protected by vercel login. and then the only thing you can access is like the demo user. I think I think technically we would be fine just using a fork of the production database without all this anonymization shit but I dont know. talk to codex about the simplest way to achieve our fundamental goals"

Distilled product goals:

1. Previews should mirror production behavior with the live schema and roughly-live data, so schema/data drift gets caught before prod.
2. Preview access should be small: Vercel deployment protection plus preview credentials that should only grant the demo user.
3. The current Neon anonymized-branch path is likely over-built for the immediate goal.
4. The chosen architecture should be the simplest thing that catches drift without exposing real people.

### Recommendation

Do **not** keep trying to use Neon's `masking_rules`/`SECURITY LABEL` API on Vercel-created preview branches. That path is now proven to be the wrong control point: Vercel creates regular Neon branches, while Neon's masking rules API only applies to branches created with `POST /branch_anonymized`. There is no conversion API.

The cheapest defensible path is **Option B: keep Vercel's normal production-fork preview branches, but replace the broken Neon masking API step with a direct `psql` masking pass on the Vercel-made branch**. This keeps the live schema and production-shaped data, avoids coordinating a pre-Vercel Neon branch lifecycle, and removes the Beta Neon anonymized-branch dependency from the preview path. The existing `packages/db/prisma/anonymization-rules.sql` can remain the source-of-truth inventory, but implementation should mechanically convert/apply the effective rules as raw SQL `UPDATE` statements against the preview branch after migrations and before any reviewer-visible success signal.

I would not endorse pure Option C as the default durable architecture. It is true that the likely exposure is lower than a normal public staging site if Vercel protection is enforced, but the "only demo user can access data" assumption is false at the app layer. After someone passes Vercel deployment protection, there are logged-out public routes that can render production-derived names, email fallbacks, profile text, health/death/testimony details, organization contact data, task comments, share/email content, and referendum/social-proof rows. Option C is acceptable only as a short emergency unblock if Mike explicitly accepts that authorized preview reviewers may see and screenshot real production-derived PII.

### Access-control findings

- Vercel deployment protection could not be dashboard-confirmed from this sandbox. The local `.env` `VERCEL_TOKEN` failed Vercel REST authentication, and the Vercel CLI could not use local auth because it tried to write outside the workspace.
- Repo evidence says previews are intended to be protected: `packages/web/scripts/smoke-deploy.mjs` supports the `x-vercel-protection-bypass` header and treats Vercel protection pages as an expected condition; `.github/workflows/smoke-deploy.yml` documents `VERCEL_AUTOMATION_BYPASS_SECRET` from "Deployment Protection -> Protection Bypass for Automation"; `/api/dev/login-as-demo` comments say preview deploys are already auth-gated by Vercel's bypass-cookie system.
- Treat preview protection as **unverified until checked in the Vercel dashboard or via a working token**. The implementation plan must include a live proof that an unauthenticated request to a preview URL gets the Vercel protection challenge, not app HTML.
- `packages/web/src/middleware.ts` only app-auth-gates `/dashboard`, `/profile`, `/census`, `/settings`, and `/admin`. Public routes remain public to anyone who clears Vercel deployment protection.
- `packages/web/src/app/api/dev/login-as-demo/route.ts` only works in preview/dev and signs in `DEMO_USER_EMAIL`. `packages/db/src/managed-data/managed-demo-user.ts` creates that user without `isAdmin`, so the managed demo account is non-admin by default. If a production demo row is manually changed to admin, the route will honor the database value.
- `packages/web/src/lib/auth.ts` verifies credentials with bcrypt compare, so `User.password` is expected to be a password hash in the app's current auth path. It is still credential material and should not be visible in previews.

### Public preview surfaces that can leak production-derived PII

- `/people` is logged-out and lists `Person.displayName`, `Person.image`, `Person.headline`, `Person.currentAffiliation`, `Person.countryCode`, and public task context. The server query filters active/non-deceased rows but does not require `Person.isPublic = true`.
- `/people/[id]` is logged-out and can display represented-person and task-profile content, including person names, images, bio, dates, health/death/testimony fields, memorial messages, responsible-party names, and evidence context.
- `/signatories` is logged-out and uses referendum home data. `userDisplaySelect` includes `User.email`, and `getUserDisplayName` can fall back to email if no linked display name exists.
- `/organizations/[id]` is logged-out and displays organization name, website, description, logo, survey/embed surfaces, and public organization position content.
- `/tasks` and task surfaces are public recruitment surfaces and can expose task titles, descriptions, comments, communication targets, organization/person snapshots, and source links depending on the route/state.

These surfaces mean Vercel deployment protection is only an outer gate. It does not make a production fork safe to browse by default.

### Concrete PII and sensitive-content inventory from `schema.prisma`

Direct identity/profile fields:

- `Person.handle`, `Person.displayName`, `Person.firstName`, `Person.middleName`, `Person.lastName`, `Person.email`, `Person.image`, `Person.bio`, `Person.birthDate`, `Person.deathDate`, `Person.links`, `Person.currentAffiliation`, `Person.countryCode`, `Person.headline`, `Person.coverImage`, `Person.website`, `Person.sourceUrl`, `Person.sourceRef`, `Person.createdByUserId`
- `User.email`, `User.password`, `User.personId`, `User.referralCode`, `User.signupLandingUrl`, `User.phoneNumber`, `User.timeZone`, `User.countryCode`, `User.regionCode`, `User.city`, `User.postalCode`, `User.latitude`, `User.longitude`, `User.isAdmin`
- `Subject.externalId`, `Subject.displayName`
- `Organization.name`, `Organization.slug`, `Organization.description`, `Organization.creatorId`, `Organization.website`, `Organization.squareLogoUrl`, `Organization.wordmarkLogoUrl`, `Organization.donationUrl`, `Organization.sourceUrl`, `Organization.sourceRef`, `Organization.contactEmail`
- `OrganizationMember.organizationId`, `OrganizationMember.userId`, `OrganizationMember.role`
- `SocialAccount.userId`, `SocialAccount.accountId`, `SocialAccount.username`, `SocialAccount.walletAddress`

Auth, tokens, OAuth, and credential material:

- `Account.providerAccountId`, `Account.refresh_token`, `Account.access_token`, `Account.scope`, `Account.id_token`, `Account.session_state`, `Account.oauth_token_secret`, `Account.oauth_token`
- `Session.sessionToken`
- `VerificationToken.identifier`, `VerificationToken.token`
- `WebPushSubscription.userId`, `WebPushSubscription.endpoint`, `WebPushSubscription.p256dh`, `WebPushSubscription.auth`, `WebPushSubscription.userAgent`
- `IntegrationConnection.userId`, `IntegrationConnection.accessToken`, `IntegrationConnection.refreshToken`, `IntegrationConnection.tokenExpiresAt`, `IntegrationConnection.lastSyncError`
- `OAuthClient.clientId`, `OAuthClient.clientName`, `OAuthClient.redirectUris`, `OAuthClient.scope`, `OAuthClient.clientUri`
- `OAuthAuthCode.code`, `OAuthAuthCode.userId`, `OAuthAuthCode.redirectUri`, `OAuthAuthCode.codeChallenge`, `OAuthAuthCode.scopes`
- `OAuthGrant.userId`, `OAuthGrant.scopes`, `OAuthGrant.refreshTokenHash`

Census, demographic, income, and health fields:

- `User.annualHouseholdIncomeUsd`, `User.annualPersonalIncomeUsd`, `User.householdSize`, `User.birthYear`, `User.educationLevel`, `User.employmentStatus`, `User.genderIdentity`, `User.censusNotes`, `User.biologicalSex`, `User.ethnicityOrRace`, `User.maritalStatus`, `User.numberOfDependents`, `User.primaryLanguage`, `User.healthInsuranceType`, `User.chronicConditionCount`, `User.disabilityStatus`, `User.smokingStatus`, `User.alcoholFrequency`, `User.heightCm`, `User.annualTaxesPaidUsd`, `User.monthlyHousingCostUsd`, `User.housingStatus`, `User.hoursWorkedPerWeek`, `User.industryOrSector`, `User.citizenshipStatus`, `User.internetAccessType`, `User.skillTags`, `User.interestTags`, `User.availableHoursPerWeek`, `User.maxTaskDifficulty`
- `PersonCondition.personId`, `PersonCondition.conditionName`, `PersonCondition.conditionCodeSystem`, `PersonCondition.conditionCode`, `PersonCondition.reportedByUserId`, `PersonCondition.sourceUrl`, `PersonCondition.isPublic`
- `Measurement.subjectId`, `Measurement.recordedByUserId`, `Measurement.startTime`, `Measurement.value`, `Measurement.originalValue`, `Measurement.duration`, `Measurement.note`, `Measurement.sourceName`, `Measurement.integrationConnectionId`, `Measurement.latitude`, `Measurement.longitude`
- `NOf1Variable.subjectId`, `NOf1Variable.onsetDelay`, `NOf1Variable.durationOfAction`, `NOf1Variable.fillingValue`, `NOf1Variable.latestTaggedMeasurementStartAt`, `NOf1Variable.earliestTaggedMeasurementStartAt`, `NOf1Variable.taggedMeasurementValueCount`, `NOf1Variable.maxTaggedMeasurementValue`, `NOf1Variable.minTaggedMeasurementValue`, `NOf1Variable.meanTaggedMeasurementValue`, `NOf1Variable.medianTaggedMeasurementValue`, `NOf1Variable.standardDeviationTaggedMeasurementValue`
- `NOf1VariableRelationship.subjectId`, `NOf1VariableRelationship.predictivePearsonCorrelationCoefficient`, `NOf1VariableRelationship.effectSize`, `NOf1VariableRelationship.optimalPearsonProduct`, `NOf1VariableRelationship.aggregatedQMScore`, `NOf1VariableRelationship.numberOfPairs`, `NOf1VariableRelationship.onsetDelay`
- `TrackingReminder.userId`, `TrackingReminder.nOf1VariableId`, `TrackingReminder.defaultValue`, `TrackingReminder.reminderStartTime`, `TrackingReminder.reminderEndTime`, `TrackingReminder.instructions`, `TrackingReminder.lastTracked`
- `TrackingReminderNotification.userId`, `TrackingReminderNotification.notifyAt`, `TrackingReminderNotification.notifiedAt`, `TrackingReminderNotification.receivedAt`, `TrackingReminderNotification.trackedValue`
- `IntegrationSyncLog.integrationConnectionId`, `IntegrationSyncLog.errorMessage`

Memorial, death, testimony, and legal/court content:

- `PersonRelationship.subjectPersonId`, `PersonRelationship.objectPersonId`, `PersonRelationship.relationshipType`, `PersonRelationship.createdByUserId`
- `PersonMemorial.personId`, `PersonMemorial.primaryPersonConditionId`, `PersonMemorial.deathCountryCode`, `PersonMemorial.deathLocation`, `PersonMemorial.conflictId`, `PersonMemorial.civilianStatus`, `PersonMemorial.wasChild`, `PersonMemorial.circumstances`, `PersonMemorial.isPublic`
- `PersonMemorialSubmission.memorialId`, `PersonMemorialSubmission.submittedByUserId`, `PersonMemorialSubmission.memorialMessage`, `PersonMemorialSubmission.consentToPublishName`, `PersonMemorialSubmission.consentToPublishStory`, `PersonMemorialSubmission.isPublic`
- `PersonMemorialResponsibleParty.name`, `PersonMemorialResponsibleParty.sourceArtifactId`, `PersonMemorialResponsibleParty.sourceUrl`, `PersonMemorialResponsibleParty.privateNotes`
- `PersonMemorialEvidence.submittedByUserId`, `PersonMemorialEvidence.submissionId`, `PersonMemorialEvidence.sourceArtifactId`, `PersonMemorialEvidence.title`, `PersonMemorialEvidence.description`, `PersonMemorialEvidence.sourceUrl`, `PersonMemorialEvidence.containsSensitiveData`
- `PersonEfficacyLagEvidence.memorialId`, `PersonEfficacyLagEvidence.personConditionId`, `PersonEfficacyLagEvidence.explanation`, `PersonEfficacyLagEvidence.reviewedByUserId`
- `CourtCase.createdByUserId`, `CourtCase.nominalPlaintiffSubjectId`, `CourtCase.primaryRespondentSubjectId`, `CourtCase.beneficiarySubjectId`, `CourtCase.metadataJson`
- `CourtCaseParty.subjectId`, `CourtCaseParty.displayNameSnapshot`, `CourtCaseParty.standingTheory`, `CourtCaseParty.metadataJson`, `CourtCaseParty.createdByUserId`
- `CourtCaseClaim.title`, `CourtCaseClaim.argumentMarkdown`, `CourtCaseClaim.requestedFinding`, `CourtCaseClaim.metadataJson`, `CourtCaseClaim.createdByUserId`
- `CourtCaseHarm.title`, `CourtCaseHarm.bodyMarkdown`, `CourtCaseHarm.affectedSubjectId`, `CourtCaseHarm.metadataJson`, `CourtCaseHarm.createdByUserId`
- `CourtCaseEvidence.title`, `CourtCaseEvidence.bodyMarkdown`, `CourtCaseEvidence.sourceArtifactId`, `CourtCaseEvidence.personMemorialId`, `CourtCaseEvidence.sourceUrl`, `CourtCaseEvidence.contentHash`, `CourtCaseEvidence.containsSensitiveData`, `CourtCaseEvidence.metadataJson`, `CourtCaseEvidence.createdByUserId`
- `CourtCaseRemedy.title`, `CourtCaseRemedy.bodyMarkdown`, `CourtCaseRemedy.targetPartyId`, `CourtCaseRemedy.metadataJson`, `CourtCaseRemedy.createdByUserId`

Votes, referrals, sharing, email, and user-authored content:

- `CitizenBillVote.userId`, `CitizenBillVote.billId`, `CitizenBillVote.billTitle`, `CitizenBillVote.reasoning`, `CitizenBillVote.shareIdentifier`, `CitizenBillVote.cbaSnapshot`
- `ReferendumVote.userId`, `ReferendumVote.personId`, `ReferendumVote.referredByUserId`, `ReferendumVote.organizationId`, `ReferendumVote.publicComment`, `ReferendumVote.isPublic`, `ReferendumVote.originUrl`
- `Referral.userId`, `Referral.referredByUserId`, `Referral.originatingShareAttemptId`
- `ReferralClick.code`, `ReferralClick.referrerUserId`, `ReferralClick.shareAttemptId`, `ReferralClick.refererUrl`, `ReferralClick.userAgent`, `ReferralClick.countryCode`
- `ReferralInvitation.referrerUserId`, `ReferralInvitation.recipientPersonId`, `ReferralInvitation.convertedVoteId`, `ReferralInvitation.inviteToken`, `ReferralInvitation.recipientName`, `ReferralInvitation.recipientEmail`, `ReferralInvitation.messageText`, `ReferralInvitation.originUrl`
- `EmailLog.userId`, `EmailLog.toAddress`, `EmailLog.subject`, `EmailLog.providerMessageId`, `EmailLog.subjectTemplate`, `EmailLog.sendContext`, `EmailLog.errorMessage`, `EmailLog.dedupeKey`
- `ShareAttempt.userId`, `ShareAttempt.surface`, `ShareAttempt.channel`, `ShareAttempt.emailLogId`, `ShareAttempt.templateId`, `ShareAttempt.templateBody`, `ShareAttempt.renderedMessage`, `ShareAttempt.context`
- `SurveyResponse.userId`, `SurveyResponse.organizationId`
- `QuestionResponse.answer`
- `Notification.userId`, `Notification.title`, `Notification.message`, `Notification.link`
- `NotificationPreference.userId`
- `Activity.userId`, `Activity.description`, `Activity.metadata`, `Activity.entityType`, `Activity.entityId`

Task, communications, comments, and generated content:

- `Task.assigneePersonId`, `Task.assigneeOrganizationId`, `Task.verifiedByUserId`, `Task.createdByUserId`, `Task.title`, `Task.description`, `Task.impactStatement`, `Task.roleTitle`, `Task.assigneeAffiliationSnapshot`, `Task.skillTags`, `Task.interestTags`, `Task.contextJson`, `Task.completionEvidence`
- `TaskClaim.userId`, `TaskClaim.verifiedByUserId`, `TaskClaim.completionEvidence`, `TaskClaim.verificationNote`, `TaskClaim.actualEffortSeconds`, `TaskClaim.actualCashCostUsd`
- `TaskComment.authorUserId`, `TaskComment.authorPersonId`, `TaskComment.authorOrganizationId`, `TaskComment.authorNameSnapshot`, `TaskComment.message`, `TaskComment.mediaUrl`, `TaskComment.mentionedUserIds`, `TaskComment.citationsJson`, `TaskComment.moderationReason`, `TaskComment.moderatedByUserId`
- `TaskCommentVote.userId`, `TaskCommentVote.ipHash`, `TaskCommentVote.userAgentHash`
- `TaskEdge.assumptionsJson`, `TaskEdge.notes`
- `TaskImpactEstimateSet.assumptionsJson`
- `TaskImpactFrameEstimate.summaryStatsJson`
- `TaskImpactMetric.valueJson`, `TaskImpactMetric.summaryStatsJson`, `TaskImpactMetric.metadataJson`
- `TaskCommunicationEndpoint.label`, `TaskCommunicationEndpoint.url`, `TaskCommunicationEndpoint.email`, `TaskCommunicationEndpoint.instructions`, `TaskCommunicationEndpoint.sourceUrl`
- `TaskCommunicationVariant.subject`, `TaskCommunicationVariant.htmlBody`, `TaskCommunicationVariant.textBody`, `TaskCommunicationVariant.senderIdentity`, `TaskCommunicationVariant.signature`, `TaskCommunicationVariant.footer`
- `TaskCommunication.recipientPersonId`, `TaskCommunication.recipientUserId`, `TaskCommunication.recipientOrganizationId`, `TaskCommunication.recipientEmail`, `TaskCommunication.recipientNameSnapshot`, `TaskCommunication.senderUserId`, `TaskCommunication.senderPersonId`, `TaskCommunication.senderNameSnapshot`, `TaskCommunication.unsubscribeToken`, `TaskCommunication.externalUrl`, `TaskCommunication.errorMessage`, `TaskCommunication.providerMessageId`, `TaskCommunication.metadataJson`
- `TaskTrigger.notes`, `TaskTrigger.metadata`, `TaskTrigger.createdByUserId`, `TaskTrigger.updatedByUserId`
- `TaskSpawnSpec.titleTemplate`, `TaskSpawnSpec.descriptionTemplate`, `TaskSpawnSpec.impactStatementTemplate`, `TaskSpawnSpec.roleTitleTemplate`, `TaskSpawnSpec.skillTagTemplates`, `TaskSpawnSpec.interestTagTemplates`, `TaskSpawnSpec.metadata`
- `TaskCommunicationSpawnSpec.subjectTemplate`, `TaskCommunicationSpawnSpec.bodyTextTemplate`, `TaskCommunicationSpawnSpec.bodyHtmlTemplate`, `TaskCommunicationSpawnSpec.commentTemplate`, `TaskCommunicationSpawnSpec.emailScope`, `TaskCommunicationSpawnSpec.dedupeKeyTemplate`, `TaskCommunicationSpawnSpec.metadata`
- `TaskTriggerFire.actorUserId`, `TaskTriggerFire.context`, `TaskTriggerFire.error`, `TaskTriggerFire.spawnedTaskKeys`, `TaskTriggerFire.spawnedTaskIds`
- `SourceArtifact.sourceKey`, `SourceArtifact.externalKey`, `SourceArtifact.versionKey`, `SourceArtifact.title`, `SourceArtifact.sourceUrl`, `SourceArtifact.sourceRef`, `SourceArtifact.contentHash`, `SourceArtifact.payloadJson`
- `ContentReport.targetType`, `ContentReport.targetId`, `ContentReport.reportedByUserId`, `ContentReport.message`, `ContentReport.correctionJson`, `ContentReport.sourceUrl`, `ContentReport.reviewedByUserId`, `ContentReport.resolutionNote`

Financial, wallet, agent, and audit fields:

- `VoteTokenMint.userId`, `VoteTokenMint.nullifierHash`, `VoteTokenMint.walletAddress`, `VoteTokenMint.txHash`
- `PrizeTreasuryDeposit.depositorAddress`, `PrizeTreasuryDeposit.txHash`
- `PublicGoodsRecipient.name`, `PublicGoodsRecipient.walletAddress`
- `WishocraticAllocation.userId`, `WishocraticAllocation.itemAId`, `WishocraticAllocation.itemBId`, `WishocraticAllocation.allocationA`, `WishocraticAllocation.allocationB`
- `WishocraticItemInclusion.userId`, `WishocraticItemInclusion.itemId`, `WishocraticItemInclusion.included`
- `WishocraticEncryptedAllocation.userId`, `WishocraticEncryptedAllocation.ciphertext`, `WishocraticEncryptedAllocation.iv`
- `Badge.userId`, `Badge.metadata`
- `WishPoint.userId`, `WishPoint.metadata`
- `AgentComputeDeposit.externalRef`, `AgentComputeDeposit.memo`, `AgentComputeDeposit.depositorUserId`
- `AgentRunCost.runId`, `AgentRunCost.outputSummary`
- `AgentTaskLease.agentId`
- `McpToolCallAudit.userId`, `McpToolCallAudit.clientId`, `McpToolCallAudit.oauthGrantId`, `McpToolCallAudit.agentId`, `McpToolCallAudit.runId`, `McpToolCallAudit.inputSummaryJson`, `McpToolCallAudit.outputSummaryJson`

Reasoning/A-B test and distribution data tied to people or organizations:

- `ReasoningVariantSet.organizationId`, `ReasoningVariantSet.createdByUserId`
- `ReasoningVariantArm.content`, `ReasoningVariantArm.validatorViolations`
- `ReasoningAssignmentRule.hostKey`, `ReasoningAssignmentRule.organizationId`, `ReasoningAssignmentRule.relationshipBucket`, `ReasoningAssignmentRule.audienceTag`, `ReasoningAssignmentRule.referralSource`, `ReasoningAssignmentRule.device`, `ReasoningAssignmentRule.chainDepth`, `ReasoningAssignmentRule.surface`, `ReasoningAssignmentRule.createdByUserId`
- `ReasoningVariantExposure.sessionId`, `ReasoningVariantExposure.userId`, `ReasoningVariantExposure.organizationId`, `ReasoningVariantExposure.relationshipBucket`, `ReasoningVariantExposure.referralSource`, `ReasoningVariantExposure.device`, `ReasoningVariantExposure.chainDepth`, `ReasoningVariantExposure.returningVsFirst`, `ReasoningVariantExposure.referredByUserId`, `ReasoningVariantExposure.shareAttemptId`
- `ReasoningOutcomeRecord.sessionId`, `ReasoningOutcomeRecord.userId`, `ReasoningOutcomeRecord.organizationId`, `ReasoningOutcomeRecord.audienceTag`, `ReasoningOutcomeRecord.relationshipBucket`, `ReasoningOutcomeRecord.referredByUserId`
- `ReasoningFraudPattern.reason`
- `ReasoningFraudFinding.sessionId`, `ReasoningFraudFinding.userId`, `ReasoningFraudFinding.details`
- `ReasoningOrgFork.organizationId`, `ReasoningOrgFork.createdByUserId`
- `ReasoningGenerationRequest.requestedByUserId`, `ReasoningGenerationRequest.aiPrompt`
- `ReasoningPromotionDecision.actorUserId`, `ReasoningPromotionDecision.chainValueEvidence`, `ReasoningPromotionDecision.fraudEvidence`, `ReasoningPromotionDecision.rGuardSnapshot`, `ReasoningPromotionDecision.chainValueGuardSnapshot`, `ReasoningPromotionDecision.rationale`
- `ReasoningBlacklistRule.createdByUserId`, `ReasoningBlacklistRule.pattern`, `ReasoningBlacklistRule.reason`
- `ReasoningLocaleConfig.reviewerUserIds`, `ReasoningLocaleConfig.bannedPhrases`, `ReasoningLocaleConfig.fraudBaselines`, `ReasoningLocaleConfig.generatorQuota`, `ReasoningLocaleConfig.createdByUserId`
- `ReasoningDistributionPolicyState.organizationId`, `ReasoningDistributionPolicyState.effortSpent`
- `ReasoningDistributionSliceSnapshot.organizationId`
- `ReasoningOrganizationDomain.organizationId`, `ReasoningOrganizationDomain.host`, `ReasoningOrganizationDomain.trustedParentDomains`, `ReasoningOrganizationDomain.cspAllowlist`, `ReasoningOrganizationDomain.createdByUserId`
- `ReasoningDistributionTarget.organizationId`, `ReasoningDistributionTarget.notes`, `ReasoningDistributionTarget.createdByUserId`
- `ReasoningBundleVariant.armBindings`, `ReasoningBundleVariant.createdByUserId`

### Invariant to verify, not proxy metadata

The gate must assert the real safety invariant, not a proxy like `anonymized_status == success` or "Vercel returned 200".

For the recommended Option B path, the CI invariant is:

> Every preview database branch that can back a reviewer-visible deployment has no raw production PII or sensitive user-authored content in the concrete columns above.

Implementation should keep a row/value-level verifier. It should sample or query high-risk columns after masking, after managed-data sync, and before the preview is declared usable. It should fail if values still look like real emails, raw OAuth/session tokens, phone numbers, non-demo names in user/profile contexts, raw comments/messages, health condition text, geolocation, or unmasked JSON payloads. Diagnostics must count failures and identify table/column names without printing raw values.

Add a second public-route invariant if Mike chooses temporary Option C:

> A logged-out preview visitor cannot see raw production PII on public pages.

That check must fetch the actual preview URL and prove one of these outcomes: unauthenticated requests receive the Vercel protection challenge instead of app HTML, or bypassed/logged-out requests to `/`, `/people`, `/signatories`, `/organizations`, `/tasks`, and representative detail pages do not contain known canary production PII values. This still does not make C privacy-equivalent to masking; it only bounds the public-route risk.

### Implementation steps for the next coding dispatch

1. Stop using the Neon anonymized-branch API against Vercel-created preview branches. Remove or bypass the `masking_rules`/`POST /anonymize` flow from the preview CI path.
2. Keep Vercel's existing preview database branch integration so previews still fork production and catch schema/data drift.
3. Convert the current `packages/db/prisma/anonymization-rules.sql` source of truth into a direct SQL masking pass for regular preview branches. Prefer a generated/checkable SQL artifact over hand-maintaining two divergent inventories.
4. Run the masking pass with `psql ON_ERROR_STOP=1` after preview migrations and before managed-data sync or any green preview summary.
5. Re-run the row-level masking invariant after managed-data sync, because managed-data sync can reintroduce names, emails, URLs, or message text if fixtures drift.
6. Add the preview protection proof: unauthenticated preview URL must show Vercel protection, or CI must fail loudly before telling reviewers the preview is usable.
7. Keep Option C as an explicit emergency switch only if Mike confirms he accepts authorized-reviewer PII exposure. If used, add `noindex` and the logged-out public-route invariant before disabling masking.
8. Do not print raw PII in CI summaries. Report table/column/count and the failing invariant.

### Files to touch in the next coding dispatch

- `.github/workflows/ci.yml` — replace the broken Neon API anonymization step with the direct preview-branch SQL masking flow, or add an explicit emergency C switch if Mike approves it.
- `packages/db/prisma/anonymization-rules.sql` — keep as source of truth; do not weaken coverage.
- A generated or committed SQL/script artifact under `packages/db/prisma/` or `packages/db/scripts/` — direct `UPDATE` masking for regular preview branches.
- `packages/web/scripts/verify-preview-masking.mjs` — keep the row-level invariant and run it after every operation that can reintroduce managed data.
- `packages/web/scripts/smoke-deploy.mjs` or a small companion script — prove Vercel protection/logged-out public-route behavior using real preview HTTP responses.

### Verification commands for the next coding dispatch

Do not use `pnpm build` or `next build` for this architecture change. Use narrow gates:

```powershell
git diff --check
pnpm --filter @optimitron/web exec node packages/web/scripts/verify-preview-masking.mjs
pnpm --filter @optimitron/web exec node packages/web/scripts/smoke-deploy.mjs --target Preview --url <preview-url>
```

For CI-only Neon/Vercel state, the decisive verification is a fresh `sync-preview-managed-data` run where:

1. preview migrations apply,
2. direct SQL masking succeeds,
3. masking verification succeeds after managed-data sync,
4. unauthenticated preview HTTP receives the Vercel protection challenge,
5. the GitHub summary never prints raw PII.

## Round 5 implementation log

- Replaced the preview Neon masking API path with generated direct `UPDATE` masking SQL.
- Added `packages/db/scripts/generate-anonymization-updates.mjs` and `packages/db/prisma/anonymization-updates.sql`.
- Added `@optimitron/db` script `anon:generate-updates` and a CI drift check for the generated SQL.
- Kept `anonymization-rules.sql` as the source of truth and updated its header for the generator path.
- Local verification on 2026-05-15: generator produced 392 `UPDATE` statements, rerun was idempotent, `git diff --check` passed, and local `psql EXPLAIN` passed for the generated `User.password` update.
