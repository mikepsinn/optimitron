#!/usr/bin/env node

import { appendFile, writeFile } from "node:fs/promises";
import {
  getVercelAppByUrl,
  VERCEL_APP_PROJECTS,
} from "./vercel-app-projects.mjs";

const ATTEMPTS = 3;
const REQUEST_TIMEOUT_MS = 10_000;
const ERROR_MARKERS = [
  "Application error",
  "Internal Server Error",
  "FUNCTION_INVOCATION_FAILED",
  "MIDDLEWARE_INVOCATION_FAILED",
  "This deployment is protected",
  "Vercel Authentication",
  "PrismaClientKnownRequestError",
];

async function main() {
  const appName = requiredEnvironmentVariable("VERCEL_APP");
  const targetUrl = requiredEnvironmentVariable("SITE_APP_URL");
  const app = VERCEL_APP_PROJECTS.find(
    (candidate) => candidate.appName === appName,
  );
  if (!app) throw new Error(`Unknown Vercel app: ${appName}`);
  const classified = getVercelAppByUrl(targetUrl);
  if (classified && classified.appName !== appName) {
    throw new Error(
      `${targetUrl} belongs to ${classified.appName}, not ${appName}.`,
    );
  }

  const startedAt = Date.now();
  const routes = [];
  for (const routePath of app.smokePaths) {
    routes.push(await smokeRoute(targetUrl, routePath));
  }
  const failures = routes.filter(({ ok }) => !ok);
  const result = {
    success: failures.length === 0,
    environment: process.env.DEPLOYMENT_ENVIRONMENT || "Preview",
    targetUrl,
    targetUrls: [targetUrl],
    durationMs: Date.now() - startedAt,
    routes,
    failures,
  };
  await writeResult(result);
  await writeSummary(appName, result);

  for (const route of routes) {
    console.log(
      `${route.ok ? "PASS" : "FAIL"} ${route.url} ${route.status ? `HTTP ${route.status}` : "no response"}`,
    );
  }
  if (failures.length > 0) process.exitCode = 1;
}

async function smokeRoute(baseUrl, routePath) {
  const url = new URL(routePath, baseUrl).toString();
  const attempts = [];
  for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
    const current = await fetchRoute(url);
    attempts.push(current);
    if (current.ok) {
      return { ...current, path: routePath, url, attempts };
    }
    if (attempt < ATTEMPTS) await sleep(attempt * 2_000);
  }
  return { ...attempts.at(-1), path: routePath, url, attempts };
}

async function fetchRoute(url) {
  const startedAt = Date.now();
  const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim();
  try {
    const response = await fetch(url, {
      redirect: "follow",
      headers: bypassSecret
        ? {
            "x-vercel-protection-bypass": bypassSecret,
            "x-vercel-set-bypass-cookie": "true",
          }
        : undefined,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const body = await response.text();
    const matchedErrorMarker = ERROR_MARKERS.find((marker) =>
      body.includes(marker),
    );
    const ok = response.ok && !matchedErrorMarker;
    return {
      ok,
      status: response.status,
      durationMs: Date.now() - startedAt,
      error: ok
        ? undefined
        : matchedErrorMarker
          ? `Response contained ${matchedErrorMarker}`
          : `Received HTTP ${response.status}`,
      matchedErrorMarker,
    };
  } catch (error) {
    return {
      ok: false,
      status: undefined,
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
      matchedErrorMarker: undefined,
    };
  }
}

async function writeResult(result) {
  const resultFile = process.env.SMOKE_DEPLOY_RESULT_FILE?.trim();
  if (resultFile)
    await writeFile(resultFile, `${JSON.stringify(result, null, 2)}\n`);
}

async function writeSummary(appName, result) {
  const summaryFile = process.env.GITHUB_STEP_SUMMARY?.trim();
  if (!summaryFile) return;
  const lines = [
    `## ${appName} deployment smoke`,
    "",
    `Target: ${result.targetUrl}`,
    "",
    "| Route | Result |",
    "| --- | --- |",
    ...result.routes.map(
      (route) => `| \`${route.path}\` | ${route.ok ? "PASS" : route.error} |`,
    ),
    "",
  ];
  await appendFile(summaryFile, lines.join("\n"));
}

function requiredEnvironmentVariable(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
