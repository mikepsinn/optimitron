#!/usr/bin/env node
// enforce-feature-preexistence-check-on-autoplan.mjs
//
// PreToolUse hook on Skill: when /autoplan is invoked with args that imply
// adding/building/shipping a named feature, grep the codebase for routes,
// route labels, recent commits, and the current branch name to see whether
// that feature already exists. If any match is found, advise the planner
// to inspect the existing surface BEFORE drafting a plan that may critique
// a feature that's already shipped.
//
// Mike's 2026-05-19 trigger, verbatim: *"didn't we already do the bio
// template page at the /love route? if so, why are you not reviewing the
// recent commits and the full scope of the application?"*
//
// Why: autoplan's Phase 0 reads CLAUDE.md, TODO.md, git log -30, and
// git diff --stat. It does NOT enumerate existing route directories,
// grep routes.ts for the proposed feature name, or cross-check the
// branch name. Result: the dual reviewers critique a feature against
// a wrong starting point and recommend "ship the bio-template version"
// for a feature whose bio-template version is already shipped.
//
// Related memory:
//   - feedback_verify_before_defensive_recommendation.md
//   - feedback_promote_violated_text_rules_to_hooks.md
//   - feedback_cwd_aware_absence_checks.md
//
// Strategy:
//   1. Pass-through unless tool_name === "Skill" AND skill === "autoplan".
//   2. Extract candidate feature nouns from the skill args:
//      tokens following add/build/ship/create/implement/launch, plus
//      branch-name tokens (after stripping feature/ prefix).
//   3. For each candidate token, search:
//      a. packages/web/src/app/ directory names (one-level deep)
//      b. packages/web/src/lib/routes.ts content
//      c. recent commit messages on the current branch, resolved from origin/HEAD
//   4. If matches found, emit a structured advisory listing each match
//      with file:line refs. Hook stays ADVISORY (exit 0) so a planner
//      who has ALREADY acknowledged the existing surface isn't blocked,
//      but the warning forces the planner to see existing state before
//      proceeding.
//
// Bypass: if args contains "ACKNOWLEDGED-PREEXISTENCE" the hook skips
// (signals the planner has already inspected the existing surface).

import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();

const TRIGGER_VERBS = new Set([
  "add",
  "adding",
  "build",
  "building",
  "ship",
  "shipping",
  "create",
  "creating",
  "implement",
  "implementing",
  "launch",
  "launching",
  "introduce",
  "introducing",
  "make",
  "making",
]);

const STOPWORDS = new Set([
  "a",
  "an",
  "the",
  "this",
  "that",
  "these",
  "those",
  "some",
  "any",
  "new",
  "real",
  "full",
  "small",
  "simple",
  "minimal",
  "feature",
  "features",
  "thing",
  "things",
  "stuff",
  "way",
  "ways",
  "page",
  "pages",
  "route",
  "routes",
  "support",
  "to",
  "for",
  "of",
  "on",
  "in",
  "with",
  "and",
  "or",
  "but",
  "into",
  "onto",
  "from",
  "by",
  "as",
  "is",
  "are",
  "be",
  "been",
  "being",
  "do",
  "does",
  "did",
  "have",
  "has",
  "had",
  "will",
  "would",
  "could",
  "should",
  "can",
  "may",
  "might",
  "shall",
  "more",
  "very",
  "really",
  "just",
  "only",
  "even",
  "also",
  "still",
  "yet",
  "system",
  "layer",
  "thing",
  "ui",
  "ux",
  "api",
  "app",
  "site",
  "web",
]);

function extractCandidateNouns(text) {
  const cleaned = String(text || "")
    .toLowerCase()
    .replace(/[`*_~"'()[\]{}.,!?;:]/g, " ")
    .replace(/\s+/g, " ");
  const tokens = cleaned.split(" ");
  const candidates = new Set();
  for (let i = 0; i < tokens.length - 1; i += 1) {
    const token = tokens[i];
    if (!TRIGGER_VERBS.has(token)) continue;
    // Take up to the next 4 tokens, stopping at any verb/stopword we don't want.
    for (let j = 1; j <= 4 && i + j < tokens.length; j += 1) {
      const candidate = tokens[i + j];
      if (!candidate || candidate.length < 3) continue;
      if (STOPWORDS.has(candidate)) continue;
      if (TRIGGER_VERBS.has(candidate)) break;
      candidates.add(candidate.replace(/[^a-z0-9-]/g, ""));
    }
  }
  return Array.from(candidates).filter((c) => c && c.length >= 3);
}

function safeExec(cmd) {
  try {
    return execSync(cmd, {
      cwd: PROJECT_DIR,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 4000,
    });
  } catch {
    return "";
  }
}

function getDefaultRemoteRef() {
  const ref = safeExec(
    "git symbolic-ref --quiet --short refs/remotes/origin/HEAD",
  ).trim();
  return /^[A-Za-z0-9._/-]+$/.test(ref) ? ref : "";
}

function collectRecentCommits() {
  const defaultRemoteRef = getDefaultRemoteRef();
  if (defaultRemoteRef) {
    const mergeBase = safeExec(
      `git merge-base ${defaultRemoteRef} HEAD`,
    ).trim();
    if (/^[a-f0-9]{40}$/.test(mergeBase)) {
      return {
        label: `${defaultRemoteRef}..HEAD`,
        lines: safeExec(
          `git log ${mergeBase}..HEAD --oneline --format=%h%x09%s`,
        )
          .split(/\r?\n/)
          .filter(Boolean),
      };
    }
  }

  return {
    label: "last 30 commits",
    lines: safeExec("git log --max-count=30 --oneline --format=%h%x09%s")
      .split(/\r?\n/)
      .filter(Boolean),
  };
}

function getBranchTokens() {
  const branch = safeExec("git branch --show-current").trim();
  if (!branch) return { branch, tokens: [] };
  const stripped = branch
    .replace(/^feature\//, "")
    .replace(/^fix\//, "")
    .replace(/^chore\//, "");
  const tokens = stripped
    .split(/[-_/]/)
    .map((t) => t.toLowerCase())
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));
  return { branch, tokens };
}

function listAppRouteDirs() {
  const appRoot = path.join(PROJECT_DIR, "packages", "web", "src", "app");
  if (!existsSync(appRoot)) return [];
  const out = [];
  function walk(dir, depth) {
    if (depth > 2) return;
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      if (
        e.name.startsWith(".") ||
        e.name === "api" ||
        e.name === "node_modules"
      )
        continue;
      const full = path.join(dir, e.name);
      out.push({ name: e.name.toLowerCase(), path: full });
      walk(full, depth + 1);
    }
  }
  walk(appRoot, 0);
  return out;
}

function searchRoutesTs(candidate) {
  const routesPath = path.join(
    PROJECT_DIR,
    "packages",
    "web",
    "src",
    "lib",
    "routes.ts",
  );
  if (!existsSync(routesPath)) return [];
  const content = readFileSync(routesPath, "utf-8");
  const lines = content.split(/\r?\n/);
  const hits = [];
  const needle = candidate.toLowerCase();
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].toLowerCase().includes(needle)) {
      hits.push({ line: i + 1, text: lines[i].trim().slice(0, 140) });
      if (hits.length >= 4) break;
    }
  }
  return hits;
}

function searchRecentCommits(candidate, recentCommits) {
  const needle = candidate.toLowerCase();
  return recentCommits.lines
    .filter((line) => line.toLowerCase().includes(needle))
    .slice(0, 5);
}

try {
  const raw = readFileSync(0, "utf-8");
  if (!raw || !raw.trim()) process.exit(0);

  const hookData = JSON.parse(raw);
  if (hookData?.tool_name !== "Skill") process.exit(0);

  const skill = hookData?.tool_input?.skill;
  if (skill !== "autoplan") process.exit(0);

  const args = String(hookData?.tool_input?.args || "");
  if (args.includes("ACKNOWLEDGED-PREEXISTENCE")) process.exit(0);

  const candidates = extractCandidateNouns(args);
  const { branch, tokens: branchTokens } = getBranchTokens();
  for (const t of branchTokens) {
    if (!candidates.includes(t)) candidates.push(t);
  }

  if (candidates.length === 0) process.exit(0);

  const routeDirs = listAppRouteDirs();
  const recentCommits = collectRecentCommits();
  const findings = [];

  for (const candidate of candidates) {
    const dirMatches = routeDirs.filter(
      (d) => d.name === candidate || d.name.includes(candidate),
    );
    const routesHits = searchRoutesTs(candidate);
    const commitHits = searchRecentCommits(candidate, recentCommits);

    if (
      dirMatches.length === 0 &&
      routesHits.length === 0 &&
      commitHits.length === 0
    )
      continue;

    findings.push({ candidate, dirMatches, routesHits, commitHits });
  }

  if (findings.length === 0) process.exit(0);

  const lines = [
    `[enforce-feature-preexistence-check-on-autoplan] ADVISORY — /autoplan invocation references feature noun(s) that ALREADY appear in this repo. Read existing surfaces BEFORE drafting a plan; otherwise reviewers will critique a starting point that doesn't exist.`,
    ``,
    `Branch: ${branch || "(none)"}`,
    `Candidates examined: ${candidates.join(", ")}`,
    ``,
  ];

  for (const f of findings) {
    lines.push(`### "${f.candidate}"`);
    if (f.dirMatches.length > 0) {
      lines.push(`  app/ route dirs matching:`);
      for (const d of f.dirMatches.slice(0, 4)) {
        const rel = path.relative(PROJECT_DIR, d.path).replace(/\\/g, "/");
        lines.push(`    - ${rel}`);
      }
    }
    if (f.routesHits.length > 0) {
      lines.push(`  routes.ts hits:`);
      for (const r of f.routesHits) {
        lines.push(`    - routes.ts:${r.line}: ${r.text}`);
      }
    }
    if (f.commitHits.length > 0) {
      lines.push(`  recent commits (${recentCommits.label}):`);
      for (const c of f.commitHits) {
        lines.push(`    - ${c}`);
      }
    }
    lines.push(``);
  }

  lines.push(
    `Required before drafting the plan:`,
    `  1. Read EVERY app/ route file in the dir matches above.`,
    `  2. Quote the current state in the plan's "What already exists" section.`,
    `  3. Reframe the plan as a delta against the existing surface (not a greenfield design).`,
    `  4. Re-invoke /autoplan with "ACKNOWLEDGED-PREEXISTENCE" appended to args to confirm.`,
    ``,
    `Rule lives at: .claude/hooks/enforce-feature-preexistence-check-on-autoplan.mjs`,
  );

  process.stderr.write(lines.join("\n") + "\n");
  // ADVISORY (exit 0) on first design pass; planner is expected to read
  // the advisory and either acknowledge or stop. If we want hard-blocking
  // later, flip to exit 2 after measuring false-positive rate.
  process.exit(0);
} catch (err) {
  // Intentional silence: hooks must never fail closed. If this hook itself
  // crashes (malformed JSON, missing path, etc.) we exit 0 so /autoplan
  // dispatches remain possible. The error gets surfaced to stderr for the
  // next-turn Claude to notice without blocking the user.
  process.stderr.write(
    `[enforce-feature-preexistence-check] hook crashed: ${err?.message ?? err}\n`,
  );
  process.exit(0);
}
