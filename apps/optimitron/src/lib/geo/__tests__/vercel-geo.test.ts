import { describe, expect, it } from "vitest";
import { readVercelGeo } from "../vercel-geo";

function makeHeaders(init: Record<string, string>): Headers {
  const h = new Headers();
  for (const [k, v] of Object.entries(init)) h.set(k, v);
  return h;
}

describe("readVercelGeo", () => {
  it("returns an empty object when no headers are present", () => {
    expect(readVercelGeo(makeHeaders({}))).toEqual({});
  });

  it("returns a full geo object from Vercel's standard headers", () => {
    const h = makeHeaders({
      "x-vercel-ip-country": "FR",
      "x-vercel-ip-country-region": "75",
      "x-vercel-ip-city": "Paris",
      "x-vercel-ip-latitude": "48.8566",
      "x-vercel-ip-longitude": "2.3522",
      "x-vercel-ip-timezone": "Europe/Paris",
    });
    expect(readVercelGeo(h)).toEqual({
      countryCode: "FR",
      regionCode: "75",
      city: "Paris",
      latitude: 48.8566,
      longitude: 2.3522,
      timeZone: "Europe/Paris",
    });
  });

  it("decodes URI-encoded city names", () => {
    const h = makeHeaders({
      "x-vercel-ip-country": "FR",
      "x-vercel-ip-city": "Saint-%C3%89tienne",
    });
    expect(readVercelGeo(h).city).toBe("Saint-Étienne");
  });

  it("skips the placeholder XX country code", () => {
    const h = makeHeaders({ "x-vercel-ip-country": "XX" });
    expect(readVercelGeo(h).countryCode).toBeUndefined();
  });

  it("skips T1 (Tor) country code", () => {
    const h = makeHeaders({ "x-vercel-ip-country": "T1" });
    expect(readVercelGeo(h).countryCode).toBeUndefined();
  });

  it("uppercases country codes", () => {
    const h = makeHeaders({ "x-vercel-ip-country": "us" });
    expect(readVercelGeo(h).countryCode).toBe("US");
  });

  it("ignores non-numeric latitude/longitude values", () => {
    const h = makeHeaders({
      "x-vercel-ip-latitude": "n/a",
      "x-vercel-ip-longitude": "n/a",
    });
    const geo = readVercelGeo(h);
    expect(geo.latitude).toBeUndefined();
    expect(geo.longitude).toBeUndefined();
  });
});
