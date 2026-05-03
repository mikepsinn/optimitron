import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

import {
  ROUTES,
  exploreLinks,
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
  it("keeps route metadata off the root data barrel", () => {
    const source = readFileSync(new URL("../routes.ts", import.meta.url), "utf8");

    expect(source).not.toMatch(/from\s+["']@optimitron\/data["']/);
  });

  it("uses intent-based navigation buckets instead of the old generic fund section", () => {
    expect(navSections.map((section) => section.id)).not.toContain("fund");
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
});
