import type { Page } from "@playwright/test";

export const FROZEN_NOW_MS = 1768435200000; // 2026-01-15T00:00:00.000Z

export function freezeClock(
  page: Page,
  time = FROZEN_NOW_MS,
): Promise<void> {
  return page.clock.install({ time });
}
