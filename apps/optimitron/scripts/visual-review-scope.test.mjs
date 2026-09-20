import assert from "node:assert/strict";
import test from "node:test";
import { getVisualReviewCaptureApps, isRouteInCaptureScope, missingScheduledCaptures } from "./visual-review-scope.mjs";

test("site-only CI excludes full-main web baselines without dropping missing site captures", () => {
  const apps = getVisualReviewCaptureApps({
    webScheduled: "false", siteAppsScheduled: "true",
    manifestApps: ["warondisease", "dfda"], siteApps: ["warondisease", "dfda"],
  });
  assert.equal(isRouteInCaptureScope("home", apps), false);
  assert.equal(isRouteInCaptureScope("variant-dfda-home", apps), false);
  assert.equal(isRouteInCaptureScope("site-app-warondisease-home", apps), true);
  // Scope must not be inferred from PNGs: a missing current image still belongs here.
  assert.equal(isRouteInCaptureScope("site-app-dfda-missing-current", apps), true);
});

test("web-only captures exclude unrelated site baselines", () => {
  const apps = getVisualReviewCaptureApps({
    webScheduled: "true", siteAppsScheduled: "false",
    manifestApps: ["optimitron"], siteApps: ["dfda"],
  });
  assert.equal(isRouteInCaptureScope("home", apps), true);
  assert.equal(isRouteInCaptureScope("site-app-dfda-home", apps), false);
});

test("missing scheduled artifacts fail rather than silently narrowing review scope", () => {
  assert.throws(() => getVisualReviewCaptureApps({
    webScheduled: "true", siteAppsScheduled: "false",
    manifestApps: ["dfda"], siteApps: ["dfda"],
  }), /missing its route manifest: optimitron/);
  assert.throws(() => getVisualReviewCaptureApps({
    webScheduled: "false", siteAppsScheduled: "true",
    manifestApps: ["dfda"], siteApps: ["dfda", "courtofhumanity"],
  }), /missing its route manifest: courtofhumanity/);
});

test("local reviews infer scope from manifests, not the broader baseline", () => {
  assert.deepEqual([...getVisualReviewCaptureApps({
    manifestApps: ["courtofhumanity"], siteApps: ["dfda", "courtofhumanity"],
  })], ["courtofhumanity"]);
});

test("missing scheduled images fail even when no baseline image exists", () => {
  assert.deepEqual(missingScheduledCaptures([
    { name: "site-app-dfda-home", required: true, requiredProjects: ["default", "visual-mobile"] },
  ], [{ routeName: "site-app-dfda-home", projectName: "default" }]),
  ["site-app-dfda-home/visual-mobile: missing scheduled screenshot"]);
});
