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
 *   headroom, and the container OOM-kills the whole build. 3584 MB was chosen
 *   from that measurement and holds.
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
const PLAIN_BUILD_HEAP_MB = 3584;

const generatesSourceMaps = Boolean(process.env.SENTRY_AUTH_TOKEN);
const heapMb = generatesSourceMaps
  ? SOURCEMAP_BUILD_HEAP_MB
  : PLAIN_BUILD_HEAP_MB;

const nodeOptions = [process.env.NODE_OPTIONS, `--max-old-space-size=${heapMb}`]
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

child.on("exit", (code, signal) => {
  // A signal here is the kernel OOM killer, not a build error. Surface it as a
  // failure but make the distinction visible, because the fix is the opposite
  // of the one for a heap error.
  if (signal) {
    console.error(
      `[next-build] terminated by ${signal} — this is the container running out of memory, not the heap. Lower the ceiling or reduce parallelism.`,
    );
    process.exit(1);
  }
  process.exit(code ?? 1);
});

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});
