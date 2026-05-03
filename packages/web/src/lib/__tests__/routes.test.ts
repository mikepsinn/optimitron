import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

import {
  ROUTES,
  exploreLinks,
  footerAppLinks,
  getSignInPath,
  isNavItemActive,
  navSections,
} from "../routes";

function requireLink<T extends { href: string }>(href: string, links: T[]): T {
  const link = links.find((item) => item.href === href);

  expect(link).toBeDefined();

  if (!link) {
    throw new Error(`Missing link for ${href}`);
  }

  return link;
}

describe("navigation routes", () => {
  it("surfaces key pages in nav sections", () => {
    const allNavHrefs = navSections.flatMap((s) => s.items.map((i) => i.href));

    expect(allNavHrefs).toEqual(
      expect.arrayContaining([
        ROUTES.treaty,
        ROUTES.wishocracy,
        ROUTES.alignment,
        ROUTES.tasks,
        ROUTES.prize,
        ROUTES.fund,
        ROUTES.dtreasury,
        ROUTES.efficiency,
        ROUTES.legislation,
        ROUTES.tools,
        ROUTES.dgao,
        ROUTES.governments,
      ]),
    );
  });

  it("keeps route metadata off the root data barrel", () => {
    const source = readFileSync(new URL("../routes.ts", import.meta.url), "utf8");

    expect(source).not.toMatch(/from\s+["']@optimitron\/data["']/);
  });

  it("uses intent-based navigation buckets instead of the old generic fund section", () => {
    expect(navSections.map((section) => section.id)).not.toContain("fund");
  });

  it("surfaces the core evidence explorers in the explore links", () => {
    const hrefs = exploreLinks.map((link) => link.href);

    expect(hrefs).toEqual(
      expect.arrayContaining([
        ROUTES.referendum,
        ROUTES.opg,
        ROUTES.obg,
      ]),
    );
  });

  it("keeps nested routes highlighted under the correct parent nav item", () => {
    const opg = requireLink(ROUTES.opg, exploreLinks);

    expect(isNavItemActive("/opg/drug-decriminalization", opg)).toBe(true);
    expect(isNavItemActive(ROUTES.obg, opg)).toBe(false);
  });

  it("builds sign-in links from canonical routes", () => {
    expect(getSignInPath()).toBe(
      `/auth/signin?callbackUrl=${encodeURIComponent(ROUTES.dashboard)}`,
    );
    expect(getSignInPath(ROUTES.alignment)).toBe(
      `/auth/signin?callbackUrl=${encodeURIComponent(ROUTES.alignment)}`,
    );
    expect(
      getSignInPath(ROUTES.wishocracy, {
        referralCode: "friend-123",
      }),
    ).toBe(
      `/auth/signin?callbackUrl=${encodeURIComponent(ROUTES.wishocracy)}&ref=friend-123`,
    );
  });

  it("footer includes key user-facing links", () => {
    const footerHrefs = footerAppLinks.map((link) => link.href);

    expect(footerHrefs).toEqual(
      expect.arrayContaining([
        ROUTES.wishocracy,
        ROUTES.alignment,
        ROUTES.dashboard,
        ROUTES.profile,
        ROUTES.census,
        ROUTES.settings,
        ROUTES.about,
      ]),
    );
  });
});
