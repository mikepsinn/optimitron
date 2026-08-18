export const FROZEN_NOW_MS = 1768435200000; // 2026-01-15T00:00:00.000Z

/**
 * @param {import("@playwright/test").Page} page
 * @param {number} [time]
 */
export function freezeClock(page, time = FROZEN_NOW_MS) {
  return page.clock.install({ time });
}
