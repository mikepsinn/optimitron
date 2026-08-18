#!/usr/bin/env node
// dev-server-check.mjs
//
// SessionStart hook: probes http://127.0.0.1:3001 and prints one of:
//   DEV SERVER: 200 OK
//   DEV SERVER: DOWN — run `pnpm --filter @optimitron/web dev:fast ...`
//   DEV SERVER: PORT BOUND but UNRESPONSIVE — kill PID then restart
//
// Per CLAUDE.md HVD#2: Claude pre-warms the dev server at session
// start if curl doesn't return 2xx/3xx. I keep forgetting to run the
// curl, so I never reach the conditional. This hook runs the check
// FOR me + prints loud status + the exact command to restart.
//
// Does NOT auto-start — too many edge cases (intentional teardown,
// different port, sibling repo bound to 3001). Loud warn + concrete
// command is sufficient if I actually read the output.
//
// 2026-05-14: written after I dispatched Codex agents claiming "Dev
// server is running at :3001" while a 17-hour zombie PID was bound
// but unresponsive. Per
// feedback_promote_violated_text_rules_to_hooks.md.

import { execSync } from "node:child_process";

const PORT = 3001;
const URL = `http://127.0.0.1:${PORT}`;
const START_CMD =
  "pnpm --filter @optimitron/web dev:fast > apps/optimitron/.dev-server.log 2>&1";

try {
  let status = null;
  try {
    const devNull = process.platform === "win32" ? "NUL" : "/dev/null";
    const out = execSync(
      `curl -sS -m 3 -o ${devNull} -w "%{http_code}" ${URL}`,
      { stdio: ["ignore", "pipe", "ignore"], encoding: "utf-8" },
    ).trim();
    status = parseInt(out, 10);
  } catch {
    status = 0;
  }

  if (status >= 200 && status < 400) {
    process.stdout.write(`[dev-server-check] DEV SERVER: ${status} OK on ${URL}\n`);
    process.exit(0);
  }

  // Down or unresponsive. Check if port is bound to a zombie PID.
  let zombiePid = null;
  try {
    const netstat = execSync(
      `powershell -NoProfile -Command "(Get-NetTCPConnection -LocalPort ${PORT} -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1).OwningProcess"`,
      { stdio: ["ignore", "pipe", "ignore"], encoding: "utf-8" },
    ).trim();
    if (netstat && /^\d+$/.test(netstat)) zombiePid = netstat;
  } catch {
    // ignore; Windows-specific
  }

  if (zombiePid) {
    process.stdout.write(
      `[dev-server-check] DEV SERVER: PORT ${PORT} BOUND by PID ${zombiePid} but UNRESPONSIVE (zombie).\n` +
        `  Kill + restart:\n` +
        `    powershell -NoProfile -Command "Stop-Process -Id ${zombiePid} -Force"\n` +
        `    ${START_CMD}\n`,
    );
    process.exit(0);
  }

  process.stdout.write(
    `[dev-server-check] DEV SERVER: DOWN on ${URL}.\n` +
      `  Start it now (orchestrator-only — per CLAUDE.md HVD#2):\n` +
      `    ${START_CMD}\n` +
      `  Codex dispatches will fail or run blind without it.\n`,
  );
  process.exit(0);
} catch {
  process.exit(0);
}
