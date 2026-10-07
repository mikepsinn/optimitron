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

// GitHub reports skipped Vercel builds as inactive even when their preview
// URL points at a canceled deployment. Require an actual successful status.
export function getSuccessfulVercelDeploymentStatus(statuses) {
  const conclusive = statuses.find(
    ({ state, description }) =>
      ["success", "error", "failure"].includes(state) ||
      (state === "inactive" && String(description || "").startsWith("Skipped")),
  );
  return conclusive?.state === "success" &&
    /^https?:\/\//u.test(conclusive.environment_url || "")
    ? conclusive
    : null;
}

// Vercel creates a GitHub deployment record for every app on every push, and
// a skipped app's record gets one final "inactive" status. Only a record whose
// newest status is still queued, pending or in progress can yet become a
// preview. GitHub lists statuses newest first.
export function isVercelDeploymentBuilding(statuses) {
  const newest = statuses[0];
  return !newest || ["queued", "pending", "in_progress"].includes(newest.state);
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
