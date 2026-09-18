import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveAlternates } from "next/dist/lib/metadata/resolvers/resolve-basics";
import { buildSiteMetadata } from "../../../../packages/site-kit/src/lib/site-metadata";
import { getSiteConfigForVariant } from "../../../../packages/site-kit/src/lib/site-config";
import { VARIANTS } from "../../../../packages/site-kit/src/lib/site-variant-types";

vi.mock("@sentry/nextjs", () => ({ getTraceData: () => ({}) }));
vi.mock("../../../../packages/site-kit/src/lib/url", () => ({
  getBaseUrl: () => "https://preview.example.test",
}));

afterEach(() => vi.unstubAllEnvs());

describe("shared site canonical URLs", () => {
  it("does not publish the campaign homepage as a child page's canonical", () => {
    const root = path.resolve(import.meta.dirname, "../../app");
    const snapshots = readdirSync(root, { recursive: true, encoding: "utf8" })
      .filter((file) => file.endsWith("page.logged-out.md") && file !== "page.logged-out.md");
    expect(snapshots.length).toBeGreaterThan(0);
    const wrong = snapshots.filter((file) =>
      /^- Canonical: https:\/\/warondisease\.org\/?\s*$/m.test(readFileSync(path.join(root, file), "utf8")),
    );
    expect(wrong).toEqual([]);
  });
  it.each([
    VARIANTS.WAR_ON_DISEASE, VARIANTS.DFDA, VARIANTS.WISHOCRACY,
    VARIANTS.SURVEY, VARIANTS.CUREDAO, VARIANTS.ACCELERATED_MEDICINE,
    VARIANTS.COURT_OF_HUMANITY,
  ])("resolves inherited metadata to each route on %s", async (variant) => {
    vi.stubEnv("NEXT_PUBLIC_SITE_VARIANT", variant);
    const metadata = buildSiteMetadata();
    for (const pathname of ["/", "/treaty", "/privacy", "/nested/page"]) {
      const resolved = await resolveAlternates(
        metadata.alternates, metadata.metadataBase ?? null,
        Promise.resolve(pathname), { trailingSlash: false, isStaticMetadataRouteFile: false },
      );
      const origin = getSiteConfigForVariant(variant).canonicalUrl || "https://preview.example.test";
      expect(resolved?.canonical?.url).toBe(`${origin}${pathname === "/" ? "" : pathname}`);
    }
  });
});
