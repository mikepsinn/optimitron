# Court MCP ownership cutover

[PR #345](https://github.com/mikepsinn/optimitron/pull/345). Its prerequisite,
[PR #350](https://github.com/mikepsinn/optimitron/pull/350), is merged.

## What changes

- Court serves its own MCP server at `https://courtofhumanity.org/api/mcp` with
  eight Court tools. Optimitron's MCP server no longer offers them, over HTTP or
  stdio. There are no forwarding tools.
- Court tokens are RS256 and carry the Court resource as their audience. Court
  verifies them with the issuer's public JWKS and never holds the issuer's secret.
  Optimitron and dFDA keep the `legacy` resource; each server rejects the other's
  tokens.
- The migration `20260917020000_drop_legacy_oauth_grant_unique` drops the old
  `(clientId, userId)` unique index so one user and client can hold a legacy grant
  and a Court grant at the same time. No records change.
- Legacy public Court pages and mirrors redirect to Court with their query
  parameters. Retired Court writes return JSON `410` naming the Court endpoint;
  no authenticated write is redirected across domains.

## Deployment

Merge and deploy. The migration runs in the production workflow like any other.

Court token issuance stays off until the issuer has the signing configuration in
`COURT_MCP_OAUTH_ROLLOUT.md`; until then Court's MCP endpoint answers `401`.
A follow-up derives the signing key from `NEXTAUTH_SECRET` and removes that
configuration.

## Client change

Clients add the Court endpoint and authorize it once. Existing Optimitron and
dFDA connections keep working on `legacy`. A client can hold separate legacy
and Court grants for the same user; refresh and revocation act on their own
grant, and reconnecting one does not replace the other.

## Ownership notes

Optimitron keeps the treaty representation POST at
`/api/referendums/one-percent-treaty/represented-people` for its campaign forms
and saved offline drafts. It shares generic person and memorial registration
with Court through the transaction-aware enrollment helper, without importing
Court app code.

Court owns `apps/courtofhumanity/lib/represented-people.server.ts` and the
PostgreSQL pagination regressions under its own integration tests. Jury creation
and case status transition commit together and retry without duplicate ballots.
This PR supersedes the standalone pagination PR #343, including its nine
database regressions.

## Rollback

Revert the deployments. Keep the OAuth resource records, Court data, and the
`(clientId, userId, resource)` unique index. Do not restore the old dual unique
index once independent resource grants coexist; that can fail or force deletion
of valid grants. Already-issued Court tokens stay readable only by Court. Do not
change session secrets as a rollback mechanism.
