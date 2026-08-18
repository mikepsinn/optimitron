import { describe, expect, it } from "vitest";
import {
  buildTaskCommunicationMessage,
  resolveTaskCommunicationAction,
} from "./task-communication-action";

const delayStats = {
  currentDelayDays: 42,
  currentDelayMs: 42 * 24 * 60 * 60 * 1000,
  currentEconomicValueUsdLost: 1_500_000,
  currentHealthyLifeHoursLost: null,
  currentHumanLivesLost: 1_200,
  currentSufferingHoursLost: 40_000,
  delayDalysLostPerDay: null,
  delayEconomicValueUsdLostPerDay: 35_714,
  delayHealthyLifeHoursLostPerDay: null,
  delayHumanLivesLostPerDay: 28,
  delaySufferingHoursLostPerDay: 952,
  dueAt: new Date("2026-01-01T00:00:00.000Z"),
  isOverdue: true,
  overdueSince: new Date("2026-01-01T00:00:00.000Z"),
} as const;

describe("task communication action helpers", () => {
  it("builds a default accountability message", () => {
    const message = buildTaskCommunicationMessage({
      delayStats,
      task: {
        assigneePerson: {
          displayName: "President Example",
        },
        title: "Sign the 1% Treaty",
      },
    });

    expect(message).toContain("President Example");
    expect(message).toContain("Sign the 1% Treaty");
    expect(message).toContain("42 days overdue");
  });

  it("interpolates endpoint instructions", () => {
    const message = buildTaskCommunicationMessage({
      delayStats,
      task: {
        assigneePerson: {
          displayName: "President Example",
        },
        communicationEndpoints: [
          {
            instructions:
              "{{targetLabel}} has delayed \"{{taskTitle}}\" for {{delayLabel}} at a cost of {{humanLives}} lives.",
            isPrimary: true,
          },
        ],
        title: "Sign the 1% Treaty",
      },
    });

    expect(message).toBe(
      'President Example has delayed "Sign the 1% Treaty" for 42 days overdue at a cost of 1.2K lives.',
    );
  });

  it("resolves explicit external URLs and fallback mailto channels", () => {
    const linkAction = resolveTaskCommunicationAction({
      delayStats,
      task: {
        assigneePerson: {
          displayName: "President Example",
        },
        communicationEndpoints: [
          {
            id: "endpoint_1",
            isPrimary: true,
            label: "Contact the office",
            url: "https://example.com/contact",
          },
        ],
        title: "Sign the 1% Treaty",
      },
    });

    expect(linkAction).toMatchObject({
      channel: "externalUrl",
      endpointId: "endpoint_1",
      href: "https://example.com/contact",
      label: "Contact the office",
    });

    const emailAction = resolveTaskCommunicationAction({
      delayStats,
      task: {
        assigneeOrganization: {
          contactEmail: "contact@example.com",
          name: "Example Government",
        },
        title: "Sign the 1% Treaty",
      },
    });

    expect(emailAction?.channel).toBe("mailto");
    expect(emailAction?.href).toContain("mailto:contact@example.com");
    expect(emailAction?.href).toContain("subject=");
    expect(emailAction?.href).toContain("body=");
  });

  it("falls back to a search link when no direct endpoint exists", () => {
    const searchAction = resolveTaskCommunicationAction({
      delayStats,
      task: {
        assigneeOrganization: {
          name: "Example Government",
        },
        assigneePerson: {
          displayName: "President Example",
        },
        roleTitle: "President",
        title: "Sign the 1% Treaty",
      },
    });

    expect(searchAction).toMatchObject({
      channel: "externalUrl",
      label: "Find office contact",
    });
    expect(searchAction?.href).toContain("google.com/search");
    expect(searchAction?.href).toContain(encodeURIComponent("President Example President Example Government official contact"));
  });
});
