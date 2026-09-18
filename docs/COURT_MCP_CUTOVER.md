# Court MCP ownership cutover

This is [PR #345](https://github.com/mikepsinn/optimitron/pull/345), the second
stage of `COURT_MCP_OAUTH_ROLLOUT.md`. Its prerequisite is
[PR #350](https://github.com/mikepsinn/optimitron/pull/350)
(`feature/court-oauth-preparation`). Both require human review and merge.
Keep this PR based on preparation until preparation merges, then retarget it to
`main`. Do not merge this PR into the preparation branch.

## Deployment order

1. Resolve [production deployment blocker #299](https://github.com/mikepsinn/optimitron/issues/299):
   restore the Vercel deployment credential and verify an authorized production
   deployment can complete. Do not paste credentials into logs or PRs.
2. Merge and deploy the OAuth preparation PR first, including its additive
   database migration. Keep `MCP_COURT_RESOURCE_ENABLED` disabled. All grant
   consumers must use an explicit resource; existing credentials remain in
   `legacy`, with the original IDs and refresh hashes.
3. Deploy only Court from this reviewed branch while Optimitron remains on the
   preparation deployment and Court token issuance is disabled. Verify public
   discovery and the eight-tool catalog at `https://courtofhumanity.org`.
4. Provision the dedicated Court signing key and public JWKS on the preparation
   issuer. Verify key agreement using the preparation guide. Keep the existing
   NextAuth/session secrets unchanged on both apps.
5. Apply this PR's reviewed migration removing only the old client/user unique
   index. The additive migration must already be recorded as applied, so
   `pnpm db:deploy` from this branch has only the contract migration pending.
   Verify the client/user/resource unique index remains; no records change.
   Enable Court issuance on the preparation issuer, then connect a test client
   using PKCE and explicit
   `resource=https://courtofhumanity.org/api/mcp`. Confirm consent shows Court,
   perform an authenticated read, refresh, and revoke. Inspect Court errors and
   redacted audit attribution using that test client's IDs.
6. Verify existing Optimitron/dFDA connections and wrong-resource rejection.
   Set the **GitHub Production environment variable**
   `COURT_MCP_CUTOVER_READY=1` only after these checks succeed. Merge this PR to
   `main` and deploy Optimitron's removal. The production workflow blocks before
   migrations and therefore before Optimitron deployment until that variable is
   set. Confirm both HTTP and stdio omit and reject all
   eight Court tools. There are no forwarding tools. Legacy public pages/mirrors
   redirect to Court with query parameters; retired writes return JSON `410`
   identifying the Court endpoint instead of redirecting bearer credentials.

## Client change

Clients must add the Court endpoint and authorize it again. Existing Optimitron
and dFDA connections continue using `legacy`; Court rejects those tokens. A
client can have separate legacy and Court grants for the same user. Refresh and
revocation operate on their own grant; reconnecting one must not replace the other.

## Acceptance and rollback

Run OAuth unit and PostgreSQL code-exchange tests, Court integration tests, host
retirement tests, catalog generation, navigation checks, type checks and affected
page desktop/mobile review. Check privacy using unrelated writers, creators,
moderators with and without admin scope, and revoked/deleted identities.

Jury creation and case status transition must commit together and retry without
duplicate ballots. Self-service plaintiffs retain their own consent and private
records; campaign callers use the transaction-aware shared enrollment helper.
Historical backfills are not part of rollout. Gallery pagination retains the
bounded database queries and snapshot consistency from PR #343.

Optimitron retains the treaty representation POST at
`/api/referendums/one-percent-treaty/represented-people` for its campaign forms
and saved offline drafts. It shares generic person and memorial registration
with Court and calls the transaction-aware Court enrollment helper. Other
legacy Court representation writes return `410`; no authenticated write is
redirected across domains.

Court owns `apps/courtofhumanity/lib/represented-people.server.ts` and the
PostgreSQL pagination regressions under its own integration tests. The gallery
is not a shared site-kit service or an Accelerated Medicine feature. Optimitron
retains generic person profiles; campaign integration uses the shared enrollment
helper without importing Court app code. This PR supersedes the standalone
pagination PR #343, including its nine database regressions.

Rollback applications by reverting deployments and disabling new Court
authorization if necessary. Keep the additive OAuth resource records, Court data,
and triple unique index. Do not restore the old dual unique index once independent
resource grants coexist; doing so could fail or force deletion of valid grants.
Already-issued Court tokens remain readable only by Court. Do not change session
secrets as a rollback mechanism.
