import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const hookPath = path.join(__dirname, "review-loop-gate.mjs");

test("Stop blocks a non-empty Pending queue until AskUserQuestion is used", () => {
  const fixture = createFixture();
  try {
    writeQueue(fixture.queuePath, [
      "## Pending",
      "- [ ] /donate — review the donation hero",
      "",
      "## Approved",
      "(none yet)",
    ]);
    writeTranscript(fixture.transcriptPath, [
      humanMessage("u1", "Review these pages."),
    ]);

    const result = runHook(fixture, ["--stop"], {
      session_id: "session-a",
      transcript_path: fixture.transcriptPath,
    });

    assert.equal(result.status, 2);
    assert.match(result.stderr, /AskUserQuestion/);
    assert.match(result.stderr, /\/donate/);
    assert.match(result.stderr, /review the donation hero/);
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("Stop allows the turn when AskUserQuestion was called after the last human prompt", () => {
  const fixture = createFixture();
  try {
    writeQueue(fixture.queuePath, [
      "## Pending",
      "- [ ] /donate — review the donation hero",
    ]);
    writeTranscript(fixture.transcriptPath, [
      humanMessage("u1", "Review these pages."),
      assistantToolUse("a1", "AskUserQuestion"),
    ]);

    const result = runHook(fixture, ["--stop"], {
      session_id: "session-a",
      transcript_path: fixture.transcriptPath,
    });

    assert.equal(result.status, 0);
    assert.equal(result.stderr, "");
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("Stop allows the turn when the AskUserQuestion sentinel matches the current turn", () => {
  const fixture = createFixture();
  try {
    writeQueue(fixture.queuePath, [
      "## Pending",
      "- [ ] /donate — review the donation hero",
    ]);
    writeTranscript(fixture.transcriptPath, [
      humanMessage("u1", "Review these pages."),
    ]);

    const postAsk = runHook(fixture, ["--post-ask"], {
      session_id: "session-a",
      transcript_path: fixture.transcriptPath,
      tool_name: "AskUserQuestion",
    });
    assert.equal(postAsk.status, 0);

    const stop = runHook(fixture, ["--stop"], {
      session_id: "session-a",
      transcript_path: fixture.transcriptPath,
    });

    assert.equal(stop.status, 0);
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("PostToolUse appends touched app page routes to the review queue", () => {
  const fixture = createFixture();
  try {
    writeQueue(fixture.queuePath, [
      "# Review queue — feature/test",
      "Updated: 2026-05-15T00:00:00Z",
      "",
      "## Pending",
      "(none yet)",
      "",
      "## Approved",
      "(none yet)",
    ]);

    const result = runHook(fixture, ["--post-edit"], {
      session_id: "session-a",
      tool_name: "Edit",
      tool_input: {
        file_path: path.join(fixture.root, "packages/web/src/app/treaty/page.tsx"),
        new_string: "Vote now.",
      },
    });

    assert.equal(result.status, 0);
    const queue = readFileSync(fixture.queuePath, "utf8");
    assert.match(queue, /## Pending/);
    assert.match(queue, /- \[ \] \/treaty - touched packages\/web\/src\/app\/treaty\/page\.tsx/);
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("PostToolUse handles MultiEdit edits arrays and does not duplicate pending routes", () => {
  const fixture = createFixture();
  try {
    writeQueue(fixture.queuePath, [
      "## Pending",
      "- [ ] /organizations/[id] — existing review",
      "",
      "## Approved",
      "(none yet)",
    ]);

    const filePath = path.join(
      fixture.root,
      "packages/web/src/app/organizations/[id]/page.tsx",
    );
    const result = runHook(fixture, ["--post-edit"], {
      session_id: "session-a",
      tool_name: "MultiEdit",
      tool_input: {
        file_path: filePath,
        edits: [
          { old_string: "old", new_string: "new" },
          { old_string: "older", new_string: "newer" },
        ],
      },
    });

    assert.equal(result.status, 0);
    const queue = readFileSync(fixture.queuePath, "utf8");
    assert.equal(queue.match(/\/organizations\/\[id\]/g)?.length, 1);
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("SessionStart loads the current queue and surfaces the top Pending item", () => {
  const fixture = createFixture();
  try {
    writeQueue(fixture.queuePath, [
      "# Review queue — feature/test",
      "",
      "## Pending — Priority 1",
      "- [ ] /donate — review the donation hero",
      "- [ ] /treaty — review the treaty flow",
    ]);

    const result = runHook(fixture, ["--session-start"], {
      session_id: "session-a",
    });

    assert.equal(result.status, 0);
    assert.match(result.stdout, /Review queue loaded/);
    assert.match(result.stdout, /\/donate/);
    assert.doesNotMatch(result.stdout, /\/treaty.*top/s);
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

function createFixture() {
  const root = mkdtempSync(path.join(tmpdir(), "review-loop-gate-"));
  mkdirSync(path.join(root, ".claude/state"), { recursive: true });
  mkdirSync(path.join(root, ".git"), { recursive: true });
  const queuePath = path.join(root, ".claude/state/review-queue-feature-test.md");
  const transcriptPath = path.join(root, "transcript.jsonl");
  return { root, queuePath, transcriptPath };
}

function runHook(fixture, args, hookData) {
  return spawnSync(process.execPath, [hookPath, ...args], {
    cwd: repoRoot,
    env: {
      ...process.env,
      CLAUDE_PROJECT_DIR: fixture.root,
      CLAUDE_REVIEW_QUEUE_FILE: fixture.queuePath,
    },
    input: JSON.stringify(hookData),
    encoding: "utf8",
  });
}

function writeQueue(filePath, lines) {
  writeFileSync(filePath, `${lines.join("\n")}\n`, "utf8");
}

function writeTranscript(filePath, entries) {
  writeFileSync(filePath, `${entries.map((entry) => JSON.stringify(entry)).join("\n")}\n`, "utf8");
}

function humanMessage(uuid, text) {
  return {
    type: "user",
    uuid,
    message: { role: "user", content: text },
  };
}

function assistantToolUse(uuid, name) {
  return {
    type: "assistant",
    uuid,
    message: {
      role: "assistant",
      content: [{ type: "tool_use", id: `toolu_${uuid}`, name, input: {} }],
    },
  };
}
