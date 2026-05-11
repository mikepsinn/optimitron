#!/usr/bin/env node

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";

const require = createRequire(import.meta.url);
const DEFAULT_BASE_URL = "http://127.0.0.1:3001";
const NEW_USER_FLOW_ARTIFACT_DIR = path.resolve(
  process.cwd(),
  "../../screenshots/new-user-flow/_playwright-artifacts",
);
const LOCAL_REACHABILITY_PATHS = [
  "/favicon.ico",
  "/manifest.json",
  "/",
];
const LOCAL_REACHABILITY_RETRIES = 3;
const LOCAL_REACHABILITY_TIMEOUT_MS = 5_000;
const LOCAL_REACHABILITY_RETRY_DELAY_MS = 750;
const LOCAL_BASE_URL_CANDIDATES = [
  process.env.BASE_URL,
  DEFAULT_BASE_URL,
  "http://localhost:3001",
].filter(Boolean);
const isCI = parseBoolean(process.env.CI);

const MODE_SPECS = {
  all: [
    "e2e/smoke.spec.ts",
    "e2e/contrast-audit.spec.ts",
    "e2e/mobile-responsiveness-audit.spec.ts",
  ],
  smoke: isCI
    ? [
        "e2e/smoke.spec.ts",
        "e2e/contrast-audit.spec.ts",
        "e2e/treaty-page-structure.spec.ts",
      ]
    : [
        "e2e/smoke.spec.ts",
        "e2e/treaty-page-structure.spec.ts",
      ],
  contrast: ["e2e/contrast-audit.spec.ts"],
  mobile: ["e2e/mobile-responsiveness-audit.spec.ts"],
  "new-user-flow-screenshots": ["e2e/new-user-flow-screenshots.spec.ts"],
  "treaty-screenshots": ["e2e/treaty-vote-post-vote-screenshots.spec.ts"],
  "treaty-reminder-one-human": ["e2e/treaty-reminder-one-human.spec.ts"],
  visual: ["e2e/visual-regression.spec.ts"],
  // `email-screenshots.spec.ts` (which renders the templates and shoots
  // them) is held out of `visual` for now: it imports
  // `…-email.server.ts` modules that transitively pull `@optimitron/db`,
  // and Playwright's spec transformer cannot parse the compiled
  // `packages/db/dist/index.js` (`export * from …` namespace re-exports
  // need `@babel/plugin-transform-export-namespace-from`, which isn't
  // wired into the Playwright pipeline). Re-include here once email
  // HTML rendering moves behind a `/dev/email/*` Next.js preview route
  // (then the spec just `page.goto`s instead of importing).
  "email-screenshots": ["e2e/email-screenshots.spec.ts"],
};

const PLAYWRIGHT_DEFAULT_ARGS = ["--project=default"];
const PLAYWRIGHT_MODE_DEFAULT_ARGS = {
  visual: ["--project=default", "--project=visual-mobile"],
};
const scriptArgs = process.argv.slice(2).filter((arg, index) => !(index === 0 && arg === "--"));
const requestedMode = scriptArgs[0];
const helpRequested = ["-h", "--help", "help"].includes(requestedMode ?? "");
const mode = requestedMode && requestedMode in MODE_SPECS ? requestedMode : "all";
const passthroughArgs = requestedMode && requestedMode in MODE_SPECS
  ? scriptArgs.slice(1)
  : scriptArgs;

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

async function main() {
  if (helpRequested) {
    printHelp();
    return;
  }

  const execution = isCI
    ? {
        baseUrl: process.env.BASE_URL ?? DEFAULT_BASE_URL,
        reuseExistingServer: false,
        reason: "CI run; using Playwright-managed server",
      }
    : await resolveLocalExecution({
        requireRunningServer:
          mode === "new-user-flow-screenshots" &&
          !parseBoolean(process.env.E2E_ALLOW_PRODUCTION_FALLBACK),
      });

  const env = { ...process.env, BASE_URL: execution.baseUrl };

  if (execution.reuseExistingServer) {
    env.SKIP_SERVER = "1";
  } else {
    delete env.SKIP_SERVER;
  }

  if (mode === "smoke" && isCI) {
    env.PLAYWRIGHT_CONTRAST_SCOPE = "critical";
  } else {
    delete env.PLAYWRIGHT_CONTRAST_SCOPE;
  }

  if (mode === "new-user-flow-screenshots") {
    env.PLAYWRIGHT_OUTPUT_DIR = process.env.PLAYWRIGHT_OUTPUT_DIR ?? NEW_USER_FLOW_ARTIFACT_DIR;
  }

  if (mode === "visual") {
    env.ARGOS_VISUAL = "1";
  } else {
    delete env.ARGOS_VISUAL;
  }

  const playwrightArgs = ["test", ...MODE_SPECS[mode], ...appendDefaultProjectArg(passthroughArgs, mode)];

  console.log(`[e2e] mode=${mode}`);
  console.log(`[e2e] baseUrl=${execution.baseUrl}`);
  console.log(`[e2e] ${execution.reason}`);

  const exitCode = await runCommand(playwrightArgs, env);
  process.exit(exitCode);
}

async function resolveLocalExecution(options = {}) {
  for (const candidate of dedupe(LOCAL_BASE_URL_CANDIDATES)) {
    if (await isReachable(candidate)) {
      return {
        baseUrl: candidate,
        reuseExistingServer: true,
        reason: `Reusing running server at ${candidate}`,
      };
    }
  }

  if (options.requireRunningServer) {
    throw new Error(
      [
        "No running Optimitron web server was detected.",
        `Checked: ${dedupe(LOCAL_BASE_URL_CANDIDATES).join(", ")}`,
        "The new-user-flow-screenshots mode is designed to reuse `pnpm --filter @optimitron/web run dev` so it does not run against a stale or slow production build.",
        "Set E2E_ALLOW_PRODUCTION_FALLBACK=1 only when you explicitly want Playwright to start the existing `.next` build.",
      ].join(" "),
    );
  }

  if (!hasExistingBuild()) {
    throw new Error(
      [
        "No running Optimitron web server was detected.",
        `Checked: ${dedupe(LOCAL_BASE_URL_CANDIDATES).join(", ")}`,
        "Start `pnpm --filter @optimitron/web run dev` or build the app before running `pnpm --filter @optimitron/web run e2e`.",
      ].join(" "),
    );
  }

  return {
    baseUrl: process.env.BASE_URL ?? DEFAULT_BASE_URL,
    reuseExistingServer: false,
    reason: "No running dev server detected; using existing production build via Playwright",
  };
}

function appendDefaultProjectArg(args, selectedMode) {
  const hasProjectArg = args.some((arg, index) => (
    arg === "--project" || arg.startsWith("--project=") || (index > 0 && args[index - 1] === "--project")
  ));

  const defaultArgs = PLAYWRIGHT_MODE_DEFAULT_ARGS[selectedMode] ?? PLAYWRIGHT_DEFAULT_ARGS;
  return hasProjectArg ? args : [...defaultArgs, ...args];
}

function hasExistingBuild() {
  return existsSync(path.resolve(process.cwd(), ".next", "BUILD_ID"));
}

async function isReachable(baseUrl) {
  const probeUrls = buildReachabilityProbeUrls(baseUrl);

  for (let attempt = 0; attempt < LOCAL_REACHABILITY_RETRIES; attempt += 1) {
    for (const probeUrl of probeUrls) {
      if (await isReachableProbe(probeUrl)) {
        return true;
      }
    }

    if (attempt < LOCAL_REACHABILITY_RETRIES - 1) {
      await sleep(LOCAL_REACHABILITY_RETRY_DELAY_MS);
    }
  }

  return false;
}

function buildReachabilityProbeUrls(baseUrl) {
  try {
    const parsed = new URL(baseUrl);
    return LOCAL_REACHABILITY_PATHS.map((pathname) => {
      const probe = new URL(parsed);
      probe.pathname = pathname;
      probe.search = "";
      probe.hash = "";
      return probe.toString();
    });
  } catch {
    return [baseUrl];
  }
}

async function isReachableProbe(probeUrl) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LOCAL_REACHABILITY_TIMEOUT_MS);

  try {
    const response = await fetch(probeUrl, {
      method: "GET",
      redirect: "manual",
      signal: controller.signal,
    });
    return response.status >= 200 && response.status < 500;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseBoolean(value) {
  if (!value) return false;
  return !["0", "false", "False", "FALSE"].includes(value);
}

function dedupe(values) {
  return [...new Set(values)];
}

function runCommand(args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [resolvePlaywrightCli(), ...args], {
      cwd: process.cwd(),
      env,
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`Playwright exited from signal ${signal}`));
        return;
      }
      resolve(code ?? 1);
    });
  });
}

function resolvePlaywrightCli() {
  return path.join(path.dirname(require.resolve("@playwright/test/package.json")), "cli.js");
}

function printHelp() {
  console.log(`Usage: pnpm --filter @optimitron/web run e2e -- [mode] [playwright args]

Modes:
  all        Run smoke, contrast, and mobile audits (default)
  smoke      Run smoke tests locally; in CI also includes a critical-route contrast audit
  contrast   Run only the contrast audit
  mobile     Run only the mobile responsiveness audit
  new-user-flow-screenshots
             Regenerate the cross-variant new-user funnel screenshots
  treaty-screenshots
             Regenerate the treaty vote/post-vote screenshots
  visual     Capture curated route screenshots for Argos visual PR review

Behavior:
  - In CI, uses the Playwright-managed built server path
  - Locally, reuses BASE_URL or a running server on ${DEFAULT_BASE_URL} when available
  - Locally, new-user-flow-screenshots requires a running dev server unless E2E_ALLOW_PRODUCTION_FALLBACK=1 is set
  - If no local server is running, falls back to an existing production build
  - visual runs desktop and mobile projects and enables the Argos reporter
`);
}
