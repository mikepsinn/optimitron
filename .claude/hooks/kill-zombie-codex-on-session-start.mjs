#!/usr/bin/env node
// kill-zombie-codex-on-session-start.mjs
//
// SessionStart hook: kill any lingering codex.exe processes that
// survived from a previous session. They steal memory + slow the
// stop-review-gate's Codex CLI to a crawl (15-min timeout).
//
// 2026-05-16 trigger: today's session accumulated 5 zombie
// codex.exe processes from dispatches that hung on stdin. The
// gstack stop-review-gate hook spawns Codex on every turn-end;
// with zombies hogging resources, normal 10-30s reviews stretched
// to 5+ minutes per turn. Mike noticed the latency.
//
// Safety: SessionStart fires BEFORE any active work in this
// session, so killing all codex.exe processes is safe — there's
// nothing legitimate running yet. Mid-session cleanup is risky
// (might kill actively-working agents) so we don't do that here.
//
// For mid-session zombies, kill them manually:
//   powershell "Get-Process codex -ErrorAction SilentlyContinue | Stop-Process -Force"

import { spawnSync } from "node:child_process";

try {
  // Windows: use PowerShell. Other platforms: pkill.
  const isWindows = process.platform === "win32";
  if (isWindows) {
    const result = spawnSync(
      "powershell",
      [
        "-NoProfile",
        "-Command",
        "$procs = Get-Process codex -ErrorAction SilentlyContinue; if ($procs) { $count = $procs.Count; $procs | Stop-Process -Force -ErrorAction SilentlyContinue; Write-Output \"[kill-zombie-codex] killed $count lingering codex.exe processes from a previous session\" }",
      ],
      { encoding: "utf-8", timeout: 5000 },
    );
    if (result.stdout?.trim()) {
      process.stderr.write(result.stdout.trim() + "\n");
    }
  } else {
    spawnSync("pkill", ["-9", "codex"], { encoding: "utf-8", timeout: 5000 });
  }
  process.exit(0);
} catch {
  process.exit(0);
}
