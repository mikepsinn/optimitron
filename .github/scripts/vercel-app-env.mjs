#!/usr/bin/env node

import { pathToFileURL } from "node:url";

const AUTH_ENVIRONMENT_VARIABLES = Object.freeze([
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
]);

const AUTH_PRODUCTION_ENVIRONMENT_VARIABLES = Object.freeze([
  "NEXTAUTH_URL",
  "RESEND_API_KEY",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
]);

function requirements(required = [], requiredInProduction = []) {
  return Object.freeze({
    required: Object.freeze([...required]),
    requiredInProduction: Object.freeze([...requiredInProduction]),
  });
}

function authRequirements(requiredInProduction = []) {
  return requirements(AUTH_ENVIRONMENT_VARIABLES, [
    ...AUTH_PRODUCTION_ENVIRONMENT_VARIABLES,
    ...requiredInProduction,
  ]);
}

export const VERCEL_APP_ENV_REQUIREMENTS = Object.freeze({
  optimitron: authRequirements(["CRON_SECRET"]),
  warondisease: authRequirements(["CRON_SECRET"]),
  dfda: authRequirements(["GOOGLE_GENERATIVE_AI_API_KEY"]),
  wishocracy: authRequirements(),
  trialabundancesurvey: authRequirements(),
  curedao: requirements(),
  acceleratedmedicine: authRequirements(["RIGHT_TO_TRY_RATE_LIMIT_SECRET"]),
  courtofhumanity: authRequirements(),
});

export function getMissingVercelAppEnvironmentVariables(
  appName,
  environment = process.env,
) {
  const appRequirements = VERCEL_APP_ENV_REQUIREMENTS[appName];
  if (!appRequirements) {
    throw new Error(`Unknown Vercel app: ${appName}`);
  }

  const names = [
    ...appRequirements.required,
    ...(environment.VERCEL_ENV === "production"
      ? appRequirements.requiredInProduction
      : []),
  ];
  return names.filter((name) => !environment[name]?.trim());
}

export function validateVercelAppEnvironment(
  appName,
  environment = process.env,
) {
  const missing = getMissingVercelAppEnvironmentVariables(appName, environment);
  if (missing.length > 0) {
    const target = environment.VERCEL_ENV?.trim() || "deployment";
    throw new Error(
      `${appName} cannot build for ${target}. Missing required environment variables: ${missing.join(", ")}`,
    );
  }
  console.log(`${appName}: required deployment environment variables are set.`);
}

function main() {
  const appName = process.argv[2];
  if (!appName) {
    throw new Error("Usage: vercel-app-env.mjs <app-name>");
  }
  validateVercelAppEnvironment(appName);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
