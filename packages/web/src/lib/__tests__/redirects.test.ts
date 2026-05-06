import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const { REDIRECTS } = require("../redirects.js") as {
  REDIRECTS: Array<{
    destination: string;
    has?: Array<{ type: "host"; value: string }>;
    permanent: boolean;
    source: string;
  }>;
};

describe("redirects", () => {
  it("canonicalizes legacy campaign domains to War on Disease with path preservation", () => {
    for (const host of [
      "1percenttreaty.org",
      "www.1percenttreaty.org",
      "trialabundancesurvey.org",
      "www.trialabundancesurvey.org",
      "acceleratedmedicine.org",
      "www.acceleratedmedicine.org",
    ]) {
      expect(REDIRECTS).toContainEqual({
        source: "/:path*",
        has: [{ type: "host", value: host }],
        destination: "https://warondisease.org/:path*",
        permanent: true,
      });
    }
  });
});
