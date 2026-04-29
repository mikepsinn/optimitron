import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(process.cwd(), "src/components/site/SiteVariantLandingPage.tsx"),
  "utf8",
);

describe("SiteVariantLandingPage copy", () => {
  it("speaks directly to survey partner organizations", () => {
    expect(source).not.toContain("Approved organizations get");
    expect(source).toContain("your organization");
    expect(source).toContain("your audience");
    expect(source).toContain("No new form stack");
  });
});
