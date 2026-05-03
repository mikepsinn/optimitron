import { describe, expect, it } from "vitest";
import * as siteRegistry from "@/lib/site";
import {
  SITE_VARIANT_OVERRIDE_COOKIE,
  SITE_VARIANT_OVERRIDE_HEADER,
  buildTrialAbundanceSurveyUrl,
  getRequestSiteOrigin,
  getCanonicalHostForSiteKey,
  getEnabledStaticPathsForSite,
  getSiteConfig,
  getSiteFromHeaders,
  getSiteFromHost,
  getSiteRouteDisposition,
  getTreatySignUrl,
  isLocalHost,
  isSiteRouteAllowed,
} from "@/lib/site";
import { DASHBOARD_INVITE_HREF, ROUTES } from "@/lib/routes";

describe("site variant registry", () => {
  it("uses local http origins for .local hosts", () => {
    expect(
      getRequestSiteOrigin({
        host: "1percenttreaty.local:3001",
      }),
    ).toBe("http://1percenttreaty.local:3001");
  });

  it("prefers forwarded host and proto when present", () => {
    expect(
      getRequestSiteOrigin({
        host: "localhost:3001",
        forwardedHost: "1percenttreaty.org",
        forwardedProto: "https",
      }),
    ).toBe("https://1percenttreaty.org");
  });

  it("maps public domains to their audience-specific site variants", () => {
    expect(getSiteFromHost("warondisease.org").key).toBe("warOnDisease");
    expect(getSiteFromHost("1percenttreaty.org").key).toBe(
      "onePercentTreaty",
    );
    expect(getSiteFromHost("trialabundancesurvey.org").key).toBe(
      "trialAbundanceSurvey",
    );
    expect(getSiteFromHost("dfda.earth").key).toBe("dfda");
    expect(getSiteFromHost("dih.earth").key).toBe("dih");
    expect(getSiteFromHost("acceleratedmedicine.org").key).toBe("dih");
    expect(getSiteFromHost("optimitron.com").key).toBe("optimitron");
  });

  it("supports local-only middleware site override plumbing without DNS-specific hosts", () => {
    expect(isLocalHost("127.0.0.1:3001")).toBe(true);
    expect(isLocalHost("warondisease.org")).toBe(false);
    expect(getCanonicalHostForSiteKey("warOnDisease")).toBe("warondisease.org");
    expect(getCanonicalHostForSiteKey("dfda")).toBe("dfda.earth");
    expect(
      getSiteFromHeaders(
        new Headers({
          host: "127.0.0.1:3001",
          "x-optimitron-site-key": "warOnDisease",
        }),
      ).key,
    ).toBe("warOnDisease");
    expect(
      getSiteFromHeaders(
        new Headers({
          host: "warondisease.org",
          "x-optimitron-site-key": "dfda",
        }),
      ).key,
    ).toBe("warOnDisease");
    expect(
      getSiteFromHeaders(
        new Headers({
          host: "localhost:3001",
          cookie: `${SITE_VARIANT_OVERRIDE_COOKIE}=trialAbundanceSurvey`,
        }),
      ).key,
    ).toBe("trialAbundanceSurvey");
    expect(
      getSiteFromHeaders(
        new Headers({
          host: "warondisease.org",
          cookie: `${SITE_VARIANT_OVERRIDE_COOKIE}=dfda`,
        }),
      ).key,
    ).toBe("warOnDisease");
  });

  it("uses the treaty home for War on Disease and the DIH home for Accelerated Medicine", () => {
    expect(getSiteFromHost("warondisease.org").pageVariants.home).toBe(
      "onePercentTreatyLanding",
    );
    expect(getSiteFromHost("acceleratedmedicine.org").pageVariants.home).toBe(
      "initiativeLanding",
    );
  });

  it("getTreatySignUrl returns relative /treaty for sites that allow the route, canonical fallback otherwise", () => {
    // Sites with /treaty allowed: relative path so the browser stays on the
    // user's current origin. Useful for in-app links where same-origin nav
    // is the right behaviour.
    expect(getTreatySignUrl(getSiteConfig("warOnDisease"))).toBe("/treaty");
    expect(getTreatySignUrl(getSiteConfig("onePercentTreaty"))).toBe("/treaty");
    // optimitron has restrictToAllowlist=false, so every route is allowed.
    expect(getTreatySignUrl(getSiteConfig("optimitron"))).toBe("/treaty");
    // Sites without /treaty fall back to the canonical 1percenttreaty.org
    // origin so callers that need an absolute URL up-front (outbound emails,
    // OG previews where middleware doesn't run) get the right destination.
    expect(getTreatySignUrl(getSiteConfig("dfda"))).toBe(
      "https://1percenttreaty.org/treaty",
    );
    expect(getTreatySignUrl(getSiteConfig("dih"))).toBe(
      "https://1percenttreaty.org/treaty",
    );
    expect(getTreatySignUrl(getSiteConfig("trialAbundanceSurvey"))).toBe(
      "https://1percenttreaty.org/treaty",
    );
  });

  it("keeps site variant identity, UI, and initiative data in the site config", () => {
    const treatySite = getSiteConfig("onePercentTreaty");
    const surveySite = getSiteConfig("trialAbundanceSurvey");

    expect(treatySite.domains).toEqual(
      expect.arrayContaining(["1percenttreaty.org", "www.1percenttreaty.org"]),
    );
    expect(treatySite.initiative).toMatchObject({
      key: "onePercentTreaty",
      name: "1% Treaty",
      primaryPath: "/treaty",
      parentKey: "warOnDisease",
    });
    expect(treatySite.ui.nav.brandLabel).toBe("1% Treaty");
    expect(surveySite.initiative).toMatchObject({
      key: "trialAbundanceSurvey",
      primaryPath: "/survey",
    });
  });

  it("keeps the voter invite action on campaign navs", () => {
    expect(getSiteConfig("optimitron").ui.nav.quickAction?.href).toBe(
      DASHBOARD_INVITE_HREF,
    );
    expect(getSiteConfig("warOnDisease").ui.nav.quickAction?.href).toBe(
      DASHBOARD_INVITE_HREF,
    );
    expect(getSiteConfig("onePercentTreaty").ui.nav.quickAction?.href).toBe(
      DASHBOARD_INVITE_HREF,
    );
    expect(getSiteConfig("dfda").ui.nav.quickAction).toBeUndefined();
  });

  it("keeps Profile out of the War on Disease menu chrome", () => {
    const treatySections = getSiteConfig("onePercentTreaty").ui.nav.sections;
    const treatyAccount = treatySections.find((s) => s.id === "account");
    expect(treatyAccount?.items.some((i) => i.href === ROUTES.profile)).toBe(true);

    const warItems = getSiteConfig("warOnDisease").ui.nav.sections.flatMap(
      (section) => section.items,
    );
    expect(warItems.some((item) => item.href === ROUTES.profile)).toBe(false);
  });

  it("assigns the manager framing to campaign sites and voter framing to reference sites", () => {
    expect(getSiteConfig("onePercentTreaty").userFraming).toBe("manager");
    expect(getSiteConfig("warOnDisease").userFraming).toBe("manager");
    expect(getSiteConfig("optimitron").userFraming).toBe("manager");
    expect(getSiteConfig("dfda").userFraming).toBe("voter");
    expect(getSiteConfig("dih").userFraming).toBe("voter");
    expect(getSiteConfig("trialAbundanceSurvey").userFraming).toBe("voter");
  });

  it("keeps treaty signing on-domain when the current site allows it", () => {
    expect(getTreatySignUrl(getSiteConfig("optimitron"))).toBe("/treaty");
    expect(getTreatySignUrl(getSiteConfig("warOnDisease"))).toBe("/treaty");
    expect(getTreatySignUrl(getSiteConfig("onePercentTreaty"))).toBe(
      "/treaty",
    );
    expect(getTreatySignUrl(getSiteConfig("trialAbundanceSurvey"))).toBe(
      "https://1percenttreaty.org/treaty",
    );
  });

  it("redirects known routes on the wrong host to their canonical site", () => {
    const treatySite = getSiteFromHost("1percenttreaty.org");
    const surveySite = getSiteFromHost("trialabundancesurvey.org");

    expect(typeof siteRegistry.getSiteRouteRedirect).toBe("function");
    expect(siteRegistry.getSiteRouteRedirect?.(treatySite, "/scoreboard")).toBe(
      "https://optimitron.com/scoreboard",
    );
    expect(
      siteRegistry.getSiteRouteRedirect?.(treatySite, "/conditions/asthma"),
    ).toBe("https://dfda.earth/conditions/asthma");
    expect(siteRegistry.getSiteRouteRedirect?.(surveySite, "/why")).toBe(
      "https://1percenttreaty.org/why",
    );
    expect(siteRegistry.getSiteRouteRedirect?.(surveySite, "/treaty")).toBe(
      "https://1percenttreaty.org/treaty",
    );
    expect(siteRegistry.getSiteRouteRedirect?.(surveySite, "/not-real")).toBeNull();
  });

  it("treats unknown disallowed routes as ordinary 404s", () => {
    const surveySite = getSiteFromHost("trialabundancesurvey.org");

    expect(getSiteRouteDisposition(surveySite, "/not-real")).toEqual({
      type: "notFound",
    });
  });

  it("does not expose a custom coalition 404 route in site policies", () => {
    for (const siteKey of [
      "optimitron",
      "dfda",
      "dih",
      "warOnDisease",
      "onePercentTreaty",
      "trialAbundanceSurvey",
    ] as const) {
      const site = getSiteConfig(siteKey);
      expect(site.routePolicy.publicPrefixes).not.toContain("_coalition-404");
      expect(site.routePolicy.operationalPrefixes).not.toContain(
        "/_coalition-404",
      );
    }
  });

  it("keeps the treaty host closed to unrelated Optimitron routes", () => {
    const treatySite = getSiteFromHost("1percenttreaty.org");

    expect(isSiteRouteAllowed(treatySite, "/")).toBe(true);
    expect(isSiteRouteAllowed(treatySite, "/dashboard")).toBe(true);
    expect(isSiteRouteAllowed(treatySite, "/tasks")).toBe(true);
    expect(isSiteRouteAllowed(treatySite, "/scoreboard")).toBe(false);
    expect(isSiteRouteAllowed(treatySite, "/search")).toBe(false);
  });

  it("allows War on Disease footer trust routes without opening the whole platform", () => {
    const warSite = getSiteFromHost("warondisease.org");

    expect(isSiteRouteAllowed(warSite, "/campaign")).toBe(true);
    expect(isSiteRouteAllowed(warSite, "/coalition")).toBe(true);
    expect(isSiteRouteAllowed(warSite, "/endorse")).toBe(true);
    expect(isSiteRouteAllowed(warSite, "/privacy")).toBe(true);
    expect(isSiteRouteAllowed(warSite, "/terms")).toBe(true);
    expect(isSiteRouteAllowed(warSite, "/search")).toBe(false);
  });

  it("limits neutral survey hosts to voting and survey routes", () => {
    const surveySite = getSiteFromHost("trialabundancesurvey.org");

    expect(isSiteRouteAllowed(surveySite, "/")).toBe(true);
    expect(isSiteRouteAllowed(surveySite, "/survey/test-org")).toBe(true);
    expect(isSiteRouteAllowed(surveySite, "/vote")).toBe(true);
    expect(isSiteRouteAllowed(surveySite, "/why")).toBe(false);
    expect(isSiteRouteAllowed(surveySite, "/governments")).toBe(false);
  });

  it("exposes medical pages on DFDA without exposing treaty campaign pages", () => {
    const dfdaSite = getSiteFromHost("dfda.earth");

    expect(isSiteRouteAllowed(dfdaSite, "/conditions")).toBe(true);
    expect(isSiteRouteAllowed(dfdaSite, "/agencies/dfda/conditions")).toBe(true);
    expect(isSiteRouteAllowed(dfdaSite, "/conditions/asthma")).toBe(true);
    expect(isSiteRouteAllowed(dfdaSite, "/agencies/dfda/conditions/asthma")).toBe(true);
    expect(isSiteRouteAllowed(dfdaSite, "/treatments/metformin")).toBe(true);
    expect(isSiteRouteAllowed(dfdaSite, "/agencies/dfda/treatments/metformin")).toBe(true);
    expect(isSiteRouteAllowed(dfdaSite, "/treaty")).toBe(false);
  });

  it("filters static smoke paths by site capability", () => {
    const candidates = [
      ROUTES.campaign,
      ROUTES.coalition,
      ROUTES.endorse,
      ROUTES.impact,
      ROUTES.legal,
      ROUTES.why,
      ROUTES.treaty,
      ROUTES.donate,
    ];

    expect(
      getEnabledStaticPathsForSite(getSiteConfig("optimitron"), candidates),
    ).toEqual([ROUTES.donate, ROUTES.treaty]);
    expect(
      getEnabledStaticPathsForSite(getSiteConfig("onePercentTreaty"), candidates),
    ).toEqual([
      ROUTES.campaign,
      ROUTES.coalition,
      ROUTES.donate,
      ROUTES.endorse,
      ROUTES.impact,
      ROUTES.legal,
      ROUTES.treaty,
      ROUTES.why,
    ]);
  });

  it("keeps Optimitron medical links canonical under DFDA", () => {
    expect(ROUTES.conditions).toBe("/agencies/dfda/conditions");
    expect(ROUTES.treatments).toBe("/agencies/dfda/treatments");
  });

  it("builds partner survey URLs on the Trial Abundance Survey domain", () => {
    expect(buildTrialAbundanceSurveyUrl("trial-partner")).toBe(
      "https://trialabundancesurvey.org/survey/trial-partner",
    );
  });

  it("keeps Trial Abundance Survey partner copy direct", () => {
    const surveySite = getSiteConfig("trialAbundanceSurvey");

    expect(surveySite.ui.footer.bottomText).not.toContain(
      "Approved organization",
    );
    expect(surveySite.ui.footer.bottomText).toContain("your organization");
    expect(surveySite.ui.footer.bottomText).toContain("your audience");
  });

  it("keeps root metadata isolated per domain variant", () => {
    expect(getSiteConfig("trialAbundanceSurvey").rootMetadata.title).toContain(
      "Trial Abundance Survey",
    );
    expect(getSiteConfig("dfda").rootMetadata.title).toContain("DFDA");
    expect(getSiteConfig("dih").rootMetadata.title).toContain("DIH");
    expect(getSiteConfig("warOnDisease").rootMetadata.title).toContain(
      "War on Disease",
    );
  });
});
