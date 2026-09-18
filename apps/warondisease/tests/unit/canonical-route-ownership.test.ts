import { describe, expect, it } from "vitest";
import { getCanonicalRedirect, isRouteAllowedForVariant } from "../../../../packages/site-kit/src/lib/canonical-routes";
import { getPageMetadata } from "../../../../packages/site-kit/src/lib/nav-items";
import { VARIANTS } from "../../../../packages/site-kit/src/lib/site-variant-types";

describe("same-path app ownership", () => {
  it("keeps dFDA health MCP and campaign MCP on their respective apps", () => {
    for (const variant of [VARIANTS.DFDA, VARIANTS.WAR_ON_DISEASE]) {
      expect(getCanonicalRedirect("/mcp", variant)).toBeNull();
      expect(isRouteAllowedForVariant("/mcp", variant)).toBe(true);
    }
    expect(getPageMetadata("mcp").alternates?.canonical).toBe("https://dfda.earth/mcp");
    expect(getPageMetadata("campaignMcp").alternates?.canonical).toBe("https://warondisease.org/mcp");
  });

  it("redirects non-owning apps to the first canonical MCP owner", () => {
    expect(getCanonicalRedirect("/mcp", VARIANTS.WISHOCRACY)).toBe("https://warondisease.org/mcp");
    expect(isRouteAllowedForVariant("/mcp", VARIANTS.WISHOCRACY)).toBe(false);
  });

  it("still redirects routes owned exclusively by another app", () => {
    expect(getCanonicalRedirect("/wishocracy", VARIANTS.DFDA)).toBe("https://wishocracy.org/wishocracy");
    expect(isRouteAllowedForVariant("/wishocracy", VARIANTS.DFDA)).toBe(false);
    expect(getCanonicalRedirect("/conditions/example", VARIANTS.DFDA)).toBeNull();
  });
});
