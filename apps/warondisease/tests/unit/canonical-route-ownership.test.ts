import { describe, expect, it } from "vitest";
import { getCanonicalRedirect, isRouteAllowedForVariant } from "../../../../packages/site-kit/src/lib/canonical-routes";
import { getPageMetadata } from "../../../../packages/site-kit/src/lib/nav-items";
import { VARIANTS } from "../../../../packages/site-kit/src/lib/site-variant-types";

describe("same-path app ownership", () => {
  it("keeps health, Court, and campaign MCP on their respective apps", () => {
    for (const variant of [VARIANTS.DFDA, VARIANTS.WAR_ON_DISEASE, VARIANTS.COURT_OF_HUMANITY]) {
      expect(getCanonicalRedirect("/mcp", variant)).toBeNull();
      expect(isRouteAllowedForVariant("/mcp", variant)).toBe(true);
    }
    expect(getPageMetadata("mcp").alternates?.canonical).toBe("https://dfda.earth/mcp");
    expect(getPageMetadata("campaignMcp").alternates?.canonical).toBe("https://warondisease.org/mcp");
    expect(getPageMetadata("courtMcp").alternates?.canonical).toBe("https://courtofhumanity.org/mcp");
  });

  it("preserves the general MCP destination when specialized owners are added", () => {
    expect(getCanonicalRedirect("/mcp", VARIANTS.WISHOCRACY)).toBe("https://warondisease.org/mcp");
    expect(isRouteAllowedForVariant("/mcp", VARIANTS.WISHOCRACY)).toBe(false);
    expect(getCanonicalRedirect("/developers/tools", VARIANTS.COURT_OF_HUMANITY)).toBeNull();
  });

  it("still redirects routes owned exclusively by another app", () => {
    expect(getCanonicalRedirect("/wishocracy", VARIANTS.DFDA)).toBe("https://wishocracy.org/wishocracy");
    expect(isRouteAllowedForVariant("/wishocracy", VARIANTS.DFDA)).toBe(false);
    expect(getCanonicalRedirect("/conditions/example", VARIANTS.DFDA)).toBeNull();
  });
});
