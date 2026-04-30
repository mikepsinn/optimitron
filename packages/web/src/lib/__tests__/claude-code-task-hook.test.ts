import { describe, expect, it } from "vitest";

import {
  buildClaudeCodePrompt,
  buildCompletionComment,
  buildPrTitle,
  getTaskAcceptanceCriteria,
  parseClaudeHookArgs,
} from "../claude-code-task-hook";

describe("Claude Code task hook helpers", () => {
  const task = {
    contextJson: {
      acceptanceCriteria: [
        "Task is claimed before work begins",
        "PR title includes the task ID",
      ],
      executor_type: "AI Agent",
    },
    description: "Build the integration.",
    id: "task-123",
    title: "Build Claude Code hook",
  };

  it("extracts acceptance criteria from task context", () => {
    expect(getTaskAcceptanceCriteria(task)).toEqual([
      "Task is claimed before work begins",
      "PR title includes the task ID",
    ]);
  });

  it("builds a Claude Code prompt that includes task identity and acceptance criteria", () => {
    const prompt = buildClaudeCodePrompt({
      repoRoot: "E:\\code\\optimitron",
      task,
    });

    expect(prompt).toContain("task-123");
    expect(prompt).toContain("Build Claude Code hook");
    expect(prompt).toContain("Task is claimed before work begins");
    expect(prompt).toContain("When done, open a PR whose title includes task-123");
  });

  it("builds PR and completion text with the task ID", () => {
    expect(buildPrTitle(task)).toBe("task-123: Build Claude Code hook");
    expect(
      buildCompletionComment({
        prUrl: "https://github.com/mikepsinn/optimitron/pull/1",
        summary: "Added the hook script.",
        taskId: "task-123",
      }),
    ).toContain("task-123");
  });

  it("parses start and finish commands", () => {
    expect(parseClaudeHookArgs(["start", "--execute"])).toMatchObject({
      command: "start",
      execute: true,
    });
    expect(
      parseClaudeHookArgs([
        "finish",
        "--task-id",
        "task-123",
        "--summary",
        "Done",
        "--pr-url",
        "https://github.com/mikepsinn/optimitron/pull/1",
      ]),
    ).toMatchObject({
      command: "finish",
      prUrl: "https://github.com/mikepsinn/optimitron/pull/1",
      summary: "Done",
      taskId: "task-123",
    });
  });
});
