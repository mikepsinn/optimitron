export const FROZEN_NOW_MS = 1768435200000; // 2026-01-15T00:00:00.000Z

/**
 * Freeze `Date` for deterministic captures without Playwright's clock.
 *
 * `page.clock` wedges long capture runs. A single page looping the capture
 * pipeline died at exactly the 33rd capture under `clock.install`, again at
 * the 33rd under `clock.setFixedTime`, and completed 320 with no clock at
 * all — so it is the injected clock itself, not its fake timers. The stall
 * lands inside a `page.evaluate`, which has no timeout of its own, so it
 * hangs the caller forever rather than failing.
 *
 * Captures only need `Date.now()` and `new Date()` to be stable; nothing here
 * drives the clock manually (no caller uses `runFor`, `fastForward`, `pauseAt`
 * or `resume`). So pin `Date` directly and leave every timer alone.
 *
 * @param {import("@playwright/test").Page} page
 * @param {number} [time]
 */
export function freezeClock(page, time = FROZEN_NOW_MS) {
  return page.addInitScript((frozen) => {
    const RealDate = Date;
    class FrozenDate extends RealDate {
      constructor(...args) {
        super(...(args.length === 0 ? [frozen] : args));
      }
      static now() {
        return frozen;
      }
    }
    FrozenDate.parse = RealDate.parse;
    FrozenDate.UTC = RealDate.UTC;
    Object.defineProperty(FrozenDate, "name", { value: "Date" });
    globalThis.Date = FrozenDate;
  }, time);
}
