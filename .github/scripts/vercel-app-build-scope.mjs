import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const dependencyFields = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
];
const globalBuildFiles = new Set([
  ".npmrc",
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "tsconfig.base.json",
]);
const appExtraBuildPaths = Object.freeze({
  optimitron: [
    "content/",
    "docs/canonical-argument-2026-05-20.md",
  ],
});
const appIgnoredBuildPaths = Object.freeze({
  optimitron: [
    "apps/optimitron/scripts/build-visual-review.mjs",
    "apps/optimitron/scripts/visual-capture-contract.mjs",
    "apps/optimitron/scripts/visual-review-coverage.mjs",
    "apps/optimitron/scripts/visual-review-diff.mjs",
    "apps/optimitron/scripts/visual-review-hunks.mjs",
    "apps/optimitron/scripts/visual-review-page.mjs",
  ],
});

export function getVercelAppBuildMatches(
  appName,
  files,
  workspacePackages = loadWorkspacePackages(),
) {
  const target = [...workspacePackages.values()].find(
    ({ directory }) => directory === `apps/${appName}`,
  );
  if (!target) throw new Error(`Unknown Vercel app: ${appName}`);

  const relevantDirectories = getDependencyDirectories(
    target.name,
    workspacePackages,
  );
  const extraPaths = appExtraBuildPaths[appName] ?? [];
  const ignoredPaths = appIgnoredBuildPaths[appName] ?? [];

  return files
    .map((file) => file.replaceAll("\\", "/"))
    .filter(
      (file) =>
        !isIgnoredBuildPath(file, ignoredPaths) &&
        (globalBuildFiles.has(file) ||
          extraPaths.some((extraPath) =>
            extraPath.endsWith("/")
              ? file.startsWith(extraPath)
              : file === extraPath,
          ) ||
          [...relevantDirectories].some(
            (directory) =>
              file === directory || file.startsWith(`${directory}/`),
          )),
    )
    .sort();
}

function isIgnoredBuildPath(file, appIgnoredPaths) {
  return (
    appIgnoredPaths.includes(file) ||
    /\/(?:e2e|output|playwright-report|screenshots|test-results)\//u.test(
      file,
    ) ||
    /\.(?:spec|test)\.[cm]?[jt]sx?$/u.test(file)
  );
}

export function getVercelDiffBase(environment = process.env) {
  const previousSha = String(environment.VERCEL_GIT_PREVIOUS_SHA ?? "").trim();
  return /^[0-9a-f]{7,40}$/iu.test(previousSha) ? previousSha : "HEAD^";
}

export function loadWorkspacePackages(root = repoRoot) {
  const packages = new Map();

  for (const parentDirectory of ["apps", "packages"]) {
    const parentPath = path.join(root, parentDirectory);
    for (const entry of readdirSync(parentPath, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const directory = `${parentDirectory}/${entry.name}`;
      const manifestPath = path.join(root, directory, "package.json");
      let manifest;
      try {
        manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
      } catch (error) {
        if (error?.code === "ENOENT") continue;
        throw error;
      }
      if (!manifest.name) continue;
      if (packages.has(manifest.name)) {
        throw new Error(`Duplicate workspace package name: ${manifest.name}`);
      }
      packages.set(manifest.name, {
        dependencies: new Set(
          dependencyFields.flatMap((field) =>
            Object.keys(manifest[field] ?? {}),
          ),
        ),
        directory,
        name: manifest.name,
      });
    }
  }

  return packages;
}

function getDependencyDirectories(targetName, workspacePackages) {
  const directories = new Set();
  const pending = [targetName];
  const visited = new Set();

  while (pending.length > 0) {
    const name = pending.pop();
    if (visited.has(name)) continue;
    visited.add(name);
    const workspacePackage = workspacePackages.get(name);
    if (!workspacePackage) continue;
    directories.add(workspacePackage.directory);
    for (const dependency of workspacePackage.dependencies) {
      if (workspacePackages.has(dependency)) pending.push(dependency);
    }
  }

  return directories;
}
