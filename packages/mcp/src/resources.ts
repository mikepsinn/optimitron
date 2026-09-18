export const LEGACY_MCP_RESOURCE = "legacy";
export const COURT_MCP_RESOURCE = "https://courtofhumanity.org/api/mcp";
export const COURT_MCP_SCOPES = ["EARTHDATA_WRITE", "EARTHDATA_ADMIN"] as const;

/** Configuration must supply a fixed audience, never an untrusted Host header. */
export function courtMcpResource(
  environment: string | undefined,
  configured?: string,
): string {
  if (environment === "production") return COURT_MCP_RESOURCE;
  if (!configured)
    throw new Error("Court MCP resource must be configured outside production");
  const url = new URL(configured);
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/api/mcp"
  ) {
    throw new Error("Invalid Court MCP resource configuration");
  }
  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (url.protocol !== "https:" && !(loopback && url.protocol === "http:")) {
    throw new Error("Court MCP resource requires HTTPS or loopback HTTP");
  }
  return url.href;
}
