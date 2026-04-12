import { describe, expect, it } from "vitest";
import { buildTaskContactMessage, resolveTaskContactAction } from "./contact";

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

describe("task contact helpers", () => {
  it("builds a default accountability message", () => {
    const message = buildTaskContactMessage({
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

  it("interpolates explicit contact templates", () => {
    const message = buildTaskContactMessage({
      delayStats,
      task: {
        assigneePerson: {
          displayName: "President Example",
        },
        contactTemplate:
          "{{targetLabel}} has delayed \"{{taskTitle}}\" for {{delayLabel}} at a cost of {{humanLives}} lives.",
        title: "Sign the 1% Treaty",
      },
    });

    expect(message).toBe(
      'President Example has delayed "Sign the 1% Treaty" for 42 days overdue at a cost of 1.2K lives.',
    );
  });

  it("resolves explicit contact links and fallback email channels", () => {
    const linkAction = resolveTaskContactAction({
      delayStats,
      task: {
        assigneePerson: {
          displayName: "President Example",
        },
        contactLabel: "Contact the office",
        contactUrl: "https://example.com/contact",
        title: "Sign the 1% Treaty",
      },
    });

    expect(linkAction).toMatchObject({
      channel: "link",
      href: "https://example.com/contact",
      label: "Contact the office",
    });

    const emailAction = resolveTaskContactAction({
      delayStats,
      task: {
        assigneeOrganization: {
          contactEmail: "contact@example.com",
          name: "Example Government",
        },
        title: "Sign the 1% Treaty",
      },
    });

    expect(emailAction?.channel).toBe("email");
    expect(emailAction?.href).toContain("mailto:contact@example.com");
    expect(emailAction?.href).toContain("subject=");
    expect(emailAction?.href).toContain("body=");
  });
});
