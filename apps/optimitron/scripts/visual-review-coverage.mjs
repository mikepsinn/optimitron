import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SITE_APP_NAMES } from "./visual-capture-contract.mjs";

const WEB_PREFIX = "apps/optimitron/";
const SITE_APP_PREFIXES = SITE_APP_NAMES.map((appName) => `apps/${appName}/`);

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

function defaultFileExists(repoRelativePath) {
  return existsSync(path.join(REPO_ROOT, repoRelativePath));
}

export function buildChangedFileDiscoveryArgs(baselineRef) {
  return [
    "-c",
    "diff.renameLimit=999999",
    "diff",
    "--name-status",
    "--find-renames=100%",
    "-z",
    baselineRef,
    "--",
  ];
}

/**
 * Keep content changes while dropping byte-identical path-only renames.
 * NUL delimiters preserve unusual filenames and make rename pairs unambiguous.
 */
export function parseChangedFileDiscoveryOutput(output) {
  const fields = String(output ?? "").split("\0");
  const changedFiles = [];

  for (let index = 0; index < fields.length; ) {
    const status = fields[index++];
    if (!status) continue;

    const isRename = /^R\d+$/.test(status);
    const isCopy = /^C\d+$/.test(status);
    if (!isRename && !isCopy && !/^[ADMTUXB]$/.test(status)) {
      throw new TypeError(`Unexpected git diff status: ${status}`);
    }

    if (isRename || isCopy) {
      const sourcePath = fields[index++];
      const destinationPath = fields[index++];
      if (!sourcePath || !destinationPath) {
        throw new TypeError(`Incomplete git diff record for ${status}`);
      }
      if (status !== "R100") changedFiles.push(destinationPath);
      continue;
    }

    const filePath = fields[index++];
    if (!filePath) {
      throw new TypeError(`Incomplete git diff record for ${status}`);
    }
    changedFiles.push(filePath);
  }

  return changedFiles;
}

function normalizeRepoPath(filePath) {
  return String(filePath ?? "")
    .trim()
    .replaceAll("\\", "/");
}

function isTestOrStory(filePath) {
  return (
    filePath.includes("/__tests__/") ||
    filePath.includes("/__stories__/") ||
    /\.(?:test|spec|story|stories)\.[cm]?[jt]sx?$/i.test(filePath)
  );
}

function isServerOnlyJsx(webRelative) {
  return (
    /^src\/(?:server|lib\/server)\//.test(webRelative) ||
    /^src\/app\/api\//.test(webRelative) ||
    /^src\/(?:emails|lib\/email)\//.test(webRelative) ||
    /\.(?:email|server)\.(?:jsx|tsx)$/i.test(webRelative) ||
    /-react-email\.(?:jsx|tsx)$/i.test(webRelative) ||
    /^src\/app\/(?:.*\/)?(?:apple-icon|icon|opengraph-image|route|twitter-image)\.(?:jsx|tsx)$/i.test(
      webRelative,
    ) ||
    /^src\/lib\/.*-og-image-response\.(?:jsx|tsx)$/i.test(webRelative)
  );
}

function getSiteAppRelativePath(normalized) {
  for (const prefix of SITE_APP_PREFIXES) {
    if (normalized.startsWith(prefix)) {
      return normalized.slice(prefix.length);
    }
  }
  return null;
}

function isSiteAppServerOnlyJsx(appRelative) {
  return (
    /^app\/api\//.test(appRelative) ||
    /^emails\//.test(appRelative) ||
    /\.email\.(?:jsx|tsx)$/i.test(appRelative) ||
    /^app\/(?:.*\/)?(?:apple-icon|icon|opengraph-image|twitter-image)\.(?:jsx|tsx)$/i.test(
      appRelative,
    ) ||
    // Error, loading, and not-found boundaries only render in exceptional
    // states the screenshot smoke cannot reach deterministically.
    /^app\/(?:.*\/)?(?:error|global-error|loading|not-found)\.(?:jsx|tsx)$/i.test(
      appRelative,
    )
  );
}

/** Rendered web source that requires a registered screenshot state when changed. */
export function isVisualUiSourceFile(filePath) {
  const normalized = normalizeRepoPath(filePath);
  if (isTestOrStory(normalized)) {
    return false;
  }

  if (normalized.startsWith(WEB_PREFIX)) {
    const webRelative = normalized.slice(WEB_PREFIX.length);
    if (
      /^src\/.*\.(?:jsx|tsx)$/i.test(webRelative) &&
      !isServerOnlyJsx(webRelative)
    ) {
      return true;
    }
    if (/^src\/.*\.css$/.test(webRelative)) {
      return true;
    }
    if (
      /^public\/.*\.(?:avif|gif|ico|jpe?g|png|svg|webp)$/i.test(webRelative)
    ) {
      return true;
    }
    return /^(?:postcss|tailwind)\.config\.[cm]?[jt]s$/.test(webRelative);
  }

  const appRelative = getSiteAppRelativePath(normalized);
  if (appRelative === null) {
    return false;
  }
  if (
    /^(?:app|components)\/.*\.(?:jsx|tsx)$/i.test(appRelative) &&
    !isSiteAppServerOnlyJsx(appRelative)
  ) {
    return true;
  }
  if (/^(?:app|components)\/.*\.css$/.test(appRelative)) {
    return true;
  }
  return /^public\/.*\.(?:avif|gif|ico|jpe?g|png|svg|webp)$/i.test(appRelative);
}

/**
 * `git diff --name-only` lists deletions alongside edits, and a deleted
 * component can never be screenshotted -- demanding a required visual state
 * for one is unsatisfiable, so removing dead UI would block a pull request
 * forever. Drop paths that no longer exist in the working tree.
 *
 * `fileExists` is injectable so the unit tests do not need real files.
 */
export function getChangedUiFiles(
  changedFiles,
  fileExists = defaultFileExists,
  explicitlyCoveredFiles = new Set(),
) {
  if (!Array.isArray(changedFiles)) return [];
  return [...new Set(changedFiles.map(normalizeRepoPath))]
    .filter(
      (filePath) =>
        isVisualUiSourceFile(filePath) || explicitlyCoveredFiles.has(filePath),
    )
    .filter((filePath) => fileExists(filePath))
    .sort((a, b) => a.localeCompare(b));
}

/**
 * Proves that every changed UI source file was exercised by required,
 * state-asserted screenshots in every configured visual viewport.
 */
export function buildVisualCoverage({
  afterCaptures = [],
  changedFiles,
  fileExists = defaultFileExists,
  routes = [],
}) {
  const analysisAvailable = Array.isArray(changedFiles);
  const explicitlyCoveredFiles = new Set(
    routes.flatMap((route) =>
      Array.isArray(route.covers)
        ? route.covers.map(normalizeRepoPath).filter(Boolean)
        : [],
    ),
  );
  const changedUiFiles = getChangedUiFiles(
    changedFiles,
    fileExists,
    explicitlyCoveredFiles,
  );
  const blockingIssues = [];
  if (!analysisAvailable) {
    blockingIssues.push(
      "changed-file analysis is unavailable, so screenshot coverage cannot be proven",
    );
  }

  const normalizedRoutes = routes.map((route) => ({
    activationSelector:
      typeof route.activationSelector === "string"
        ? route.activationSelector.trim()
        : "",
    covers: Array.isArray(route.covers)
      ? [...new Set(route.covers.map(normalizeRepoPath).filter(Boolean))]
      : [],
    name: String(route.name ?? "").trim(),
    required: route.required === true,
    requiredProjects: Array.isArray(route.requiredProjects)
      ? [...new Set(route.requiredProjects.map(String).filter(Boolean))]
      : [],
  }));
  const captureKeys = new Set(
    afterCaptures.map(
      (capture) =>
        `${String(capture.routeName)}\u0000${String(capture.projectName)}`,
    ),
  );
  const invalidRouteMap = new Map();
  const missingCaptureMap = new Map();
  const routeCoverage = [];
  const uncoveredUiFiles = [];

  for (const filePath of changedUiFiles) {
    const matchingRoutes = normalizedRoutes.filter((route) =>
      route.covers.includes(filePath),
    );
    routeCoverage.push({
      filePath,
      routeNames: matchingRoutes.map((route) => route.name),
    });
    if (matchingRoutes.length === 0) {
      uncoveredUiFiles.push(filePath);
      blockingIssues.push(
        `${filePath}: no required visual state is registered for this changed UI source`,
      );
      continue;
    }

    for (const route of matchingRoutes) {
      const reasons = [];
      if (!route.name) reasons.push("route name is missing");
      if (!route.required) reasons.push("route is optional");
      if (!route.activationSelector) {
        reasons.push("activation selector is missing");
      }
      if (route.requiredProjects.length === 0) {
        reasons.push("required visual projects are missing");
      }
      if (reasons.length > 0) {
        invalidRouteMap.set(route.name || "<unnamed>", {
          reasons,
          routeName: route.name || "<unnamed>",
        });
      }

      for (const projectName of route.requiredProjects) {
        if (!captureKeys.has(`${route.name}\u0000${projectName}`)) {
          missingCaptureMap.set(`${route.name}\u0000${projectName}`, {
            projectName,
            routeName: route.name,
          });
        }
      }
    }
  }

  const invalidRoutes = [...invalidRouteMap.values()].sort((left, right) =>
    left.routeName.localeCompare(right.routeName),
  );
  const missingCaptures = [...missingCaptureMap.values()].sort((left, right) =>
    `${left.routeName}/${left.projectName}`.localeCompare(
      `${right.routeName}/${right.projectName}`,
    ),
  );
  for (const route of invalidRoutes) {
    blockingIssues.push(`${route.routeName}: ${route.reasons.join(", ")}`);
  }
  for (const capture of missingCaptures) {
    blockingIssues.push(
      `${capture.routeName}/${capture.projectName}: required UI coverage screenshot was not captured`,
    );
  }

  const incompleteFiles = new Set(uncoveredUiFiles);
  for (const mapping of routeCoverage) {
    if (
      mapping.routeNames.some(
        (routeName) =>
          invalidRouteMap.has(routeName) ||
          missingCaptures.some((capture) => capture.routeName === routeName),
      )
    ) {
      incompleteFiles.add(mapping.filePath);
    }
  }
  const coveredUiFiles = changedUiFiles.filter(
    (filePath) => !incompleteFiles.has(filePath),
  );

  return {
    analysisAvailable,
    blockingIssues,
    changedUiFiles,
    complete: blockingIssues.length === 0,
    coveredUiFiles,
    invalidRoutes,
    missingCaptures,
    routeCoverage,
    uncoveredUiFiles,
  };
}
