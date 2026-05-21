import { describe, expect, it } from "vitest";
import * as siteRegistry from "@/lib/site";
import {
  SITE_VARIANT_OVERRIDE_COOKIE,
  SITE_VARIANT_OVERRIDE_HEADER,
  buildOrganizationSurveyUrl,
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
  WAR_ON_DISEASE_APOCALYPSE_DESCRIPTION,
} from "@/lib/site";
import { DASHBOARD_INVITE_HREF, ROUTES } from "@/lib/routes";

const INTERNATIONAL_CAMPAIGN_NAME =
  "International Campaign to End War and Disease";
const INTERNATIONAL_CAMPAIGN_SHORT_NAME = "IC2EWD";

describe("site variant registry", () => {
  it("uses local http origins for .local hosts", () => {
    expect(
      getRequestSiteOrigin({
        host: "warondisease.local:3001",
      }),
    ).toBe("http://warondisease.local:3001");
  });

  it("prefers forwarded host and proto when present", () => {
    expect(
      getRequestSiteOrigin({
        host: "localhost:3001",
        forwardedHost: "warondisease.org",
        forwardedProto: "https",
      }),
    ).toBe("https://warondisease.org");
  });

  it("maps public domains to their audience-specific site variants", () => {
    expect(getSiteFromHost("warondisease.org").key).toBe("warOnDisease");
    expect(getSiteFromHost("1percenttreaty.org").key).toBe("warOnDisease");
    expect(getSiteFromHost("trialabundancesurvey.org").key).toBe(
      "warOnDisease",
    );
    expect(getSiteFromHost("dfda.earth").key).toBe("dfda");
    expect(getSiteFromHost("dih.earth").key).toBe("dih");
    expect(getSiteFromHost("acceleratedmedicine.org").key).toBe("warOnDisease");
    expect(getSiteFromHost("optimitron.com").key).toBe("optimitron");
    expect(
      getSiteFromHost(
        "optimitron-web-git-feature-remove-c9e3c0-mike-p-sinns-projects.vercel.app",
      ).key,
    ).toBe("warOnDisease");
    expect(getSiteFromHost("unknown.example").key).toBe("warOnDisease");
  });

  it("supports local-only middleware site override plumbing without DNS-specific hosts", () => {
    const localSite = getSiteFromHeaders(
      new Headers({
        host: "127.0.0.1:3001",
      }),
    );

    expect(isLocalHost("127.0.0.1:3001")).toBe(true);
    expect(isLocalHost("warondisease.org")).toBe(false);
    expect(getCanonicalHostForSiteKey("warOnDisease")).toBe("warondisease.org");
    expect(getCanonicalHostForSiteKey("dfda")).toBe("dfda.earth");
    expect(localSite.key).toBe("warOnDisease");
    expect(getSiteRouteDisposition(localSite, ROUTES.scoreboard)).toEqual({
      type: "allow",
    });
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
          cookie: `${SITE_VARIANT_OVERRIDE_COOKIE}=warOnDisease`,
        }),
      ).key,
    ).toBe("warOnDisease");
    expect(
      getSiteFromHeaders(
        new Headers({
          host: "warondisease.org",
          cookie: `${SITE_VARIANT_OVERRIDE_COOKIE}=dfda`,
        }),
      ).key,
    ).toBe("warOnDisease");
  });

  it("uses the treaty home for War on Disease and legacy campaign domains", () => {
    expect(getSiteFromHost("warondisease.org").pageVariants.home).toBe(
      "onePercentTreatyLanding",
    );
    expect(getSiteFromHost("acceleratedmedicine.org").pageVariants.home).toBe(
      "onePercentTreatyLanding",
    );
  });

  it("getTreatySignUrl returns relative /treaty for sites that allow the route, canonical fallback otherwise", () => {
    // Sites with /treaty allowed: relative path so the browser stays on the
    // user's current origin. Useful for in-app links where same-origin nav
    // is the right behaviour.
    expect(getTreatySignUrl(getSiteConfig("warOnDisease"))).toBe("/treaty");
    // optimitron has restrictToAllowlist=false, so every route is allowed.
    expect(getTreatySignUrl(getSiteConfig("optimitron"))).toBe("/treaty");
    // Sites without /treaty fall back to the canonical campaign host
    // origin so callers that need an absolute URL up-front (outbound emails,
    // OG previews where middleware doesn't run) get the right destination.
    expect(getTreatySignUrl(getSiteConfig("dfda"))).toBe(
      "https://warondisease.org/treaty",
    );
    expect(getTreatySignUrl(getSiteConfig("dih"))).toBe(
      "https://warondisease.org/treaty",
    );
  });

  it("keeps site variant identity, UI, and initiative data in the site config", () => {
    const warSite = getSiteConfig("warOnDisease");

    expect(warSite).toMatchObject({
      name: INTERNATIONAL_CAMPAIGN_NAME,
      shortName: INTERNATIONAL_CAMPAIGN_SHORT_NAME,
      organizationName: INTERNATIONAL_CAMPAIGN_NAME,
      emailBranding: {
        fromName: INTERNATIONAL_CAMPAIGN_SHORT_NAME,
        orgName: INTERNATIONAL_CAMPAIGN_NAME,
      },
      initiative: {
        key: "warOnDisease",
        name: INTERNATIONAL_CAMPAIGN_NAME,
        shortName: INTERNATIONAL_CAMPAIGN_SHORT_NAME,
      },
    });
    expect(warSite.alternateSiteNames).toEqual(
      expect.arrayContaining(["War on Disease", INTERNATIONAL_CAMPAIGN_NAME]),
    );
    expect(warSite.ui.nav.brandLabel).toBe(INTERNATIONAL_CAMPAIGN_SHORT_NAME);
    expect(warSite.ui.nav.desktopBrandLabel).toBe(INTERNATIONAL_CAMPAIGN_NAME);
    expect(warSite.ui.nav.menuTitle).toBe(INTERNATIONAL_CAMPAIGN_NAME);
    expect(warSite.ui.footer.brandLabel).toBe(INTERNATIONAL_CAMPAIGN_NAME);
    expect(warSite.description).toBe(WAR_ON_DISEASE_APOCALYPSE_DESCRIPTION);
    expect(warSite.ui.footer.brandDescription).toBe(warSite.description);
    expect(warSite.rootMetadata.description).toBe(warSite.description);
    expect(warSite.rootMetadata.openGraphDescription).toBe(warSite.description);
    expect(warSite.rootMetadata.twitterDescription).toBe(warSite.description);
    expect(
      warSite.ui.footer.columns
        .flatMap((column) => column.items)
        .some((item) => item.href === ROUTES.humanityVGovernment),
    ).toBe(true);
    expect(warSite.domains).toEqual(
      expect.arrayContaining([
        "1percenttreaty.org",
        "trialabundancesurvey.org",
        "acceleratedmedicine.org",
      ]),
    );
  });

  it("keeps the voter invite action on campaign navs", () => {
    expect(getSiteConfig("optimitron").ui.nav.quickAction?.href).toBe(
      DASHBOARD_INVITE_HREF,
    );
    expect(getSiteConfig("warOnDisease").ui.nav.quickAction?.href).toBe(
      DASHBOARD_INVITE_HREF,
    );
    expect(getSiteConfig("dfda").ui.nav.quickAction).toBeUndefined();
  });

  it("keeps Profile out of the War on Disease menu chrome and links president management", () => {
    const warItems = getSiteConfig("warOnDisease").ui.nav.sections.flatMap(
      (section) => section.items,
    );
    expect(warItems.some((item) => item.href === ROUTES.profile)).toBe(false);
    expect(warItems.some((item) => item.href === ROUTES.employees)).toBe(true);
  });

  it("assigns the manager framing to campaign sites and voter framing to reference sites", () => {
    expect(getSiteConfig("warOnDisease").userFraming).toBe("manager");
    expect(getSiteConfig("optimitron").userFraming).toBe("manager");
    expect(getSiteConfig("dfda").userFraming).toBe("voter");
    expect(getSiteConfig("dih").userFraming).toBe("voter");
  });

  it("keeps treaty signing on-domain when the current site allows it", () => {
    expect(getTreatySignUrl(getSiteConfig("optimitron"))).toBe("/treaty");
    expect(getTreatySignUrl(getSiteConfig("warOnDisease"))).toBe("/treaty");
    expect(getTreatySignUrl(getSiteConfig("dfda"))).toBe(
      "https://warondisease.org/treaty",
    );
  });

  it("redirects known routes on the wrong host to their canonical site", () => {
    const campaignSite = getSiteFromHost("1percenttreaty.org");
    const dfdaSite = getSiteFromHost("dfda.earth");

    expect(typeof siteRegistry.getSiteRouteRedirect).toBe("function");
    expect(
      siteRegistry.getSiteRouteRedirect?.(campaignSite, "/scoreboard"),
    ).toBeNull();
    expect(siteRegistry.getSiteRouteRedirect?.(dfdaSite, "/treaty")).toBe(
      "https://warondisease.org/treaty",
    );
    expect(
      siteRegistry.getSiteRouteRedirect?.(campaignSite, "/not-real"),
    ).toBeNull();
  });

  it("treats unknown disallowed routes as ordinary 404s", () => {
    const dfdaSite = getSiteFromHost("dfda.earth");

    expect(getSiteRouteDisposition(dfdaSite, "/not-real")).toEqual({
      type: "notFound",
    });
  });

  it("does not expose a custom coalition 404 route in site policies", () => {
    for (const siteKey of [
      "optimitron",
      "dfda",
      "dih",
      "warOnDisease",
    ] as const) {
      const site = getSiteConfig(siteKey);
      expect(site.routePolicy.publicPrefixes).not.toContain("_coalition-404");
      expect(site.routePolicy.operationalPrefixes).not.toContain(
        "/_coalition-404",
      );
    }
  });

  it("lets campaign hosts serve platform routes without cross-domain redirects", () => {
    const treatySite = getSiteFromHost("1percenttreaty.org");

    expect(isSiteRouteAllowed(treatySite, "/")).toBe(true);
    expect(isSiteRouteAllowed(treatySite, ROUTES.dashboard)).toBe(true);
    expect(isSiteRouteAllowed(treatySite, ROUTES.tasks)).toBe(true);
    expect(isSiteRouteAllowed(treatySite, ROUTES.signatories)).toBe(true);
    expect(isSiteRouteAllowed(treatySite, ROUTES.reasoning)).toBe(true);
    expect(isSiteRouteAllowed(treatySite, ROUTES.scoreboard)).toBe(true);
    expect(isSiteRouteAllowed(treatySite, ROUTES.search)).toBe(true);
  });

  it("allows War on Disease to serve the whole platform", () => {
    const warSite = getSiteFromHost("warondisease.org");

    expect(isSiteRouteAllowed(warSite, ROUTES.signatories)).toBe(true);
    expect(isSiteRouteAllowed(warSite, ROUTES.campaign)).toBe(true);
    expect(isSiteRouteAllowed(warSite, ROUTES.coalition)).toBe(true);
    expect(isSiteRouteAllowed(warSite, ROUTES.humanityVGovernment)).toBe(true);
    expect(isSiteRouteAllowed(warSite, ROUTES.join)).toBe(true);
    expect(isSiteRouteAllowed(warSite, ROUTES.privacy)).toBe(true);
    expect(isSiteRouteAllowed(warSite, ROUTES.terms)).toBe(true);
    expect(isSiteRouteAllowed(warSite, ROUTES.reasoning)).toBe(true);
    expect(isSiteRouteAllowed(warSite, ROUTES.search)).toBe(true);
  });

  it("exposes medical pages on DFDA without exposing treaty campaign pages", () => {
    const dfdaSite = getSiteFromHost("dfda.earth");

    expect(isSiteRouteAllowed(dfdaSite, "/conditions")).toBe(true);
    expect(isSiteRouteAllowed(dfdaSite, "/agencies/dfda/conditions")).toBe(
      true,
    );
    expect(isSiteRouteAllowed(dfdaSite, "/conditions/asthma")).toBe(true);
    expect(
      isSiteRouteAllowed(dfdaSite, "/agencies/dfda/conditions/asthma"),
    ).toBe(true);
    expect(isSiteRouteAllowed(dfdaSite, "/treatments/metformin")).toBe(true);
    expect(
      isSiteRouteAllowed(dfdaSite, "/agencies/dfda/treatments/metformin"),
    ).toBe(true);
    expect(isSiteRouteAllowed(dfdaSite, "/treaty")).toBe(false);
  });

  it("filters static smoke paths by site capability", () => {
    const candidates = [
      ROUTES.signatories,
      ROUTES.campaign,
      ROUTES.coalition,
      ROUTES.join,
      ROUTES.impact,
      ROUTES.treaty,
      ROUTES.donate,
    ];

    expect(
      getEnabledStaticPathsForSite(getSiteConfig("optimitron"), candidates),
    ).toEqual([ROUTES.donate, ROUTES.treaty]);
    expect(
      getEnabledStaticPathsForSite(getSiteConfig("warOnDisease"), candidates),
    ).toEqual(expect.arrayContaining(candidates));
  });

  it("keeps Optimitron medical links canonical under DFDA", () => {
    expect(ROUTES.conditions).toBe("/agencies/dfda/conditions");
    expect(ROUTES.treatments).toBe("/agencies/dfda/treatments");
  });

  it("builds partner survey URLs on the War on Disease domain", () => {
    expect(buildOrganizationSurveyUrl("trial-partner")).toBe(
      "https://warondisease.org/survey/trial-partner",
    );
    expect(
      buildOrganizationSurveyUrl("trial-partner", {
        referralCode: "mike psinn",
      }),
    ).toBe("https://warondisease.org/survey/trial-partner?ref=mike+psinn");
  });

  it("keeps War on Disease survey embeds free of full campaign chrome", () => {
    expect(
      getSiteConfig("warOnDisease").routePolicy.minimalChromePrefixes,
    ).toContain(ROUTES.survey);
  });

  it("keeps root metadata isolated per domain variant", () => {
    expect(getSiteConfig("dfda").rootMetadata.title).toContain("DFDA");
    expect(getSiteConfig("dih").rootMetadata.title).toContain("DIH");
    expect(getSiteConfig("warOnDisease").rootMetadata.title).toContain(
      INTERNATIONAL_CAMPAIGN_NAME,
    );
  });
});
