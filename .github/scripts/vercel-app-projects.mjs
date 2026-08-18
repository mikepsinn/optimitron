#!/usr/bin/env node

import { pathToFileURL } from "node:url";

const API_ORIGIN = "https://api.vercel.com";
const GITHUB_REPOSITORY = "mikepsinn/optimitron";

export const VERCEL_APP_PROJECTS = Object.freeze([
  project("optimitron", "optimitron-web", "optimitron.com", [
    "optimitron",
    "optimitron-web",
    "optomitron",
    "optomitron-web",
  ]),
  project("warondisease", "warondisease", "warondisease.org"),
  project("dfda", "dfda", "dfda.earth"),
  project("wishocracy", "wishocracy", "wishocracy.org"),
  project(
    "trialabundancesurvey",
    "trialabundancesurvey",
    "trialabundancesurvey.org",
    undefined,
    ["/", "/embed?embed=1"],
  ),
  project("curedao", "curedao", "curedao.org"),
  project(
    "acceleratedmedicine",
    "acceleratedmedicine",
    "acceleratedmedicine.org",
  ),
]);

function project(
  appName,
  projectName,
  productionDomain,
  deploymentPrefixes = [projectName],
  smokePaths = ["/"],
) {
  return Object.freeze({
    appName,
    projectName,
    productionDomain,
    rootDirectory: `apps/${appName}`,
    deploymentPrefixes: Object.freeze(deploymentPrefixes),
    smokePaths: Object.freeze(smokePaths),
  });
}

export function getVercelAppByUrl(value) {
  let hostname;
  try {
    hostname = new URL(value).hostname.toLowerCase();
  } catch {
    return undefined;
  }

  const productionMatch = VERCEL_APP_PROJECTS.find(
    ({ productionDomain }) =>
      hostname === productionDomain || hostname === `www.${productionDomain}`,
  );
  if (productionMatch) return productionMatch;
  if (!hostname.endsWith(".vercel.app")) return undefined;

  return VERCEL_APP_PROJECTS.find(({ deploymentPrefixes }) =>
    deploymentPrefixes.some(
      (prefix) =>
        hostname === `${prefix}.vercel.app` ||
        hostname.startsWith(`${prefix}-`),
    ),
  );
}

export function getProjectPatch(current, desired) {
  const expected = {
    enableAffectedProjectsDeployments: true,
    framework: "nextjs",
    nodeVersion: "24.x",
    rootDirectory: desired.rootDirectory,
    sourceFilesOutsideRootDirectory: true,
  };
  return Object.fromEntries(
    Object.entries(expected).filter(([key, value]) => {
      const currentValue = current?.[key] ?? current?.settings?.[key];
      return currentValue !== value;
    }),
  );
}

export function getGitLinkProblem(current) {
  const link = current?.link;
  if (
    link?.type === "github" &&
    link.org === "mikepsinn" &&
    link.repo === "optimitron"
  ) {
    return undefined;
  }
  return `project is not linked to ${GITHUB_REPOSITORY}`;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const token = requiredEnvironmentVariable("VERCEL_TOKEN");
  const teamId = requiredEnvironmentVariable("VERCEL_ORG_ID");
  let driftCount = 0;

  for (const desired of VERCEL_APP_PROJECTS) {
    let current = await requestProject(desired.projectName, teamId, token);
    if (!current) {
      driftCount += 1;
      if (!apply) {
        console.log(
          `MISSING ${desired.projectName} (${desired.rootDirectory})`,
        );
        continue;
      }
      const created = await createProject(desired, teamId, token);
      console.log(`CREATED ${desired.projectName} (${created.id})`);
      current = await requestProject(desired.projectName, teamId, token);
      if (!current) {
        throw new Error(
          `${desired.projectName}: project was missing after creation.`,
        );
      }
    }

    const linkProblem = getGitLinkProblem(current);
    if (linkProblem) {
      throw new Error(
        `${desired.projectName}: ${linkProblem}. Connect it in Vercel or recreate the project.`,
      );
    }

    const patch = getProjectPatch(current, desired);
    if (Object.keys(patch).length === 0) {
      console.log(`OK ${desired.projectName} (${desired.rootDirectory})`);
      continue;
    }

    driftCount += 1;
    if (!apply) {
      console.log(`DRIFT ${desired.projectName}: ${JSON.stringify(patch)}`);
      continue;
    }
    await updateProject(desired.projectName, patch, teamId, token);
    console.log(
      `UPDATED ${desired.projectName}: ${Object.keys(patch).join(", ")}`,
    );
  }

  if (!apply && driftCount > 0) {
    throw new Error(
      `${driftCount} Vercel project(s) need changes. Re-run with --apply.`,
    );
  }
  console.log(
    `Vercel project reconciliation complete (${VERCEL_APP_PROJECTS.length} projects).`,
  );
}

async function requestProject(name, teamId, token) {
  const response = await vercelRequest(
    `/v9/projects/${encodeURIComponent(name)}`,
    { method: "GET" },
    teamId,
    token,
    [404],
  );
  return response.status === 404 ? undefined : response.json();
}

async function createProject(desired, teamId, token) {
  const response = await vercelRequest(
    "/v11/projects",
    {
      method: "POST",
      body: JSON.stringify({
        enableAffectedProjectsDeployments: true,
        framework: "nextjs",
        gitRepository: { repo: GITHUB_REPOSITORY, type: "github" },
        name: desired.projectName,
        rootDirectory: desired.rootDirectory,
      }),
    },
    teamId,
    token,
  );
  const created = await response.json();
  const patch = getProjectPatch(created, desired);
  if (Object.keys(patch).length > 0) {
    await updateProject(desired.projectName, patch, teamId, token);
    return { ...created, ...patch };
  }
  return created;
}

async function updateProject(name, patch, teamId, token) {
  const response = await vercelRequest(
    `/v9/projects/${encodeURIComponent(name)}`,
    { method: "PATCH", body: JSON.stringify(patch) },
    teamId,
    token,
  );
  return response.json();
}

async function vercelRequest(pathname, options, teamId, token, allowed = []) {
  const url = new URL(pathname, API_ORIGIN);
  url.searchParams.set("teamId", teamId);
  const response = await fetch(url, {
    ...options,
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      ...options.headers,
    },
  });
  if (!response.ok && !allowed.includes(response.status)) {
    const body = await response.text();
    throw new Error(
      `Vercel ${options.method} ${pathname} returned HTTP ${response.status}: ${body}`,
    );
  }
  return response;
}

function requiredEnvironmentVariable(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
