import { execFileSync } from "node:child_process";
import {
  buildCopyReviewGateResult,
  formatCopyReviewGateMessage,
} from "../src/lib/copy-review-gate";

function getStagedPaths() {
  const repoRoot = execFileSync("git", ["rev-parse", "--show-toplevel"], {
    encoding: "utf8",
  }).trim();
  const output = execFileSync(
    "git",
    ["diff", "--cached", "--name-only", "--diff-filter=ACMR"],
    { cwd: repoRoot, encoding: "utf8" },
  );

  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

const result = buildCopyReviewGateResult({
  changedPaths: getStagedPaths(),
  env: process.env,
});

if (result.publicCopyPaths.length === 0) {
  process.exit(0);
}

if (!result.shouldBlock) {
  console.log(
    "COPY_REVIEW_APPROVED=1 set; allowing public copy commit after explicit human approval.",
  );
  process.exit(0);
}

console.error(formatCopyReviewGateMessage(result.publicCopyPaths));
process.exit(1);
