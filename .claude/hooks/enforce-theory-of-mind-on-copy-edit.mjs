#!/usr/bin/env node
// enforce-theory-of-mind-on-copy-edit.mjs
//
// PreToolUse hook on Edit / Write / MultiEdit: when the file path
// matches user-facing copy (route pages, components, lib/routes,
// lib/messaging, email templates), REQUIRE the current-turn chat
// text to contain a theory-of-mind block — explicit Audience, Goal,
// and Theory-of-Mind reader simulation — BEFORE the edit lands.
//
// 2026-05-16 trigger: Mike, verbatim — *"Like it would be nice if
// you like simulated a theory of mind of the viewer, the reader of
// everything that we write instead of. It seems like you're not
// doing that, am I? And like, figure out what we want them to do.
// On the page who it is and what words would make them do what we
// want them to do? It seems like you're just like throwing a bunch
// of words on the pages. That are similar to whatever the fuck I
// said. Like is it possible to force you to do this and would it
// help if we did?"*
//
// Sister hook: enforce-audience-and-goal-on-ui-dispatch.mjs fires
// only on Codex dispatches. This hook fires on direct Edit/Write —
// the gap that lets me ship copy without simulating the reader.
//
// What counts as user-facing copy (triggers this hook):
//   packages/web/src/app/**/page.tsx
//   packages/web/src/app/**/page.logged-out.md (auto-generated; skip)
//   packages/web/src/components/**/*.tsx (component-level copy)
//   packages/web/src/lib/routes.ts
//   packages/web/src/lib/messaging.ts
//   packages/web/src/lib/email/**
//   packages/web/emails/**
//
// What the hook checks (current-turn assistant text):
//   1. An Audience phrase — concrete persona naming (audience, viewer,
//      reader, persona, "who", "grieving family", "org leaders",
//      "donors", "voters", "plaintiffs", "signers", "endorsers",
//      "politicians", "the user is", "people who")
//   2. A Goal phrase — concrete action (goal, want them to, action,
//      conversion, primary action, click, sign, register, endorse,
//      donate, vote, share, scroll to)
//   3. A reader-simulation phrase — theory of mind, blocker, what
//      stops, what makes them act, what they fear, what converts
//
// All three must be present in the assistant text written between
// the last human user message and the current Edit/Write call.
// Missing any => BLOCK with corrective template.
//
// Bypass conditions:
//   - File is page.logged-out.md (auto-generated snapshot)
//   - File matches packages/web/src/lib/email/*.ts AND change is
//     mechanical (handled by separate enforce hook)
//   - Edit is a trivial mechanical change (typo, import reorder,
//     formatting) — but we can't detect that here, so we don't
//     bypass — the hook is best-effort, not a tribunal.

import { existsSync, readFileSync } from "node:fs";

const COPY_PATTERNS = [
  /^packages\/web\/src\/app\/.*\/page\.tsx$/,
  /^packages\/web\/src\/components\/.*\.tsx$/,
  /^packages\/web\/src\/lib\/routes\.ts$/,
  /^packages\/web\/src\/lib\/messaging\.ts$/,
  /^packages\/web\/src\/lib\/email\//,
  /^packages\/web\/emails\//,
];

// Skip auto-generated snapshots and tests.
const SKIP_PATTERNS = [
  /\.logged-out\.md$/,
  /\.email\.md$/,
  /\.test\.tsx?$/,
  /\.spec\.tsx?$/,
];

try {
  const raw = readFileSync(0, "utf-8");
  if (!raw || !raw.trim()) process.exit(0);

  const hookData = JSON.parse(raw);
  const tool = hookData?.tool_name;
  if (tool !== "Edit" && tool !== "Write" && tool !== "MultiEdit") {
    process.exit(0);
  }

  const filePath = String(hookData?.tool_input?.file_path ?? "");
  if (!filePath) process.exit(0);

  const normalized = filePath.replace(/\\/g, "/");
  if (SKIP_PATTERNS.some((re) => re.test(normalized))) process.exit(0);

  const matchesCopy = COPY_PATTERNS.some((re) =>
    re.test(normalized) ||
    re.test(normalized.replace(/^.*\/packages\//, "packages/")),
  );
  if (!matchesCopy) process.exit(0);

  // Read current-turn assistant text from transcript.
  const transcriptPath =
    hookData?.transcript_path ?? hookData?.transcriptPath;
  if (typeof transcriptPath !== "string" || !existsSync(transcriptPath)) {
    process.exit(0); // can't verify, fail open
  }

  const lines = readFileSync(transcriptPath, "utf-8").split(/\r?\n/);
  const entries = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      entries.push(JSON.parse(line));
    } catch {
      // ignore malformed
    }
  }

  let lastHumanIndex = -1;
  for (let i = 0; i < entries.length; i += 1) {
    const e = entries[i];
    if (e?.type !== "user") continue;
    if (e?.sourceToolAssistantUUID) continue;
    const content = e?.message?.content;
    if (Array.isArray(content)) {
      if (content.every((part) => part?.type === "tool_result")) continue;
    } else if (typeof content !== "string") {
      continue;
    }
    lastHumanIndex = i;
  }

  let chatText = "";
  for (let i = lastHumanIndex + 1; i < entries.length; i += 1) {
    const e = entries[i];
    if (e?.type !== "assistant") continue;
    const content = e?.message?.content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (part?.type === "text" && typeof part.text === "string") {
        chatText += part.text + "\n";
      }
    }
  }

  const ct = chatText.toLowerCase();

  // Transcript flush is unreliable at PreToolUse time — if we have
  // <100 chars of text, exit advisory not blocking.
  if (ct.length < 100) {
    process.stderr.write(
      `[enforce-theory-of-mind-on-copy-edit] ADVISORY — chat text too short to verify; if I haven't simulated the reader for ${filePath}, do so before the next edit.\n`,
    );
    process.exit(0);
  }

  // Audience: concrete persona naming
  const audienceHit =
    /\baudience\b/.test(ct) ||
    /\bpersona\b/.test(ct) ||
    /\b(who|whom)\b.*\b(is|are|reads?|visits?|views?|opens?)\b/.test(ct) ||
    /\bviewer\b/.test(ct) ||
    /\breader\b/.test(ct) ||
    /\bgrieving (family|family member|relative)\b/.test(ct) ||
    /\b(org leaders?|donors?|voters?|plaintiffs?|signers?|endorsers?|politicians?|presidents?|signatories?|recruiters?|coalition partners?|public figures?)\b/.test(ct) ||
    /\bthe (user|visitor) (is|are|wants|sees|reads|views|arrives)\b/.test(ct) ||
    /\bpeople who\b/.test(ct);

  // Goal: concrete desired action
  const goalHit =
    /\bgoal\b/.test(ct) ||
    /\bwe want\b/.test(ct) ||
    /\bwant them to\b/.test(ct) ||
    /\bprimary action\b/.test(ct) ||
    /\bthe conversion\b/.test(ct) ||
    /\bcta\b/.test(ct) ||
    /\bnext step\b/.test(ct) ||
    /\b(click|sign|register|endorse|donate|vote|share|subscribe|scroll to|fill (in|out)|submit|tap)\s+(the|a|on|to|down|→)?/i.test(ct);

  // Theory of mind: explicit reader simulation
  const tomHit =
    /\btheory of mind\b/.test(ct) ||
    /\bblocker(s)?\b/.test(ct) ||
    /\bwhat (stops|blocks|prevents|makes|gets) them\b/.test(ct) ||
    /\bthey (fear|worry|wonder|hesitate|think|expect)\b/.test(ct) ||
    /\bconvert(s|ed|ing|er)?\b/.test(ct) ||
    /\b(scam|credible|credibility|trustworth)/.test(ct) ||
    /\b(what they want|what converts them|what pushes them)\b/.test(ct);

  if (audienceHit && goalHit && tomHit) process.exit(0);

  const missing = [];
  if (!audienceHit) missing.push("Audience (concrete persona)");
  if (!goalHit) missing.push("Goal (concrete action)");
  if (!tomHit) missing.push("Theory of mind (reader's blockers + lever)");

  const msg =
    `[enforce-theory-of-mind-on-copy-edit] BLOCKED — copy edit without reader simulation.\n\n` +
    `File: ${filePath}\n\n` +
    `Missing in current turn's chat text:\n${missing.map((m) => `  - ${m}`).join("\n")}\n\n` +
    `Required template before re-attempting Edit/Write:\n\n` +
    `  **Audience:** <concrete persona — who arrives at this page and why>\n` +
    `  **Goal:** <one concrete action — what we want them to do>\n` +
    `  **Theory of mind:** <what they want, what blocks them, what converts them>\n\n` +
    `Then write the edit. The simulation is the whole point — without it, copy is\n` +
    `"throwing a bunch of words" (Mike's words) at strangers.\n\n` +
    `Sister hooks: enforce-audience-and-goal-on-ui-dispatch.mjs (Codex dispatches),\n` +
    `enforce-copy-review-before-commit.mjs (before/after + AskUserQuestion).\n` +
    `Rule lives at: feedback_simulate_reader_theory_of_mind_before_copy_edit.md`;

  process.stderr.write(msg + "\n");
  process.exit(2);
} catch {
  process.exit(0);
}
