import assert from "node:assert/strict";
import test from "node:test";

import {
  SITE_APP_MATRIX,
  SITE_APP_ROUTES_FILE,
  getAffectedSiteApps,
  getSiteAppScopeOutputs,
  parseRouteChangedApps,
} from "./ci-site-app-scope.mjs";

const everyApp = SITE_APP_MATRIX.map(({ app }) => app);

test("a change inside one app builds only that app", () => {
  assert.deepEqual(
    getAffectedSiteApps([
      "apps/acceleratedmedicine/app/act/page.tsx",
      "apps/acceleratedmedicine/app/act/page.logged-out.md",
      "apps/acceleratedmedicine/tests/unit/partner-signup.test.ts",
    ]),
    ["acceleratedmedicine"],
  );
});

test("a shared package builds every app that depends on it", () => {
  // acceleratedmedicine.org does not use site-kit, so a site-kit change leaves it alone.
  assert.deepEqual(
    getAffectedSiteApps(["packages/site-kit/src/components/layout.tsx"]),
    everyApp.filter((app) => app !== "acceleratedmedicine"),
  );
  assert.deepEqual(getAffectedSiteApps(["packages/neobrutalist-ui/src/ui/button.tsx"]), everyApp);
});

test("a change to another app's folder that an app's build imports builds that app too", () => {
  // The War on Disease auth config loads the survey app's test harness.
  assert.deepEqual(
    getAffectedSiteApps(["apps/trialabundancesurvey/tests/e2e/config.ts"]),
    ["warondisease", "trialabundancesurvey"],
  );
});

test("imports in unit and integration tests do not widen the build", () => {
  // warondisease's unit tests import this file; those tests run for every app in static validation.
  assert.deepEqual(getAffectedSiteApps(["apps/acceleratedmedicine/lib/navigation.ts"]), ["acceleratedmedicine"]);
});

test("files outside the site apps and their dependencies build nothing", () => {
  assert.deepEqual(
    getAffectedSiteApps(["docs/ROADMAP.md", "apps/optimitron/src/app/page.tsx", "videos/x/README.md"]),
    [],
  );
});

test("shared app files and capture tooling build every app", () => {
  for (const file of [
    ".github/workflows/ci.yml",
    "apps/shared-globals.css",
    "apps/shared-next-config.mjs",
    "scripts/smoke-site-apps.mjs",
    "apps/optimitron/e2e/utils/visual-settle.mjs",
    "pnpm-lock.yaml",
  ]) {
    assert.deepEqual(getAffectedSiteApps([file]), everyApp, file);
  }
});

test("a screenshot registry change builds the apps whose routes changed", () => {
  assert.deepEqual(
    getAffectedSiteApps([SITE_APP_ROUTES_FILE], { routeChangedApps: ["courtofhumanity"] }),
    ["courtofhumanity"],
  );
  assert.deepEqual(
    getAffectedSiteApps([SITE_APP_ROUTES_FILE, "apps/acceleratedmedicine/app/act/page.tsx"], {
      routeChangedApps: [],
    }),
    ["acceleratedmedicine"],
  );
  // Without a route comparison, the registry change could affect any app.
  assert.deepEqual(getAffectedSiteApps([SITE_APP_ROUTES_FILE], { routeChangedApps: null }), everyApp);
});

test("route comparison output separates no change from a comparison that did not run", () => {
  assert.deepEqual(parseRouteChangedApps("none"), []);
  assert.deepEqual(parseRouteChangedApps("dfda,acceleratedmedicine"), ["dfda", "acceleratedmedicine"]);
  assert.equal(parseRouteChangedApps(""), null);
  assert.equal(parseRouteChangedApps("*"), null);
  assert.throws(() => parseRouteChangedApps("acceleratedmedicine,mystery"), /Unknown site apps/);
});

test("outputs schedule only the affected apps and keep the matrix valid when none are", () => {
  const one = getSiteAppScopeOutputs(["acceleratedmedicine"]);
  assert.equal(one.site_apps_changed, "true");
  assert.equal(one.site_app_names, "acceleratedmedicine");
  assert.deepEqual(JSON.parse(one.site_app_matrix).map(({ app }) => app), ["acceleratedmedicine"]);

  const none = getSiteAppScopeOutputs([]);
  assert.equal(none.site_apps_changed, "false");
  assert.equal(none.site_app_names, "");
  assert.equal(JSON.parse(none.site_app_matrix).length, SITE_APP_MATRIX.length);
});
