#!/usr/bin/env node
// enforce-cba-table-on-plan-files.mjs
//
// PreToolUse hook on Skill: when /autoplan runs, look for the most recent
// plan file in ~/.gstack/projects/<slug>/*plan*.md and verify it contains
// a Cost-Benefit Matrix section with all required columns.
//
// Mike's 2026-05-19 trigger, verbatim: *"it should be like doing a cost
// benefit analysis of the value of features and the complexity cost to
// the code base and to the user interface. it seems like you're just
// suggesting a bunch of ideas and not doing a cost-benefit analysis. do
// we have guidelines to do this? isn't that the whole point of the
// autoplan thing?"*
//
// Why: /autoplan's plan-ceo-review, plan-eng-review, plan-design-review,
// and plan-devex-review challenge premises, architecture, design, and DX,
// but do NOT require a structured comparison of (CC effort × probability
// of value × opportunity cost). Result: reviewers suggest features that
// look reasonable in isolation but don't survive a real CBA against the
// priority order in CLAUDE.md.
//
// Related memory:
//   - feedback_promote_violated_text_rules_to_hooks.md
//   - feedback_be_opinionated_for_mike_finite_energy.md
//
// Strategy:
//   1. Pass-through unless tool_name === "Skill" AND skill === "autoplan".
//   2. Locate the most recent plan file matching the slug + branch pattern
//      under ~/.gstack/projects/<slug>/.
//   3. If no plan file exists yet (first /autoplan invocation), emit an
//      advisory reminding that the plan MUST include a CBA section before
//      the final gate.
//   4. If a plan file exists, check it for:
//      - A heading containing "Cost-Benefit" OR "Cost / Benefit"
//        OR "CBA" (case-insensitive)
//      - At least one table row mentioning CC hours / effort
//      - At least one mention of "opportunity cost" OR "what drops"
//      - At least one "Decision:" or decision column entry
//   5. If the section is missing or incomplete, emit a corrective
//      template the planner can paste in. ADVISORY for now (exit 0)
//      so we measure false-positive rate before hard-blocking.
//
// Bypass: if args contains "CBA-IN-PROGRESS" the hook skips (signals the
// planner is mid-draft and acknowledges the requirement).

import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();

const REQUIRED_SIGNALS = {
  heading: /^#{1,4}\s+.*(cost[\s\-/]*benefit|\bCBA\b)/im,
  effort: /(CC\s*(hours|hrs)|effort|wallclock|wall\s*clock)/i,
  opportunity: /(opportunity\s*cost|what\s*drops|trade[\s\-]*off|instead\s*of)/i,
  decision: /(decision|\bship\b|\bcut\b|\bdefer\b|\bresearch\b|\bkill\b)/i,
};

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

function projectSlug() {
  const top = safeExec("git rev-parse --show-toplevel").trim();
  if (!top) return "unknown";
  const remote = safeExec("git config --get remote.origin.url").trim();
  // Best-effort slug: derive from remote URL (owner-repo) if possible,
  // else use the directory basename.
  const m = remote.match(/[:/]([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/);
  if (m) return `${m[1]}-${m[2]}`;
  return path.basename(top);
}

function findMostRecentPlanFile() {
  const slug = projectSlug();
  const dir = path.join(os.homedir(), ".gstack", "projects", slug);
  if (!existsSync(dir)) return null;
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return null;
  }
  const planFiles = entries
    .filter((e) => e.isFile() && /plan/i.test(e.name) && e.name.endsWith(".md"))
    .map((e) => {
      const full = path.join(dir, e.name);
      let mtime = 0;
      try {
        mtime = statSync(full).mtimeMs;
      } catch {
        // Intentional silence: stat failure (race with concurrent file
        // deletion, permission flake) just means we sort that entry last;
        // not worth surfacing.
      }
      return { full, mtime, name: e.name };
    })
    .sort((a, b) => b.mtime - a.mtime);
  return planFiles[0] || null;
}

function cbaTemplate() {
  return [
    `## Cost-Benefit Matrix`,
    ``,
    `Required before the final approval gate. Rank impact against CLAUDE.md priority order (1=vote conversion, 2=referral propagation, 3=org endorsement, 4=plaintiffs, 5=leader reminders, 6=discoverability, 7=optimitron OS).`,
    ``,
    `| Option | CC hrs | Wallclock | Expected impact (with units) | Confidence | Brand/UX cost | Opportunity cost (which P0/P1 TODO drops) | Risk-adj score | Decision |`,
    `|---|---|---|---|---|---|---|---|---|`,
    `| Option A — <name> | N | N | e.g. \"+N treaty signatures / 30d\" | HIGH/MED/LOW | none/low/med/high | name the specific TODO item this displaces | qualitative | SHIP / CUT / DEFER / RESEARCH |`,
    `| Option B — <name> | N | N | ... | ... | ... | ... | ... | ... |`,
    `| ... (one row per real option, including \"do nothing\" and \"defer to TODO.md\") |`,
    ``,
    `**Verdict from the matrix:** <one sentence explaining the dominant option(s) and why>.`,
    ``,
  ].join("\n");
}

try {
  const raw = readFileSync(0, "utf-8");
  if (!raw || !raw.trim()) process.exit(0);

  const hookData = JSON.parse(raw);
  if (hookData?.tool_name !== "Skill") process.exit(0);

  const skill = hookData?.tool_input?.skill;
  if (skill !== "autoplan") process.exit(0);

  const args = String(hookData?.tool_input?.args || "");
  if (args.includes("CBA-IN-PROGRESS")) process.exit(0);

  const planFile = findMostRecentPlanFile();

  if (!planFile) {
    const msg = [
      `[enforce-cba-table-on-plan-files] ADVISORY — no plan file found yet for this project.`,
      ``,
      `When /autoplan drafts the plan, it MUST include a Cost-Benefit Matrix section before reviewers run. The matrix is the structured antidote to "suggest a bunch of ideas without weighing them."`,
      ``,
      cbaTemplate(),
      `Rule lives at: .claude/hooks/enforce-cba-table-on-plan-files.mjs`,
    ].join("\n");
    process.stderr.write(msg + "\n");
    process.exit(0);
  }

  const content = readFileSync(planFile.full, "utf-8");
  const missing = [];
  for (const [key, re] of Object.entries(REQUIRED_SIGNALS)) {
    if (!re.test(content)) missing.push(key);
  }

  if (missing.length === 0) process.exit(0);

  const lines = [
    `[enforce-cba-table-on-plan-files] ADVISORY — plan file is missing required Cost-Benefit Matrix signals.`,
    ``,
    `Plan: ${planFile.full}`,
    `Missing signals: ${missing.join(", ")}`,
    ``,
    `What each signal requires:`,
    `  - heading: a "## Cost-Benefit Matrix" (or "CBA") section header`,
    `  - effort: per-option CC hours / wallclock estimate`,
    `  - opportunity: name the specific P0/P1 TODO that drops if this ships`,
    `  - decision: SHIP / CUT / DEFER / RESEARCH per option`,
    ``,
    `Paste this template into the plan file before re-running /autoplan:`,
    ``,
    cbaTemplate(),
    `Rule lives at: .claude/hooks/enforce-cba-table-on-plan-files.mjs`,
  ];

  process.stderr.write(lines.join("\n") + "\n");
  // ADVISORY (exit 0) on first design pass; flip to exit 2 after measuring
  // false-positive rate. Hook should never block the planner mid-draft.
  process.exit(0);
} catch (err) {
  // Intentional silence: hooks must never fail closed on their own crash.
  // Surface to stderr for the next-turn Claude to notice without blocking
  // the user's /autoplan dispatch.
  process.stderr.write(`[enforce-cba-table] hook crashed: ${err?.message ?? err}\n`);
  process.exit(0);
}
