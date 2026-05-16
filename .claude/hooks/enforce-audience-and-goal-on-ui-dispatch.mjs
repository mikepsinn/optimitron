#!/usr/bin/env node
// enforce-audience-and-goal-on-ui-dispatch.mjs
//
// PreToolUse hook on Bash: when a fresh `codex exec` dispatch targets
// user-facing UI/copy paths, require the prompt to explicitly name
// (1) the audience looking at the page, and (2) what we want them
// to do.
//
// Mike's 2026-05-15 trigger, verbatim: *"whenever we do edits like
// this, do we ask ourselves who is looking at this page and what the
// f*** do we want them to do? if not, can you add something to a
// hook or something that will remind you to always f****** think of
// that anytime you make any changes to the user interface?"*
//
// The /endorse page got restructured to put functional disclaimer
// copy ("No donation to us. No candidate endorsement. One public
// humanitarian treaty position.") above the form, demoting the
// moral-case Wishonia paragraph below the fold. That happened
// because the dispatch said "put form above the fold" without
// naming who the audience is (org leaders) or what we want them
// to do (click JOIN, motivated). The reordering optimized for
// procedural clarity instead of conversion.
//
// Same text-rule-vs-enforcement pattern as the other hooks. The
// reminder lives at CLAUDE.md "UI/UX Rules" but reading it didn't
// land. Promote to active enforcement.
//
// Detection: a Codex dispatch is "UI-touching" if the prompt body
// mentions any of:
//   - `packages/web/src/app/` (any route file)
//   - `/page.tsx` or `page.logged-out.md`
//   - `packages/web/src/components/`
//   - `packages/web/src/lib/routes.ts`
//   - `packages/web/src/lib/email/`
//   - `packages/web/emails/`
//   - share-card / share-copy / OG image
//   - `lib/messaging.ts`
//
// Requirements when UI-touching:
//   The prompt must include BOTH an audience-framing phrase AND a
//   desired-action-framing phrase. Audience-framing accepts:
//     - "audience" (any context)
//     - "the visitor", "the reader", "the user is", "viewers are"
//     - "org leaders", "donors", "voters", "plaintiffs", "politicians",
//       "signers", "endorsers", "people who" — concrete persona naming
//   Desired-action-framing accepts:
//     - "want them to", "goal is", "lever is", "primary action",
//       "the conversion", "they should", "we want", "the next step",
//       "click", "sign", "endorse", "donate", "vote", "subscribe",
//       "share", "convert" — concrete action verbs
//
// Bypasses (skip the check entirely):
//   - `trivial:` prefix (small mechanical change, no UX restructuring)
//   - `drafting-plan-for:` / `critiquing-plan:` (plan work)

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

  const firstToken = command.trim().split(/\s+/)[0] ?? "";
  if (/^(git|gh|grep|rg|find|cat|head|tail|sed|awk|echo|printf|ls|cd|node|pnpm|npm|yarn|tsx|powershell)$/i.test(firstToken)) {
    process.exit(0);
  }

  const isFreshDispatch = /\bcodex\s+(exec|review)\b/.test(command) &&
    !/\bcodex\s+exec\s+resume\b/.test(command);
  if (!isFreshDispatch) process.exit(0);

  const matches = [...command.matchAll(/'([\s\S]*?)'/g)];
  const prompt = matches
    .map((m) => m[1])
    .filter((s) => s.length >= 12)
    .sort((a, b) => b.length - a.length)[0] ?? "";

  if (/^\s*(trivial|drafting-plan-for|critiquing-plan):/im.test(prompt)) {
    process.exit(0);
  }

  // Is this a UI-touching dispatch?
  const UI_PATH_PATTERNS = [
    /packages\/web\/src\/app\//,
    /\/page\.tsx\b/,
    /page\.logged-out\.md\b/,
    /packages\/web\/src\/components\//,
    /packages\/web\/src\/lib\/routes\.ts\b/,
    /packages\/web\/src\/lib\/email\//,
    /packages\/web\/emails\//,
    /packages\/web\/src\/lib\/messaging\.ts\b/,
    /share[\s-]?card/i,
    /share[\s-]?copy/i,
    /OG\s+image/i,
    /open\s+graph/i,
  ];
  const isUiDispatch = UI_PATH_PATTERNS.some((rx) => rx.test(prompt));
  if (!isUiDispatch) process.exit(0);

  // Audience-framing detection.
  const AUDIENCE_PATTERNS = [
    /\baudience\b/i,
    /\bthe visitor\b/i,
    /\bthe reader\b/i,
    /\bthe user is\b/i,
    /\bviewers are\b/i,
    /\bpeople (who|on this page|looking)\b/i,
    /\borg leaders?\b/i,
    /\bdonors?\b/i,
    /\bvoters?\b/i,
    /\bplaintiffs?\b/i,
    /\bpoliticians?\b/i,
    /\bsigners?\b/i,
    /\bendorsers?\b/i,
    /\bemployees?\b/i,
    /\bvisitors?\b/i,
  ];
  const hasAudience = AUDIENCE_PATTERNS.some((rx) => rx.test(prompt));

  // Desired-action-framing detection.
  const ACTION_PATTERNS = [
    /\bwant them to\b/i,
    /\bgoal is\b/i,
    /\bthe lever\b/i,
    /\bprimary action\b/i,
    /\bthe conversion\b/i,
    /\bthey should\b/i,
    /\bwe want\b/i,
    /\bthe next step\b/i,
    /\bclick\b/i,
    /\bsign\b/i,
    /\bendorse\b/i,
    /\bdonate\b/i,
    /\bvote\b/i,
    /\bsubscribe\b/i,
    /\bshare\b/i,
    /\bconvert\b/i,
    /\bjoin\b/i,
  ];
  const hasAction = ACTION_PATTERNS.some((rx) => rx.test(prompt));

  if (hasAudience && hasAction) process.exit(0);

  const missing = [];
  if (!hasAudience) missing.push("AUDIENCE");
  if (!hasAction) missing.push("DESIRED ACTION");

  const msg =
    `[enforce-audience-and-goal-on-ui-dispatch] BLOCKED — UI/copy Codex dispatch lacks ${missing.join(" and ")}.\n\n` +
    `Mike's 2026-05-15 rule: every UI/copy change must name (1) who is looking at this page, and (2) what we want them to do. The /endorse page got restructured to put procedural disclaimer copy above the moral-case Wishonia paragraph because the dispatch said "put form above the fold" without naming the audience (org leaders) or the lever (moral motivation, not procedural reassurance).\n\n` +
    `Add to the dispatch prompt, in one sentence each:\n` +
    `  Audience: <concrete persona — "org leaders deciding whether to publicly endorse", "voters who arrived from social", "donors who have GiveWell intuitions">\n` +
    `  Goal: <one concrete action — "click JOIN", "sign the treaty", "donate $100", "share the referral URL">\n\n` +
    `Bypass: prefix the prompt with \`trivial:\` if the change is mechanical (snapshot regen, dependency bump, single-constant edit) and does NOT change the visible page structure or copy meaning.`;

  process.stderr.write(msg + "\n");
  process.exit(2);
} catch {
  process.exit(0);
}
