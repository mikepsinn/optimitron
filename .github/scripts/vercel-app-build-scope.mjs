import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
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
  optimitron: ["content/"],
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

export function getVercelDiffBase(
  environment = process.env,
  resolveMergeBase = resolveProductionMergeBase,
) {
  const previousSha = String(environment.VERCEL_GIT_PREVIOUS_SHA ?? "").trim();
  if (/^[0-9a-f]{7,40}$/iu.test(previousSha)) return previousSha;
  return resolveMergeBase();
}

export function ensureVercelDiffBase(
  diffBase,
  {
    root = repoRoot,
    execFile = execFileSync,
    fetchRemotes = getVercelGitFetchRemotes(process.env, root),
  } = {},
) {
  if (!diffBase) return null;
  if (hasGitCommit(diffBase, root, execFile)) return diffBase;

  for (const remote of fetchRemotes) {
    try {
      execFile("git", ["fetch", "--no-tags", "--depth=1", remote, diffBase], {
        cwd: root,
        encoding: "utf8",
        stdio: ["ignore", "ignore", "pipe"],
      });
    } catch {
      continue;
    }
    if (hasGitCommit(diffBase, root, execFile)) return diffBase;
  }

  return null;
}

export function ensureVercelProductionDiffBase({
  root = repoRoot,
  execFile = execFileSync,
  fetchRemotes = getVercelGitFetchRemotes(process.env, root),
  currentBranch = String(process.env.VERCEL_GIT_COMMIT_REF ?? "").trim(),
  productionBranch = "main",
  fetchDepth = 100,
} = {}) {
  if (!currentBranch || currentBranch === productionBranch) return null;

  const localMergeBase = resolveProductionMergeBase(
    root,
    execFile,
    productionBranch,
  );
  if (localMergeBase) return localMergeBase;

  for (const remote of fetchRemotes) {
    try {
      execFile(
        "git",
        ["fetch", "--no-tags", `--depth=${fetchDepth}`, remote, currentBranch],
        {
          cwd: root,
          encoding: "utf8",
          stdio: ["ignore", "ignore", "pipe"],
        },
      );
      execFile(
        "git",
        [
          "fetch",
          "--no-tags",
          `--depth=${fetchDepth}`,
          remote,
          productionBranch,
        ],
        {
          cwd: root,
          encoding: "utf8",
          stdio: ["ignore", "ignore", "pipe"],
        },
      );
      const mergeBase = execFile("git", ["merge-base", "HEAD", "FETCH_HEAD"], {
        cwd: root,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
      if (/^[0-9a-f]{40}$/iu.test(mergeBase)) return mergeBase;
    } catch {
      continue;
    }
  }

  return null;
}

export function getVercelGitFetchRemotes(
  environment = process.env,
  root = repoRoot,
) {
  const remotes = ["origin"];
  const owner = String(environment.VERCEL_GIT_REPO_OWNER ?? "").trim();
  const slug = String(environment.VERCEL_GIT_REPO_SLUG ?? "").trim();
  const safeRepoPart = /^[a-z0-9_.-]+$/iu;
  if (safeRepoPart.test(owner) && safeRepoPart.test(slug)) {
    remotes.push(`https://github.com/${owner}/${slug}.git`);
    return remotes;
  }

  try {
    const manifest = JSON.parse(
      readFileSync(path.join(root, "package.json"), "utf8"),
    );
    const repositoryUrl = String(
      typeof manifest.repository === "string"
        ? manifest.repository
        : (manifest.repository?.url ?? ""),
    )
      .replace(/^git\+/u, "")
      .trim();
    if (
      /^https:\/\/github\.com\/[a-z0-9_.-]+\/[a-z0-9_.-]+(?:\.git)?$/iu.test(
        repositoryUrl,
      )
    ) {
      remotes.push(
        repositoryUrl.endsWith(".git") ? repositoryUrl : `${repositoryUrl}.git`,
      );
    }
  } catch {
    // The named remote remains available for non-Vercel checkouts.
  }

  return remotes;
}

function hasGitCommit(ref, root, execFile) {
  try {
    execFile("git", ["cat-file", "-e", `${ref}^{commit}`], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "ignore", "ignore"],
    });
    return true;
  } catch {
    return false;
  }
}

function resolveProductionMergeBase(
  root = repoRoot,
  execFile = execFileSync,
  productionBranch = "main",
) {
  for (const ref of [`origin/${productionBranch}`, productionBranch]) {
    try {
      const sha = execFile("git", ["merge-base", "HEAD", ref], {
        cwd: root,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
      if (/^[0-9a-f]{40}$/iu.test(sha)) return sha;
    } catch {
      // Vercel uses a shallow clone, so the production ref may be unavailable.
    }
  }
  return null;
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
