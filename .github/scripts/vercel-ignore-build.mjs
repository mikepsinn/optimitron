import { execFileSync } from "node:child_process";
import {
  ensureVercelDiffBase,
  ensureVercelProductionDiffBase,
  getVercelAppBuildMatches,
  getVercelDiffBase,
} from "./vercel-app-build-scope.mjs";

const appName = process.argv[2] ?? "optimitron";
const requestedDiffBase = getVercelDiffBase(process.env, () => null);
const verifiedRequestedDiffBase = requestedDiffBase
  ? ensureVercelDiffBase(requestedDiffBase)
  : null;
const diffBase =
  verifiedRequestedDiffBase ?? ensureVercelProductionDiffBase();
const comparisonLabel = diffBase ?? "the full tracked tree";

if (requestedDiffBase && !verifiedRequestedDiffBase && diffBase) {
  console.warn(
    `Vercel diff base ${requestedDiffBase} is unavailable or not an ancestor of HEAD; comparing ${appName} with the production merge base.`,
  );
} else if (requestedDiffBase && !diffBase) {
  console.warn(
    `Could not load Vercel diff base ${requestedDiffBase} or the production merge base; building ${appName} to avoid an unsafe skip.`,
  );
} else if (!requestedDiffBase && !diffBase) {
  console.warn(
    `Could not load the production merge base; building ${appName} to avoid an unsafe skip.`,
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
