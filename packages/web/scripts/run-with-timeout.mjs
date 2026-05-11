/**
 * Runs a command and kills it after `seconds`, exiting with 124 if timed out
 * (GNU timeout convention). Used so Vercel previews fail fast instead of
 * hanging until the platform build cap (~45m).
 */
import { spawn } from "node:child_process";

const seconds = Number(process.argv[2]);
const cmd = process.argv[3];
const cmdArgs = process.argv.slice(4);

if (!Number.isFinite(seconds) || seconds <= 0 || !cmd) {
  console.error(
    "usage: node scripts/run-with-timeout.mjs <seconds> <command> [args...]",
  );
  process.exit(2);
}

let timedOut = false;

const child = spawn(cmd, cmdArgs, {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

const killTimer = setTimeout(() => {
  timedOut = true;
  console.error(
    `\n[run-with-timeout] Exceeded ${seconds}s — terminating (fail-fast).`,
  );
  child.kill("SIGTERM");
  setTimeout(() => child.kill("SIGKILL"), 5000).unref();
}, seconds * 1000);

child.on("exit", (code, signal) => {
  clearTimeout(killTimer);
  if (timedOut) {
    process.exit(124);
  }
  if (signal) {
    process.exit(1);
  }
  process.exit(code ?? 1);
});

child.on("error", (err) => {
  clearTimeout(killTimer);
  console.error(err);
  process.exit(1);
});
