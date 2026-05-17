import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  TaskCategory,
  TaskClaimPolicy,
  TaskDifficulty,
  TaskStatus,
} from "@optimitron/db";
import { describe, expect, it, vi } from "vitest";
import { PublicProfileTaskSection } from "./PublicProfileTaskSection";
import type { TaskCardTask } from "./task-card";

vi.mock("@/components/tasks/TaskShareButtons", () => ({
  TaskShareButtons: ({ taskId }: { taskId: string }) => (
    <span data-task-share={taskId}>Send reminder</span>
  ),
}));

function task(overrides: Partial<TaskCardTask>): TaskCardTask {
  return {
    activeClaimCount: 0,
    assigneeAffiliationSnapshot: null,
    assigneeOrganization: null,
    assigneePerson: null,
    category: TaskCategory.OTHER,
    claimPolicy: TaskClaimPolicy.ASSIGNED_ONLY,
    communicationEndpoints: [],
    completedAt: null,
    currentImpactEstimateSet: null,
    description: "Task description",
    difficulty: TaskDifficulty.BEGINNER,
    dueAt: null,
    estimatedEffortHours: null,
    id: "task_1",
    impact: {
      costPerDalyUsd: null,
      selectedFrame: null,
      selectedMetrics: null,
    },
    interestTags: [],
    isPublic: true,
    maxClaims: null,
    parentTask: null,
    primaryEndpoint: null,
    recommendationScore: undefined,
    roleTitle: null,
    skillTags: [],
    sortOrder: null,
    sourceUrl: null,
    status: TaskStatus.ACTIVE,
    taskKey: null,
    title: "Task title",
    verifiedAt: null,
    viewerHasClaim: false,
    ...overrides,
  };
}

describe("PublicProfileTaskSection", () => {
  it("renders open and completed public profile tasks without campaign filtering", () => {
    (globalThis as typeof globalThis & { React: typeof React }).React = React;

    const html = renderToStaticMarkup(
      <PublicProfileTaskSection
        completedTasks={[
          task({
            id: "task_done",
            status: TaskStatus.VERIFIED,
            title: "Publish completion receipt",
            verifiedAt: new Date("2026-05-01T00:00:00.000Z"),
          }),
        ]}
        openTasks={[
          task({
            id: "task_open",
            status: TaskStatus.ACTIVE,
            title: "Call the health minister",
          }),
        ]}
        ownerName="Ada"
      />,
    );

    expect(html).toContain("Open Tasks (1)");
    expect(html).toContain("Completed Tasks (1)");
    expect(html).toContain("Call the health minister");
    expect(html).toContain("Publish completion receipt");
    expect(html).toContain('data-task-share="task_open"');
    expect(html).not.toContain('data-task-share="task_done"');
  });
});
