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
  const diffNames = git("diff --name-only HEAD")
    .split("\n")
    .filter(Boolean);
  const untracked = git("ls-files --others --exclude-standard")
    .split("\n")
    .filter(Boolean);
  const allChanged = [...new Set([...diffNames, ...untracked])];

  const diffBody = git("diff --unified=0 HEAD").split("\n");

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

  const violations = [];

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
      violations.push(formatList(
        `SCREENSHOT GATE: UI files changed but no PNG under ${ScreenshotDir} is newer than them.`,
        uiFiles,
        `Action: figure out which routes these affect, screenshot each (auth + unauth where relevant) via
  the chrome-devtools or Playwright MCP, then READ the PNGs and verify the change landed AND nothing
  adjacent broke. Don't commit on faith.`,
      ));
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
  const voiceHits = [];
  for (const line of addedLines) {
    for (const p of bannedExact) {
      if (line.includes(p)) voiceHits.push(`  - '${p}' -> ${line.trim()}`);
    }
    for (const rx of bannedRegex) {
      if (rx.test(line)) voiceHits.push(`  - /${rx.source}/ -> ${line.trim()}`);
    }
  }
  if (voiceHits.length) {
    const sample = unique(voiceHits).slice(0, 12).join("\n");
    violations.push(`VOICE GATE: banned vocabulary in added copy. Rewrite per CLAUDE.md Wishonia voice + Vonnegut rule
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
    violations.push(`PARAMETER GATE: hardcoded number(s) in JSX. Use <ParameterValue paramId="..." figures={3} /> so the
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
      violations.push(`CLAUDE.MD BLOAT GATE: CLAUDE.md grew by ~${claudeAdded} added lines. The file's own meta-rule says
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
      violations.push(formatList(
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
    violations.push(`ERROR-SWALLOW GATE: silent error swallowing in added lines. Catches must rethrow with context,
log via log.error / console.error / Sentry.captureException, or have a one-line comment naming why
the silence is intentional. Our own infrastructure failing (our endpoints, our DB writes, our code
paths) is always an ERROR, not a warning — warnings get ignored. Warn only for things outside our
control (third-party APIs, browser quirks, user network).
${sample}`);
  }

  // --- Check 7: email template changes -----------------------------------
  if (emailFiles.length) {
    violations.push(formatList(
      "EMAIL MINIMALISM GATE: email template / sender changed.",
      emailFiles,
      `  Action: re-read feedback_email_minimalism — one CTA, no chrome, no system internals leaking.
  Run pnpm --filter @optimitron/web e2e:visual (email-screenshots mode) or render the template
  preview and inspect the rendered HTML before commit.`,
    ));
  }

  // --- Check 7b: Vonnegut / blather gate on user-facing copy ---------------
  const copyChanges = unique([
    ...uiFiles.filter((f) => /\/page\.tsx$/.test(f)),
    ...copyFiles,
  ]);
  if (copyChanges.length) {
    violations.push(formatList(
      `VONNEGUT / BLATHER GATE: page.tsx or page.logged-out.md changed. Read the rendered copy. Goal: a
5th grader follows it, nothing said twice, no Stripe-keynote sentences, one primary CTA per screen
above the fold on mobile. Spawn voice-critic on the .md diff if scope is non-trivial.`,
      copyChanges,
      "",
    ));
  }

  // --- Check 7c: stupid tests gate ----------------------------------------
  if (testFiles.length) {
    violations.push(formatList(
      `STUPID TEST GATE: test file(s) changed. For each new test: name the bug it would catch. If you
can't, delete it. No tests for symmetry, documentation, or to silence a bot.`,
      testFiles,
      "",
    ));
  }

  // --- Check 7d: reuse / no-duplication gate ------------------------------
  if (newReusableFiles.length) {
    violations.push(formatList(
      `REUSE GATE: new file(s) under components/ or lib/. Before commit: grep for an existing component/
function that does the same job. Don't duplicate. Don't add an abstraction nobody extends yet.
Recent miss: org-context-token (full HMAC system for no real threat — should have trusted the URL slug).`,
      newReusableFiles,
      "",
    ));
  }

  // --- Emit ---------------------------------------------------------------
  if (!violations.length) process.exit(0);

  const banner = `[verify-ui-changes hook] ${violations.length} gate(s) failed. Address each before stopping:`;
  const body = violations.join("\n\n");
  process.stderr.write(
    `${banner}\n\n${body}\n\n(Commit clears the gate, but only commit AFTER you have addressed each violation above. For each NON-OBVIOUS fix, present 2-3 options via AskUserQuestion — recommendation first + one-line reason — before refactoring. Skip asking only when the fix is mechanical/obvious (typo, missing import, formatter). Calibrate first, then act; don't refactor then ask.)\n`,
  );
  process.exit(2);
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
