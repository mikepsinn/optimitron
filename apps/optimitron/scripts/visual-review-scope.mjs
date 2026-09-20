/** CI supplies its scheduled capture jobs; local reviews use available manifests. */
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
  const apps = new Set([
    ...(scheduled(webScheduled, available.has("optimitron")) ? ["optimitron"] : []),
    ...siteApps.filter((app) => scheduled(siteAppsScheduled, available.has(app))),
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
