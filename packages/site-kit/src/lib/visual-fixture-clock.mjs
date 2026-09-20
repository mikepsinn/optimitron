// Keep browser captures and server-rendered counters on the same instant.
export const VISUAL_FIXTURE_NOW_MS = 1768435200000; // 2026-01-15T00:00:00.000Z

/**
 * Production renders use the real clock. Only the explicit site-app capture
 * fixture pins server time to the instant used by the browser capture helper.
 *
 * @param {{ SITE_APP_VISUAL_FIXTURES?: string }} [environment]
 */
export function getSiteAppRenderNowMs(environment = process.env) {
  return environment.SITE_APP_VISUAL_FIXTURES === "1"
    ? VISUAL_FIXTURE_NOW_MS
    : Date.now();
}
