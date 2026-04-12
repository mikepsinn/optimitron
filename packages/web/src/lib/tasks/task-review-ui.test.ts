import { describe, expect, it } from "vitest";
import {
  buildTaskPressureShareText,
  buildPublicOfficialPersonReview,
  getTaskPressurePrompt,
  getTaskReviewUi,
} from "./task-review-ui";

const treatySignerContext = {
  treatySignerSlot: {
    annualRedirectAmountUsd: 9_970_000_000,
    countryCode: "US",
    countryName: "United States",
    decisionMakerLabel: "President of the United States",
    governmentName: "United States Government",
    militaryBudgetSharePct: 36.7,
    militaryBudgetShareRatio: 0.367,
    militaryBudgetUsd: 997_000_000_000,
    snapshotYear: 2024,
    worldMilitarySpendingUsd: 2_718_000_000_000,
  },
};

describe("task review ui", () => {
  it("uses employee framing for public-official treaty tasks", () => {
    const result = getTaskReviewUi({
      assigneePerson: {
        displayName: "President Example",
        isPublicFigure: true,
        sourceRef: "wikidata:Q11696",
      },
      childTasks: [],
      contextJson: treatySignerContext,
      taskKey: "program:one-percent-treaty:signer:us",
      title: "Sign the 1% Treaty",
    });

    expect(result.assigneeLabel).toBe("Employee");
    expect(result.assignedBylinePrefix).toBe("Your employee");
    expect(result.recordLinkLabel).toBe("Employee Review");
    expect(result.blockerBanner?.eyebrow).toBe("Employee Performance Review");
    expect(result.blockerBanner?.metrics).toEqual([
      expect.objectContaining({ label: "Budget Controlled", value: "$997B" }),
      expect.objectContaining({ label: "Better Use Right Now", value: "$9.97B" }),
      expect.objectContaining({ label: "Trial Capacity", value: "10.7M" }),
    ]);
  });

  it("uses generic copy for non-official tasks and subtasks", () => {
    const result = getTaskReviewUi({
      assigneeOrganization: {
        name: "Neighborhood Group",
      },
      childTasks: [{}, {}],
      taskKey: "task:community:clean-up",
      title: "Clean up the park",
    });

    expect(result.assigneeLabel).toBe("Assignee");
    expect(result.assignedBylinePrefix).toBe("Assigned to");
    expect(result.childSectionHeading).toBe("Subtasks");
    expect(result.childSectionNavLabel).toBe("Subtasks");
    expect(result.blockerBanner).toBeNull();
  });

  it("builds a public-official review banner from the top blocking task", () => {
    const result = buildPublicOfficialPersonReview({
      openTasks: [
        {
          contextJson: treatySignerContext,
          description: "Secure the signature.",
          id: "task-1",
          taskKey: "program:one-percent-treaty:signer:us",
          title: "Sign the 1% Treaty",
        },
      ],
      person: {
        displayName: "President Example",
        isPublicFigure: true,
        sourceRef: "wikidata:Q11696",
      },
    });

    expect(result).toMatchObject({
      eyebrow: "Employee Performance Review",
      title: "Promote the general welfare.",
      callout: {
        eyebrow: "Current Blocking Task",
        href: "/tasks/task-1",
        title: "Sign the 1% Treaty",
      },
    });
    expect(result?.metrics).toEqual([
      expect.objectContaining({ label: "Budget Controlled", value: "$997B" }),
      expect.objectContaining({ label: "Better Use Right Now", value: "$9.97B" }),
      expect.objectContaining({ label: "Trial Capacity", value: "10.7M" }),
    ]);
  });

  it("does not build an employee review banner for ordinary people", () => {
    const result = buildPublicOfficialPersonReview({
      openTasks: [],
      person: {
        displayName: "Regular User",
        isPublicFigure: false,
        sourceRef: null,
      },
    });

    expect(result).toBeNull();
  });

  it("does not treat every public figure as a public employee", () => {
    const result = buildPublicOfficialPersonReview({
      openTasks: [],
      person: {
        displayName: "Mother Teresa",
        isPublicFigure: true,
        sourceRef: "public-figure:mother-teresa",
      },
    });

    expect(result).toBeNull();
  });

  it("builds treaty-specific pressure share text", () => {
    const text = buildTaskPressureShareText(
      {
        assigneePerson: {
          displayName: "President Example",
          isPublicFigure: true,
          sourceRef: "wikidata:Q11696",
        },
        contextJson: treatySignerContext,
        taskKey: "program:one-percent-treaty:signer:us",
        title: "Sign the 1% Treaty",
      },
      {
        currentDelayDays: 42,
        currentEconomicValueUsdLost: 1_500_000_000,
        currentHumanLivesLost: 12_345,
        currentSufferingHoursLost: 99_000_000,
      },
    );

    expect(text).toContain("Tell your employee President Example to take 30 seconds to sign the 1% Treaty.");
    expect(text).toContain("42 days overdue");
    expect(text).toContain("$9.97B per year");
  });

  it("builds a short pressure prompt for treaty blocker rows", () => {
    const text = getTaskPressurePrompt(
      {
        contextJson: treatySignerContext,
        taskKey: "program:one-percent-treaty:signer:us",
        title: "Sign the 1% Treaty",
      },
      {
        currentDelayDays: 3,
      },
    );

    expect(text).toContain("Tell your employee to take 30 seconds to sign");
    expect(text).toContain("3 days overdue");
  });

  it("keeps child-style treaty keys generic instead of mislabeling them as employees", () => {
    const result = getTaskReviewUi({
      assigneeOrganization: {
        name: "Australian Volunteers",
      },
      taskKey: "program:one-percent-treaty:signer:au:support:contact-office",
      title: "Contact Prime Minister of Australia's office about the 1% Treaty",
    });

    expect(result.assigneeLabel).toBe("Assignee");
    expect(result.recordLinkLabel).toBe("Full Record");
    expect(result.blockerBanner).toBeNull();
  });
});
