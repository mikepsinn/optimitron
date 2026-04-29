import { describe, expect, it } from "vitest";
import {
  getRequestSiteOrigin,
  getSiteFromHost,
  isSiteRouteAllowed,
} from "@/lib/site";

describe("getRequestSiteOrigin", () => {
  it("uses local http origins for .local hosts", () => {
    expect(
      getRequestSiteOrigin({
        host: "1percenttreaty.local:3001",
      }),
    ).toBe("http://1percenttreaty.local:3001");
  });

  it("prefers forwarded host and proto when present", () => {
    expect(
      getRequestSiteOrigin({
        host: "localhost:3001",
        forwardedHost: "1percenttreaty.org",
        forwardedProto: "https",
      }),
    ).toBe("https://1percenttreaty.org");
  });

  it("maps treaty hosts to the treaty variant", () => {
    expect(getSiteFromHost("warondisease.org").key).toBe("onePercentTreaty");
    expect(getSiteFromHost("1percenttreaty.org").key).toBe(
      "onePercentTreaty",
    );
    expect(getSiteFromHost("optimitron.com").key).toBe("optimitron");
  });

  it("keeps the treaty host closed to unrelated Optimitron routes", () => {
    const treatySite = getSiteFromHost("warondisease.org");

    expect(isSiteRouteAllowed(treatySite, "/")).toBe(true);
    expect(isSiteRouteAllowed(treatySite, "/dashboard")).toBe(true);
    expect(isSiteRouteAllowed(treatySite, "/tasks")).toBe(true);
    expect(isSiteRouteAllowed(treatySite, "/scoreboard")).toBe(false);
    expect(isSiteRouteAllowed(treatySite, "/search")).toBe(false);
  });
});
