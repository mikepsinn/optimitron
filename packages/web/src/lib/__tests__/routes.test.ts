import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

import {
  ROUTES,
  courtLink,
  donateLink,
  eosLink,
  exploreLinks,
  feedbackLink,
  gameLink,
  getSignInPath,
  humanityVGovernmentLink,
  editProfileLink,
  isNavItemActive,
  navSections,
  publicProfileLink,
  questionsLink,
  routeReviewNavItems,
  voteLink,
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
    const source = readFileSync(
      new URL("../routes.ts", import.meta.url),
      "utf8",
    );

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

  it("keeps Humanity v. Government social preview config on the NavItem", () => {
    expect(humanityVGovernmentLink.socialPreview).toEqual(
      expect.objectContaining({
        title: "You May Be Owed $2.74 Million | Humanity v. Government",
        image: expect.objectContaining({
          url: "/humanity-v-government/opengraph-image",
          width: 1200,
          height: 630,
        }),
        blackWhiteTextOgImage: expect.objectContaining({
          primaryLines: [
            "You May Be Owed",
            "$2.74 Million",
            "Render Your Verdict",
          ],
        }),
      }),
    );
  });

  it("keeps route-level social images on public copy-review entry points", () => {
    for (const link of [courtLink, voteLink, questionsLink, feedbackLink]) {
      expect(link.socialPreview?.image).toEqual(
        expect.objectContaining({
          url: "/site-assets/warondisease/war-on-disease-og-1200x630.png",
          width: 1200,
          height: 630,
        }),
      );
    }
  });

  it("keeps edit-profile and public-profile navigation as separate intents", () => {
    expect(routeReviewNavItems).toContain(editProfileLink);
    expect(routeReviewNavItems).not.toContain(publicProfileLink);
  });

  it("keeps the game landing in route review after moving it off the home page", () => {
    expect(routeReviewNavItems).toContain(gameLink);
  });

  it("keeps the EOS landing in route review after the donation page", () => {
    expect(routeReviewNavItems).toContain(eosLink);
    expect(routeReviewNavItems.indexOf(eosLink)).toBe(
      routeReviewNavItems.indexOf(donateLink) + 1,
    );
  });
});
