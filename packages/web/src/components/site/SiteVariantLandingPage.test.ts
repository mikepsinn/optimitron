import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(process.cwd(), "src/components/site/SiteVariantLandingPage.tsx"),
  "utf8",
);

describe("SiteVariantLandingPage copy", () => {
  it("does not hardcode retired survey-partner copy", () => {
    expect(source).not.toContain("Approved organizations get");
    expect(source).not.toContain("No new form stack");
    expect(source).toContain("initiative.description");
    expect(source).toContain("site.homeActions");
  });
});
