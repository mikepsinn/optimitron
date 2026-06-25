#!/usr/bin/env node

import { appendFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const ATTEMPTS = 3;
const BACKOFF_MS = 5000;
const REQUEST_TIMEOUT_MS = Number(
  process.env.SMOKE_DEPLOY_REQUEST_TIMEOUT_MS ?? 5000,
);
const DEMO_LOGIN_PATH = "/api/dev/login-as-demo?next=%2Fdashboard";
const DEMO_LOGIN_ROUTE = {
  path: DEMO_LOGIN_PATH,
  source: "preview demo user managed-data seed",
};
const NEXT_AUTH_COOKIE_NAMES = [
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
];

// Route paths mirror ROUTES in packages/web/src/lib/routes.ts. Expected h1s
// use route metadata where the nav label is the page heading; otherwise they
// use the existing page/component h1 text.
const ROUTES_TO_SMOKE = [
  {
    path: "/",
    expectedH1: "PLEASE TAKE 30 SECONDS TO END WAR AND DISEASE",
    expectedH1ByHost: {
      "optimitron.com": "Play the Earth Optimization Game!",
      "www.optimitron.com": "Play the Earth Optimization Game!",
    },
    source: "warondisease landing action heading",
  },
  {
    path: "/treaty",
    expectedH1: "Please quickly skim and sign to end war and disease.",
    source: "treaty page heading",
  },
  {
    path: "/plaintiffs",
    expectedH1: "Register plaintiffs for Humanity v Government.",
    source: "plaintiffs page heading",
  },
  {
    path: "/tasks",
    expectedH1: "Earth Optimization Tasks",
    source: "tasksLink label",
  },
  {
    path: "/humanity-v-government",
    expectedH1: "Humanity v. Governments of Earth",
    source: "humanityVGovernmentLink label",
  },
  {
    path: "/legislation",
    expectedH1: "Drafted bills built from the analysis, not vibes",
    source: "legislation page heading",
  },
  {
    path: "/employees",
    expectedH1: "President Management System",
    source: "employees page heading",
  },
  {
    path: "/court",
    // /court renders via ReferendumStepperPage, whose primary heading
    // is the referendum's `question` field from the DB (canonical text
    // in packages/data/src/referendums/court-of-humanity.ts). The page
    // title "Court of Humanity" is metadata, not a body heading.
    expectedH1:
      "If a government kills, injures, or harms you or your family, should you have the same right to sue it that you would have if a corporation did the same?",
    source: "court-of-humanity referendum question",
  },
  {
    path: "/people",
    expectedH1: "Find the human who should do something.",
    source: "people page heading",
  },
];

const ERROR_MARKERS = [
  "Something went wrong",
  "Something went wrong!",
  "Something went wrong. Please try again.",
  "Application error",
  "Application error: a client-side exception has occurred",
  "Application error: a server-side exception has occurred",
  "client-side exception",
  "server-side exception",
  "An error occurred",
  "An error occurred in the Server Components render",
  "Internal Server Error",
  "500: INTERNAL_SERVER_ERROR",
  "Unhandled Runtime Error",
  "Runtime Error",
  "Minified React error #",
  "Hydration failed because the server rendered HTML didn't match the client",
  "There was an error while hydrating",
  "A tree hydrated but some attributes of the server rendered HTML didn't match",
  "Switched to client rendering because the server rendering errored",
  // "404: This page could not be found" is the specific Next.js 404
  // title. Do NOT add bare "Page Not Found" — Next.js App Router
  // bundles the 404 page's text inline in the RSC payload script of
  // EVERY successful page (so client-side navigation can render 404s
  // without a round trip), which would false-positive on every route.
  "404: This page could not be found",
  "This Serverless Function has crashed",
  "FUNCTION_INVOCATION_FAILED",
  "EDGE_FUNCTION_INVOCATION_FAILED",
  "MIDDLEWARE_INVOCATION_FAILED",
  "NO_RESPONSE_FROM_FUNCTION",
  "DEPLOYMENT_NOT_FOUND",
  "This deployment is protected",
  "Vercel Authentication",
  "Authentication Required",
  "PrismaClient",
  "PrismaClientKnownRequestError",
  "not found in DB. Managed-data sync should have created it",
];

async function main() {
  const startedAt = new Date();
  const targets = resolveTargets();
  const environment = targets[0]?.environment ?? "Production";
  const targetUrl = formatTargetUrls(targets);
  const bypassSecret = (
    process.env.VERCEL_AUTOMATION_BYPASS_SECRET ?? ""
  ).trim();

  if (environment === "Preview" && !bypassSecret) {
    // Fail loud. The previous skip-with-warning was an escape hatch
    // that silently masked smoke for ~24 hours because the secret
    // wasn't set. The secret is retrievable in one curl + jq +
    // gh CLI command; missing-secret is an operator config bug,
    // not an acceptable runtime state. See
    // memory/feedback_default_opinionated_no_escape_hatches.md.
    console.error(
      "[smoke-deploy] FAIL: VERCEL_AUTOMATION_BYPASS_SECRET is not set in the GitHub Preview environment.",
    );
    console.error("[smoke-deploy] Retrieve and set in one command:");
    console.error(
      '[smoke-deploy]   curl -H "Authorization: Bearer $VERCEL_TOKEN" \\',
    );
    console.error(
      '[smoke-deploy]     "https://api.vercel.com/v9/projects/$VERCEL_PROJECT_ID?teamId=$VERCEL_ORG_ID" \\',
    );
    console.error(
      "[smoke-deploy]     | jq -r '.protectionBypass | keys[0]' \\",
    );
    console.error(
      "[smoke-deploy]     | gh secret set VERCEL_AUTOMATION_BYPASS_SECRET --env Preview",
    );
    // Write a failure summary so the downstream "Comment on preview
    // failure" / "Post production failure to Slack" steps in
    // smoke-deploy.yml can still read SMOKE_DEPLOY_RESULT_FILE and
    // format their messages. Without this, those steps crash with
    // ENOENT and the PR comment never lands.
    const failureSummary = {
      success: false,
      skipped: false,
      reason: "VERCEL_AUTOMATION_BYPASS_SECRET not configured",
      environment,
      targetUrl,
      targetUrls: targets.map((target) => target.baseUrl.href),
      startedAt: startedAt.toISOString(),
      durationMs: 0,
      routes: [],
      failures: [
        {
          path: "(setup)",
          targetUrl,
          status: null,
          error:
            'VERCEL_AUTOMATION_BYPASS_SECRET missing from GitHub Preview environment. Run: curl -H "Authorization: Bearer $VERCEL_TOKEN" "https://api.vercel.com/v9/projects/$VERCEL_PROJECT_ID?teamId=$VERCEL_ORG_ID" | jq -r \'.protectionBypass | keys[0]\' | gh secret set VERCEL_AUTOMATION_BYPASS_SECRET --env Preview',
          matchedErrorMarker: null,
        },
      ],
    };
    await writeResult(failureSummary);
    await writeStepSummary(failureSummary);
    process.exit(1);
  }

  for (const target of targets) {
    console.log(
      `Smoke testing ${target.environment} deployment ${target.baseUrl.href}`,
    );
  }

  const pageResults = await Promise.all(
    targets.flatMap((target) =>
      ROUTES_TO_SMOKE.map((route) =>
        smokeRoute({ route, target, bypassSecret }),
      ),
    ),
  );
  const demoLoginResults =
    environment === "Preview"
      ? await Promise.all(
          targets.map((target) => smokeDemoLogin({ target, bypassSecret })),
        )
      : [];
  const routeResults = [...pageResults, ...demoLoginResults];
  const durationMs = Date.now() - startedAt.getTime();
  const failures = routeResults.filter((result) => !result.ok);
  const summary = {
    success: failures.length === 0,
    environment,
    targetUrl,
    targetUrls: targets.map((target) => target.baseUrl.href),
    startedAt: startedAt.toISOString(),
    durationMs,
    routes: routeResults,
    failures,
  };

  await writeResult(summary);
  await writeStepSummary(summary);

  for (const result of routeResults) {
    const label = result.ok ? "PASS" : "FAIL";
    const status = result.status ? `HTTP ${result.status}` : "no response";
    console.log(
      `${label} ${formatResultTarget(result)}${result.path} ${status} ${result.durationMs}ms after ${result.attempts.length} attempt(s)`,
    );
  }

  if (failures.length > 0) {
    console.error(
      `Deploy smoke failed for ${failures.length} of ${routeResults.length} route check(s).`,
    );
    process.exitCode = 1;
    return;
  }

  console.log(
    `Deploy smoke passed for ${routeResults.length} route check(s) in ${durationMs}ms.`,
  );
}

async function smokeDemoLogin({ target, bypassSecret }) {
  const url = new URL(DEMO_LOGIN_PATH, target.baseUrl);
  const attempts = [];
  const startedAt = Date.now();

  for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
    const attemptResult = await fetchAndAssertDemoLogin({
      url,
      bypassSecret,
      attempt,
    });
    attempts.push(attemptResult);

    if (attemptResult.ok) {
      return summarizeRouteResult({
        route: DEMO_LOGIN_ROUTE,
        target,
        url,
        expectedH1: "",
        startedAt,
        attempts,
        finalAttempt: attemptResult,
      });
    }

    if (attempt < ATTEMPTS) {
      await sleep(BACKOFF_MS);
    }
  }

  return summarizeRouteResult({
    route: DEMO_LOGIN_ROUTE,
    target,
    url,
    expectedH1: "",
    startedAt,
    attempts,
    finalAttempt: attempts.at(-1),
  });
}

async function fetchAndAssertDemoLogin({ url, bypassSecret, attempt }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const attemptStartedAt = Date.now();
  const headers = {
    accept: "text/plain,*/*",
    "user-agent": "optimitron-deploy-smoke/1.0",
  };

  if (bypassSecret) {
    headers["x-vercel-protection-bypass"] = bypassSecret;
  }

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers,
      redirect: "manual",
      signal: controller.signal,
    });
    const body = await response.text();
    const evaluation = evaluateDemoLoginSmokeResponse({
      status: response.status,
      location: response.headers.get("location") ?? "",
      setCookie: response.headers.get("set-cookie") ?? "",
      body,
    });

    return {
      ok: evaluation.ok,
      attempt,
      durationMs: Date.now() - attemptStartedAt,
      status: response.status,
      finalUrl: response.url,
      expectedH1: "",
      h1Texts: [],
      missingExpectedH1: false,
      matchedErrorMarker: evaluation.matchedErrorMarker,
      error: evaluation.error,
    };
  } catch (error) {
    return {
      ok: false,
      attempt,
      durationMs: Date.now() - attemptStartedAt,
      status: null,
      finalUrl: url.href,
      expectedH1: "",
      h1Texts: [],
      missingExpectedH1: false,
      matchedErrorMarker: null,
      error: formatFetchError(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

export function evaluateDemoLoginSmokeResponse({
  status,
  location,
  setCookie,
  body,
}) {
  const matchedErrorMarker = findErrorMarker(body ?? "");
  const statusOk = Number(status) >= 300 && Number(status) < 400;
  const locationPath = getLocationPathname(location);
  const locationOk = locationPath === "/dashboard";
  const cookieHeader = String(setCookie ?? "");
  const cookieOk = NEXT_AUTH_COOKIE_NAMES.some(
    (cookieName) =>
      cookieHeader.includes(`${cookieName}=`) ||
      cookieHeader.includes(`${cookieName}.0=`),
  );
  const ok = statusOk && locationOk && cookieOk && !matchedErrorMarker;

  if (ok) {
    return { ok: true, matchedErrorMarker: null, error: null };
  }

  const reasons = [];
  if (!statusOk) {
    reasons.push(`expected HTTP redirect 300-399, got ${status ?? "none"}`);
  }
  if (matchedErrorMarker) {
    reasons.push(`matched error marker "${matchedErrorMarker}"`);
  }
  if (!locationOk) {
    reasons.push(
      `expected redirect location /dashboard, got ${location || "none"}`,
    );
  }
  if (!cookieOk) {
    reasons.push("missing NextAuth session cookie");
  }

  return {
    ok: false,
    matchedErrorMarker,
    error: reasons.join("; "),
  };
}

function getLocationPathname(location) {
  if (!location) {
    return "";
  }

  try {
    return new URL(location, "https://preview-smoke.local").pathname;
  } catch {
    return "";
  }
}

async function smokeRoute({ route, target, bypassSecret }) {
  const url = new URL(route.path, target.baseUrl);
  const expectedH1 = resolveExpectedH1(route, target.baseUrl.hostname);
  const attempts = [];
  const startedAt = Date.now();

  for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
    const attemptResult = await fetchAndAssert({
      route,
      url,
      expectedH1,
      bypassSecret,
      attempt,
    });
    attempts.push(attemptResult);

    if (attemptResult.ok) {
      return summarizeRouteResult({
        route,
        target,
        url,
        expectedH1,
        startedAt,
        attempts,
        finalAttempt: attemptResult,
      });
    }

    if (attempt < ATTEMPTS) {
      await sleep(BACKOFF_MS);
    }
  }

  return summarizeRouteResult({
    route,
    target,
    url,
    expectedH1,
    startedAt,
    attempts,
    finalAttempt: attempts.at(-1),
  });
}

async function fetchAndAssert({
  route,
  url,
  expectedH1,
  bypassSecret,
  attempt,
}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const attemptStartedAt = Date.now();
  const headers = {
    accept: "text/html,application/xhtml+xml",
    "user-agent": "optimitron-deploy-smoke/1.0",
  };

  if (bypassSecret) {
    headers["x-vercel-protection-bypass"] = bypassSecret;
  }

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers,
      redirect: "follow",
      signal: controller.signal,
    });
    const body = await response.text();
    const h1Texts = extractH1Texts(body);
    const matchedErrorMarker = findErrorMarker(body);
    const normalizedExpectedH1 = normalizeText(expectedH1);
    const hasExpectedH1 = h1Texts.some(
      (text) => normalizeText(text) === normalizedExpectedH1,
    );
    const statusOk = response.status === 200;
    const ok = statusOk && !matchedErrorMarker && hasExpectedH1;

    return {
      ok,
      attempt,
      durationMs: Date.now() - attemptStartedAt,
      status: response.status,
      finalUrl: response.url,
      expectedH1: route.expectedH1,
      h1Texts,
      missingExpectedH1: !hasExpectedH1,
      matchedErrorMarker,
      error: ok
        ? null
        : describeFailure({
            status: response.status,
            statusOk,
            matchedErrorMarker,
            hasExpectedH1,
            expectedH1: route.expectedH1,
            h1Texts,
          }),
    };
  } catch (error) {
    return {
      ok: false,
      attempt,
      durationMs: Date.now() - attemptStartedAt,
      status: null,
      finalUrl: url.href,
      expectedH1: route.expectedH1,
      h1Texts: [],
      missingExpectedH1: true,
      matchedErrorMarker: null,
      error: formatFetchError(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function summarizeRouteResult({
  route,
  target,
  url,
  expectedH1,
  startedAt,
  attempts,
  finalAttempt,
}) {
  return {
    path: route.path,
    targetUrl: target.baseUrl.href,
    url: url.href,
    source: route.source,
    ok: Boolean(finalAttempt?.ok),
    status: finalAttempt?.status ?? null,
    finalUrl: finalAttempt?.finalUrl ?? url.href,
    expectedH1,
    h1Texts: finalAttempt?.h1Texts ?? [],
    missingExpectedH1: finalAttempt?.missingExpectedH1 ?? true,
    matchedErrorMarker: finalAttempt?.matchedErrorMarker ?? null,
    error: finalAttempt?.error ?? "No attempt result recorded.",
    durationMs: Date.now() - startedAt,
    attempts,
  };
}

function resolveExpectedH1(route, hostname) {
  return (
    route.expectedH1ByHost?.[String(hostname).toLowerCase()] ?? route.expectedH1
  );
}

function resolveTargets() {
  const previewUrl = (process.env.PREVIEW_URL ?? "").trim();
  const prodUrl = (process.env.PROD_URL ?? "").trim();
  const prodUrls = (process.env.PROD_URLS ?? "").trim();
  const prodTargetValue = prodUrls || prodUrl;

  if (previewUrl && prodTargetValue) {
    throw new Error("Set PREVIEW_URL or PROD_URL/PROD_URLS, not both.");
  }

  if (!previewUrl && !prodTargetValue) {
    throw new Error(
      "Set PREVIEW_URL, PROD_URL, or PROD_URLS before running deploy smoke.",
    );
  }

  const environment = previewUrl ? "Preview" : "Production";
  const rawUrls = previewUrl ? [previewUrl] : parseTargetUrls(prodTargetValue);
  if (rawUrls.length === 0) {
    throw new Error(`${environment} URL list did not contain any URLs.`);
  }

  return rawUrls.map((rawUrl) => ({
    environment,
    baseUrl: normalizeTargetUrl(rawUrl, environment),
  }));
}

function parseTargetUrls(value) {
  return String(value)
    .split(/[,\s]+/u)
    .map((url) => url.trim())
    .filter(Boolean);
}

function normalizeTargetUrl(rawUrl, environment) {
  let baseUrl;
  try {
    baseUrl = new URL(rawUrl);
  } catch {
    throw new Error(`${environment} URL is not a valid URL: ${rawUrl}`);
  }

  if (baseUrl.protocol !== "http:" && baseUrl.protocol !== "https:") {
    throw new Error(`${environment} URL must start with http:// or https://.`);
  }

  if (!baseUrl.pathname.endsWith("/")) {
    baseUrl.pathname = `${baseUrl.pathname}/`;
  }

  return baseUrl;
}

function formatTargetUrls(targets) {
  return targets.map((target) => target.baseUrl.href).join(", ");
}

function formatResultTarget(result) {
  if (!result.targetUrl) {
    return "";
  }

  try {
    return `${new URL(result.targetUrl).hostname} `;
  } catch {
    return `${result.targetUrl} `;
  }
}

function extractH1Texts(html) {
  // Match any top-level heading (h1-h6), not just h1. Several pages
  // use h2 as the primary heading (e.g. /treaty's "Please quickly
  // skim..."). Smoke verifies the expected text appears as a
  // heading, not specifically at level 1; semantic-heading-level
  // is a separate a11y concern.
  const headingTexts = [];
  const headingPattern = /<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/giu;
  let match;

  while ((match = headingPattern.exec(html))) {
    const text = htmlToText(match[1]);
    if (text) {
      headingTexts.push(text);
    }
  }

  return headingTexts;
}

function htmlToText(html) {
  return normalizeText(
    decodeHtmlEntities(
      html
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/giu, " ")
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/giu, " ")
        .replace(/<[^>]+>/gu, " "),
    ),
  );
}

function normalizeText(value) {
  return String(value).replace(/\s+/gu, " ").trim();
}

function decodeHtmlEntities(value) {
  return value
    .replace(/&(#x?[0-9a-f]+|[a-z]+);/giu, (entity, token) => {
      const lower = token.toLowerCase();
      if (lower.startsWith("#x")) {
        return codePointToString(Number.parseInt(lower.slice(2), 16), entity);
      }
      if (lower.startsWith("#")) {
        return codePointToString(Number.parseInt(lower.slice(1), 10), entity);
      }
      return (
        {
          amp: "&",
          apos: "'",
          gt: ">",
          lt: "<",
          nbsp: " ",
          quot: '"',
        }[lower] ?? entity
      );
    })
    .replace(/\u00a0/gu, " ");
}

function codePointToString(codePoint, fallback) {
  if (!Number.isFinite(codePoint)) {
    return fallback;
  }
  try {
    return String.fromCodePoint(codePoint);
  } catch {
    return fallback;
  }
}

function findErrorMarker(body) {
  const lowerBody = body.toLowerCase();
  return (
    ERROR_MARKERS.find((marker) => lowerBody.includes(marker.toLowerCase())) ??
    null
  );
}

function describeFailure({
  status,
  statusOk,
  matchedErrorMarker,
  hasExpectedH1,
  expectedH1,
  h1Texts,
}) {
  const reasons = [];
  if (!statusOk) {
    reasons.push(`expected HTTP 200, got ${status}`);
  }
  if (matchedErrorMarker) {
    reasons.push(`matched error marker "${matchedErrorMarker}"`);
  }
  if (!hasExpectedH1) {
    const found = h1Texts.length > 0 ? h1Texts.join(" | ") : "none";
    reasons.push(`missing h1 "${expectedH1}" (found: ${found})`);
  }
  return reasons.join("; ");
}

function formatFetchError(error) {
  if (error?.name === "AbortError") {
    return `request timed out after ${REQUEST_TIMEOUT_MS}ms`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

async function writeResult(summary) {
  const resultFile = process.env.SMOKE_DEPLOY_RESULT_FILE;
  if (!resultFile) {
    return;
  }

  await mkdir(dirname(resultFile), { recursive: true });
  await writeFile(resultFile, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
}

async function writeStepSummary(summary) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) {
    return;
  }

  await appendFile(summaryPath, buildMarkdownSummary(summary), "utf8");
}

function buildMarkdownSummary(summary) {
  const lines = [
    "## Deploy smoke",
    "",
    `- Environment: ${summary.environment}`,
    `- Target: ${summary.targetUrl}`,
    `- Duration: ${summary.durationMs}ms`,
    `- Result: ${summary.success ? "passed" : "failed"}`,
    "",
  ];

  if (summary.success) {
    const targetCount = summary.targetUrls?.length ?? 1;
    lines.push(
      `Checked ${summary.routes.length} route check(s) across ${targetCount} target(s).`,
      "",
    );
    return `${lines.join("\n")}\n`;
  }

  lines.push(
    "| Target | Route | Status | Missing h1 | Error marker | Details |",
    "| --- | --- | --- | --- | --- | --- |",
  );

  for (const failure of summary.failures) {
    lines.push(
      `| ${escapeMarkdownTableCell(formatFailureTarget(failure))} | ${escapeMarkdownTableCell(failure.path)} | ${escapeMarkdownTableCell(
        failure.status ? String(failure.status) : "no response",
      )} | ${escapeMarkdownTableCell(
        failure.missingExpectedH1 ? failure.expectedH1 : "no",
      )} | ${escapeMarkdownTableCell(
        failure.matchedErrorMarker ?? "none",
      )} | ${escapeMarkdownTableCell(failure.error)} |`,
    );
  }

  lines.push("");
  return `${lines.join("\n")}\n`;
}

function formatFailureTarget(failure) {
  if (!failure.targetUrl) {
    return "n/a";
  }

  try {
    return new URL(failure.targetUrl).hostname;
  } catch {
    return failure.targetUrl;
  }
}

function escapeMarkdownTableCell(value) {
  return String(value ?? "")
    .replace(/\r?\n/gu, " ")
    .replace(/\|/gu, "\\|")
    .trim();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isCliEntrypoint() {
  const entrypoint = process.argv[1];
  return Boolean(
    entrypoint && import.meta.url === pathToFileURL(resolve(entrypoint)).href,
  );
}

if (isCliEntrypoint()) {
  main().catch(async (error) => {
    const summary = {
      success: false,
      environment: process.env.PREVIEW_URL ? "Preview" : "Production",
      targetUrl:
        process.env.PREVIEW_URL ||
        process.env.PROD_URLS ||
        process.env.PROD_URL ||
        "",
      startedAt: new Date().toISOString(),
      durationMs: 0,
      routes: [],
      failures: [
        {
          path: "configuration",
          url: "",
          ok: false,
          status: null,
          finalUrl: "",
          expectedH1: "",
          h1Texts: [],
          missingExpectedH1: false,
          matchedErrorMarker: null,
          error: error instanceof Error ? error.message : String(error),
          durationMs: 0,
          attempts: [],
        },
      ],
    };
    await writeResult(summary);
    await writeStepSummary(summary);
    console.error(summary.failures[0].error);
    process.exit(1);
  });
}
