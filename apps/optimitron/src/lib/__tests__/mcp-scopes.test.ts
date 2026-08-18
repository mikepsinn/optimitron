import { describe, expect, it } from "vitest";
import { allowedMcpScopesForUser, McpScope } from "@/lib/mcp-scopes";

describe("MCP OAuth scope visibility", () => {
  it("does not offer admin, agent, or GitHub scopes to non-admins", () => {
    expect(allowedMcpScopesForUser(false)).toEqual([
      McpScope.TASKS_PERSONAL,
      McpScope.TASKS_ORGANIZATION,
      McpScope.EARTHDATA_WRITE,
    ]);
  });

  it("offers privileged scopes to admins", () => {
    expect(allowedMcpScopesForUser(true)).toEqual(
      expect.arrayContaining([
        McpScope.TASKS_ADMIN,
        McpScope.EARTHDATA_ADMIN,
        McpScope.AGENT_RUN,
        McpScope.GITHUB,
      ]),
    );
  });
});
