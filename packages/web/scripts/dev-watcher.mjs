#!/usr/bin/env node

import { spawn } from "node:child_process";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import http from "node:http";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(WEB_ROOT, "../..");
const LOG_FILE = path.join(WEB_ROOT, ".dev-watcher.log");
const PID_FILE = path.join(WEB_ROOT, ".dev-watcher.pid");
const DEV_SERVER_LOG = path.join(WEB_ROOT, ".dev-server.log");
const HEALTH_URL = new URL("http://127.0.0.1:3001");
const POLL_MS = 5000;
const HEALTH_TIMEOUT_MS = 10000;
const SCAN_MS = 1000;
const DEBOUNCE_MS = 1500;
const RESTART_COOLDOWN_MS = 60000;

const WATCH_TARGETS = [
  "src/app",
  "src/components",
  "src/lib/routes.ts",
  "src/lib/messaging.ts",
  "src/lib/email",
  "src/emails",
].map((target) => path.join(WEB_ROOT, target));

let lastRestartAt = 0;
let knownFiles = new Map();
let regenTimer = null;
let regenRunning = false;
let regenQueued = false;
let healthCheckRunning = false;

main();

function main() {
  mkdirSync(WEB_ROOT, { recursive: true });
  claimWatcherLock();
  log(`watcher starting pid=${process.pid}`);
  knownFiles = scanWatchedFiles();
  log(`watcher indexed ${knownFiles.size} files`);
  ensureDevServer();
  setInterval(ensureDevServer, POLL_MS);
  setInterval(checkForSourceChanges, SCAN_MS);
}

function claimWatcherLock() {
  if (existsSync(PID_FILE)) {
    const pid = Number(readFileSync(PID_FILE, "utf8").trim());
    if (pid && isProcessAlive(pid)) {
      log(`watcher already running pid=${pid}; exiting`);
      process.exit(0);
    }
  }
  writeFileSync(PID_FILE, `${process.pid}\n`);
  process.on("exit", () => {
    try {
      if (readFileSync(PID_FILE, "utf8").trim() === String(process.pid)) {
        rmSync(PID_FILE, { force: true });
      }
    } catch {}
  });
}

async function ensureDevServer() {
  if (healthCheckRunning) return;
  healthCheckRunning = true;
  try {
    if (await isHealthy()) return;
    if (await isPortAccepting()) {
      log("dev server health check failed but port 3001 is accepting connections; waiting");
      return;
    }
    const now = Date.now();
    if (now - lastRestartAt < RESTART_COOLDOWN_MS) return;
    lastRestartAt = now;
    log("dev server health check failed; starting pnpm --filter @optimitron/web dev:fast");
    startDevServer();
  } finally {
    healthCheckRunning = false;
  }
}

function startDevServer() {
  if (process.platform === "win32") {
    const command = `pnpm --filter "@optimitron/web" dev:fast > ${cmdQuote(DEV_SERVER_LOG)} 2>&1`;
    const ps = [
      "Start-Process -FilePath cmd.exe",
      `-ArgumentList @('/d','/s','/c',${psQuote(command)})`,
      `-WorkingDirectory ${psQuote(REPO_ROOT)}`,
      "-WindowStyle Hidden",
    ].join(" ");
    spawn("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", ps], {
      cwd: REPO_ROOT,
      detached: true,
      stdio: "ignore",
    }).unref();
    return;
  }

  const logFd = openSync(DEV_SERVER_LOG, "a");
  const child = spawn("nohup", ["pnpm", "--filter", "@optimitron/web", "dev:fast"], {
    cwd: REPO_ROOT,
    detached: true,
    stdio: ["ignore", logFd, logFd],
  });
  child.unref();
}

function checkForSourceChanges() {
  const next = scanWatchedFiles();
  const changed = hasSnapshotChanged(knownFiles, next);
  knownFiles = next;
  if (changed) scheduleRegen();
}

function scheduleRegen() {
  if (regenTimer) clearTimeout(regenTimer);
  regenTimer = setTimeout(runRegen, DEBOUNCE_MS);
}

function runRegen() {
  if (regenRunning) {
    regenQueued = true;
    return;
  }
  regenRunning = true;
  log("source change detected; running pnpm --filter @optimitron/web copy:preview");
  const startedAt = Date.now();
  const child = spawn("pnpm", ["--filter", "@optimitron/web", "copy:preview"], {
    cwd: REPO_ROOT,
    shell: process.platform === "win32",
    stdio: ["ignore", "ignore", "pipe"],
  });
  child.stderr.on("data", (chunk) => log(`copy:preview stderr: ${chunk.toString().trim()}`));
  child.on("exit", (code, signal) => {
    const suffix = signal ? `signal=${signal}` : `exit=${code}`;
    log(`copy:preview finished ${suffix} durationMs=${Date.now() - startedAt}`);
    regenRunning = false;
    if (regenQueued) {
      regenQueued = false;
      scheduleRegen();
    }
  });
}

function scanWatchedFiles() {
  const files = new Map();
  for (const target of WATCH_TARGETS) scanTarget(target, files);
  return files;
}

function scanTarget(target, files) {
  if (!existsSync(target)) return;
  const stat = statSync(target);
  if (stat.isFile()) {
    if (!isGeneratedArtifact(target)) files.set(normalizePath(target), `${stat.mtimeMs}:${stat.size}`);
    return;
  }
  if (!stat.isDirectory()) return;
  for (const entry of readdirSync(target, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    scanTarget(path.join(target, entry.name), files);
  }
}

function hasSnapshotChanged(previous, next) {
  if (previous.size !== next.size) return true;
  for (const [file, signature] of next) {
    if (previous.get(file) !== signature) return true;
  }
  return false;
}

function isGeneratedArtifact(filePath) {
  const name = path.basename(filePath);
  return name === "page.logged-out.md" || name === "page.logged-in.md" || name.endsWith(".email.md");
}

function isPortAccepting() {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: HEALTH_URL.hostname, port: Number(HEALTH_URL.port) });
    const finish = (result) => {
      socket.destroy();
      resolve(result);
    };
    socket.setTimeout(1000, () => finish(false));
    socket.once("connect", () => finish(true));
    socket.once("error", () => finish(false));
  });
}

function isHealthy() {
  return new Promise((resolve) => {
    const req = http.get(
      {
        hostname: HEALTH_URL.hostname,
        port: Number(HEALTH_URL.port),
        path: HEALTH_URL.pathname,
        timeout: HEALTH_TIMEOUT_MS,
      },
      (res) => {
        res.resume();
        resolve(res.statusCode >= 200 && res.statusCode < 400);
      },
    );
    req.on("timeout", () => req.destroy());
    req.on("error", () => resolve(false));
  });
}

function isProcessAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function log(message) {
  appendFileSync(LOG_FILE, `${new Date().toISOString()} ${message}\n`);
}

function normalizePath(filePath) {
  const resolved = path.resolve(filePath);
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}

function psQuote(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function cmdQuote(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}
