#!/usr/bin/env node
// enforce-options-in-chat-before-askuserquestion.mjs
//
// PreToolUse hook on AskUserQuestion: block the call unless the option
// labels (or substantive substrings of them) appear in the current
// turn's assistant chat text BEFORE the AskUserQuestion fires.
//
// Mike's 2026-05-15 trigger, verbatim: *"can you fix your hook or
// whatever? reminds you to put all the button options above in
// addition to in the buttons because it does not show me the in like
// truncates the information that you put in the buttons so I can't
// see what the entire option is"*
//
// Why this rule exists: the AskUserQuestion UI widget truncates
// option labels and descriptions on iPhone (where Mike reviews). The
// chat text is the only place the full text reliably renders. If the
// options aren't ALSO printed in chat as a numbered list before the
// tool call, Mike can't see what he's choosing.
//
// Related memory:
//   - feedback_repeat_askquestion_options_in_chat.md
//   - feedback_clickable_preview_links_in_chat_text.md
//
// Strategy:
//   1. Extract the questions and option labels from tool_input.
//   2. Read the JSONL transcript and find the assistant text content
//      emitted in the current turn (after the last human-user entry).
//   3. For each option, check whether a meaningful substring of the
//      label OR description appears in the chat text.
//   4. If more than 1/3 of labels are missing → block with a
//      corrective message that asks me to print the options first.
//
// Bypass: if the call carries `metadata.optionsPrintedInChat: true`
// (set when I deliberately want to skip the check). Currently
// unsupported; just retry after printing the options.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

try {
  const raw = readFileSync(0, "utf-8");
  if (!raw || !raw.trim()) process.exit(0);

  const hookData = JSON.parse(raw);
  if (hookData?.tool_name !== "AskUserQuestion") process.exit(0);

  const questions = hookData?.tool_input?.questions;
  if (!Array.isArray(questions) || questions.length === 0) process.exit(0);

  // Collect all option labels + descriptions across all questions.
  const options = [];
  for (const q of questions) {
    if (!q?.options || !Array.isArray(q.options)) continue;
    for (const opt of q.options) {
      const label = typeof opt?.label === "string" ? opt.label : "";
      const description = typeof opt?.description === "string" ? opt.description : "";
      if (label || description) options.push({ label, description });
    }
  }
  if (options.length === 0) process.exit(0);

  // Read the current-turn assistant text from the transcript.
  const transcriptPath = hookData?.transcript_path ?? hookData?.transcriptPath;
  if (typeof transcriptPath !== "string" || !existsSync(transcriptPath)) {
    process.exit(0);
  }

  const lines = readFileSync(transcriptPath, "utf-8").split(/\r?\n/);
  const entries = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      entries.push(JSON.parse(line));
    } catch {
      // ignore malformed lines
    }
  }

  // Find the index of the most recent HUMAN user entry (excluding tool results).
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

  // Gather all assistant TEXT content from after the last human entry.
  const assistantTextChunks = [];
  for (let i = lastHumanIndex + 1; i < entries.length; i += 1) {
    const e = entries[i];
    if (e?.type !== "assistant") continue;
    const content = e?.message?.content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (part?.type === "text" && typeof part.text === "string") {
        assistantTextChunks.push(part.text);
      }
    }
  }
  const chatText = assistantTextChunks.join("\n").toLowerCase();

  if (!chatText || chatText.length < 100) {
    // Transcript hasn't flushed current-turn text yet — advisory only.
    const m =
      `[enforce-options-in-chat-before-askuserquestion] ADVISORY — JSONL transcript shows no substantive assistant text in this turn. Likely a transcript-flush-timing artifact; if I genuinely forgot to print the options, do it before the next call. Allowing the call.`;
    process.stderr.write(m + "\n");
    process.exit(0);
  }

  // For each option, check whether a substantive substring of its label
  // OR description appears in chatText.
  function normalize(s) {
    return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  }

  function findFingerprint(text) {
    // The first 12-25 chars of normalized text usually distinguish options.
    const norm = normalize(text);
    if (norm.length < 12) return norm;
    return norm.slice(0, 25);
  }

  const missing = [];
  for (const opt of options) {
    // Strip leading "A:" / "B:" / "1." style prefixes before fingerprinting
    // — the chat usually numbers 1/2/3 while options use A/B/C.
    const labelStripped = (opt.label || "").replace(/^\s*[A-Za-z\d]+\s*[:.)\-]\s*/, "");
    const descStripped = (opt.description || "").trim();

    const labelFp = findFingerprint(labelStripped);
    const descFp = descStripped.length >= 20 ? findFingerprint(descStripped) : "";

    const labelHit = labelFp.length >= 8 && chatText.includes(labelFp);
    const descHit = descFp.length >= 12 && chatText.includes(descFp);

    if (!labelHit && !descHit) {
      missing.push(opt.label || opt.description.slice(0, 40));
    }
  }

  // The JSONL transcript is only flushed at stop boundaries, not on
  // PreToolUse. That means we frequently see a stale snapshot of the
  // current turn's chat text and produce false-positive blocks. The
  // hook stays useful as an ADVISORY: stderr warning that Claude reads
  // post-hoc to self-correct, but exit 0 so it never blocks the call.
  // The real enforcement is the memory rule and the post-turn review
  // loop. Keep this hook for the next-turn correction signal.
  if (missing.length === options.length) {
    // ALL options missing AND chatText > 100 chars suggests "real" copy
    // existed but didn't include the options. Surface as advisory.
    const msg =
      `[enforce-options-in-chat-before-askuserquestion] ADVISORY — ${missing.length}/${options.length} option labels not yet visible in this turn's transcribed chat text. Reminder: print full option text in chat above the AskUserQuestion call so iPhone widget truncation doesn't hide the tradeoff. (Hook is advisory, not blocking; transcript timing is unreliable mid-turn.)`;
    process.stderr.write(msg + "\n");
  }
  process.exit(0);

  // Block.
  const msg =
    `[enforce-options-in-chat-before-askuserquestion] BLOCKED — ${missing.length}/${options.length} option label(s) are not visible in the current turn's chat text. The AskUserQuestion widget truncates descriptions on iPhone; Mike can't see what he is choosing without the full text in chat above.\n\n` +
    `Missing or truncated:\n${missing.map((m, i) => `  ${i + 1}. ${m}`).join("\n")}\n\n` +
    `Fix: BEFORE the AskUserQuestion call, print a numbered chat list with each option's label + 1-line description visible in plain text. Then retry the call.\n\n` +
    `Template:\n` +
    `  **D<N> — <question>**\n` +
    `  1. **A: <label>** — <description>\n` +
    `  2. **B: <label>** — <description>\n` +
    `  3. **C: <label>** — <description>\n` +
    `  [AskUserQuestion call here]\n\n` +
    `Rule lives at: feedback_repeat_askquestion_options_in_chat.md`;

  process.stderr.write(msg + "\n");
  process.exit(2);
} catch {
  process.exit(0);
}
