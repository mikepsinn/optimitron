export const LEGACY_VISUAL_CAPTURE_VERSION = 1;
export const VISUAL_CAPTURE_VERSION = 2;
export const SITE_APP_VISUAL_CAPTURE_VERSION = 3;

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
