import { execFileSync } from "node:child_process";
import {
  ensureVercelDiffBase,
  getVercelAppBuildMatches,
  getVercelDiffBase,
} from "./vercel-app-build-scope.mjs";

const appName = process.argv[2] ?? "optimitron";
const requestedDiffBase = getVercelDiffBase();
const diffBase = ensureVercelDiffBase(requestedDiffBase);
const comparisonLabel = diffBase ?? "the full tracked tree";

if (requestedDiffBase && !diffBase) {
  console.warn(
    `Could not load Vercel diff base ${requestedDiffBase}; building ${appName} to avoid an unsafe skip.`,
  );
}

const files = execFileSync(
  "git",
  diffBase
    ? ["diff", "--name-only", diffBase, "HEAD"]
    : ["ls-tree", "-r", "--name-only", "HEAD"],
  { encoding: "utf8" },
)
  .split(/\r?\n/u)
  .filter(Boolean);

const matches = getVercelAppBuildMatches(appName, files);
console.log(
  matches.length > 0
    ? `Building ${appName} for changes since ${comparisonLabel}: ${matches.join(", ")}`
    : `Skipping ${appName}; no deployable inputs changed since ${comparisonLabel}.`,
);
process.exitCode = matches.length === 0 ? 0 : 1;
