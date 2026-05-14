#!/usr/bin/env node
/**
 * surprise-signal.mjs
 *
 * UserPromptSubmit hook: scans the user's prompt for phrases indicating
 * they're pushing back on the complexity of what I'm doing ("should it
 * really be this hard / I thought it was simpler / aren't we missing
 * something / why is this so much"). When detected, prepends a STOP
 * signal to my context so I notice it BEFORE I respond — instead of
 * pattern-matching to "build more."
 *
 * Ported from the previous global PowerShell version on 2026-05-13 with a
 * critical framing fix: the old version pushed me toward the "smallest
 * fix" which kept rewarding workarounds that masked real bugs (the 0.5%
 * visual-review threshold was the canonical example). New framing is
 * "BEST fix" — small is preferred only when also correct; a one-line
 * workaround that hides a real bug is not the right move.
 *
 * Output via stdout = added to my context as additional info on the
 * user's prompt. Not blocking — I still need to respond, but with the
 * signal foregrounded.
 *
 * Fail-open on any error.
 */

import { readFileSync, existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";

try {
  let raw = "";
  try {
    raw = readFileSync(0, "utf-8");
  } catch {
    process.exit(0);
  }
  if (!raw || !raw.trim()) process.exit(0);

  let hookData;
  try {
    hookData = JSON.parse(raw);
  } catch {
    process.exit(0);
  }

  let prompt = hookData?.prompt;
  if (!prompt) process.exit(0);
  if (Array.isArray(prompt)) prompt = prompt.join(" ");
  if (typeof prompt !== "string") process.exit(0);

  // Surprise / "this should be simpler" patterns. Tuned to catch the
  // moments I miss most often.
  const patterns = [
    /\b(should|shouldn['`]t) (?:it|this|we|they) (?:really|just|be|have)\b/i,
    /\bI thought (?:it|this|we|that|that we|we had|we were)\b/i,
    /\baren['`]t (?:we|you) (?:missing|supposed)\b/i,
    /\bwhy (?:is|are) (?:this|it|we) (?:so |such )\b/i,
    /\bisn['`]t (?:this|it|that) (?:just|simply|basically)\b/i,
    /\b(what are|are) we missing\b/i,
    /\bwhy can['`]t (?:we|it) just\b/i,
    /\bbasically (?:just |only )?\w+ing\b/i,
    /\b(?:am I|are we) (?:doing|missing)\b/i,
  ];

  const matched = [];
  for (const p of patterns) {
    const m = prompt.match(p);
    if (m) matched.push(m[0]);
  }
  if (matched.length === 0) process.exit(0);

  // Dedup by prompt hash — don't re-surface for the same message if it
  // arrives twice in quick succession.
  const cacheDir = path.join(
    process.env.LOCALAPPDATA || os.tmpdir(),
    "claude",
    "hook-cache",
  );
  try {
    if (!existsSync(cacheDir)) mkdirSync(cacheDir, { recursive: true });
  } catch {
    // Cache miss is fine — fall through and emit.
  }
  const head = prompt.slice(0, 400);
  const hash = crypto.createHash("sha1").update(head).digest("hex").slice(0, 16);
  const cacheFile = path.join(cacheDir, `surprise-${hash}.txt`);
  try {
    if (existsSync(cacheFile)) {
      const tenMinAgo = Date.now() - 10 * 60 * 1000;
      if (statSync(cacheFile).mtimeMs > tenMinAgo) process.exit(0);
    }
    writeFileSync(cacheFile, new Date().toISOString());
  } catch {
    // Cache write failure shouldn't block emission.
  }

  const matchedStr = [...new Set(matched)].slice(0, 3).join(" / ");

  const msg = `[surprise-signal hook] User's prompt contains a "this should be simpler" phrase: ${matchedStr}

STOP and re-explore before responding — don't pattern-match to "build more."

1. STOP the next step you had planned.
2. Re-explore the existing system relevant to the question (grep deploy workflow, package.json scripts, existing functions). Don't rely on session memory. If the question is about UX / page copy / "what does X look like," fetch the PR's PREVIEW DEPLOY (Vercel MCP \`web_fetch_vercel_url\` or curl with \`_vercel_share\`), NOT production or page.tsx source.
3. State in chat what you found that already handles (or doesn't handle) the user's concern.
4. **Find the BEST fix, not the smallest.** A one-line workaround masking a real bug is not the right move; if the smallest viable change is a band-aid, name that openly and propose the real fix.`;

  process.stdout.write(msg + "\n");
  process.exit(0);
} catch {
  process.exit(0);
}
