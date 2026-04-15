import { describe, expect, it } from "vitest";
import { getRequestSiteOrigin } from "@/lib/site";

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
});
