#!/usr/bin/env node
// review-loop-gate.mjs
//
// Claude hook for Mike's one-at-a-time page review protocol.
//
// Modes:
//   --post-edit      PostToolUse on Edit/Write/MultiEdit; append touched
//                    user-facing routes to the per-branch markdown queue.
//   --post-ask       PostToolUse on AskUserQuestion; record a sentinel for
//                    this turn/top queue item.
//   --session-start  SessionStart; load/surface current queue context.
//   --stop           Stop; block turn-end until AskUserQuestion is used when
//                    Pending pages exist.
//
// Exit codes:
//   0  allow
//   2  block Stop; stderr tells Claude exactly what to do next
//
// Fail-open for unexpected hook/runtime errors except explicit Stop blocks.

import { execFileSync, spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

const MODE = process.argv[2] ?? "";
const RepoRoot = process.env.CLAUDE_PROJECT_DIR
  ? path.resolve(process.env.CLAUDE_PROJECT_DIR)
  : process.cwd();
const StateDir = path.join(RepoRoot, ".claude", "state");
const QueueFile = process.env.CLAUDE_REVIEW_QUEUE_FILE
  ? path.resolve(process.env.CLAUDE_REVIEW_QUEUE_FILE)
  : path.join(StateDir, `review-queue-${branchSlug()}.md`);

class StopBlock extends Error {}

try {
  const hookData = readHookData();

  if (MODE === "--post-edit") {
    postEdit(hookData);
    process.exit(0);
  }

  if (MODE === "--post-ask") {
    postAsk(hookData);
    process.exit(0);
  }

  if (MODE === "--session-start") {
    sessionStart();
    process.exit(0);
  }

  if (MODE === "--stop") {
    stopGate(hookData);
    process.exit(0);
  }

  process.exit(0);
} catch (error) {
  if (error instanceof StopBlock) {
    process.stderr.write(`${error.message}\n`);
    process.exit(2);
  }
  process.exit(0);
}

function postEdit(hookData) {
  const tool = hookData?.tool_name;
  if (!["Edit", "Write", "MultiEdit"].includes(tool)) return;

  const filePath = hookData?.tool_input?.file_path;
  if (typeof filePath !== "string" || !filePath.trim()) return;

  const relPath = toRepoRelative(filePath);
  if (!isReviewablePath(relPath)) return;

  const entries = entriesForTouchedPath(relPath);
  if (!entries.length) return;

  appendPendingEntries(entries);
}

function postAsk(hookData) {
  if (hookData?.tool_name && hookData.tool_name !== "AskUserQuestion") return;

  const queue = readQueue();
  const pending = parsePending(queue);
  const sentinel = {
    sessionId: sessionId(hookData),
    transcriptPath: normalizedTranscriptPath(hookData),
    turnMarker: currentTurnMarker(hookData),
    queueFingerprint: queueFingerprint(pending),
    topPending: pending[0] ?? null,
    ts: new Date().toISOString(),
  };

  mkdirSync(StateDir, { recursive: true });
  writeFileSync(sentinelPath(hookData), `${JSON.stringify(sentinel, null, 2)}\n`, "utf8");
}

function sessionStart() {
  const queue = readQueue();
  const pending = parsePending(queue);
  if (!pending.length) return;

  const top = pending[0];
  process.stdout.write(
    [
      `[review-loop-gate] Review queue loaded: ${pending.length} Pending item(s).`,
      `Top Pending page: ${top.label}${top.note ? ` - ${top.note}` : ""}`,
      `Queue: ${QueueFile}`,
      "Every Claude response that ends while Pending is non-empty must call AskUserQuestion for one page.",
    ].join("\n") + "\n",
  );
}

function stopGate(hookData) {
  const queue = readQueue();
  const pending = parsePending(queue);
  if (!pending.length) return;

  if (askedThisTurn(hookData, pending)) return;

  const top = pending[0];
  throw new StopBlock(formatStopBlock(pending, top));
}

function askedThisTurn(hookData, pending) {
  const transcript = transcriptAskState(hookData);
  const fingerprint = queueFingerprint(pending);
  if (transcript.hasAskUserQuestion) {
    if (!transcript.askTimestampMs) return true;
    const queueMtimeMs = fileMtimeMs(QueueFile);
    if (!queueMtimeMs || transcript.askTimestampMs + 1000 >= queueMtimeMs) return true;
  }

  const sentinel = readSentinel(hookData);
  if (!sentinel) return false;
  if (sentinel.sessionId !== sessionId(hookData)) return false;
  if (sentinel.turnMarker !== currentTurnMarker(hookData)) return false;
  if (sentinel.queueFingerprint !== fingerprint) return false;

  return true;
}

function transcriptAskState(hookData) {
  const transcriptPath = normalizedTranscriptPath(hookData);
  if (!transcriptPath || !existsSync(transcriptPath)) {
    return { hasAskUserQuestion: false, askTimestampMs: null };
  }

  const entries = readJsonl(transcriptPath);
  let lastHumanIndex = -1;
  for (let index = 0; index < entries.length; index += 1) {
    if (isHumanUserEntry(entries[index])) lastHumanIndex = index;
  }

  let askTimestampMs = null;
  for (let index = lastHumanIndex + 1; index < entries.length; index += 1) {
    const entry = entries[index];
    if (!entryHasToolUse(entry, "AskUserQuestion")) continue;
    const ts = Date.parse(entry.timestamp ?? "");
    askTimestampMs = Number.isFinite(ts) ? ts : null;
  }

  return {
    hasAskUserQuestion: askTimestampMs !== null || entries
      .slice(lastHumanIndex + 1)
      .some((entry) => entryHasToolUse(entry, "AskUserQuestion")),
    askTimestampMs,
  };
}

function currentTurnMarker(hookData) {
  const transcriptPath = normalizedTranscriptPath(hookData);
  if (!transcriptPath || !existsSync(transcriptPath)) {
    return `no-transcript:${sessionId(hookData)}`;
  }

  const entries = readJsonl(transcriptPath);
  let marker = `transcript:${transcriptPath}:no-human`;
  for (const entry of entries) {
    if (!isHumanUserEntry(entry)) continue;
    marker = entry.uuid || entry.timestamp || `human-index:${entries.indexOf(entry)}`;
  }
  return marker;
}

function isHumanUserEntry(entry) {
  if (entry?.type !== "user") return false;
  if (entry?.sourceToolAssistantUUID) return false;
  const content = entry?.message?.content;
  if (Array.isArray(content)) {
    return !content.every((part) => part?.type === "tool_result");
  }
  return typeof content === "string";
}

function entryHasToolUse(entry, expectedName) {
  if (entry?.type !== "assistant") return false;
  const content = entry?.message?.content;
  if (!Array.isArray(content)) return false;
  return content.some(
    (part) =>
      part?.type === "tool_use" &&
      typeof part.name === "string" &&
      part.name.includes(expectedName),
  );
}

function appendPendingEntries(entries) {
  const original = readQueue();
  const pending = parsePending(original);
  const pendingLabels = new Set(pending.map((item) => item.label));
  const newEntries = uniqueEntries(entries).filter((entry) => !pendingLabels.has(entry.label));
  if (!newEntries.length) return;

  let text = original || initialQueue();
  text = touchUpdatedLine(text);
  const section = "## Pending — Auto-added by review-loop hook";

  if (!text.includes(section)) {
    const approvedIndex = text.search(/\n## Approved\b/);
    const insert = `\n${section}\n`;
    if (approvedIndex >= 0) {
      text = `${text.slice(0, approvedIndex)}${insert}${text.slice(approvedIndex)}`;
    } else {
      text = `${text.replace(/\s*$/, "\n")}${insert}`;
    }
  }

  const lines = text.split(/\r?\n/);
  const sectionIndex = lines.findIndex((line) => line.trim() === section);
  let insertIndex = lines.length;
  for (let index = sectionIndex + 1; index < lines.length; index += 1) {
    if (/^##\s+/.test(lines[index])) {
      insertIndex = index;
      break;
    }
  }

  const sectionBody = lines.slice(sectionIndex + 1, insertIndex);
  const noneIndex = sectionBody.findIndex((line) => /^\(none yet\)\s*$/.test(line));
  if (noneIndex >= 0) lines.splice(sectionIndex + 1 + noneIndex, 1);

  const entryLines = newEntries.map((entry) => `- [ ] ${entry.label} - touched ${entry.file}`);
  const adjustedInsertIndex = noneIndex >= 0 && sectionIndex + 1 + noneIndex < insertIndex
    ? insertIndex - 1
    : insertIndex;
  lines.splice(adjustedInsertIndex, 0, ...entryLines);

  mkdirSync(path.dirname(QueueFile), { recursive: true });
  writeFileSync(QueueFile, `${lines.join("\n").replace(/\s+$/, "")}\n`, "utf8");
}

function entriesForTouchedPath(relPath) {
  if (/^packages\/web\/src\/app\//.test(relPath)) {
    const route = routeFromAppPath(relPath);
    return route ? [{ label: route, file: relPath }] : [];
  }

  if (isEmailPath(relPath)) {
    return [{ label: emailLabel(relPath), file: relPath }];
  }

  const affected = affectedRoutes(relPath);
  if (affected.length) {
    return affected.map((route) => ({ label: route, file: relPath }));
  }

  if (/^packages\/web\/src\/components\//.test(relPath)) {
    return [{ label: `component: ${relPath}`, file: relPath }];
  }

  if (/^packages\/web\/src\/lib\/(routes\.ts|messaging\.ts)$/.test(relPath)) {
    return [{ label: `shared copy: ${relPath}`, file: relPath }];
  }

  return [];
}

function affectedRoutes(relPath) {
  const script = path.join(RepoRoot, "packages", "web", "scripts", "affected-routes.mjs");
  if (!existsSync(script)) return [];

  const result = spawnSync(process.execPath, [script, relPath], {
    cwd: RepoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
    timeout: 2500,
  });
  if (result.status !== 0) return [];

  return result.stdout
    .split(",")
    .map((route) => route.trim())
    .filter(Boolean);
}

function routeFromAppPath(relPath) {
  const prefix = "packages/web/src/app/";
  const appRel = relPath.slice(prefix.length);
  const rawSegments = appRel.split("/");
  if (rawSegments[0] === "api") return null;

  const fileName = rawSegments.at(-1) ?? "";
  if (!/\.(tsx|ts|jsx|js|md)$/.test(fileName)) return null;

  let segments = rawSegments.slice(0, -1);
  const stopAt = segments.findIndex((segment) =>
    ["components", "_components", "lib", "utils", "hooks"].includes(segment),
  );
  if (stopAt >= 0) segments = segments.slice(0, stopAt);

  const routeSegments = segments.filter(
    (segment) =>
      segment &&
      !segment.startsWith("(") &&
      !segment.startsWith("@") &&
      !segment.startsWith("_"),
  );
  return routeSegments.length ? `/${routeSegments.join("/")}` : "/";
}

function isReviewablePath(relPath) {
  if (/\.(test|spec)\.(ts|tsx|js|jsx|mjs|cjs)$/.test(relPath)) return false;
  if (/\/__tests__\//.test(relPath)) return false;
  if (/^packages\/web\/src\/app\//.test(relPath)) return true;
  if (/^packages\/web\/src\/components\//.test(relPath)) return true;
  if (/^packages\/web\/src\/lib\/(routes\.ts|messaging\.ts)$/.test(relPath)) return true;
  if (/^packages\/web\/src\/lib\/email\//.test(relPath)) return true;
  if (/^packages\/web\/src\/emails\//.test(relPath)) return true;
  if (/^packages\/web\/emails\//.test(relPath)) return true;
  return false;
}

function isEmailPath(relPath) {
  return (
    /^packages\/web\/src\/lib\/email\//.test(relPath) ||
    /^packages\/web\/src\/emails\//.test(relPath) ||
    /^packages\/web\/emails\//.test(relPath)
  );
}

function emailLabel(relPath) {
  const base = path.posix.basename(relPath).replace(/\.(email\.md|tsx|ts|jsx|js|md)$/, "");
  return `email: ${base || relPath}`;
}

function parsePending(markdown) {
  const pending = [];
  let inPending = false;
  for (const line of markdown.split(/\r?\n/)) {
    const heading = line.match(/^##\s+(.+?)\s*$/);
    if (heading) {
      inPending = heading[1].startsWith("Pending");
      continue;
    }
    if (!inPending) continue;
    const item = line.match(/^\s*-\s+\[\s\]\s+(.+?)(?:\s+[—-]\s+(.+))?\s*$/);
    if (!item) continue;
    const label = (item[1] ?? "").trim();
    if (!label) continue;
    pending.push({
      label,
      note: (item[2] ?? "").trim(),
      raw: line.trim(),
    });
  }
  return pending;
}

function formatStopBlock(pending, top) {
  return [
    `[review-loop-gate] ${pending.length} Pending review item(s) remain, and this turn has not called AskUserQuestion for the current queue item.`,
    "",
    `Top Pending page: ${top.label}${top.note ? ` - ${top.note}` : ""}`,
    `Queue file: ${QueueFile}`,
    "",
    "Mike's protocol is strict: every response that ends with Pending pages in the review queue must terminate with an AskUserQuestion about one page.",
    "",
    "Before ending the turn, surface the topmost Pending page with AskUserQuestion:",
    `- Route/page: ${top.label}`,
    top.note ? `- What changed: ${top.note}` : "- What changed: read the queue row and the page diff, then summarize it in one line.",
    "- Options: A: Looks good, ship it; B-D: 2-3 specific predicted complaints from the diff; Other: Mike's freeform complaint.",
    "",
    "After AskUserQuestion fires, the AskUserQuestion PostToolUse hook records the sentinel and this Stop hook will allow the turn to end.",
  ].join("\n");
}

function readQueue() {
  if (!existsSync(QueueFile)) return "";
  return readFileSync(QueueFile, "utf8");
}

function initialQueue() {
  return [
    `# Review queue - ${branchName()}`,
    `Updated: ${new Date().toISOString()}`,
    "",
    "## Pending",
    "(none yet)",
    "",
    "## Approved",
    "(none yet)",
    "",
    "## Needs fixes",
    "(none yet)",
    "",
  ].join("\n");
}

function touchUpdatedLine(text) {
  const now = `Updated: ${new Date().toISOString()}`;
  if (/^Updated:\s*.+$/m.test(text)) return text.replace(/^Updated:\s*.+$/m, now);
  return text.replace(/^# .+$/m, (heading) => `${heading}\n${now}`);
}

function queueFingerprint(pending) {
  const top = pending[0]?.raw ?? "";
  return `${pending.length}:${top}`;
}

function readSentinel(hookData) {
  const filePath = sentinelPath(hookData);
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function sentinelPath(hookData) {
  return path.join(StateDir, `review-loop-ask-user-question-${safeName(sessionId(hookData))}.json`);
}

function sessionId(hookData) {
  return String(hookData?.session_id ?? hookData?.sessionId ?? "unknown-session");
}

function normalizedTranscriptPath(hookData) {
  const transcriptPath = hookData?.transcript_path ?? hookData?.transcriptPath;
  return typeof transcriptPath === "string" && transcriptPath.trim()
    ? path.resolve(transcriptPath)
    : null;
}

function readJsonl(filePath) {
  try {
    return readFileSync(filePath, "utf8")
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

function readHookData() {
  try {
    const raw = readFileSync(0, "utf8");
    if (raw && raw.trim()) return JSON.parse(raw);
  } catch {
    // No/bad stdin: hooks fail open.
  }
  return {};
}

function toRepoRelative(filePath) {
  const normalized = filePath.replace(/\\/g, "/");
  if (normalized.startsWith("packages/")) return normalized;

  const absolute = path.isAbsolute(filePath) ? path.resolve(filePath) : path.resolve(RepoRoot, filePath);
  let rel = path.relative(RepoRoot, absolute).replace(/\\/g, "/");
  if (rel.startsWith("../")) rel = normalized;
  return rel;
}

function branchSlug() {
  return safeName(branchName()).replace(/^-+|-+$/g, "") || "unknown-branch";
}

function branchName() {
  try {
    return execFileSync("git", ["-C", RepoRoot, "branch", "--show-current"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim() || "unknown-branch";
  } catch {
    return "unknown-branch";
  }
}

function safeName(value) {
  return String(value).replace(/[^A-Za-z0-9._-]+/g, "-");
}

function uniqueEntries(entries) {
  const seen = new Set();
  const out = [];
  for (const entry of entries) {
    const key = `${entry.label}\n${entry.file}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(entry);
  }
  return out;
}

function fileMtimeMs(filePath) {
  try {
    return statSync(filePath).mtimeMs;
  } catch {
    return 0;
  }
}
