#!/usr/bin/env node
// enforce-manual-search-in-copy-dispatch.mjs
//
// PreToolUse hook on Bash: when a fresh `codex exec` dispatch
// targets user-facing copy work, require the prompt to also
// instruct Codex to manual-search FIRST. The rule lives at
// CLAUDE.md line 41:
//
//   "Manual-search before proposing copy. Any agent that writes or
//    critiques user-facing text MUST call
//    mcp__optimitron-tasks__searchManual (or askWishonia) before
//    suggesting replacement wording. Quoting from the manual beats
//    inventing prose."
//
// Same text-rule-vs-enforcement pattern as the other hooks I built
// this session. 2026-05-14: dispatched Codex to draft apocalypse
// copy across 13 surfaces without instructing manual-search.
// Codex invented "layers of nuclear overkill" — worse than what's
// already in the manual. User rejected and reminded me the rule
// exists.
//
// Strategy: detect copy-writing dispatches by keyword density.
// High-confidence triggers (multiple matches in the prompt):
//   replacement text, replacement copy, replacement wording,
//   rewrite, redraft, draft copy, draft new copy, draft replacement,
//   user-facing copy, user-facing text, user-facing prose,
//   tagline, headline copy, button label
// Plus single-strong-signal triggers:
//   "propose copy", "propose wording", "exact wording",
//   "exact replacement", "exact copy", "verbatim copy"
//
// Then check the prompt mentions one of:
//   searchManual, askWishonia, manual.warondisease.org/assets/json/search-index,
//   manual-search, search the manual, manual\.warondisease\.org
//
// If copy-writing detected AND no manual-search reference → block
// with a corrective message.
//
// Bypasses (skip the check entirely):
//   - trivial: prefix       (small mechanical change, no new copy)
//   - drafting-plan-for:    (plan files document strategy not new copy)
//   - critiquing-plan:      (critique evaluates existing plan)
//
// Per `feedback_promote_violated_text_rules_to_hooks.md`.

import { readFileSync } from "node:fs";

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

  // Skip non-codex commands (same skip-list as enforce-codex-protocol).
  const firstToken = command.trim().split(/\s+/)[0] ?? "";
  if (/^(git|gh|grep|rg|find|cat|head|tail|sed|awk|echo|printf|ls|cd|node|pnpm|npm|yarn|tsx|powershell)$/i.test(firstToken)) {
    process.exit(0);
  }

  // Only fire on fresh codex exec dispatches.
  const isFreshDispatch = /\bcodex\s+(exec|review)\b/.test(command) &&
    !/\bcodex\s+exec\s+resume\b/.test(command);
  if (!isFreshDispatch) process.exit(0);

  // Extract the longest single-quoted span as the prompt.
  const matches = [...command.matchAll(/'([\s\S]*?)'/g)];
  const prompt = matches
    .map((m) => m[1])
    .filter((s) => s.length >= 12)
    .sort((a, b) => b.length - a.length)[0] ?? "";

  // Bypass: trivial / plan-drafting / plan-critique dispatches.
  if (/^\s*(trivial|drafting-plan-for|critiquing-plan):/im.test(prompt)) {
    process.exit(0);
  }

  // Copy-writing detection. Two tiers.
  const HIGH_CONFIDENCE_PHRASES = [
    "propose copy",
    "propose wording",
    "exact wording",
    "exact replacement",
    "exact copy",
    "verbatim copy",
    "draft replacement",
    "draft new copy",
    "draft copy",
    "draft the copy",
    "rewrite the copy",
    "rewrite the wording",
    "replacement text",
    "replacement copy",
    "replacement wording",
    "replacement string",
    "replacement headline",
    "user-facing copy",
    "user-facing text",
    "user-facing prose",
    "user-facing string",
  ];
  const KEYWORD_TERMS = [
    "rewrite",
    "redraft",
    "tagline",
    "headline copy",
    "button label",
    "wording",
    "phrasing",
    "messaging",
    "marketing copy",
    "share copy",
    "share text",
    "email copy",
    "campaign copy",
  ];

  const lowerPrompt = prompt.toLowerCase();
  const highHit = HIGH_CONFIDENCE_PHRASES.some((p) => lowerPrompt.includes(p));
  const keywordHits = KEYWORD_TERMS.filter((k) => lowerPrompt.includes(k)).length;

  const isCopyDispatch = highHit || keywordHits >= 2;
  if (!isCopyDispatch) process.exit(0);

  // Already references manual-search?
  const MANUAL_SEARCH_PATTERNS = [
    /searchManual/,
    /askWishonia/,
    /manual\.warondisease\.org/i,
    /manual-search/i,
    /search\s+the\s+manual/i,
    /manual\s+search/i,
    /search-index\.json/,
  ];
  if (MANUAL_SEARCH_PATTERNS.some((rx) => rx.test(prompt))) {
    process.exit(0);
  }

  // Detected copy-writing dispatch WITHOUT manual-search instruction.
  const msg =
    `[enforce-manual-search-in-copy-dispatch] BLOCKED — copy-writing Codex dispatch lacks manual-search instruction.\n\n` +
    `CLAUDE.md line 41 requires every copy-writing or copy-critiquing dispatch to instruct the agent to manual-search FIRST. Quoting from the manual beats inventing prose. Today (2026-05-14) Codex invented "layers of nuclear overkill" — strictly worse than the existing manual phrasing "Your governments possess nuclear weapons sufficient to end civilization N times but have not cured Alzheimer's once."\n\n` +
    `Add this paragraph to the dispatch prompt and retry:\n\n` +
    `  Before drafting any replacement copy, call \`mcp__optimitron-tasks__searchManual\` (or \`askWishonia\` for full RAG) with relevant queries for the topic. Fallback when MCP is not available: curl https://manual.warondisease.org/assets/json/search-index.json and grep. Cite the manual snippet you found. If the manual returns nothing usable, say so explicitly THEN propose new copy.\n\n` +
    `Bypass: prefix the prompt with \`trivial: <reason>\` if this dispatch is genuinely not new copy work (e.g. a mechanical search/replace already designed elsewhere).`;

  process.stderr.write(msg + "\n");
  process.exit(2);
} catch {
  process.exit(0);
}
