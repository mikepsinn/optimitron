// Prints `route_changed_apps=<apps>` for GitHub Actions: the site apps whose
// screenshot routes, covered files or exemptions in site-app-visual-routes.mjs
// differ between a base commit and the working tree. Prints "none" when no app
// changed, and "*" when the comparison cannot run, so CI builds every app.
//
// Usage (from apps/optimitron): pnpm exec tsx ../../scripts/site-app-route-changes.mjs <base-sha>
import { execFileSync } from "node:child_process";
import { rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { VARIANTS } from "../packages/site-kit/src/lib/site-variant-types.ts";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptsDir, "..");

// The variants scripts/smoke-site-apps.mjs captures each app with.
const siteApps = [
  ["warondisease", VARIANTS.WAR_ON_DISEASE],
  ["dfda", VARIANTS.DFDA],
  ["wishocracy", VARIANTS.WISHOCRACY],
  ["trialabundancesurvey", VARIANTS.SURVEY],
  ["curedao", VARIANTS.CUREDAO],
  ["acceleratedmedicine", VARIANTS.ACCELERATED_MEDICINE],
  ["courtofhumanity", VARIANTS.COURT_OF_HUMANITY],
];

/** Everything the registry says about one app, as comparable JSON. */
export function describeSiteAppRoutes(registry, appName, siteVariant) {
  const ownsPage = ({ sourcePage }) => sourcePage.startsWith(`apps/${appName}/`);
  return JSON.stringify({
    screenshotRoutes: registry.getSiteAppScreenshotRoutes(appName, siteVariant),
    authenticatedExemptions: registry.authenticatedSiteAppRouteExemptions.filter(ownsPage),
    publicExemptions: registry.publicSiteAppRouteExemptions.filter(ownsPage),
  });
}

export function getRouteChangedApps(before, after) {
  return siteApps
    .filter(([appName, siteVariant]) =>
      describeSiteAppRoutes(before, appName, siteVariant) !==
        describeSiteAppRoutes(after, appName, siteVariant))
    .map(([appName]) => appName);
}

async function main(baseSha) {
  // The base copy sits next to the current one, so its relative imports resolve.
  const baseCopy = path.join(scriptsDir, `.site-app-visual-routes.base-${process.pid}.mjs`);
  try {
    const source = execFileSync("git", ["show", `${baseSha}:scripts/site-app-visual-routes.mjs`], {
      cwd: repoRoot,
      encoding: "utf8",
    });
    writeFileSync(baseCopy, source);
    const before = await import(pathToFileURL(baseCopy).href);
    const after = await import(pathToFileURL(path.join(scriptsDir, "site-app-visual-routes.mjs")).href);
    return getRouteChangedApps(before, after).join(",") || "none";
  } finally {
    rmSync(baseCopy, { force: true });
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const baseSha = process.argv[2];
  let result = "*";
  try {
    if (!baseSha) throw new Error("Pass the base commit SHA");
    result = await main(baseSha);
    console.error(`Site apps with changed screenshot routes: ${result}`);
  } catch (error) {
    console.error("Could not compare site-app screenshot routes; building every app.", error);
  }
  console.log(`route_changed_apps=${result}`);
}
