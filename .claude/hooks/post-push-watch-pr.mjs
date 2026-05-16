#!/usr/bin/env node
// post-push-watch-pr.mjs
//
// PostToolUse hook on Bash: after `git push`, prints a loud
// reminder to watch the open PR (CI + bot comments) instead of
// returning idle. Default is action, not "want me to watch?".
//
// Per memory rule `feedback_watch_pr_after_push_by_default.md`:
// the user is often AFK between turns. Idle time multiplies the
// cost of every PR cycle. After a push, watch CI + triage bot
// comments without asking permission.
//
// Hook fires AFTER the push completes. It prints to stdout the
// concrete commands to run + the stop conditions, so the next
// Claude turn has the watch plan injected as system feedback
// rather than depending on memory recall.
//
// Detection: command starts with `git push` (allowlist first
// token check, ignoring git commits / commit messages that
// mention push). Skips if push failed (non-zero exit), since
// there's nothing to watch.

import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

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

  // Only fire when the command is invoking `git push` as the actual
  // shell command (not when "git push" appears in a quoted string,
  // commit message, heredoc, etc).
  const isGitPush = /(^|\s*[&|;]\s*)git\s+push\b/.test(command);
  if (!isGitPush) process.exit(0);

  // Skip if the push failed — nothing to watch.
  const exitCode = hookData?.tool_response?.exit_code ?? hookData?.tool_response?.exitCode ?? 0;
  if (exitCode !== 0) process.exit(0);

  // Look up the open PR for the current branch. If none, skip.
  let prNumber = null;
  try {
    const out = execSync(
      `gh pr view --json number -q .number`,
      { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"], timeout: 5000 },
    ).trim();
    if (/^\d+$/.test(out)) prNumber = out;
  } catch {
    // No PR for this branch yet, or gh not authenticated. Skip.
  }
  if (!prNumber) process.exit(0);

  const msg =
    `[post-push-watch-pr] PR #${prNumber} just received a push. Default is to WATCH, not to idle.\n\n` +
    `Per feedback_watch_pr_after_push_by_default.md: do NOT ask the user "should I watch?". Run the watch loop until CI conclusion + bot threads triaged. The user is often AFK; idle time is wasted.\n\n` +
    `Concrete watch commands:\n` +
    `  gh pr checks ${prNumber}                          # poll CI status\n` +
    `  gh api graphql -f query='{repository(owner:"mikepsinn",name:"optimitron"){pullRequest(number:${prNumber}){reviewThreads(first:50){nodes{id isResolved comments(first:1){nodes{databaseId author{login} path body}}}}}}}' -q '[.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved == false) | {threadId:.id,commentId:.comments.nodes[0].databaseId,author:.comments.nodes[0].author.login,path:.comments.nodes[0].path,body:.comments.nodes[0].body}]'\n\n` +
    `Loop:\n` +
    `  1. If CI still pending — poll periodically (don't \`--watch\` which blocks the tool indefinitely; ScheduleWakeup or short Bash sleeps work).\n` +
    `  2. If CI failed — investigate, fix, push. Loop.\n` +
    `  3. If bot reviewers posted (claude-review, CodeRabbit, Copilot, Vercel Agent Review) — triage per .claude/agents/pr-comment-triager.md, reply per-comment per feedback_reply_per_comment_not_summary, resolve threads.\n` +
    `  4. Stop only when CI green + no unresolved threads, OR a genuine fork needs Mike's taste, OR a destructive op is the next step.\n\n` +
    `Banned shape: "want me to watch the PR?". Just watch.`;

  process.stdout.write(msg + "\n");
  process.exit(0);
} catch {
  process.exit(0);
}
