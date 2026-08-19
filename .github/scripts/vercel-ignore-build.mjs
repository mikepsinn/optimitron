import { execFileSync } from "node:child_process";
import { getVercelAppBuildMatches } from "./vercel-app-build-scope.mjs";

const appName = process.argv[2] ?? "optimitron";

const files = execFileSync("git", ["diff", "--name-only", "HEAD^", "HEAD"], {
  encoding: "utf8",
})
  .split(/\r?\n/u)
  .filter(Boolean);

const matches = getVercelAppBuildMatches(appName, files);
console.log(
  matches.length > 0
    ? `Building ${appName} for: ${matches.join(", ")}`
    : `Skipping ${appName}; no deployable inputs changed.`,
);
process.exitCode = matches.length === 0 ? 0 : 1;
