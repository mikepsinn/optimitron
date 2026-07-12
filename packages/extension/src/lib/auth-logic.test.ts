import { describe, expect, it } from "vitest";
import {
  computeExpiresAt,
  parseAuthRedirect,
  shouldRefreshAccessToken,
} from "./auth-logic.js";

const NOW = 1_800_000_000_000;

describe("shouldRefreshAccessToken", () => {
  it("refreshes when expiry is unknown", () => {
    expect(shouldRefreshAccessToken(null, NOW)).toBe(true);
    expect(shouldRefreshAccessToken(undefined, NOW)).toBe(true);
    expect(shouldRefreshAccessToken(Number.NaN, NOW)).toBe(true);
  });

  it("refreshes when the token is already expired", () => {
    expect(shouldRefreshAccessToken(NOW - 1, NOW)).toBe(true);
  });

  it("refreshes inside the skew window before expiry", () => {
    expect(shouldRefreshAccessToken(NOW + 30_000, NOW, 60_000)).toBe(true);
    expect(shouldRefreshAccessToken(NOW + 60_000, NOW, 60_000)).toBe(true); // boundary
  });

  it("does not refresh a fresh token", () => {
    expect(shouldRefreshAccessToken(NOW + 61_000, NOW, 60_000)).toBe(false);
  });
});

describe("computeExpiresAt", () => {
  it("converts expires_in seconds to epoch ms", () => {
    expect(computeExpiresAt(NOW, 3600)).toBe(NOW + 3_600_000);
  });

  it("treats invalid expires_in as already expired", () => {
    expect(computeExpiresAt(NOW, 0)).toBe(NOW);
    expect(computeExpiresAt(NOW, Number.NaN)).toBe(NOW);
    expect(computeExpiresAt(NOW, -5)).toBe(NOW);
  });
});

describe("parseAuthRedirect", () => {
  const REDIRECT = "https://abc.chromiumapp.org/oauth2";

  it("extracts the code when state matches", () => {
    expect(
      parseAuthRedirect(`${REDIRECT}?code=my-code&state=xyz`, "xyz"),
    ).toBe("my-code");
  });

  it("rejects a state mismatch", () => {
    expect(
      parseAuthRedirect(`${REDIRECT}?code=my-code&state=forged`, "xyz"),
    ).toBeNull();
  });

  it("rejects a redirect without a code", () => {
    expect(parseAuthRedirect(`${REDIRECT}?state=xyz`, "xyz")).toBeNull();
  });

  it("rejects an unparseable redirect URL", () => {
    expect(parseAuthRedirect("not a url", "xyz")).toBeNull();
  });
});
