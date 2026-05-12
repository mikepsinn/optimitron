#!/usr/bin/env node
// pre-write-architecture-check.mjs
//
// PreToolUse hook: blocks `Write` of a NEW file in `packages/*/src/` etc.
// until the agent has shown evidence it searched for the existing system
// instead of reflexively adding a new file.
//
// Dedup: 5-minute TTL per file path. First Write blocks; retry within 5
// minutes is allowed (assumes the checklist was answered in chat).
//
// Fail-open on any unexpected error.

import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { homedir, tmpdir } from "node:os";

try {
  let hookData = null;
  try {
    const raw = readFileSync(0, "utf-8");
    if (raw && raw.trim()) hookData = JSON.parse(raw);
  } catch {
    process.exit(0);
  }
  if (!hookData) process.exit(0);
  if (hookData.tool_name !== "Write") process.exit(0);

  const filePath = hookData?.tool_input?.file_path;
  if (!filePath) process.exit(0);

  const normalized = filePath.replace(/\\/g, "/");

  // Only fire for files under these architectural paths.
  const patterns = [
    /\/packages\/[^/]+\/src\/.+\.(ts|tsx|js|mjs)$/,
    /\/packages\/[^/]+\/prisma\/.+\.(ts|tsx|sql)$/,
    /\/packages\/[^/]+\/scripts\/.+\.(ts|tsx|js|mjs)$/,
    /\/\.github\/workflows\/.+\.ya?ml$/,
    /\/\.claude\/(agents|commands)\/.+\.md$/,
  ];
  if (!patterns.some((rx) => rx.test(normalized))) process.exit(0);

  // Skip if the file already exists (this is an edit, not a create).
  if (existsSync(filePath)) process.exit(0);

  // --- Dedup -------------------------------------------------------------
  const cacheDir = getCacheDir();
  if (!existsSync(cacheDir)) mkdirSync(cacheDir, { recursive: true });

  const hash = createHash("sha1").update(filePath).digest("hex").slice(0, 16);
  const cacheFile = join(cacheDir, `pre-write-${hash}.txt`);

  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  if (existsSync(cacheFile) && statSync(cacheFile).mtimeMs > fiveMinutesAgo) {
    // Already blocked once recently; allow retry through.
    process.exit(0);
  }
  writeFileSync(cacheFile, new Date().toISOString());

  // --- Emit checklist ----------------------------------------------------
  const relPath = filePath.replace(/.*[/\\]packages[/\\]/, "packages/");
  const msg = `[pre-write architecture check] You are about to CREATE a new file:
  ${relPath}

This hook fires for new files in architectural paths (packages/*/src/, prisma/, scripts/, .github/workflows/, .claude/agents/). The user has called out the pattern — I default to creating new files / abstractions when the smallest fix is one line in a config or a delegation to an existing function. Before writing this file, answer in chat:

1. **What is the actual user-facing problem?** Name it in one sentence.

2. **What does the existing system already do for this area?** Specifically grep / Read at least one of:
   - The deploy workflow (.github/workflows/ci.yml) — what does production currently run?
   - package.json scripts — is there an existing command that does the work?
   - Existing functions in the same area — is there already an idempotent version?
   - The relevant section of TODO.md — has a decision been recorded?

3. **What is the smallest possible fix?** If the answer is "add a new file", justify why a one-line change in a config / package.json / existing function would NOT work.

4. **Has the user signaled this should be simple?** If YES, you almost certainly haven't found the smallest fix yet. Stop and re-explore.

After answering these in chat, retry the Write. The hook will allow it within 5 minutes once you've responded.`;

  process.stderr.write(msg + "\n");
  process.exit(2);
} catch {
  process.exit(0);
}

function getCacheDir() {
  // Honor LOCALAPPDATA on Windows, fall back to ~/.cache or /tmp elsewhere.
  if (process.env.LOCALAPPDATA) {
    return join(process.env.LOCALAPPDATA, "claude", "hook-cache");
  }
  if (process.env.XDG_CACHE_HOME) {
    return join(process.env.XDG_CACHE_HOME, "claude", "hook-cache");
  }
  return join(homedir(), ".cache", "claude", "hook-cache");
}
