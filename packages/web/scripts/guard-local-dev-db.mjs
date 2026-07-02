#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");
const webRoot = path.resolve(__dirname, "..");
const repoEnvPath = path.join(repoRoot, ".env");
const webEnvPath = path.join(webRoot, ".env");
const LOCAL_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "host.docker.internal",
]);
const ALLOW_REMOTE_FLAG = "OPTIMITRON_ALLOW_REMOTE_DEV_DATABASE";
const ALLOW_LIVE_STRIPE_FLAG = "OPTIMITRON_ALLOW_LIVE_STRIPE_DEV";

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {};

  const entries = {};
  for (const rawLine of readFileSync(filePath, "utf8").split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) continue;

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    entries[key] = value;
  }
  return entries;
}

function mergeEnv() {
  return {
    ...parseEnvFile(repoEnvPath),
    ...parseEnvFile(webEnvPath),
    ...process.env,
  };
}

function redactDatabaseUrl(databaseUrl) {
  try {
    const url = new URL(databaseUrl);
    if (url.username) url.username = "<user>";
    if (url.password) url.password = "<password>";
    return url.toString();
  } catch {
    return "<invalid DATABASE_URL>";
  }
}

function isLocalDatabaseUrl(databaseUrl) {
  const url = new URL(databaseUrl);
  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
    throw new Error(`DATABASE_URL uses unsupported protocol ${url.protocol}.`);
  }
  return LOCAL_HOSTS.has(url.hostname);
}

const env = mergeEnv();
const databaseUrl = env.DATABASE_URL;

if (!databaseUrl) {
  console.error(
    [
      "DATABASE_URL is required for local web dev.",
      "Copy .env.example to .env and run pnpm db:setup.",
    ].join("\n"),
  );
  process.exit(1);
}

if (env[ALLOW_REMOTE_FLAG] === "1" || env[ALLOW_REMOTE_FLAG] === "true") {
  console.warn(
    `${ALLOW_REMOTE_FLAG} is set; allowing remote dev database ${redactDatabaseUrl(databaseUrl)}.`,
  );
  process.exit(0);
}

try {
  if (isLocalDatabaseUrl(databaseUrl)) {
    guardLiveStripe(env);
    process.exit(0);
  }
} catch (error) {
  const message = error instanceof Error ? error.message : "Invalid DATABASE_URL.";
  console.error(message);
  process.exit(1);
}

console.error(
  [
    "Refusing to start local dev against a non-local DATABASE_URL.",
    `Resolved database: ${redactDatabaseUrl(databaseUrl)}`,
    "",
    "Use the local Docker database by setting this in .env:",
    "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/optimitron",
    "",
    "Then run:",
    "pnpm db:setup",
    "",
    `For an intentional remote/preview session, run with ${ALLOW_REMOTE_FLAG}=1.`,
    "Do not use production or unmasked production-derived data for branch-schema work or screenshots.",
  ].join("\n"),
);
process.exit(1);

function guardLiveStripe(env) {
  if (
    env[ALLOW_LIVE_STRIPE_FLAG] === "1" ||
    env[ALLOW_LIVE_STRIPE_FLAG] === "true"
  ) {
    console.warn(`${ALLOW_LIVE_STRIPE_FLAG} is set; allowing live Stripe keys.`);
    return;
  }

  const liveKeys = [
    ["STRIPE_SECRET_KEY", env.STRIPE_SECRET_KEY],
    [
      "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
      env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    ],
  ].filter(([, value]) => {
    const key = String(value ?? "").trim();
    return key.startsWith("sk_live_") || key.startsWith("pk_live_");
  });

  if (liveKeys.length === 0) return;

  console.error(
    [
      "Refusing to start local dev with live Stripe keys.",
      `Live keys detected: ${liveKeys.map(([key]) => key).join(", ")}`,
      "",
      "Use Stripe test-mode keys locally, leave Stripe keys blank for UI-only review,",
      `or set ${ALLOW_LIVE_STRIPE_FLAG}=1 for a deliberate one-off live Stripe session.`,
    ].join("\n"),
  );
  process.exit(1);
}
