import { describe, expect, it } from "vitest";
import { getTaskAssigneeLabels } from "../assignee-label";

describe("getTaskAssigneeLabels", () => {
  it("uses the assignee person's name for display and share", () => {
    const labels = getTaskAssigneeLabels({
      assigneePerson: { displayName: "Ada Lovelace" },
    });
    expect(labels).toEqual({ display: "Ada Lovelace", share: "Ada Lovelace" });
  });

  it("uses the assignee organization's name when no person is assigned", () => {
    const labels = getTaskAssigneeLabels({
      assigneeOrganization: { name: "World Health Organization", slug: "who" },
    });
    expect(labels).toEqual({
      display: "World Health Organization",
      share: "World Health Organization",
    });
  });

  it("shows You for humanity-org tasks but shares as Humanity", () => {
    const labels = getTaskAssigneeLabels({
      assigneeOrganization: { name: "Humanity", slug: "humanity" },
    });
    expect(labels).toEqual({ display: "You", share: "Humanity" });
  });

  it("never echoes the task title for an unassigned task", () => {
    // Regression: unassigned rows used to fall back to task.title, so every
    // open task appeared to be assigned to itself.
    const labels = getTaskAssigneeLabels({
      assigneeOrganization: null,
      assigneePerson: null,
    });
    expect(labels).toEqual({ display: "Anyone", share: "Humanity" });
  });
});
