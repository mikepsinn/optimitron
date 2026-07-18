import { afterEach, describe, expect, it, vi } from "vitest";
import {
  SITE_VARIANT_OVERRIDE_QUERY_PARAM,
  resolveReviewSiteVariantOverride,
} from "@/lib/site-dev-override";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("review site variant override", () => {
  it("uses a valid local query override and persists it", () => {
    expect(
      resolveReviewSiteVariantOverride({
        cookieSiteKey: null,
        host: "localhost:3001",
        querySiteKey: "warOnDisease",
      }),
    ).toEqual({
      clearCookie: false,
      enabled: true,
      persistSiteKey: "warOnDisease",
      siteKey: "warOnDisease",
      stripQueryParam: true,
    });
  });

  it("uses a valid local cookie override when no query override is present", () => {
    expect(
      resolveReviewSiteVariantOverride({
        cookieSiteKey: "dfda",
        host: "127.0.0.1:3001",
        querySiteKey: null,
      }),
    ).toMatchObject({
      enabled: true,
      persistSiteKey: null,
      siteKey: "dfda",
      stripQueryParam: false,
    });
  });

  it("uses a query override on Vercel review deployments", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(
      resolveReviewSiteVariantOverride({
        cookieSiteKey: null,
        host: "optimitron-example-mike-p-sinns-projects.vercel.app",
        querySiteKey: "dfda",
      }),
    ).toMatchObject({
      enabled: true,
      persistSiteKey: "dfda",
      siteKey: "dfda",
      stripQueryParam: true,
    });
  });

  it("ignores query overrides on production Vercel deployments", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    expect(
      resolveReviewSiteVariantOverride({
        cookieSiteKey: null,
        host: "optimitron-production.vercel.app",
        querySiteKey: "dfda",
      }),
    ).toMatchObject({
      enabled: false,
      siteKey: null,
      stripQueryParam: false,
    });
  });

  it("clears the local cookie when the query override asks for the host default", () => {
    expect(
      resolveReviewSiteVariantOverride({
        cookieSiteKey: "warOnDisease",
        host: "localhost:3001",
        querySiteKey: "reset",
      }),
    ).toMatchObject({
      clearCookie: true,
      enabled: true,
      persistSiteKey: null,
      siteKey: null,
      stripQueryParam: true,
    });
  });

  it("ignores overrides on production custom domains", () => {
    expect(
      resolveReviewSiteVariantOverride({
        cookieSiteKey: "dfda",
        host: "warondisease.org",
        querySiteKey: "dfda",
      }),
    ).toMatchObject({
      enabled: false,
      siteKey: null,
      stripQueryParam: false,
    });
    expect(SITE_VARIANT_OVERRIDE_QUERY_PARAM).toBe("site");
  });
});
