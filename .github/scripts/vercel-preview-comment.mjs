import {
  VERCEL_APP_PROJECTS,
  getVercelAppByUrl,
} from "./vercel-app-projects.mjs";

const PREVIEW_LINK_PATTERN = /\[(?:Visit )?Preview\]\((https:\/\/[^)\s]+)\)/giu;

function isVercelPreviewUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.endsWith(".vercel.app");
  } catch {
    return false;
  }
}

export function getVercelPreviewUrlsFromComment(
  body,
  targetAppNames = VERCEL_APP_PROJECTS.map(({ appName }) => appName),
) {
  const targetApps = new Set(targetAppNames);
  const previewUrls = {};

  for (const line of String(body || "").split(/\r?\n/u)) {
    for (const match of line.matchAll(PREVIEW_LINK_PATTERN)) {
      const previewUrl = match[1];
      if (!isVercelPreviewUrl(previewUrl)) continue;
      const app = getVercelAppByUrl(previewUrl);
      if (!app || !targetApps.has(app.appName) || previewUrls[app.appName]) {
        continue;
      }
      previewUrls[app.appName] = previewUrl;
    }
  }

  return previewUrls;
}

export function mergeVercelPreviewUrls(
  successfulPreviewUrls,
  commentBodies,
  targetAppNames = VERCEL_APP_PROJECTS.map(({ appName }) => appName),
) {
  const targetApps = new Set(targetAppNames);
  const previewUrls = Object.fromEntries(
    Object.entries(successfulPreviewUrls || {}).filter(([appName]) =>
      targetApps.has(appName),
    ),
  );

  for (const body of commentBodies) {
    const commentPreviewUrls = getVercelPreviewUrlsFromComment(
      body,
      targetAppNames,
    );
    for (const [appName, previewUrl] of Object.entries(commentPreviewUrls)) {
      previewUrls[appName] ||= previewUrl;
    }
  }

  return previewUrls;
}
