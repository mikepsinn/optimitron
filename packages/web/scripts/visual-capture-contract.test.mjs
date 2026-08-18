import assert from "node:assert/strict";
import test from "node:test";
import {
  getVisualCaptureVersion,
  LEGACY_VISUAL_CAPTURE_VERSION,
  normalizeVisualRouteManifest,
} from "./visual-capture-contract.mjs";

test("treats array route manifests as the legacy capture protocol", () => {
  const routes = [{ name: "home", path: "/" }];

  assert.deepEqual(normalizeVisualRouteManifest(routes), {
    captureVersion: LEGACY_VISUAL_CAPTURE_VERSION,
    routes,
  });
});

test("reads the capture version from versioned route manifests", () => {
  const routes = [{ name: "home", path: "/" }];

  assert.deepEqual(
    normalizeVisualRouteManifest({ captureVersion: 3, routes, version: 2 }),
    { captureVersion: 3, routes },
  );
});

test("defaults unversioned site-app manifests to the legacy protocol", () => {
  assert.equal(
    getVisualCaptureVersion({ appName: "warondisease", routes: [] }),
    LEGACY_VISUAL_CAPTURE_VERSION,
  );
  assert.equal(getVisualCaptureVersion({ captureVersion: 2 }), 2);
});
