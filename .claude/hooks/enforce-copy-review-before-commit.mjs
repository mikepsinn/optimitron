#!/usr/bin/env node
// enforce-copy-review-before-commit.mjs
//
// PreToolUse hook on Bash: when the command is `git commit` AND the
// staged diff touches user-facing copy files, REQUIRE the current
// turn to have shown Mike a before/after of the copy AND called
// AskUserQuestion with predicted complaints + freeform "Other".
//
// 2026-05-16 trigger: Mike, verbatim — *"And you're supposed to like
// fucking tell me what the previous text was and what you changed it
// to before you fucking commit and ask me if that's OK. If you'd
// like give me like a multiple choice questions with buttons that I
// can click if I like with the things that you think I might wanna
// change and then a freeform one. Can you add that to your protocol
// too anytime you change copy? And force yourself to do it."* — after
// I attempted to commit a /plaintiffs rewrite without showing him
// the before/after or asking.
//
// Why: copy changes are taste calls. Mike is the human gradient
// signal. I cannot judge whether the new wording lands without him.
// Committing without a before/after + AskUserQuestion ships untested
// taste into the campaign critical path.
//
// What counts as user-facing copy (must trigger this hook):
//   packages/web/src/app/**/*.tsx
//   packages/web/src/app/**/*.md  (auto-generated snapshots from the .tsx)
//   packages/web/src/components/**/*.tsx
//   packages/web/src/lib/routes.ts
//   packages/web/src/lib/messaging.ts
//   packages/web/src/lib/email/**
//   packages/web/emails/**
//   packages/web/src/components/people/*ShareCard*
//   packages/web/src/components/people/*SignatureBox*
//
// What the hook checks (best-effort, transcript-based):
//   1. Staged diff includes at least one copy file (above patterns).
//   2. Current-turn assistant text shows a before/after diff display
//      (a "BEFORE:"/"AFTER:" or "Old:"/"New:" or backtick-delimited
//      old/new blocks).
//   3. AskUserQuestion was called in the current turn.
//
// If 1 fires but 2 or 3 missing → BLOCK with corrective template.
//
// Related memory:
//   - [[feedback_one_at_a_time_review_loop_with_predicted_fixes]]
//   - [[feedback_promote_violated_text_rules_to_hooks]]
//   - [[feedback_verify_ui_fix_before_commit]]

import { existsSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const COPY_PATTERNS = [
  /^packages\/web\/src\/app\/.*\.(tsx|md)$/,
  /^packages\/web\/src\/components\/.*\.tsx$/,
  /^packages\/web\/src\/lib\/routes\.ts$/,
  /^packages\/web\/src\/lib\/messaging\.ts$/,
  /^packages\/web\/src\/lib\/email\//,
  /^packages\/web\/emails\//,
];

try {
  const raw = readFileSync(0, "utf-8");
  if (!raw || !raw.trim()) process.exit(0);

  const hookData = JSON.parse(raw);
  if (hookData?.tool_name !== "Bash") process.exit(0);

  const command = String(hookData?.tool_input?.command ?? "");
  if (!command) process.exit(0);

  // Match `git commit` invocations only. Use a negative lookahead so
  // `commit-tree`, `commit-graph`, etc. are excluded (the `\b` boundary
  // alone fires on `commit-tree` because `-` is a non-word char). Also
  // allow common config prefixes like `git -c user.email=foo commit`,
  // `git -C path commit`, `git -S commit`.
  if (!/\bgit\s+(?:(?:-[CcP]\s+\S+|-S(?:\s*\S+)?)\s+)*commit(?!\S)/.test(command)) {
    process.exit(0);
  }

  // Read staged diff name-only via git.
  let stagedFiles = [];
  try {
    const out = execSync("git diff --cached --name-only", {
      encoding: "utf-8",
      cwd: hookData?.cwd ?? process.cwd(),
      stdio: ["ignore", "pipe", "ignore"],
    });
    stagedFiles = out.split(/\r?\n/).filter(Boolean);
  } catch {
    process.exit(0);
  }
  if (stagedFiles.length === 0) process.exit(0);

  const copyFiles = stagedFiles.filter((f) =>
    COPY_PATTERNS.some((re) => re.test(f.replace(/\\/g, "/"))),
  );
  if (copyFiles.length === 0) process.exit(0);

  // Read the current-turn assistant text from the transcript.
  const transcriptPath =
    hookData?.transcript_path ?? hookData?.transcriptPath;
  let chatText = "";
  let askedThisTurn = false;
  if (typeof transcriptPath === "string" && existsSync(transcriptPath)) {
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
      // AskUserQuestion responses come through as text-content user
      // messages prefixed with "User has answered your questions:". They
      // are NOT new human-initiated messages — without this skip, every
      // copy-review confirmation click resets the lastHumanIndex pointer,
      // creating an infinite re-ask loop (Mike caught this 2026-05-17
      // after 3 forced re-confirmations of the same diff).
      const text =
        typeof content === "string"
          ? content
          : Array.isArray(content)
            ? content
                .map((p) =>
                  typeof p?.text === "string" ? p.text : "",
                )
                .join("")
            : "";
      if (/^\s*User has answered your questions:/i.test(text)) continue;
      lastHumanIndex = i;
    }

    for (let i = lastHumanIndex + 1; i < entries.length; i += 1) {
      const e = entries[i];
      if (e?.type !== "assistant") continue;
      const content = e?.message?.content;
      if (!Array.isArray(content)) continue;
      for (const part of content) {
        if (part?.type === "text" && typeof part.text === "string") {
          chatText += part.text + "\n";
        }
        if (part?.type === "tool_use" && part?.name === "AskUserQuestion") {
          askedThisTurn = true;
        }
      }
    }
  }

  // Heuristic: did I show a before/after?
  //
  // Require explicit labeled markers matching the template the hook
  // prints on failure. The prior "any `before` near any `after` within
  // 400 chars" was a near-no-op — incidental prose like "before commit,
  // review changes; after that, ship" satisfied it, and "the header was
  // too long; now shorter" satisfied the `was…now` fallback. Mike's
  // template uses **BEFORE:** / **AFTER:** so we require those tokens
  // (case-insensitive, optional markdown bolding) — they don't appear
  // in narrative prose.
  const ctRaw = chatText; // keep case for marker detection
  const ct = ctRaw.toLowerCase();
  const hasBeforeMarker = /(\*\*|__|^|\n)\s*before\s*[:\*]/i.test(ctRaw);
  const hasAfterMarker = /(\*\*|__|^|\n)\s*after\s*[:\*]/i.test(ctRaw);
  const hasOldNewMarkers =
    /(\*\*|__|^|\n)\s*old\s*[:\*]/i.test(ctRaw) &&
    /(\*\*|__|^|\n)\s*new\s*[:\*]/i.test(ctRaw);
  const showsBeforeAfter =
    (hasBeforeMarker && hasAfterMarker) || hasOldNewMarkers;

  if (showsBeforeAfter && askedThisTurn) process.exit(0);

  const fileList = copyFiles.map((f) => `  - ${f}`).join("\n");
  const msg =
    `[enforce-copy-review-before-commit] BLOCKED — copy commit without before/after review.\n\n` +
    `Staged copy files:\n${fileList}\n\n` +
    `Missing in current turn:\n` +
    (showsBeforeAfter ? `` : `  - Before/After diff display (Mike needs to see OLD text + NEW text in chat)\n`) +
    (askedThisTurn ? `` : `  - AskUserQuestion with predicted complaints + freeform Other\n`) +
    `\n` +
    `Required template before re-attempting commit:\n\n` +
    `  **BEFORE:** <verbatim old copy>\n\n` +
    `  **AFTER:** <verbatim new copy>\n\n` +
    `  Predicted complaints:\n` +
    `  1. **A: Looks good, ship it**\n` +
    `  2. **B: <predicted issue 1>**\n` +
    `  3. **C: <predicted issue 2>**\n` +
    `  4. **D: <predicted issue 3>**\n` +
    `  (Other: freeform — Mike types his own complaint)\n\n` +
    `  [AskUserQuestion call here]\n\n` +
    `Why: copy changes are taste calls; Mike is the human gradient signal.\n` +
    `Rule lives at: feedback_show_before_after_and_ask_before_copy_commit.md\n` +
    `Doc: .claude/codex-delegation.md (delegation rules)\n` +
    `Related hook: review-loop-gate.mjs (post-deploy review queue)`;

  process.stderr.write(msg + "\n");
  process.exit(2);
} catch {
  process.exit(0);
}
