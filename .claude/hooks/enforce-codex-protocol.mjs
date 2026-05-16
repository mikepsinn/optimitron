#!/usr/bin/env node
// enforce-codex-protocol.mjs
//
// PreToolUse hook on Bash: when the command invokes `codex exec`
// or `codex review`, REQUIRE the prompt to either:
//
//   (a) Start with `trivial:<reason>` — explicit acknowledgement
//       that this dispatch skips the plan-first protocol. The reason
//       must name why (e.g., "trivial: single-file rename",
//       "trivial: copy edit on /treaty"). Min 12 chars after the colon.
//
//   (b) Contain `plan-file: <path>` referencing a real file under
//       `.claude/plans/` or `~/.gstack/projects/<slug>/plans/`, and
//       that file must contain a `## Mike approved` section header.
//
// Otherwise hard-block with the protocol summary + the path to the
// full doc.
//
// Per `.claude/codex-delegation.md` "Plan-first protocol for
// substantial work" + memory feedback_promote_violated_text_rules_to_hooks.md.
// 2026-05-14: the doc-only version of this rule lasted ~10 minutes
// before I dispatched anonymized-preview without a plan file.

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

try {
  let hookData = null;
  try {
    const raw = readFileSync(0, "utf-8");
    if (raw && raw.trim()) hookData = JSON.parse(raw);
  } catch {
    process.exit(0);
  }
  if (!hookData) process.exit(0);
  if (hookData.tool_name !== "Bash") process.exit(0);

  const command = String(hookData?.tool_input?.command ?? "");
  if (!command) process.exit(0);

  // Skip commands that mention codex inside quoted/heredoc strings
  // rather than invoking it. `git commit -m "... codex exec ..."` and
  // similar trigger false positives. The simple heuristic: skip if
  // the FIRST token is a known non-codex tool.
  const firstToken = command.trim().split(/\s+/)[0] ?? "";
  if (/^(git|gh|grep|rg|find|cat|head|tail|sed|awk|echo|printf|ls|cd|node|pnpm|npm|yarn|tsx|powershell)$/i.test(firstToken)) {
    process.exit(0);
  }

  // Only fire on codex dispatches that start a NEW conversation.
  // `codex exec resume <uuid>` continues an existing plan-approved
  // dispatch and is allowed without re-approval.
  const isFreshDispatch = /\bcodex\s+(exec|review)\b/.test(command) &&
    !/\bcodex\s+exec\s+resume\b/.test(command) &&
    !/\bcodex\s+(login|logout|mcp|plugin|app|cloud|features|completion|update|sandbox|debug|apply|fork|help)\b/.test(command);

  if (!isFreshDispatch) process.exit(0);

  // Extract the prompt. Codex exec prompts are typically single-quoted
  // arguments. Take the longest single-quoted span (skip empty/single-char).
  const matches = [...command.matchAll(/'([\s\S]*?)'/g)];
  const promptCandidate = matches
    .map((m) => m[1])
    .filter((s) => s.length >= 12)
    .sort((a, b) => b.length - a.length)[0] ?? "";

  // Bypass A: trivial acknowledgement.
  const trivialMatch = promptCandidate.match(/^trivial:\s*(.{12,})/im);
  if (trivialMatch) {
    process.exit(0);
  }

  // Bypass C: plan-drafting dispatch. The agent's ENTIRE output is a
  // plan file (the chicken-and-egg case — you can't reference a plan
  // file that doesn't exist yet). The slug must be lowercase kebab.
  const draftMatch = promptCandidate.match(/drafting-plan-for:\s*([a-z][a-z0-9-]{2,})/im);
  if (draftMatch) {
    process.exit(0);
  }

  // Bypass D: plan critique dispatch. Phase 2 of the plan-first
  // protocol — Codex critiques an existing plan IN PLACE by
  // appending `## Codex critique (round N)`. The plan need NOT be
  // Mike-approved yet (critique happens BEFORE approval).
  const critiqueMatch = promptCandidate.match(/critiquing-plan:\s*([a-z][a-z0-9-]{2,})/im);
  if (critiqueMatch) {
    process.exit(0);
  }

  // Bypass B: plan-file reference + Mike-approved marker.
  const planMatch = promptCandidate.match(/plan[-_ ]?file:\s*([^\s`'"]+\.md)/i);
  if (planMatch) {
    const planPath = planMatch[1];
    const absPath = planPath.startsWith("/") || /^[a-zA-Z]:/.test(planPath)
      ? planPath
      : resolve(process.cwd(), planPath);

    if (!existsSync(absPath)) {
      blockWith(
        `[enforce-codex-protocol] BLOCKED — codex dispatch references plan-file at ${planPath} but the file does not exist.\n\n` +
          `Either:\n` +
          `  - Create the plan file first (see .claude/codex-delegation.md "Plan-first protocol for substantial work"), OR\n` +
          `  - Prefix the prompt with \`trivial: <12+ char reason>\` if this dispatch is small enough to skip plan-first.`
      );
    }

    const planContents = readFileSync(absPath, "utf-8");

    // Research log: must exist + cite at least one http(s) URL. AI knowledge
    // cutoffs make every vendor/API/tool assumption suspect; this catches
    // "I think Codex app-server is experimental" / "Neon doesn't have
    // anonymized branches" — claims that 60s of WebSearch would correct.
    const researchLogMatch = planContents.match(/##\s+Research log\b([\s\S]*?)(?=\n##\s|\n#\s|$)/i);
    if (!researchLogMatch) {
      blockWith(
        `[enforce-codex-protocol] BLOCKED — plan file ${planPath} has no \`## Research log\` section.\n\n` +
          `AI knowledge cutoffs make every vendor/API/tool assumption suspect. Before drafting current/proposed state, WebSearch + WebFetch the relevant vendor docs from the last 12 months. List in the plan file: search queries, URLs of canonical docs, changelog entries, anything that contradicts an assumption.\n\n` +
          `See \`.claude/codex-delegation.md\` "Plan-first protocol" step 1.`
      );
    }
    // Accept either: http(s) URLs (vendor docs) OR file:line refs
    // (repo-internal provenance like `packages/foo/bar.ts:123`).
    // Both are verifiable citations; URLs apply to third-party
    // capabilities, file:line refs apply to internal patterns. The
    // task-impact-backfill and apocalypse-framing-standardization
    // plans correctly cited file:line refs only because the work was
    // repo-internal — the URL-only rule was over-narrow.
    const hasUrl = /https?:\/\/\S+/.test(researchLogMatch[1]);
    const hasFileLineRef = /[`(\s]([a-zA-Z0-9_./-]+\.(ts|tsx|js|jsx|mjs|cjs|prisma|sql|md|json|toml|yaml|yml)):\d+/.test(researchLogMatch[1]);
    if (!hasUrl && !hasFileLineRef) {
      blockWith(
        `[enforce-codex-protocol] BLOCKED — plan file ${planPath} has \`## Research log\` but no verifiable citations.\n\n` +
          `Research log must cite at least one of:\n` +
          `  - An http(s) URL to a vendor doc / changelog / advisory (with last-updated date if visible), OR\n` +
          `  - A file:line ref like \`packages/web/src/lib/foo.ts:123\` for repo-internal provenance.\n\n` +
          `Either is verifiable. Prose without citations is what AI training data could have invented.`
      );
    }

    if (!/##\s+Mike approved/i.test(planContents)) {
      blockWith(
        `[enforce-codex-protocol] BLOCKED — plan file ${planPath} exists but has no \`## Mike approved\` section.\n\n` +
          `The 6-step protocol (codex-delegation.md):\n` +
          `  1. Claude drafts plan file (with Research log + ASCII current/proposed diagrams)\n` +
          `  2. Codex critiques in same file (\`## Codex critique (round N)\`) — verifies research log\n` +
          `  3. Iterate to convergence (max 2 rounds)\n` +
          `  4. Tell Mike the plan\n` +
          `  5. Mike approves — adds \`## Mike approved\` section to the plan file\n` +
          `  6. Codex implements via direct \`codex exec\` referencing the plan\n\n` +
          `You are at step 5. Mike has not added the approval marker yet. Stop and wait.`
      );
    }

    process.exit(0);
  }

  // No bypass present — block with the protocol summary.
  blockWith(
    `[enforce-codex-protocol] BLOCKED — codex dispatch without plan-first acknowledgement.\n\n` +
      `For substantial work (multi-system, >100 lines, schema/CI, "I thought we had" phrasing), the dispatch prompt must reference an approved plan file. The 6-step protocol:\n\n` +
      `  1. Claude drafts plan at .claude/plans/<slug>.md or ~/.gstack/projects/<slug>/plans/<slug>.md\n` +
      `     Required sections: Brief, Current state (ASCII), Proposed state (ASCII), Step list,\n` +
      `     Risks, Files to touch, ALERTS (empty), Agent log (empty).\n` +
      `  2. Codex critiques in the same file (\`## Codex critique (round N)\`).\n` +
      `  3. Claude + Codex iterate to convergence (max 2 rounds).\n` +
      `  4. Tell Mike the plan.\n` +
      `  5. Mike approves — adds \`## Mike approved\` section.\n` +
      `  6. Dispatch with: codex exec '... plan-file: .claude/plans/<slug>.md ...'\n\n` +
      `For trivial dispatches (single-file rename, copy edit, one-liner) — prefix the prompt with:\n` +
      `  trivial: <12+ chars naming why this skips plan-first>\n\n` +
      `Full protocol: .claude/codex-delegation.md "Plan-first protocol for substantial work".`
  );
} catch {
  process.exit(0);
}

function blockWith(msg) {
  process.stderr.write(msg + "\n");
  process.exit(2);
}
