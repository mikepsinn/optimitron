import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TaskClaimStatus, TaskStatus } from "@optimitron/db";
import { describe, expect, it } from "vitest";
import {
  canSeeRelatedTask,
  TaskDependenciesSection,
  type RelatedTaskLink,
  type TaskDependenciesSectionTask,
  type TaskDependenciesViewer,
} from "./TaskDependenciesSection";

function relatedTask(
  overrides: Partial<RelatedTaskLink> = {},
): RelatedTaskLink {
  return {
    assigneePersonId: null,
    claims: [],
    createdByUserId: "creator_other",
    dueAt: null,
    estimatedEffortHours: null,
    id: "task_related",
    isPublic: true,
    status: TaskStatus.ACTIVE,
    taskKey: null,
    title: "Related task",
    ...overrides,
  };
}

describe("canSeeRelatedTask", () => {
  const viewer: NonNullable<TaskDependenciesViewer> = {
    id: "user_viewer",
    isAdmin: false,
    personId: "person_viewer",
  };

  it("shows public related tasks", () => {
    expect(canSeeRelatedTask(relatedTask({ isPublic: true }), null)).toBe(true);
  });

  it("hides private related tasks unless the viewer has access", () => {
    expect(canSeeRelatedTask(relatedTask({ isPublic: false }), viewer)).toBe(
      false,
    );
    expect(
      canSeeRelatedTask(
        relatedTask({
          createdByUserId: viewer.id,
          isPublic: false,
        }),
        viewer,
      ),
    ).toBe(true);
    expect(
      canSeeRelatedTask(
        relatedTask({
          claims: [
            {
              status: TaskClaimStatus.IN_PROGRESS,
              userId: viewer.id,
            },
          ],
          isPublic: false,
        }),
        viewer,
      ),
    ).toBe(true);
  });
});

describe("TaskDependenciesSection", () => {
  it("renders visible blockers and unlocked tasks while hiding private related tasks", () => {
    const task: TaskDependenciesSectionTask = {
      incomingEdges: [
        {
          edgeType: "BLOCKS",
          fromTask: relatedTask({
            dueAt: "2026-07-10T00:00:00.000Z",
            estimatedEffortHours: 1.5,
            id: "task_public_blocker",
            taskKey: "public-blocker",
            title: "Collect treaty signature proof",
          }),
          probabilityDeltaBase: 0.055,
          timeDeltaDaysBase: 2,
        },
        {
          edgeType: "BLOCKS",
          fromTask: relatedTask({
            id: "task_private_blocker",
            isPublic: false,
            title: "Private hidden blocker",
          }),
        },
      ],
      outgoingEdges: [
        {
          edgeType: "DEPENDS_ON",
          probabilityDeltaBase: null,
          timeDeltaDaysBase: 1,
          toTask: relatedTask({
            id: "task_unlock",
            status: TaskStatus.DRAFT,
            title: "Notify the treaty campaign",
          }),
        },
      ],
    };

    const html = renderToStaticMarkup(
      <TaskDependenciesSection task={task} viewer={null} />,
    );

    expect(html).toContain("Dependencies");
    expect(html).toContain("Blocking this task");
    expect(html).toContain("Tasks this unlocks");
    expect(html).toContain("Collect treaty signature proof");
    expect(html).toContain("/tasks/task_public_blocker");
    expect(html).toContain("blocks this");
    expect(html).toContain("public-blocker");
    expect(html).toContain("Due July 10, 2026");
    expect(html).toContain("~1.5 hours");
    expect(html).toContain("+5.5pp success");
    expect(html).toContain("2 days faster");
    expect(html).toContain("Notify the treaty campaign");
    expect(html).toContain("needed by");
    expect(html).toContain("1 day faster");
    expect(html).not.toContain("Private hidden blocker");
  });

  it("renders nothing when no related tasks are visible", () => {
    const html = renderToStaticMarkup(
      <TaskDependenciesSection
        task={{
          incomingEdges: [
            {
              edgeType: "BLOCKS",
              fromTask: relatedTask({
                isPublic: false,
                title: "Private hidden blocker",
              }),
            },
          ],
          outgoingEdges: [],
        }}
        viewer={null}
      />,
    );

    expect(html).toBe("");
  });
});
