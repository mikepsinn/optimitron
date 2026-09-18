# Court MCP OAuth rollout

Court uses its own MCP resource and Optimitron's OAuth issuer. It verifies RS256
signatures through public JWKS. It never receives the issuer's private key.
Keep Court's existing `NEXTAUTH_SECRET`; do not change its browser-session trust boundary.

## Phase 1: additive deployment, gate off

The preparation branch is `feature/court-oauth-preparation`. Merge and deploy it
before the Court cutover in [PR #345](https://github.com/mikepsinn/optimitron/pull/345).
Do not merge the cutover branch into the preparation branch: that would combine
the migrations and remove the verification pause. After preparation is merged,
retarget the cutover PR to `main`.

Deploy the additive OAuth resource migration and all legacy grant filters first.
Existing rows and older writers default to `resource = 'legacy'`.
The migration adds uniqueness on `(clientId, userId, resource)` and deliberately
retains uniqueness on `(clientId, userId)`. Concurrent grants for separate resources
cannot exist yet.

Leave `MCP_COURT_RESOURCE_ENABLED` unset or `0`. Do not enable it in this phase.
Legacy Optimitron and dFDA tokens, grants, consent, refresh, and revocation must
continue to work. Confirm every deployed legacy grant reader and writer includes
the legacy resource before moving to phase 2.

## Signing configuration

Configure these values on the Optimitron OAuth issuer. Never place private key
material in source control, PR comments, screenshots, or Court's environment.

| Variable | Meaning |
| --- | --- |
| `MCP_COURT_RESOURCE_ENABLED` | Unset or `0` disables Court authorization. `1` enables it only after phase 2. |
| `MCP_COURT_SIGNING_PRIVATE_KEY` | PKCS8 RSA private key PEM for RS256; literal newlines or escaped `\n` are accepted. |
| `MCP_COURT_SIGNING_KEY_ID` | Unique ID of the active key; must match a public JWKS entry. |
| `MCP_COURT_SIGNING_PUBLIC_JWKS` | JSON object with a `keys` array of public RSA keys. Keep retired public keys while tokens remain valid. |
| `MCP_COURT_RESOURCE` | Fixed local/preview resource override, such as `http://localhost:3001/api/mcp`. Use the actual Court endpoint. |

Production always uses `https://courtofhumanity.org/api/mcp`, irrespective of the
resource override. Preview/local resources require HTTPS or loopback HTTP, exactly
`/api/mcp`, and no credentials, query, or fragment. Configure the same resource
on issuer and resource server. Never infer it from incoming Host headers.

Production issuer: `https://optimitron.com`.
Public key endpoint: `https://optimitron.com/.well-known/jwks.json`.
Court pins the configured issuer and this JWKS path; it must not follow token-supplied key URLs.
Public JWK entries contain RSA `kty`, `kid`, `n`, and `e`, with `alg: RS256` and
`use: sig`. They must not contain RSA private components.

Run the read-only preflight with configuration already supplied by your authorized
runtime: `node scripts/check-court-mcp-oauth.mjs`.
It validates RSA key shape, public-only JWKS, unique IDs, and active public/private
key agreement. It prints no keys, IDs, tokens, or supplied values. It does not load
`.env` files, retrieve credentials, access the database, or contact the network.
A successful result does not prove deployment or database readiness.

## Phase 2: separate migration and explicit cutover

1. Verify the additive migration and preparation application are deployed, including
   every legacy grant consumer's `resource = 'legacy'` filter. Resolve #299 first;
   a successful migration with a failed application deployment is insufficient.
2. Deploy Court from the reviewed cutover branch while Optimitron continues running
   preparation. Verify Court's discovery and eight-tool catalog with issuance off.
3. Verify the issuer's public JWKS and private/public agreement.
4. Apply the reviewed cutover migration separately, dropping only
   `OAuthGrant_clientId_userId_key`. Verify the triple unique index remains.
5. Enable `MCP_COURT_RESOURCE_ENABLED=1` on the preparation issuer.
6. Reconnect a Court client with its exact resource and verify consent, access,
   refresh, revocation, and audit attribution. Check that existing Optimitron/dFDA
   connections still work and that each server rejects the other's tokens.
7. Only after verification, set the **GitHub Production environment variable**
   `COURT_MCP_CUTOVER_READY=1`, then merge the cutover PR to `main`. This permits
   the idempotent migration job and Optimitron's Court-tool removal to deploy.

The production workflow fails before migrations while the cutover migration is
present and this readiness variable is unset. Optimitron deployment depends on
that job. Preparation contains no cutover migration, so it does not require the
readiness variable. Keep the variable set after the completed cutover; it records
the completed one-time rollout prerequisite. Do not set it merely to make CI green.

The phase-2 DROP is intentionally not included in phase 1. Inspect deployed indexes
with this read-only SQL through the approved database workflow:

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'OAuthGrant'
ORDER BY indexname;
```

Do not roll application code back to unfiltered grant queries after phase 2.
Disabling the Court gate stops new Court authorizations/token issuance; it is not
an immediate revocation of already issued access tokens. Revoke affected resource
grants when immediate access removal is required.

## Key rotation

Publish the new public key alongside the existing public keys before signing with
its new key ID. Confirm public JWKS propagation, then change the active private key
and key ID together. Keep retired public keys until the last token signed by that
key expires: refresh tokens last 180 days. Alternatively, revoke affected grants
and require clients to reconnect before retiring the associated public keys.
Never publish private keys. Court's session secret remains unchanged during rotation.

## Known deployment blocker

Issue [#299](https://github.com/mikepsinn/optimitron/issues/299) records the production
GitHub Actions Vercel token failure. The existing audit found that the configured
token returned HTTP 403 for the production team/project. Treat this as an unresolved
deployment prerequisite until a valid team-authorized token is supplied and the
production deployment check passes. This rollout does not retrieve, rotate, or
change deployment credentials.
