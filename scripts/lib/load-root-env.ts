/**
 * load-root-env.ts
 *
 * Side-effect import that loads the repo-root `.env` into `process.env`
 * before anything that validates env (site-kit's `env.ts`) is imported.
 *
 * Environment variables live in the root `.env` (see CLAUDE.md), but Next only
 * auto-loads `.env` from an app directory, and tsx loads none at all. Import
 * this FIRST in any repo-root script that touches site-kit or spawns an app.
 * Values already present in `process.env` win, so CI stays authoritative.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT_ENV_PATH = path.resolve(__dirname, "..", "..", ".env");

function parseEnvFile(contents: string): Record<string, string> {
  const parsed: Record<string, string> = {};
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.length === 0 || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim().replace(/^export\s+/, "");
    let value = line.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    parsed[key] = value;
  }
  return parsed;
}

try {
  const parsed = parseEnvFile(readFileSync(ROOT_ENV_PATH, "utf8"));
  for (const [key, value] of Object.entries(parsed)) {
    if (process.env[key] === undefined) process.env[key] = value;
  }
} catch {
  // No root .env (CI, fresh clone) — the importing script fails later with a
  // specific missing-variable error, which is a clearer message than this one.
}
