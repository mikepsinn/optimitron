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
    // A proxy rather than a subclass: `Date` is callable as well as
    // constructable, and `Date()` without `new` is a plain function call that
    // returns a string. A `class` cannot be called that way, so replacing
    // `Date` with one makes any page that calls `Date()` throw mid-capture.
    // Proxying also keeps `Date.parse`, `Date.UTC`, `Date.prototype`,
    // `instanceof` and the constructor's name intact for free.
    globalThis.Date = new Proxy(RealDate, {
      apply() {
        // `Date()` ignores its arguments and reports the current time.
        return new RealDate(frozen).toString();
      },
      construct(target, args) {
        return args.length === 0 ? new RealDate(frozen) : new RealDate(...args);
      },
      get(target, property, receiver) {
        return property === "now"
          ? () => frozen
          : Reflect.get(target, property, receiver);
      },
    });
  }, time);
}
