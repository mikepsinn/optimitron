export const APP_PREVIEW_ORDER = Object.freeze([
  "optimitron",
  "warondisease",
  "dfda",
  "wishocracy",
  "trialabundancesurvey",
  "curedao",
  "acceleratedmedicine",
  "courtofhumanity",
]);

export const APP_PREVIEW_LABELS = Object.freeze({
  optimitron: "Optimitron",
  warondisease: "War on Disease",
  dfda: "dFDA",
  wishocracy: "Wishocracy",
  trialabundancesurvey: "Trial Abundance Survey",
  curedao: "CureDAO",
  acceleratedmedicine: "Accelerated Medicine",
  courtofhumanity: "Court of Humanity",
});

export function parseAppPreviewUrls(raw, fallbackOptimitronUrl = "") {
  let parsed = {};
  try {
    parsed = raw ? JSON.parse(raw) : {};
  } catch {
    parsed = {};
  }

  const urls = {};
  for (const appName of APP_PREVIEW_ORDER) {
    const url = normalizeHttpUrl(parsed?.[appName]);
    if (url) urls[appName] = url;
  }
  const fallback = normalizeHttpUrl(fallbackOptimitronUrl);
  if (!urls.optimitron && fallback) urls.optimitron = fallback;
  return urls;
}

export function getAppPreviewRouteUrl(
  appPreviewUrls,
  appName,
  routePath,
  authState,
) {
  const baseUrl = appPreviewUrls?.[appName];
  if (!baseUrl || !routePath) return null;
  const url = new URL(routePath, `${baseUrl}/`);
  if (authState === "demo-logged-in") {
    url.searchParams.set("login", "demo");
    url.searchParams.delete("logout");
  } else {
    url.searchParams.set("logout", "1");
    url.searchParams.delete("login");
  }
  return url.toString();
}

function normalizeHttpUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (!/^https?:$/u.test(url.protocol)) return null;
    return url.toString().replace(/\/$/u, "");
  } catch {
    return null;
  }
}
