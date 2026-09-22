# Court MCP OAuth

Court uses its own MCP resource and Optimitron's OAuth issuer. It verifies RS256
signatures through the issuer's public JWKS. It never receives the issuer's
private key. Court keeps its own `NEXTAUTH_SECRET`; its browser sessions are
independent of Optimitron's.

Production issuer: `https://optimitron.com`.
Public key endpoint: `https://optimitron.com/.well-known/jwks.json`.
Court resource: `https://courtofhumanity.org/api/mcp`.
Court pins the configured issuer and this JWKS path; it never follows
token-supplied key URLs.

## Signing configuration

Court token issuance is off until these values exist on the Optimitron issuer.
Until then Court's MCP endpoint answers `401`, and legacy Optimitron and dFDA
resources are unaffected. Never place private key material in source control,
PR comments, screenshots, or Court's environment.

| Variable | Meaning |
| --- | --- |
| `MCP_COURT_RESOURCE_ENABLED` | `1` enables Court authorization and token issuance. Unset or `0` keeps it off. |
| `MCP_COURT_SIGNING_PRIVATE_KEY` | PKCS8 RSA private key PEM for RS256; literal newlines or escaped `\n` are accepted. |
| `MCP_COURT_SIGNING_KEY_ID` | Unique ID of the active key; must match a public JWKS entry. |
| `MCP_COURT_SIGNING_PUBLIC_JWKS` | JSON object with a `keys` array of public RSA keys. Keep retired public keys while tokens remain valid. |
| `MCP_COURT_RESOURCE` | Required outside production, such as `http://localhost:3017/api/mcp`. |

Production always uses `https://courtofhumanity.org/api/mcp`, irrespective of the
resource override. Preview/local resources require HTTPS or loopback HTTP, exactly
`/api/mcp`, and no credentials, query, or fragment. Configure the same resource
on issuer and resource server. Never infer it from incoming Host headers.

Public JWK entries contain RSA `kty`, `kid`, `n`, and `e`, with `alg: RS256` and
`use: sig`. They must not contain RSA private components.

Read-only preflight, with the configuration already in your environment:
`node scripts/check-court-mcp-oauth.mjs`. It validates RSA key shape,
public-only JWKS, unique IDs, and active public/private key agreement. It prints
no keys, IDs, tokens, or supplied values, loads no `.env` files, and makes no
network or database calls.

A planned follow-up derives the signing key from `NEXTAUTH_SECRET` and removes
every variable in this table.

## Disabling Court

Setting `MCP_COURT_RESOURCE_ENABLED` to `0` stops new Court authorizations and
token issuance. It does not revoke access tokens already issued; revoke the
affected grants when immediate removal is required.

## Key rotation

Publish the new public key alongside the existing public keys before signing with
its key ID. Confirm public JWKS propagation, then change the active private key
and key ID together. Keep retired public keys until the last token signed by that
key expires: refresh tokens last 180 days. Alternatively, revoke affected grants
and require clients to reconnect before retiring the associated public keys.
Never publish private keys. Court's session secret remains unchanged during rotation.
