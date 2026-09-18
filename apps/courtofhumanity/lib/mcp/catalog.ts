import { COURT_TOOL_DEFINITIONS } from "./tools";

export const COURT_MCP_ENDPOINT = "https://courtofhumanity.org/api/mcp";

export function getCourtToolCatalog() {
  return {
    endpoint: COURT_MCP_ENDPOINT,
    authorizationServer: "https://optimitron.com",
    transport: "Streamable HTTP",
    scopes: [
      {
        wire: "earthdata:write",
        description: "Create cases and manage your own case records.",
      },
      {
        wire: "earthdata:admin",
        description:
          "Administrators may moderate public cases. Private records remain private.",
      },
    ],
    tools: COURT_TOOL_DEFINITIONS.map((tool) => ({
      ...tool,
      adminOnly: false,
      requiredScopes: ["earthdata:write"],
    })),
  };
}
