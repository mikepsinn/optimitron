import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
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
const { getRedirectOnlyRoutePaths, isRedirectOnlyRoutePath } = require(
  "../redirects.js",
) as {
  getRedirectOnlyRoutePaths: () => string[];
  isRedirectOnlyRoutePath: (pathname: string) => boolean;
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

  // Regression guard for the 2026-05-14 production 404 on
  // /find-trials?condition=...&intervention=... The route is canonical on
  // dfda.earth, not warondisease.org, and outside links still point here.
  it("redirects warondisease.org/find-trials to dfda.earth", () => {
    expect(REDIRECTS).toContainEqual({
      source: "/find-trials",
      has: [{ type: "host", value: "warondisease.org" }],
      destination: "https://dfda.earth/find-trials",
      permanent: true,
    });
    expect(REDIRECTS).toContainEqual({
      source: "/find-trials/:path*",
      has: [{ type: "host", value: "warondisease.org" }],
      destination: "https://dfda.earth/find-trials/:path*",
      permanent: true,
    });
  });

  // The condition and treatment pages moved to apps/dfda. Both the short
  // paths and the /agencies/dfda/* ones were live, so both must redirect or
  // old links 404.
  it("redirects the medical pages to dfda.earth", () => {
    for (const [source, destination] of [
      ["/conditions", "https://dfda.earth/conditions"],
      ["/conditions/:path*", "https://dfda.earth/conditions/:path*"],
      ["/treatments", "https://dfda.earth/treatments"],
      ["/treatments/:path*", "https://dfda.earth/treatments/:path*"],
      ["/agencies/dfda/conditions", "https://dfda.earth/conditions"],
      ["/agencies/dfda/conditions/:path*", "https://dfda.earth/conditions/:path*"],
      ["/agencies/dfda/treatments", "https://dfda.earth/treatments"],
      ["/agencies/dfda/treatments/:path*", "https://dfda.earth/treatments/:path*"],
    ]) {
      expect(REDIRECTS).toContainEqual({ source, destination, permanent: true });
    }
  });

  it("keeps legacy internal redirects out of app pages", () => {
    expect(REDIRECTS).toContainEqual({
      source: "/campaign",
      destination: "https://warondisease.org/signatories",
      permanent: true,
    });
    expect(REDIRECTS).toContainEqual({
      source: "/coalition",
      destination: "https://warondisease.org/signatories",
      permanent: true,
    });
    expect(REDIRECTS).toContainEqual({
      source: "/politicians",
      destination: "/governments/US/politicians",
      permanent: false,
    });
    expect(REDIRECTS).toContainEqual({
      source: "/politicians/:jurisdictionCode",
      destination: "/governments/:jurisdictionCode/politicians",
      permanent: false,
    });
  });

  it("classifies app-wide redirect sources as redirect-only review routes", () => {
    expect(getRedirectOnlyRoutePaths()).toEqual(
      expect.arrayContaining([
        "/about",
        "/campaign",
        "/coalition",
        "/impact",
        "/people/manage",
        "/politicians",
        "/politicians/[jurisdictionCode]",
      ]),
    );
    expect(isRedirectOnlyRoutePath("/about")).toBe(true);
    expect(isRedirectOnlyRoutePath("/campaign?ref=abc")).toBe(true);
    expect(isRedirectOnlyRoutePath("/politicians/US")).toBe(true);
    expect(isRedirectOnlyRoutePath("/signatories")).toBe(true);
    expect(isRedirectOnlyRoutePath("/tasks")).toBe(false);
  });

  // The campaign pages moved to apps/warondisease. A redirect whose target
  // that app does not serve would turn every old link into a 404.
  it("sends moved campaign pages only to routes that warondisease.org serves", () => {
    const warOnDiseaseAppDir = join(process.cwd(), "..", "warondisease", "app");
    const movedRedirects = REDIRECTS.filter(
      (redirect) =>
        !redirect.has &&
        redirect.destination.startsWith("https://warondisease.org/"),
    );

    expect(movedRedirects.map((redirect) => redirect.source)).toEqual(
      expect.arrayContaining(["/vote", "/treaty", "/signatories", "/faq"]),
    );
    for (const redirect of movedRedirects) {
      const routeDir = join(
        warOnDiseaseAppDir,
        ...new URL(redirect.destination).pathname
          .split("/")
          .filter(Boolean)
          .map((segment) =>
            segment.startsWith(":") ? `[${segment.slice(1)}]` : segment,
          ),
      );
      expect(
        existsSync(join(routeDir, "page.tsx")) ||
          existsSync(join(routeDir, "route.ts")),
        redirect.destination,
      ).toBe(true);
    }
  });
});
