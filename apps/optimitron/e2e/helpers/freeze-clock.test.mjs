import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { freezeClock } from "./freeze-clock.mjs";
import { getSiteAppRenderNowMs } from "../../../../packages/site-kit/src/lib/visual-fixture-clock.mjs";

test("visual fixtures keep server-rendered counters and the browser on the same clock", async (t) => {
  const browser = vm.createContext({});
  await freezeClock({
    addInitScript: (callback, instant) =>
      vm.runInContext(`(${callback.toString()})(${instant})`, browser),
  });
  const browserNowMs = vm.runInContext("Date.now()", browser);

  for (const realNow of ["2026-09-18T00:00:00Z", "2026-09-19T00:00:00Z"]) {
    t.mock.method(Date, "now", () => Date.parse(realNow));
    const serverNowMs = getSiteAppRenderNowMs({ SITE_APP_VISUAL_FIXTURES: "1" });
    assert.equal(serverNowMs, browserNowMs);
    t.mock.restoreAll();
  }
});

test("ordinary server renders retain the real clock unless fixtures are explicitly enabled", (t) => {
  const realNowMs = Date.parse("2026-09-18T00:00:00Z");
  t.mock.method(Date, "now", () => realNowMs);

  for (const environment of [{}, { SITE_APP_VISUAL_FIXTURES: "0" }, { SITE_APP_VISUAL_FIXTURES: "true" }]) {
    assert.equal(getSiteAppRenderNowMs(environment), realNowMs);
  }
});

test("the browser clock preserves explicit dates and native timers", async () => {
  const nativeTimer = () => {};
  const browser = vm.createContext({ setTimeout: nativeTimer });
  await freezeClock({
    addInitScript: (callback, instant) =>
      vm.runInContext(`(${callback.toString()})(${instant})`, browser),
  });

  assert.equal(vm.runInContext("new Date().getTime()", browser), getSiteAppRenderNowMs({ SITE_APP_VISUAL_FIXTURES: "1" }));
  assert.equal(vm.runInContext('new Date("2026-09-18T00:00:00Z").getTime()', browser), Date.parse("2026-09-18T00:00:00Z"));
  assert.equal(browser.setTimeout, nativeTimer);
});
