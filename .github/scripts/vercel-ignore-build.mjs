import { execFileSync } from "node:child_process";
import {
  getVercelAppBuildMatches,
  getVercelDiffBase,
} from "./vercel-app-build-scope.mjs";

const appName = process.argv[2] ?? "optimitron";
const diffBase = getVercelDiffBase();

const files = execFileSync("git", ["diff", "--name-only", diffBase, "HEAD"], {
  encoding: "utf8",
})
  .split(/\r?\n/u)
  .filter(Boolean);

const matches = getVercelAppBuildMatches(appName, files);
console.log(
  matches.length > 0
    ? `Building ${appName} for changes since ${diffBase}: ${matches.join(", ")}`
    : `Skipping ${appName}; no deployable inputs changed since ${diffBase}.`,
);
process.exitCode = matches.length === 0 ? 0 : 1;
