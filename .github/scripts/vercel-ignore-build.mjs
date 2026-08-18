import { execFileSync } from "node:child_process";
import { getVercelPreviewBuildMatches } from "./preview-smoke-scope.mjs";

const files = execFileSync("git", ["diff", "--name-only", "HEAD^", "HEAD"], {
  encoding: "utf8",
})
  .split(/\r?\n/u)
  .filter(Boolean);

process.exitCode = getVercelPreviewBuildMatches(files).length === 0 ? 0 : 1;
