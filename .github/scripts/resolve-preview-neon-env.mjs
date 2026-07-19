import { appendFileSync } from "node:fs";
import {
  assertDirectNeonConnectionUri,
  expectedPreviewBranchName,
  selectExactPreviewBranch,
} from "./preview-neon-branch.mjs";

const API_BASE = "https://console.neon.tech/api/v2";
const apiKey = requiredEnv("NEON_API_KEY");
const previewGitBranch = requiredEnv("PREVIEW_GIT_BRANCH");
const expectedBranchName = expectedPreviewBranchName(previewGitBranch);

const configuredProjectId = optionalEnv("NEON_PROJECT_ID");
const configuredDatabaseName = optionalEnv("NEON_DATABASE_NAME");
const configuredRoleName = optionalEnv("NEON_ROLE_NAME");

const { project, branch } = await resolveProjectAndBranch();
const database = await resolveDatabase(project.id, branch.id);
const role = await resolveRole(project.id, branch.id, database.name);
const pooledUri = await getConnectionUri(
  project.id,
  branch.id,
  database.name,
  role.name,
  true,
);
const directUri = assertDirectNeonConnectionUri(
  await getConnectionUri(
    project.id,
    branch.id,
    database.name,
    role.name,
    false,
  ),
);

writeGitHubEnv("DATABASE_URL", pooledUri);
writeGitHubEnv("DATABASE_URL_UNPOOLED", directUri);
writeGitHubEnv("NEON_PROJECT_ID", project.id);
writeGitHubEnv("NEON_BRANCH_ID", branch.id);
writeGitHubEnv("NEON_DATABASE_NAME", database.name);
writeGitHubEnv("PGDATABASE", database.name);

const summary = [
  "## Preview database sync",
  "",
  `Resolved Neon project \`${project.name || project.id}\`.`,
  `Resolved Neon branch \`${branch.name || branch.id}\` for \`${previewGitBranch}\`.`,
  `Resolved Neon database \`${database.name}\` and role \`${role.name}\`.`,
  "",
].join("\n");
appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);

console.log(
  `Resolved Neon preview database for ${previewGitBranch}: project ${project.name || project.id}, branch ${branch.name || branch.id}, database ${database.name}, role ${role.name}.`,
);

async function resolveProjectAndBranch() {
  const projects = configuredProjectId
    ? [await getProject(configuredProjectId)]
    : await listProjects();
  const candidates = [];

  for (const project of projects) {
    const branches = await listBranches(project.id, expectedBranchName);
    for (const branch of branches) {
      candidates.push({ project, branch });
    }
  }

  return selectExactPreviewBranch(candidates, previewGitBranch);
}

async function getProject(projectId) {
  const data = await neon(`/projects/${projectId}`);
  return data.project || data;
}

async function resolveDatabase(projectId, branchId) {
  const data = await neon(
    `/projects/${projectId}/branches/${branchId}/databases`,
  );
  const databases = data.databases || [];
  const preferredName = configuredDatabaseName || "neondb";
  const preferred = databases.find(
    (database) => database.name === preferredName,
  );
  if (preferred) return preferred;
  if (databases.length === 1) return databases[0];

  throw new Error(
    [
      `Could not choose a Neon database for branch ${branchId}.`,
      `Set NEON_DATABASE_NAME in GitHub variables. Preferred default was ${preferredName}.`,
      ...databases.map((database) => `- ${database.name}`),
    ].join("\n"),
  );
}

async function resolveRole(projectId, branchId, databaseName) {
  const data = await neon(`/projects/${projectId}/branches/${branchId}/roles`);
  const roles = data.roles || [];
  const preferredName = configuredRoleName || `${databaseName}_owner`;
  const preferred = roles.find((role) => role.name === preferredName);
  if (preferred) return preferred;

  const owners = roles.filter((role) => /_owner$/u.test(role.name));
  if (owners.length === 1) return owners[0];
  if (roles.length === 1) return roles[0];

  throw new Error(
    [
      `Could not choose a Neon role for branch ${branchId}.`,
      `Set NEON_ROLE_NAME in GitHub variables. Preferred default was ${preferredName}.`,
      ...roles.map((role) => `- ${role.name}`),
    ].join("\n"),
  );
}

async function getConnectionUri(
  projectId,
  branchId,
  databaseName,
  roleName,
  pooled,
) {
  const data = await neon(`/projects/${projectId}/connection_uri`, {
    branch_id: branchId,
    database_name: databaseName,
    role_name: roleName,
    pooled: pooled ? "true" : "false",
  });
  const uri =
    data.uri ||
    data.connection_uri ||
    data.connectionUri ||
    data.connection_string ||
    data.connectionString;
  if (!uri) {
    throw new Error(
      `Neon connection URI response did not include a URI for branch ${branchId}.`,
    );
  }
  return uri;
}

async function listProjects() {
  const data = await neon("/projects", { limit: "400" });
  const projects = data.projects || [];
  if (projects.length === 0) {
    throw new Error("NEON_API_KEY can access zero Neon projects.");
  }
  return projects;
}

async function listBranches(projectId, search) {
  const data = await neon(`/projects/${projectId}/branches`, {
    limit: "10000",
    search,
  });
  return data.branches || [];
}

async function neon(path, query = {}) {
  const url = new URL(`${API_BASE}${path}`);
  for (const [key, value] of Object.entries(query)) {
    if (value) url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      authorization: `Bearer ${apiKey}`,
    },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) {
    const message =
      data.message || data.error || text || "unknown Neon API error";
    throw new Error(`Neon API ${response.status} for ${path}: ${message}`);
  }
  return data;
}

function writeGitHubEnv(key, value) {
  console.log(`::add-mask::${value}`);
  const delimiter = `managed_data_${key}_${Math.random().toString(36).slice(2)}`;
  appendFileSync(
    process.env.GITHUB_ENV,
    `${key}<<${delimiter}\n${value}\n${delimiter}\n`,
  );
}

function requiredEnv(name) {
  const value = optionalEnv(name);
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function optionalEnv(name) {
  return String(process.env[name] || "").trim();
}
