import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  getGitLinkProblem,
  getProjectPatch,
  getVercelAppByUrl,
  VERCEL_APP_PROJECTS,
} from "./vercel-app-projects.mjs";
import {
  getMissingVercelAppEnvironmentVariables,
  validateVercelAppEnvironment,
  VERCEL_APP_ENV_REQUIREMENTS,
} from "./vercel-app-env.mjs";
import {
  getVercelAppBuildMatches,
  loadWorkspacePackages,
  shouldAutoBuildPreview,
} from "./vercel-app-build-scope.mjs";

const ciWorkflow = readFileSync(
  new URL("../workflows/ci.yml", import.meta.url),
  "utf8",
);

test("declares one Vercel project for every deployed app", () => {
  assert.deepEqual(
    VERCEL_APP_PROJECTS.map(({ appName, projectName, rootDirectory }) => ({
      appName,
      projectName,
      rootDirectory,
    })),
    [
      {
        appName: "optimitron",
        projectName: "optimitron-web",
        rootDirectory: "apps/optimitron",
      },
      {
        appName: "warondisease",
        projectName: "warondisease",
        rootDirectory: "apps/warondisease",
      },
      { appName: "dfda", projectName: "dfda", rootDirectory: "apps/dfda" },
      {
        appName: "wishocracy",
        projectName: "wishocracy",
        rootDirectory: "apps/wishocracy",
      },
      {
        appName: "trialabundancesurvey",
        projectName: "trialabundancesurvey",
        rootDirectory: "apps/trialabundancesurvey",
      },
      {
        appName: "curedao",
        projectName: "curedao",
        rootDirectory: "apps/curedao",
      },
      {
        appName: "acceleratedmedicine",
        projectName: "acceleratedmedicine",
        rootDirectory: "apps/acceleratedmedicine",
      },
      {
        appName: "courtofhumanity",
        projectName: "courtofhumanity",
        rootDirectory: "apps/courtofhumanity",
      },
    ],
  );

  for (const project of VERCEL_APP_PROJECTS) {
    const packageJson = JSON.parse(
      readFileSync(
        new URL(`../../${project.rootDirectory}/package.json`, import.meta.url),
      ),
    );
    const vercelJson = JSON.parse(
      readFileSync(
        new URL(`../../${project.rootDirectory}/vercel.json`, import.meta.url),
      ),
    );
    assert.ok(
      packageJson.name,
      `${project.rootDirectory} needs a package name`,
    );
    assert.ok(
      vercelJson.buildCommand,
      `${project.rootDirectory} needs a Vercel build command`,
    );
    assert.match(
      vercelJson.buildCommand,
      new RegExp(
        `^node \.\.\/\.\.\/\.github\/scripts\/vercel-app-env\.mjs ${project.appName} &&`,
        "u",
      ),
      `${project.rootDirectory} must validate its deployment environment before the build`,
    );
    assert.equal(
      vercelJson.ignoreCommand,
      `node ../../.github/scripts/vercel-ignore-build.mjs ${project.appName}`,
    );
  }
});

test("declares environment requirements for every Vercel app", () => {
  assert.deepEqual(
    Object.keys(VERCEL_APP_ENV_REQUIREMENTS).sort(),
    VERCEL_APP_PROJECTS.map(({ appName }) => appName).sort(),
  );
});

test("reports all missing variables without exposing values", () => {
  const environment = {
    VERCEL_ENV: "production",
    DATABASE_URL: "postgresql://example",
    NEXTAUTH_SECRET: "secret",
    RESEND_API_KEY: "resend",
    RIGHT_TO_TRY_RATE_LIMIT_SECRET: "rate-limit-secret",
  };
  assert.deepEqual(
    getMissingVercelAppEnvironmentVariables("acceleratedmedicine", environment),
    ["NEXTAUTH_URL", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
  );
  assert.throws(
    () => validateVercelAppEnvironment("acceleratedmedicine", environment),
    (error) =>
      error.message.includes("GOOGLE_CLIENT_ID") &&
      !error.message.includes("postgresql://example") &&
      !error.message.includes("rate-limit-secret"),
  );
});

test("requires provider credentials and the canonical auth URL only in production", () => {
  const previewEnvironment = {
    VERCEL_ENV: "preview",
    DATABASE_URL: "postgresql://example",
    NEXTAUTH_SECRET: "secret",
  };
  assert.deepEqual(
    getMissingVercelAppEnvironmentVariables(
      "trialabundancesurvey",
      previewEnvironment,
    ),
    [],
  );
  assert.deepEqual(
    getMissingVercelAppEnvironmentVariables("trialabundancesurvey", {
      ...previewEnvironment,
      VERCEL_ENV: "production",
    }),
    [
      "NEXTAUTH_URL",
      "RESEND_API_KEY",
      "GOOGLE_CLIENT_ID",
      "GOOGLE_CLIENT_SECRET",
    ],
  );
});

test("names the app when asked about one it does not manage", () => {
  // The Vercel build command passes the app name as a string argument, so a
  // typo there surfaces here. Failing with the offending name is what makes
  // that diagnosable from a build log.
  assert.throws(
    () =>
      getMissingVercelAppEnvironmentVariables("warondiseas", {
        VERCEL_ENV: "production",
      }),
    (error) => error.message.includes("warondiseas"),
  );
});

test("allows an app with no required environment variables", () => {
  assert.deepEqual(
    getMissingVercelAppEnvironmentVariables("curedao", {
      VERCEL_ENV: "production",
    }),
    [],
  );
});

test("classifies custom domains and Vercel deployment URLs", () => {
  assert.equal(getVercelAppByUrl("https://www.dfda.earth/")?.appName, "dfda");
  assert.equal(
    getVercelAppByUrl(
      "https://trialabundancesurvey-git-main-mike-p-sinns-projects.vercel.app",
    )?.appName,
    "trialabundancesurvey",
  );
  assert.equal(
    getVercelAppByUrl(
      "https://optimitron-4f333a319-mike-p-sinns-projects.vercel.app",
    )?.appName,
    "optimitron",
  );
  assert.equal(getVercelAppByUrl("https://dih-earth.vercel.app"), undefined);
});

test("creates Git previews only for auto-build or explicit preview branches", () => {
  for (const project of VERCEL_APP_PROJECTS) {
    const vercelJson = JSON.parse(
      readFileSync(
        new URL(`../../${project.rootDirectory}/vercel.json`, import.meta.url),
      ),
    );
    const autoBuilds = shouldAutoBuildPreview(project.appName, {
      VERCEL_ENV: "preview",
    }).build;
    if (autoBuilds) {
      assert.equal(vercelJson.git.deploymentEnabled["gh-pages"], false);
      assert.equal(
        "*" in vercelJson.git.deploymentEnabled,
        false,
        `${project.appName} must allow affected pull-request previews`,
      );
      continue;
    }
    assert.deepEqual(vercelJson.git.deploymentEnabled, {
      main: true,
      [`feature/preview-${project.appName}-*`]: true,
      "feature/preview-all-*": true,
      "**": false,
    });
    assert.equal(
      "*" in vercelJson.git.deploymentEnabled,
      false,
      `${project.appName} must use a globstar fallback for feature/* branches`,
    );
  }
});

test("validates every shared package used by the peer site apps", () => {
  const workspacePackages = loadWorkspacePackages();
  const packageFiles = [...workspacePackages.values()]
    .filter(({ directory }) => directory.startsWith("packages/"))
    .map(({ directory }) => `${directory}/package.json`);
  const requiredDirectories = new Set();

  for (const { appName } of VERCEL_APP_PROJECTS) {
    if (appName === "optimitron") continue;
    for (const file of getVercelAppBuildMatches(
      appName,
      packageFiles,
      workspacePackages,
    )) {
      requiredDirectories.add(file.replace(/\/package\.json$/u, ""));
    }
  }

  for (const directory of requiredDirectories) {
    assert.match(
      ciWorkflow,
      new RegExp(`- '${directory.replaceAll("/", "\\/")}\\/\\*\\*'`, "u"),
      `${directory} must trigger peer app validation`,
    );
  }
});

test("repairs only deployment settings that drift", () => {
  const desired = VERCEL_APP_PROJECTS[1];
  assert.deepEqual(
    getProjectPatch(
      {
        enableAffectedProjectsDeployments: false,
        buildCommand: "cd ../.. && pnpm --filter @apps/warondisease run build",
        commandForIgnoringBuildStep:
          "node ../../.github/scripts/vercel-ignore-build.mjs warondisease",
        framework: "nextjs",
        installCommand: "cd ../.. && pnpm install --frozen-lockfile",
        nodeVersion: "20.x",
        productionDeploymentsFastLane: false,
        resourceConfig: {
          buildMachineSelection: "auto",
          buildMachineType: "turbo",
          elasticConcurrencyEnabled: true,
        },
        rootDirectory: desired.rootDirectory,
        sourceFilesOutsideRootDirectory: false,
      },
      desired,
    ),
    {
      buildCommand: null,
      commandForIgnoringBuildStep: null,
      enableAffectedProjectsDeployments: true,
      installCommand: null,
      nodeVersion: "24.x",
      productionDeploymentsFastLane: true,
      resourceConfig: {
        buildMachineSelection: "fixed",
        buildMachineType: "standard",
        elasticConcurrencyEnabled: false,
      },
      sourceFilesOutsideRootDirectory: true,
    },
  );

  assert.deepEqual(
    getProjectPatch(
      {
        settings: {
          enableAffectedProjectsDeployments: true,
          framework: "nextjs",
          nodeVersion: "24.x",
          productionDeploymentsFastLane: true,
          resourceConfig: {
            buildMachineSelection: "fixed",
            buildMachineType: "standard",
            elasticConcurrencyEnabled: false,
          },
          rootDirectory: desired.rootDirectory,
          sourceFilesOutsideRootDirectory: true,
        },
      },
      desired,
    ),
    {},
  );
});

test("clears only command overrides replaced by the app config", () => {
  const desired = VERCEL_APP_PROJECTS[0];
  assert.deepEqual(desired.projectCommandOverrides, [
    "buildCommand",
    "commandForIgnoringBuildStep",
  ]);
  assert.deepEqual(
    getProjectPatch(
      {
        buildCommand: "pnpm run build:vercel",
        commandForIgnoringBuildStep: "git diff HEAD^ HEAD --quiet",
        installCommand: "pnpm install --frozen-lockfile",
        settings: {
          enableAffectedProjectsDeployments: true,
          framework: "nextjs",
          nodeVersion: "24.x",
          productionDeploymentsFastLane: true,
          resourceConfig: {
            buildMachineSelection: "fixed",
            buildMachineType: "standard",
            elasticConcurrencyEnabled: false,
          },
          rootDirectory: desired.rootDirectory,
          sourceFilesOutsideRootDirectory: true,
        },
      },
      desired,
    ),
    {
      buildCommand: null,
      commandForIgnoringBuildStep: null,
    },
  );
});

test("requires the expected GitHub repository link", () => {
  assert.equal(
    getGitLinkProblem({
      link: { type: "github", org: "mikepsinn", repo: "optimitron" },
    }),
    undefined,
  );
  assert.match(
    getGitLinkProblem({
      link: { type: "github", org: "other", repo: "optimitron" },
    }),
    /not linked/u,
  );
});
