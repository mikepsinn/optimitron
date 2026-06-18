import { appendFileSync } from "node:fs";

const API_BASE = "https://console.neon.tech/api/v2";
const apiKey = requiredEnv("NEON_API_KEY");
const previewGitBranch = requiredEnv("PREVIEW_GIT_BRANCH");

const configuredProjectId = optionalEnv("NEON_PROJECT_ID");
const configuredBranchId = optionalEnv("NEON_BRANCH_ID");
const configuredDatabaseName = optionalEnv("NEON_DATABASE_NAME");
const configuredRoleName = optionalEnv("NEON_ROLE_NAME");

const project = await resolveProject();
const branch = await resolveBranch(project);
const database = await resolveDatabase(project.id, branch.id);
const role = await resolveRole(project.id, branch.id, database.name);
const pooledUri = await getConnectionUri(
  project.id,
  branch.id,
  database.name,
  role.name,
  true,
);
const directUri = await getConnectionUri(
  project.id,
  branch.id,
  database.name,
  role.name,
  false,
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

async function resolveProject() {
  if (configuredProjectId) {
    const data = await neon(`/projects/${configuredProjectId}`);
    return data.project || data;
  }

  const projects = await listProjects();
  const matches = [];
  for (const candidateProject of projects) {
    const branches = await listBranches(candidateProject.id);
    const bestBranch = bestBranchMatch(branches);
    if (bestBranch) {
      matches.push({
        project: candidateProject,
        branch: bestBranch.branch,
        score: bestBranch.score,
      });
    }
  }

  const bestScore = Math.max(...matches.map((match) => match.score), 0);
  const bestMatches = matches.filter((match) => match.score === bestScore);
  if (bestMatches.length === 1) {
    return bestMatches[0].project;
  }

  if (bestMatches.length > 1) {
    throw new Error(
      [
        `Neon branch discovery is ambiguous for ${previewGitBranch}.`,
        "Set NEON_PROJECT_ID in GitHub variables to choose the project.",
        ...bestMatches.map(
          (match) =>
            `- ${match.project.name || match.project.id}: ${match.branch.name || match.branch.id}`,
        ),
      ].join("\n"),
    );
  }

  throw new Error(
    `No Neon project has a branch matching ${previewGitBranch}. Set NEON_PROJECT_ID and NEON_BRANCH_ID in GitHub variables if this preview branch uses a custom Neon branch name.`,
  );
}

async function resolveBranch(project) {
  const branches = await listBranches(project.id);
  if (configuredBranchId) {
    const branch = branches.find(
      (candidate) => candidate.id === configuredBranchId,
    );
    if (!branch) {
      throw new Error(
        `NEON_BRANCH_ID ${configuredBranchId} was not found in Neon project ${project.name || project.id}.`,
      );
    }
    return branch;
  }

  const bestMatch = bestBranchMatch(branches);
  if (!bestMatch) {
    throw new Error(
      `No Neon branch in project ${project.name || project.id} matches ${previewGitBranch}. Set NEON_BRANCH_ID in GitHub variables if the preview database uses a custom branch name.`,
    );
  }

  const ties = branches
    .map((branch) => ({ branch, score: scoreBranch(branch) }))
    .filter((match) => match.score === bestMatch.score);
  if (ties.length > 1) {
    throw new Error(
      [
        `Neon branch discovery is ambiguous for ${previewGitBranch} in project ${project.name || project.id}.`,
        "Set NEON_BRANCH_ID in GitHub variables to choose the branch.",
        ...ties.map((match) => `- ${match.branch.name || match.branch.id}`),
      ].join("\n"),
    );
  }

  return bestMatch.branch;
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
  const data = await neon("/projects", { limit: "100" });
  const projects = data.projects || [];
  if (projects.length === 0) {
    throw new Error("NEON_API_KEY can access zero Neon projects.");
  }
  return projects;
}

async function listBranches(projectId) {
  const data = await neon(`/projects/${projectId}/branches`, { limit: "100" });
  return data.branches || [];
}

function bestBranchMatch(branches) {
  const matches = branches
    .map((branch) => ({ branch, score: scoreBranch(branch) }))
    .filter((match) => match.score > 0)
    .sort((left, right) => right.score - left.score);
  return matches[0];
}

function scoreBranch(branch) {
  const name = String(branch.name || "");
  const normalizedName = normalizeBranchName(name);
  const normalizedPreview = normalizeBranchName(previewGitBranch);

  if (name === previewGitBranch) return 100;
  if (normalizedName === normalizedPreview) return 90;
  if (name.endsWith(`/${previewGitBranch}`)) return 85;
  if (normalizedName.endsWith(`-${normalizedPreview}`)) return 80;
  return 0;
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

function normalizeBranchName(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "");
}
