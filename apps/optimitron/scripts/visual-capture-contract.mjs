export const LEGACY_VISUAL_CAPTURE_VERSION = 1;
export const VISUAL_CAPTURE_VERSION = 3;
export const SITE_APP_VISUAL_CAPTURE_VERSION = 4;

/** Standalone site apps whose captures ride the visual review. Must match the
 * app matrix in scripts/smoke-site-apps.mjs and .github/workflows/ci.yml. */
export const SITE_APP_NAMES = Object.freeze([
  "warondisease",
  "dfda",
  "wishocracy",
  "trialabundancesurvey",
  "curedao",
  "acceleratedmedicine",
]);

export function getVisualCaptureVersion(value) {
  return value &&
    typeof value === "object" &&
    Number.isInteger(value.captureVersion) &&
    value.captureVersion > 0
    ? value.captureVersion
    : LEGACY_VISUAL_CAPTURE_VERSION;
}

export function normalizeVisualRouteManifest(value) {
  if (Array.isArray(value)) {
    return {
      captureVersion: LEGACY_VISUAL_CAPTURE_VERSION,
      routes: value,
    };
  }

  if (value && typeof value === "object" && Array.isArray(value.routes)) {
    return {
      captureVersion: getVisualCaptureVersion(value),
      routes: value.routes,
    };
  }

  return {
    captureVersion: LEGACY_VISUAL_CAPTURE_VERSION,
    routes: [],
  };
}
