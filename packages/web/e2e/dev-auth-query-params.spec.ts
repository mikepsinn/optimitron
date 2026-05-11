/**
 * `?login=demo` + `?logout=1` query-param round-trip test.
 *
 * Would have caught the bug shipped in commit `ef63c034` where the logout
 * route's cookie-clear missed `secure: true` and the `__Secure-`-prefixed
 * cookie clear was silently rejected by the browser (the `__Secure-`
 * prefix REQUIRES `secure: true` on the Set-Cookie). Result: `?logout=1`
 * looked like a no-op — visiting it left the user still signed in.
 *
 * This spec exercises the full middleware → /api/dev/login-as-demo →
 * /api/dev/logout redirect chain and verifies the session cookie is
 * actually present after login and actually absent after logout.
 *
 * Runs against the local dev server (next dev on :3001). Skipped on CI
 * unless `RUN_DEV_AUTH_E2E=1` is set — the test relies on dev-only
 * env-gating that VERCEL_ENV doesn't satisfy in the CI runner.
 */
import { expect, test } from "@playwright/test";

const NEXT_AUTH_COOKIE_NAMES = [
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
];

function findSessionCookie(
  cookies: { name: string; value: string }[],
): { name: string; value: string } | undefined {
  return cookies.find((c) => NEXT_AUTH_COOKIE_NAMES.includes(c.name));
}

test.describe("dev-auth query params", () => {
  test.skip(
    process.env.RUN_DEV_AUTH_E2E !== "1",
    "Set RUN_DEV_AUTH_E2E=1 to run (requires VERCEL_ENV=preview or NODE_ENV=development)",
  );

  test("?login=demo sets a session cookie; ?logout=1 clears it", async ({
    context,
    page,
  }) => {
    // Start clean.
    await context.clearCookies();

    // Login: visit any URL with ?login=demo. Middleware redirects to
    // /api/dev/login-as-demo, the route mints + sets the cookie, then
    // redirects back to the original URL (now sans ?login=demo).
    const loginResponse = await page.goto("/?login=demo");
    expect(loginResponse?.status()).toBeLessThan(400);
    expect(page.url()).not.toContain("login=demo");

    const cookiesAfterLogin = await context.cookies();
    const sessionAfterLogin = findSessionCookie(cookiesAfterLogin);
    expect(
      sessionAfterLogin,
      "session cookie should be set after ?login=demo",
    ).toBeTruthy();
    expect(sessionAfterLogin?.value).not.toBe("");

    // Logout: visit any URL with ?logout=1.
    const logoutResponse = await page.goto("/?logout=1");
    expect(logoutResponse?.status()).toBeLessThan(400);
    expect(page.url()).not.toContain("logout=1");

    const cookiesAfterLogout = await context.cookies();
    const sessionAfterLogout = findSessionCookie(cookiesAfterLogout);
    // After logout, the cookie should either be absent OR present with
    // an empty value (browsers can race on the delete; either state means
    // the user is effectively signed out for subsequent requests).
    if (sessionAfterLogout) {
      expect(
        sessionAfterLogout.value,
        "session cookie should be empty after ?logout=1 (was a stale value, meaning the clear failed — likely missing `secure: true` on a __Secure- cookie clear)",
      ).toBe("");
    }
  });
});
