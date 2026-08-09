/**
 * Runs `next build` with a heap ceiling sized for the build actually being run.
 *
 * One number cannot serve both environments, because they do different amounts
 * of work:
 *
 *   Preview / CI / local — no SENTRY_AUTH_TOKEN, so `sourcemaps.disable` is
 *   true (next.config.js) and the Sentry plugin skips source-map generation.
 *   A full build completes in about 2 GB here, measured. Previews also build
 *   several PRs concurrently on one machine, so a high ceiling is actively
 *   harmful: V8 does not collect aggressively while it believes it has
 *   headroom, and the container OOM-kills the whole build. A 3584 MB ceiling
 *   still left too little room for the other compiler processes on an 8 GB
 *   preview builder. 3072 MB leaves about 2 GB for that overhead while staying
 *   comfortably above the measured plain-build heap.
 *
 *   Production — SENTRY_AUTH_TOKEN is set, so source maps are generated and
 *   debug IDs are injected across the server, edge, and client compilations.
 *   That is substantially more memory, and 3584 MB is not enough: it failed
 *   with "FATAL ERROR: Ineffective mark-compacts near heap limit". Production
 *   builds are serialized (one commit to main at a time), so the container
 *   pressure that forces previews low does not apply. 5120 MB is the value
 *   production deployed on successfully before it was lowered.
 *
 * Read the failure signature before changing these:
 *   - Node "JavaScript heap out of memory"  -> this process needs MORE. Raise.
 *   - Kernel SIGKILL / Vercel "OOM event detected" -> the sum of processes is
 *     too high. Lower, or reduce build parallelism.
 */
import { spawn } from "node:child_process";

const SOURCEMAP_BUILD_HEAP_MB = 5120;
const PLAIN_BUILD_HEAP_MB = 3072;

const generatesSourceMaps = Boolean(process.env.SENTRY_AUTH_TOKEN);
const heapMb = generatesSourceMaps
  ? SOURCEMAP_BUILD_HEAP_MB
  : PLAIN_BUILD_HEAP_MB;

// Drop any inherited ceiling so this script deterministically sets it. Node
// takes the last occurrence, so appending would usually win anyway, but "our
// value is applied because it happens to be last" is not a property worth
// relying on when the whole point of this file is to control that number.
const inheritedNodeOptions = (process.env.NODE_OPTIONS ?? "")
  .split(/\s+/)
  .filter((flag) => flag && !flag.startsWith("--max-old-space-size"))
  .join(" ");

const nodeOptions = [inheritedNodeOptions, `--max-old-space-size=${heapMb}`]
  .filter(Boolean)
  .join(" ");

console.log(
  `[next-build] heap ${heapMb} MB (sentry source maps: ${generatesSourceMaps ? "on" : "off"})`,
);

const child = spawn("next", ["build", ...process.argv.slice(2)], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, NODE_OPTIONS: nodeOptions },
});

// `shell: true` means the shell is our direct child, so when something kills
// `next` underneath it we are handed the shell's 128+N exit code with a null
// signal -- including the OOM case this diagnostic exists for. Map those back.
const SIGNAL_EXIT_CODES = new Map([
  [130, "SIGINT"],
  [137, "SIGKILL"],
  [143, "SIGTERM"],
]);

child.on("exit", (code, signal) => {
  const terminatingSignal = signal ?? SIGNAL_EXIT_CODES.get(code ?? -1) ?? null;
  if (terminatingSignal) {
    // Deliberately does not assert OOM. Several things here send signals --
    // scripts/run-with-timeout.mjs sends SIGTERM then SIGKILL when a build
    // exceeds its budget, and CI cancels jobs the same way. Saying "out of
    // memory" would send someone to tune the heap for a timeout.
    console.error(
      `[next-build] terminated by ${terminatingSignal}, not a heap error -- raising --max-old-space-size will not help.`,
    );
    console.error(
      "[next-build] check, in order: the platform build log for an OOM report (then lower the ceiling or reduce parallelism), scripts/run-with-timeout.mjs firing on the build budget, or a cancelled CI job.",
    );
    process.exit(1);
  }
  process.exit(code ?? 1);
});

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});
