#!/usr/bin/env node
// session-start-pr-check.mjs
//
// SessionStart hook. Queries open PRs for failing checks and unresolved
// review threads, surfaces a one-line-per-PR summary as additional session
// context.
//
// Cache: per-repo 5-minute cache so rapid session restarts don't burn API.
// Fail-open: any error exits 0 silently.

import { execSync, execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

try {
  // gh installed?
  let gh;
  try {
    gh = execSync("gh --version", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    process.exit(0);
  }
  if (!gh) process.exit(0);

  let repoRoot;
  try {
    repoRoot = execSync("git rev-parse --show-toplevel", {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    process.exit(0);
  }
  if (!repoRoot) process.exit(0);

  let remoteUrl;
  try {
    remoteUrl = execSync(`git -C "${repoRoot}" config --get remote.origin.url`, {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    process.exit(0);
  }
  if (!remoteUrl || !remoteUrl.includes("github.com")) process.exit(0);

  const match = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)(\.git)?$/);
  const owner = match ? match[1] : "unknown";
  const repo = match ? match[2] : repoRoot.split(/[\\/]/).pop();

  // 5-minute cache
  const cacheDir = getCacheDir();
  if (!existsSync(cacheDir)) mkdirSync(cacheDir, { recursive: true });
  const cacheFile = join(cacheDir, `pr-check-${owner}-${repo}.txt`);
  const fiveMinAgo = Date.now() - 5 * 60 * 1000;
  if (existsSync(cacheFile) && statSync(cacheFile).mtimeMs > fiveMinAgo) {
    process.stdout.write(readFileSync(cacheFile, "utf-8"));
    process.exit(0);
  }

  // Query PRs
  let prsJson;
  try {
    prsJson = execFileSync(
      "gh",
      [
        "-R",
        `${owner}/${repo}`,
        "pr",
        "list",
        "--state",
        "open",
        "--json",
        "number,title,headRefName,statusCheckRollup,reviewDecision,isDraft,mergeable,updatedAt",
        "--limit",
        "20",
      ],
      { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] },
    );
  } catch {
    process.exit(0);
  }

  const prs = JSON.parse(prsJson || "[]");
  if (!prs.length) {
    const msg = `[PR check] No open PRs in ${owner}/${repo}.`;
    writeFileSync(cacheFile, msg);
    process.stdout.write(msg);
    process.exit(0);
  }

  const lines = [`[PR check] ${prs.length} open PR(s) in ${owner}/${repo}:`];

  for (const pr of prs) {
    const statusItems = [];

    let failed = 0;
    let pending = 0;
    let passed = 0;
    for (const c of pr.statusCheckRollup ?? []) {
      const concl = c.conclusion || c.status || "";
      if (/FAILURE|TIMED_OUT|CANCELLED|ACTION_REQUIRED/.test(concl)) failed++;
      else if (/SUCCESS|NEUTRAL|SKIPPED/.test(concl)) passed++;
      else pending++;
    }
    if (failed > 0) statusItems.push(`${failed} CI failing`);
    else if (pending > 0) statusItems.push(`${pending} CI pending`);
    else if (passed > 0) statusItems.push("CI green");

    switch (pr.reviewDecision) {
      case "CHANGES_REQUESTED":
        statusItems.push("changes requested");
        break;
      case "APPROVED":
        statusItems.push("approved");
        break;
      case "REVIEW_REQUIRED":
        statusItems.push("review required");
        break;
    }

    try {
      const threadsJson = execFileSync(
        "gh",
        [
          "api",
          `repos/${owner}/${repo}/pulls/${pr.number}/comments`,
          "--paginate",
        ],
        { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] },
      );
      const threads = JSON.parse(threadsJson || "[]");
      if (threads.length > 0) {
        statusItems.push(
          `${threads.length} review comment(s) — verify resolved status`,
        );
      }
    } catch {
      // ignore — no review comments / API failure
    }

    if (pr.isDraft) statusItems.push("draft");
    if (pr.mergeable === "CONFLICTING") statusItems.push("merge conflict");

    const statusStr = statusItems.length ? statusItems.join(", ") : "clean";
    lines.push(
      `  #${pr.number} [${pr.headRefName}] ${pr.title} — ${statusStr}`,
    );
  }

  const hasActionable = lines.some((l) =>
    /failing|conflict|changes requested|review comment/.test(l),
  );
  if (hasActionable) {
    lines.push("");
    lines.push(
      "Action: before starting unrelated work, triage failing CI, fix merge conflicts, and either address or resolve-with-explanation review comments per CLAUDE.md and .claude/agents/pr-comment-triager.md. Use the pr-comment-triager subagent for bot reviews (Copilot/CodeRabbit/Codex/claude-review).",
    );
  }

  const msg = lines.join("\n");
  writeFileSync(cacheFile, msg);
  process.stdout.write(msg);
  process.exit(0);
} catch {
  process.exit(0);
}

function getCacheDir() {
  if (process.env.LOCALAPPDATA) {
    return join(process.env.LOCALAPPDATA, "claude", "hook-cache");
  }
  if (process.env.XDG_CACHE_HOME) {
    return join(process.env.XDG_CACHE_HOME, "claude", "hook-cache");
  }
  return join(homedir(), ".cache", "claude", "hook-cache");
}
