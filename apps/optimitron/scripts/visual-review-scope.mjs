/**
 * CI supplies its scheduled capture jobs; local reviews use available manifests.
 * `siteAppsScheduled` is "true", "false", or the comma-separated site apps CI built.
 */
export function getVisualReviewCaptureApps({
  webScheduled,
  siteAppsScheduled,
  manifestApps,
  siteApps,
}) {
  function scheduled(value, fallback) {
    if (value === undefined || value === "") return fallback;
    if (value === "true") return true;
    if (value === "false") return false;
    throw new Error(`Invalid visual capture job flag: ${value}`);
  }
  const available = new Set(manifestApps);
  const scheduledSiteApps = /^[a-z0-9]+(,[a-z0-9]+)*$/.test(siteAppsScheduled ?? "") &&
    siteAppsScheduled !== "true" && siteAppsScheduled !== "false"
    ? new Set(siteAppsScheduled.split(","))
    : null;
  if (scheduledSiteApps) {
    const unknown = [...scheduledSiteApps].filter((app) => !siteApps.includes(app));
    if (unknown.length > 0) throw new Error(`Unknown scheduled site apps: ${unknown.join(", ")}`);
  }
  const apps = new Set([
    ...(scheduled(webScheduled, available.has("optimitron")) ? ["optimitron"] : []),
    ...siteApps.filter((app) => scheduledSiteApps
      ? scheduledSiteApps.has(app)
      : scheduled(siteAppsScheduled, available.has(app))),
  ]);
  for (const app of apps) {
    if (!available.has(app)) {
      throw new Error(`Scheduled visual capture is missing its route manifest: ${app}`);
    }
  }
  if (apps.size === 0) throw new Error("No visual capture apps were scheduled or have route manifests");
  return apps;
}

export function isRouteInCaptureScope(routeName, apps) {
  const siteApp = /^site-app-([a-z0-9]+)-/.exec(routeName)?.[1];
  return apps.has(siteApp ?? "optimitron");
}

export function missingScheduledCaptures(routes, afterCaptures) {
  const captured = new Set(afterCaptures.map(({ routeName, projectName }) => `${routeName}\0${projectName}`));
  return routes.flatMap(({ name, required, requiredProjects = [] }) =>
    required ? requiredProjects.filter((project) => !captured.has(`${name}\0${project}`))
      .map((project) => `${name}/${project}: missing scheduled screenshot`) : [],
  );
}
