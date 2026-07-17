/**
 * One-off helper for diagnosing MCP issues. Mints a Bearer token using the
 * server's NEXTAUTH_SECRET so an operator can call /api/mcp without going
 * through the interactive OAuth consent flow.
 *
 * Usage:
 *   MCP_TOKEN_USER_ID=<userId> [NEXTAUTH_URL=https://optimitron.com] \
 *     pnpm --filter @optimitron/web exec tsx scripts/mint-mcp-token.ts
 *
 * Prints the token (single line) to stdout.
 */

import "./load-env";

import { signMcpAccessToken } from "../src/lib/mcp-oauth";
import { ALL_SCOPES } from "../src/lib/mcp-scopes";

// Allow CLI override of issuer (e.g. mint a prod-valid token from a local
// dev machine). Set MCP_TOKEN_ISSUER=https://optimitron.com.
const issuer = process.env.MCP_TOKEN_ISSUER;
if (issuer) {
  process.env.NEXTAUTH_URL = issuer;
  delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
}

const userId = process.env.MCP_TOKEN_USER_ID;
if (!userId) {
  console.error("Set MCP_TOKEN_USER_ID to the userId you want the token to identify.");
  process.exit(1);
}

const organizationIds = (process.env.MCP_TOKEN_ORGANIZATION_IDS ?? "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

void signMcpAccessToken(
  userId,
  "mcp-mint-cli",
  ALL_SCOPES,
  organizationIds,
).then((token) => {
  console.log(token);
});
