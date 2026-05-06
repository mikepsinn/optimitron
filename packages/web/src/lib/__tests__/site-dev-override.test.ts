import { describe, expect, it } from "vitest";
import {
  SITE_VARIANT_OVERRIDE_QUERY_PARAM,
  resolveLocalSiteVariantOverride,
} from "@/lib/site-dev-override";

describe("local site variant override", () => {
  it("uses a valid local query override and persists it", () => {
    expect(
      resolveLocalSiteVariantOverride({
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
      resolveLocalSiteVariantOverride({
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

  it("clears the local cookie when the query override asks for the host default", () => {
    expect(
      resolveLocalSiteVariantOverride({
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

  it("ignores overrides outside local requests", () => {
    expect(
      resolveLocalSiteVariantOverride({
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
