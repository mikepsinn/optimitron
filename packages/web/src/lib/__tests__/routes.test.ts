import { describe, expect, it } from "vitest";

import {
  ROUTES,
  exploreLinks,
  footerAppLinks,
  isNavItemActive,
  topLinks,
} from "../routes";

function requireLink(href: string, links: Array<{ href: string }>) {
  const link = links.find((item) => item.href === href);

  expect(link).toBeDefined();

  if (!link) {
    throw new Error(`Missing link for ${href}`);
  }

  return link;
}

describe("navigation routes", () => {
  it("surfaces the core interactive app flows in the top nav and footer", () => {
    const topHrefs = topLinks.map((link) => link.href);
    const footerHrefs = footerAppLinks.map((link) => link.href);

    expect(topHrefs).toEqual(
      expect.arrayContaining([
        ROUTES.vote,
        ROUTES.alignment,
        ROUTES.chat,
        ROUTES.about,
      ]),
    );
    expect(footerHrefs).toEqual(
      expect.arrayContaining([
        ROUTES.vote,
        ROUTES.alignment,
        ROUTES.profile,
        ROUTES.chat,
        ROUTES.about,
      ]),
    );
  });

  it("surfaces the core evidence explorers in the nav", () => {
    const hrefs = exploreLinks.map((link) => link.href);

    expect(hrefs).toEqual(
      expect.arrayContaining([
        ROUTES.outcomes,
        ROUTES.compare,
        ROUTES.policies,
        ROUTES.budget,
        ROUTES.misconceptions,
      ]),
    );
  });

  it("keeps nested routes highlighted under the correct parent nav item", () => {
    const studiesLink = requireLink(ROUTES.outcomes, exploreLinks);
    const alignmentLink = requireLink(ROUTES.alignment, topLinks);
    const trackLink = requireLink(ROUTES.chat, topLinks);

    expect(isNavItemActive("/outcomes/healthy-life-years", studiesLink)).toBe(true);
    expect(isNavItemActive("/studies/hale/public-health-spending", studiesLink)).toBe(true);
    expect(isNavItemActive("/alignment/jane-doe", alignmentLink)).toBe(true);
    expect(isNavItemActive("/chat/history", trackLink)).toBe(true);
    expect(isNavItemActive(ROUTES.compare, studiesLink)).toBe(false);
  });
});
