#!/usr/bin/env node
// verify-ui-changes.mjs
//
// Stop-hook gate for the optimitron repo. Cross-platform (Node) port of the
// PowerShell original. Catches the recurring failure modes the user has
// flagged: shipping UI fixes without verifying the render, committing
// startup-bro copy, hardcoding numbers that should use <ParameterValue>,
// bloating CLAUDE.md.
//
// Exit codes (Stop / PreToolUse convention):
//   0  — allow stop / tool call
//   2  — block; stderr is shown to Claude as continuation context
//
// Fail-open: any unexpected error returns 0.

import { execSync } from "node:child_process";
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { join, resolve } from "node:path";

const RepoRoot = process.env.CLAUDE_PROJECT_DIR
  ? resolve(process.env.CLAUDE_PROJECT_DIR)
  : process.cwd();
const ScreenshotDir = join(RepoRoot, "packages/web/output/playwright");

try {
  let hookData = null;
  try {
    const raw = readFileSync(0, "utf-8");
    if (raw && raw.trim()) hookData = JSON.parse(raw);
  } catch {
    // No stdin or non-JSON. Some events (Stop, PreToolUse) always have stdin;
    // others may not. Either way, we continue.
  }

  // Break Stop-hook infinite loops.
  if (hookData?.stop_hook_active === true) process.exit(0);

  if (!existsSync(join(RepoRoot, ".git"))) process.exit(0);

  // --- Diff / file lists ----------------------------------------------------
  // Inspect ONLY staged content (--cached). The hook fires on `git commit`,
  // and the only thing being committed is what's been staged via `git add`.
  // Reading the entire working tree pulls in parallel agents' unstaged work,
  // which used to force a `git stash --keep-index` dance to satisfy the hook —
  // and that dance silently dropped Codex's edits at least once this session.
  const diffNames = git("diff --cached --name-only")
    .split("\n")
    .filter(Boolean);
  // Untracked files aren't staged-by-default; only flag them if they're in
  // the staged set (paths-mode `git add` on a previously-untracked file).
  const stagedSet = new Set(diffNames);
  const untracked = git("ls-files --others --exclude-standard")
    .split("\n")
    .filter(Boolean)
    .filter((f) => stagedSet.has(f));
  const allChanged = [...new Set([...diffNames, ...untracked])];

  const diffBody = git("diff --cached --unified=0").split("\n");

  // Lines added in the diff, with their owning file path tracked so JSX checks
  // can skip test files.
  const added = [];
  let currentFile = null;
  for (const line of diffBody) {
    const fileMatch = line.match(/^\+\+\+ b\/(.+)$/);
    if (fileMatch) {
      currentFile = fileMatch[1];
      continue;
    }
    if (line.startsWith("+") && !line.startsWith("+++")) {
      added.push({ file: currentFile, text: line.slice(1) });
    }
  }
  const addedLines = added.map((a) => a.text);

  const uiFiles = allChanged.filter((f) =>
    /^packages\/web\/src\/(app|components)\/.+\.(tsx|css|scss)$/.test(f),
  );
  const copyFiles = allChanged.filter((f) =>
    /^packages\/web\/src\/app\/.+\.md$/.test(f),
  );
  const emailFiles = allChanged.filter((f) =>
    /^packages\/web\/(emails|src\/(emails|lib\/email))\//.test(f),
  );
  const testFiles = allChanged.filter(
    (f) =>
      /\.(test|spec)\.(ts|tsx|js|jsx|mjs)$/.test(f) || /__tests__\//.test(f),
  );
  const newReusableFiles = untracked.filter(
    (f) =>
      /^packages\/web\/src\/(components|lib)\/.+\.(ts|tsx)$/.test(f) &&
      !/\.(test|spec)\./.test(f),
  );
  const claudeMd = allChanged.includes("CLAUDE.md");

  // --- qa-passed gate ----------------------------------------------------
  // When a commit touches user-facing surfaces (UI components, page copy,
  // email templates, library code that those import), require the commit
  // message to contain a `qa-passed: <one-line summary>` promise. The
  // promise is Claude's acknowledgement that a Codex preflight agent
  // validated the change — ran relevant regens, ran relevant tests,
  // reviewed generated markdown/screenshot diffs, fixed problems, and
  // came back clean. The hook doesn't enforce the agent ran; it enforces
  // the human-readable promise. See .claude/codex-delegation.md for the
  // dispatch pattern Claude is supposed to follow.
  const userFacingChanges = [...uiFiles, ...copyFiles, ...emailFiles];
  if (userFacingChanges.length > 0 && hookData?.tool_name === "Bash") {
    const cmd = hookData?.tool_input?.command ?? "";
    // Pull the commit message body from `-m "..."`, `-m '...'`, or `-F <path>`.
    // Heredoc form (`cat <<'EOF' ... EOF`) appears verbatim in the command
    // string so a simple includes() also catches it.
    const hasPromise = /qa[-\s]?passed\s*:/i.test(cmd);
    if (!hasPromise) {
      pushViolation(
        "QA_PASSED",
        userFacingChanges.length,
        `QA-PASSED GATE: commit touches user-facing files but the message lacks a qa-passed promise.

Dispatch a Codex preflight agent first. State the goal in plain English: validate this changeset, decide what's relevant to regen and test, run it, review the generated artifacts, fix any problems, iterate until clean. Don't enumerate file globs or test commands — Codex decides what's relevant from the diff itself.

When Codex returns clean, add a line to your commit message like:
  qa-passed: <one-line summary of what Codex found and fixed>

If the touched files are genuinely not user-facing (false positive), say so explicitly:
  qa-passed: skipped — <reason>

Files in this changeset that triggered the gate:
${userFacingChanges.slice(0, 8).map((f) => `  - ${f}`).join("\n")}${
          userFacingChanges.length > 8 ? `\n  ... and ${userFacingChanges.length - 8} more` : ""
        }`,
      );
    }
  }

  // Structured violations: each item has { name, count, message, blocking }.
  // - `blocking: true`  — real bug class (voice violations, hardcoded
  //                       numbers, swallowed errors, copy-snapshot drift,
  //                       CLAUDE.md bloat). Fails the commit.
  // - `blocking: false` — advisory file-pattern match (email/page/test
  //                       files changed; new lib file added). Prints the
  //                       reminder but does NOT fail the commit. Real
  //                       content concerns from these areas surface via
  //                       voice-critic / Codex review / human review
  //                       elsewhere.
  // The Stop-hook emit path summarizes (one-line). The PreToolUse(Bash)
  // emit path shows the full message.
  const violations = [];
  // True when called from the PreToolUse Bash hook (commit attempt) —
  // any time `hookData.tool_name` is set. Falsy on Stop firings.
  const isCommitAttempt = Boolean(hookData?.tool_name);
  function pushViolation(name, count, message, options = {}) {
    violations.push({ name, count, message, blocking: options.blocking !== false });
  }

  // --- Check 1: UI changes without a fresh screenshot ---------------------
  if (uiFiles.length) {
    let lastUiMtime = 0;
    for (const f of uiFiles) {
      const full = join(RepoRoot, f);
      if (existsSync(full)) {
        const m = statSync(full).mtimeMs;
        if (m > lastUiMtime) lastUiMtime = m;
      }
    }
    let newestScreenshotMs = 0;
    if (existsSync(ScreenshotDir)) {
      newestScreenshotMs = newestFileMtime(ScreenshotDir, /\.png$/);
    }
    if (!newestScreenshotMs || newestScreenshotMs < lastUiMtime) {
      pushViolation("SCREENSHOT", uiFiles.length, formatList(
        `SCREENSHOT GATE: UI files changed but no PNG under ${ScreenshotDir} is newer than them.`,
        uiFiles,
        `Action: figure out which routes these affect, screenshot each (auth + unauth where relevant) via
  the chrome-devtools or Playwright MCP, then READ the PNGs and verify the change landed AND nothing
  adjacent broke. Don't commit on faith.`,
      ), { blocking: false });
    }
  }

  // --- Check 2: banned voice / startup-bro vocab in added lines -----------
  const bannedExact = [
    "Take ownership", "Take this on", "Get started",
    "We're building", "Let's take a moment", "welcome to", "in this section",
  ];
  const bannedRegex = [
    /\bEngage\b/, /\bEmpower\b/, /\bUnlock\b/, /\bStreamline\b/,
    /\boff-ramp\b/, /\bincentive layer\b/, /\bthe protocol that\b/, /\bfundamentally\b/,
    /\brails\b/, /\bsubstrate\b/, /\bprimitive\b/, /\bstack\b/,
    /\bpressure (?:the )?politicians?\b/, /\bpolitical pressure\b/,
  ];
  // Voice gate only fires on user-facing copy. Skip internal docs / hook
  // configs / agent definitions that legitimately LIST banned words as
  // patterns to flag (e.g. voice-critic.md, CLAUDE.md, verify-ui-changes.mjs).
  function isUserFacingFile(file) {
    if (!file) return false;
    if (file.startsWith(".claude/")) return false;
    if (file === "CLAUDE.md" || file === "AGENTS.md" || file === "TODO.md") return false;
    if (file.startsWith(".github/")) return false;
    if (file.startsWith(".husky/")) return false;
    return true;
  }
  const voiceHits = [];
  for (const { file, text } of added) {
    if (!isUserFacingFile(file)) continue;
    for (const p of bannedExact) {
      if (text.includes(p)) voiceHits.push(`  - '${p}' -> ${text.trim()}`);
    }
    for (const rx of bannedRegex) {
      if (rx.test(text)) voiceHits.push(`  - /${rx.source}/ -> ${text.trim()}`);
    }
  }
  if (voiceHits.length) {
    const sample = unique(voiceHits).slice(0, 12).join("\n");
    pushViolation("VOICE", voiceHits.length, `VOICE GATE: banned vocabulary in added copy. Rewrite per CLAUDE.md Wishonia voice + Vonnegut rule
(plain declaratives, numbers beat adjectives, no corporate verbs, no infrastructure metaphors).
${sample}`);
  }

  // --- Check 3: hardcoded numbers in JSX that should use <ParameterValue> -
  const paramHits = [];
  for (const { file, text } of added) {
    if (!file || !file.endsWith(".tsx")) continue;
    if (/__tests__|\.test\.|\.spec\./.test(file)) continue;
    if (
      />\s*\$?[\d,.]+\s*(million|billion|trillion|years?|days?|hours?|months?|weeks?|%)\b[^<]*</.test(text) &&
      !text.includes("ParameterValue") &&
      !/\/\/\s*allow-hardcoded/.test(text)
    ) {
      paramHits.push(`  - ${file} :: ${text.trim()}`);
    }
  }
  if (paramHits.length) {
    const sample = paramHits.slice(0, 8).join("\n");
    pushViolation("PARAMETER", paramHits.length, `PARAMETER GATE: hardcoded number(s) in JSX. Use <ParameterValue paramId="..." figures={3} /> so the
citation popover + sig-fig rule fires. Grep packages/data/src/parameters/parameters-calculations-citations.ts
for a matching parameter; add one if it's truly new. Override with '// allow-hardcoded' on the line
only when there's no underlying datum (rare).
${sample}`);
  }

  // --- Check 4: CLAUDE.md bloat -------------------------------------------
  if (claudeMd) {
    // Count + lines that belong to CLAUDE.md specifically, not the whole diff.
    const claudeAdded = added.filter((a) => a.file === "CLAUDE.md").length;
    if (claudeAdded > 12) {
      pushViolation("CLAUDE.MD_BLOAT", claudeAdded, `CLAUDE.MD BLOAT GATE: CLAUDE.md grew by ~${claudeAdded} added lines. The file's own meta-rule says
"minimum words to convey the rule. One example only." Move detail into .claude/agents/*.md or
.claude/<topic>.md. Trim before committing.`);
    }
  }

  // --- Check 5: copy-snapshot drift ---------------------------------------
  if (uiFiles.length && !copyFiles.length) {
    const tsxPageChanges = uiFiles.filter((f) =>
      /^packages\/web\/src\/app\/.+\/page\.tsx$/.test(f),
    );
    if (tsxPageChanges.length) {
      pushViolation("COPY_SNAPSHOT", tsxPageChanges.length, formatList(
        "COPY-SNAPSHOT GATE: page.tsx files changed but no matching page.logged-out.md updated.",
        tsxPageChanges,
        `  Action: run 'pnpm --filter @optimitron/web copy:preview' to regenerate snapshots, diff the .md
  output, then invoke the voice-critic subagent on the diff. Fix anything that drifts toward
  startup-bro or away from Wishonia/Vonnegut. Commit the .md files alongside the .tsx.`,
      ));
    }
  }

  // --- Check 6: error swallowing -----------------------------------------
  const swallowHits = [];
  for (const line of addedLines) {
    if (
      /\bcatch\s*\([^)]*\)\s*\{\s*(\}|\/\/\s*ignore|\/\*\s*ignore)/.test(line) ||
      /\bcatch\s*\{\s*\}/.test(line) ||
      /\?\?\s*null\s*[;)}]/.test(line) ||
      /2>\s*&1\s*[/>]\s*(\/dev\/null|\$null)/.test(line) ||
      /2>\s*\/dev\/null/.test(line) ||
      /2>\s*\$null/.test(line)
    ) {
      swallowHits.push(`  - ${line.trim()}`);
    }
  }
  if (swallowHits.length) {
    const sample = swallowHits.slice(0, 6).join("\n");
    pushViolation("ERROR_SWALLOW", swallowHits.length, `ERROR-SWALLOW GATE: silent error swallowing in added lines. Catches must rethrow with context,
log via log.error / console.error / Sentry.captureException, or have a one-line comment naming why
the silence is intentional. Our own infrastructure failing (our endpoints, our DB writes, our code
paths) is always an ERROR, not a warning — warnings get ignored. Warn only for things outside our
control (third-party APIs, browser quirks, user network).
${sample}`);
  }

  // --- Check 7: email template changes -----------------------------------
  if (emailFiles.length) {
    pushViolation("EMAIL_MINIMALISM", emailFiles.length, formatList(
      "EMAIL MINIMALISM GATE: email template / sender changed.",
      emailFiles,
      `  Action: re-read feedback_email_minimalism — one CTA, no chrome, no system internals leaking.
  Run pnpm --filter @optimitron/web e2e:visual (email-screenshots mode) or render the template
  preview and inspect the rendered HTML before commit.`,
    ), { blocking: false });
  }

  // --- Check 7b: Vonnegut / blather gate on user-facing copy ---------------
  const copyChanges = unique([
    ...uiFiles.filter((f) => /\/page\.tsx$/.test(f)),
    ...copyFiles,
  ]);
  if (copyChanges.length) {
    pushViolation("VONNEGUT", copyChanges.length, formatList(
      `BLATHER REVIEW: page.tsx or page.logged-out.md changed.

Run gstack's chain first: \`/design-review\` (auto-fixes visual slop) and \`/qa\`
(auto-fixes functional bugs). Then run \`/qa-editorial\` for the project-specific
layer — fires voice-critic + cold-stranger-ux (+ test-auditor if tests changed)
in parallel and returns one consolidated punch list with a SHIP / NEEDS FIXES
verdict. No need to remember which critic to invoke.

If you want to spot-check manually first, walk every line and ask:
  1. Same prefix repeated on N adjacent list items? → fold into header or drop.
  2. Tautological hint under a section heading? → delete.
  3. Count above a heading + grid that says the same thing? → delete.
  4. Stripe-keynote sentence ("primitive that...", "off-ramp")? → rewrite as plain declarative.
  5. Adjective stack with no number? → replace with a number or delete.

But /qa-editorial + gstack's chain make this automatic. Use them.`,
      copyChanges,
      "",
    ), { blocking: false });
  }

  // --- Check 7c: stupid tests gate ----------------------------------------
  if (testFiles.length) {
    pushViolation("STUPID_TEST", testFiles.length, formatList(
      `STUPID TEST GATE: test file(s) changed. For each new test: name the bug it would catch. If you
can't, delete it. No tests for symmetry, documentation, or to silence a bot.`,
      testFiles,
      "",
    ), { blocking: false });
  }

  // --- Check 7d: reuse / no-duplication gate ------------------------------
  if (newReusableFiles.length) {
    pushViolation("REUSE", newReusableFiles.length, formatList(
      `REUSE GATE: new file(s) under components/ or lib/. Before commit: grep for an existing component/
function that does the same job. Don't duplicate. Don't add an abstraction nobody extends yet.
Recent miss: org-context-token (full HMAC system for no real threat — should have trusted the URL slug).`,
      newReusableFiles,
      "",
    ), { blocking: false });
  }

  // --- Emit ---------------------------------------------------------------
  if (!violations.length) process.exit(0);

  const blocking = violations.filter((v) => v.blocking);
  const advisory = violations.filter((v) => !v.blocking);

  if (isCommitAttempt) {
    // Pre-commit: full detail. Blocking violations fail the commit;
    // advisory ones print as reminders but exit 0 so the commit proceeds.
    const sections = [];
    if (blocking.length) {
      sections.push(
        `[verify-ui-changes] ${blocking.length} BLOCKING gate(s) failed — address each, then re-commit:\n\n${blocking.map((v) => v.message).join("\n\n")}`,
      );
    }
    if (advisory.length) {
      sections.push(
        `[verify-ui-changes] ${advisory.length} advisory gate(s) — reminders, NOT blocking the commit:\n\n${advisory.map((v) => v.message).join("\n\n")}`,
      );
    }
    process.stderr.write(`${sections.join("\n\n---\n\n")}\n`);
    process.exit(blocking.length ? 2 : 0);
  }

  // Stop hook: one-line summary. Marks advisory gates with [*] so the
  // reader knows they're informational.
  const summary = violations
    .map((v) => `${v.name}(${v.count})${v.blocking ? "" : "*"}`)
    .join(", ");
  process.stderr.write(
    `[verify-ui-changes] ${blocking.length} blocking + ${advisory.length} advisory* gate(s): ${summary}. Run 'git commit' for per-file detail.\n`,
  );
  // Stop hook: exit 0 if no blocking violations (advisory-only is just
  // FYI, shouldn't block stopping). Exit 2 only when something real
  // would fail.
  process.exit(blocking.length ? 2 : 0);
} catch {
  // Fail-open.
  process.exit(0);
}

// --- Helpers ---------------------------------------------------------------

function git(args) {
  try {
    return execSync(`git -C "${RepoRoot}" ${args}`, {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return "";
  }
}

function newestFileMtime(dir, fileRx) {
  let max = 0;
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return 0;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = newestFileMtime(full, fileRx);
      if (sub > max) max = sub;
    } else if (fileRx.test(entry.name)) {
      try {
        const m = statSync(full).mtimeMs;
        if (m > max) max = m;
      } catch {
        // Skip unreadable files
      }
    }
  }
  return max;
}

function unique(arr) {
  return Array.from(new Set(arr));
}

function formatList(header, files, footer) {
  const shown = files.slice(0, 8).map((f) => `    - ${f}`).join("\n");
  const more =
    files.length > 8 ? `\n    - ...(${files.length - 8} more)` : "";
  const tail = footer ? `\n  ${footer.replace(/^\s+/, "")}` : "";
  return `${header}\n${shown}${more}${tail}`;
}
