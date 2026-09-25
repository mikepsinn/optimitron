import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { LEGACY_EXTERNAL_REDIRECTS } from "../../legacy-redirects.mjs";

const appDir = path.resolve(__dirname, "../../app");

function firstSegment(source: string): string {
  return source.split("/").filter(Boolean)[0] ?? "";
}

describe("legacy external redirects", () => {
  // Next.js runs config redirects before routing, so a redirect would hide a
  // page this app adds later at the same path.
  it("never shadows a route this app serves", () => {
    for (const { source } of LEGACY_EXTERNAL_REDIRECTS) {
      expect(fs.existsSync(path.join(appDir, firstSegment(source))), source).toBe(false);
    }
  });

  it("forwards deep links to the same subpath", () => {
    for (const { source, destination } of LEGACY_EXTERNAL_REDIRECTS) {
      if (source.endsWith("/:path*")) {
        expect(destination.endsWith("/:path*"), source).toBe(true);
      }
    }
  });
});
