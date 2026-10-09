import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  getDependencyDirectories,
  loadWorkspacePackages,
} from "./vercel-app-build-scope.mjs";

/**
 * The official Postgres image from AWS's public mirror. Docker Hub limits
 * anonymous pulls per IP, and GitHub's shared runners hit that limit.
 */
const POSTGRES_IMAGE = "public.ecr.aws/docker/library/postgres:16";

/**
 * One CI build per site app. scripts/smoke-site-apps.mjs serves each app on
 * the same port.
 */
export const SITE_APP_MATRIX = Object.freeze([
  { app: "warondisease", variant: "warondisease.org", port: 4010, postgres_image: POSTGRES_IMAGE, requires_database: true },
  { app: "dfda", variant: "dfda", port: 4011, postgres_image: POSTGRES_IMAGE, requires_database: true },
  { app: "wishocracy", variant: "wishocracy.org", port: 4013, postgres_image: POSTGRES_IMAGE, requires_database: true },
  { app: "trialabundancesurvey", variant: "trialabundancesurvey.org", port: 4014, postgres_image: POSTGRES_IMAGE, requires_database: true },
  { app: "curedao", variant: "curedao.org", port: 4015, postgres_image: "", requires_database: false },
  { app: "acceleratedmedicine", variant: "acceleratedmedicine.org", port: 4016, postgres_image: POSTGRES_IMAGE, requires_database: true },
  { app: "courtofhumanity", variant: "courtofhumanity.org", port: 4017, postgres_image: POSTGRES_IMAGE, requires_database: true },
]);

const siteAppNames = SITE_APP_MATRIX.map(({ app }) => app);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

// Unit and integration tests run for every site app in site-apps-static-validate,
// so their imports from other apps do not decide which app builds.
const crossAppScanSkippedDirectories = /^(node_modules|\.next|\.turbo|output|public|tests\/unit|tests\/integration)$/u;
const crossAppScanSkippedFiles = /\.(test|spec)\.[cm]?[jt]sx?$/u;
const sourceFile = /\.[cm]?[jt]sx?$/u;

function* sourceFiles(appRoot, relativeDirectory = "") {
  for (const entry of readdirSync(path.join(appRoot, relativeDirectory), { withFileTypes: true })) {
    const relativePath = relativeDirectory ? `${relativeDirectory}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (!crossAppScanSkippedDirectories.test(relativePath)) yield* sourceFiles(appRoot, relativePath);
    } else if (entry.isFile() && sourceFile.test(entry.name) && !crossAppScanSkippedFiles.test(entry.name)) {
      yield relativePath;
    }
  }
}
const relativeImport = /(?:from\s+|import\s*\(\s*|require\s*\(\s*)["'](\.{1,2}\/[^"']+)["']/gu;

/**
 * Folders in other site apps that each app's build imports, for example the
 * survey app's sign-in test harness that two other apps' auth configs load.
 * A change under one of those folders builds the importing app too.
 */
export function getCrossAppDependencies(root = repoRoot) {
  const dependencies = new Map(siteAppNames.map((app) => [app, new Set()]));
  for (const app of siteAppNames) {
    const appRoot = path.join(root, "apps", app);
    for (const relativePath of sourceFiles(appRoot)) {
      const filePath = path.join(appRoot, relativePath);
      for (const [, specifier] of readFileSync(filePath, "utf8").matchAll(relativeImport)) {
        const target = path.relative(root, path.resolve(path.dirname(filePath), specifier)).replaceAll("\\", "/");
        const owner = siteAppNames.find((other) => other !== app && target.startsWith(`apps/${other}/`));
        if (owner) dependencies.get(app).add(path.posix.dirname(target));
      }
    }
  }
  return dependencies;
}

/** The shared screenshot registry. scripts/site-app-route-changes.mjs reports which apps' routes it changed. */
export const SITE_APP_ROUTES_FILE = "scripts/site-app-visual-routes.mjs";

// A change to any of these alters how every site app is installed, built,
// smoked or captured, so every app builds.
const everySiteAppFiles = new Set([
  ".github/workflows/ci.yml",
  ".github/scripts/ci-site-app-scope.mjs",
  ".github/scripts/vercel-app-build-scope.mjs",
  ".npmrc",
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "tsconfig.base.json",
  // Shared by every site app: imported CSS and Next.js, ESLint and NextAuth configuration.
  "apps/next-auth.d.ts",
  "apps/shared-eslint-config.mjs",
  "apps/shared-globals.css",
  "apps/shared-next-config.mjs",
  "apps/optimitron/e2e/helpers/freeze-clock.mjs",
  "apps/optimitron/e2e/utils/auth-api.mjs",
  "apps/optimitron/e2e/utils/visual-settle.mjs",
  "apps/optimitron/scripts/visual-capture-contract.mjs",
  "scripts/capture-lane.mjs",
  "scripts/capture-lane.test.mjs",
  "scripts/site-app-navigation.test.ts",
  "scripts/site-app-navigation.ts",
  "scripts/site-app-route-changes.mjs",
  "scripts/smoke-site-apps.mjs",
]);

/**
 * The site apps a change set needs to build, in matrix order: each app whose
 * own folder, workspace dependencies or imported folders in other apps changed,
 * plus the apps whose screenshot routes changed. `routeChangedApps` is null when that comparison did not run,
 * so a registry change then builds every app.
 */
export function getAffectedSiteApps(
  files,
  {
    routeChangedApps = null,
    workspacePackages = loadWorkspacePackages(),
    crossAppDependencies = getCrossAppDependencies(),
  } = {},
) {
  const changed = files.map((file) => file.replaceAll("\\", "/"));
  if (changed.some((file) => everySiteAppFiles.has(file))) return [...siteAppNames];
  if (changed.includes(SITE_APP_ROUTES_FILE) && routeChangedApps === null) {
    return [...siteAppNames];
  }

  const affected = new Set(routeChangedApps ?? []);
  for (const app of siteAppNames) {
    const workspacePackage = [...workspacePackages.values()].find(
      ({ directory }) => directory === `apps/${app}`,
    );
    if (!workspacePackage) throw new Error(`Unknown site app: ${app}`);
    const directories = [
      ...getDependencyDirectories(workspacePackage.name, workspacePackages),
      ...crossAppDependencies.get(app),
    ];
    if (
      changed.some((file) =>
        directories.some((directory) => file === directory || file.startsWith(`${directory}/`)),
      )
    ) {
      affected.add(app);
    }
  }
  return siteAppNames.filter((app) => affected.has(app));
}

/**
 * Parses scripts/site-app-route-changes.mjs output. "none" means no app's
 * routes changed. An empty value (the comparison did not run) or "*" (it
 * failed) gives null, so a registry change builds every app.
 */
export function parseRouteChangedApps(value) {
  if (value === undefined || value === "" || value === "*") return null;
  if (value === "none") return [];
  const apps = value.split(",").map((app) => app.trim()).filter(Boolean);
  const unknown = apps.filter((app) => !siteAppNames.includes(app));
  if (unknown.length > 0) throw new Error(`Unknown site apps in route changes: ${unknown.join(", ")}`);
  return apps;
}

/** GitHub Actions outputs for the site-app jobs. The matrix is never empty, because a job's matrix cannot be. */
export function getSiteAppScopeOutputs(apps) {
  const scheduled = SITE_APP_MATRIX.filter(({ app }) => apps.includes(app));
  return {
    site_apps_changed: scheduled.length > 0 ? "true" : "false",
    site_app_names: scheduled.map(({ app }) => app).join(","),
    site_app_matrix: JSON.stringify(scheduled.length > 0 ? scheduled : SITE_APP_MATRIX),
  };
}

// CI: print the outputs for a pull request (BASE_SHA and HEAD_SHA) or for
// every app (ALL_SITE_APPS=true, used for main pushes and manual runs).
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  let apps;
  if (process.env.ALL_SITE_APPS === "true") {
    apps = [...siteAppNames];
  } else {
    const { BASE_SHA: base, HEAD_SHA: head } = process.env;
    if (!base || !head) throw new Error("BASE_SHA and HEAD_SHA are required");
    const mergeBase = execFileSync("git", ["merge-base", base, head], { encoding: "utf8" }).trim();
    const files = execFileSync("git", ["diff", "--name-only", mergeBase, head], { encoding: "utf8" })
      .split(/\r?\n/u)
      .filter(Boolean);
    apps = getAffectedSiteApps(files, {
      routeChangedApps: parseRouteChangedApps(process.env.ROUTE_CHANGED_APPS),
    });
    console.error(`Site apps to build: ${apps.join(", ") || "none"}`);
  }
  for (const [key, value] of Object.entries(getSiteAppScopeOutputs(apps))) {
    console.log(`${key}=${value}`);
  }
}
