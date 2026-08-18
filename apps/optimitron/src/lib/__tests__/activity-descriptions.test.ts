import { describe, expect, it } from "vitest";
import { ActivityType, BadgeType } from "@optimitron/db";
import {
  getActivityDescription,
  getActivityEmoji,
  getBadgeDescription,
} from "../activity-descriptions";

describe("getActivityDescription", () => {
  it("interpolates numeric metadata for prize deposits", () => {
    const desc = getActivityDescription(ActivityType.DEPOSITED_PRIZE, { amount: 100 });
    expect(desc).toContain("$100");
    expect(desc).toContain("Earth Optimization Prize");
  });

  it("resolves human-readable platform names when profile metadata is present", () => {
    expect(
      getActivityDescription(ActivityType.UPDATED_PROFILE, { platform: "GITHUB" }),
    ).toContain("GitHub");
    expect(
      getActivityDescription(ActivityType.UPDATED_PROFILE, { platform: "GOOGLE" }),
    ).toContain("Google");
  });

  it("resolves human-readable badge names when badge metadata is present", () => {
    const desc = getActivityDescription(ActivityType.EARNED_BADGE, {
      badgeType: BadgeType.FIRST_RECRUIT,
    });
    expect(desc).toContain("First Recruit");
    expect(desc).toContain("badge");
  });

  it("parses JSON string metadata", () => {
    const desc = getActivityDescription(
      ActivityType.DEPOSITED_PRIZE,
      JSON.stringify({ amount: 50 }),
    );
    expect(desc).toContain("$50");
  });

  it("survives malformed string metadata instead of throwing", () => {
    const desc = getActivityDescription(
      ActivityType.DEPOSITED_PRIZE,
      "preview redacted",
    );
    expect(desc).toContain("Earth Optimization Prize");
  });

  it("returns fallback for unknown type", () => {
    const desc = getActivityDescription("UNKNOWN_TYPE");
    expect(desc).toBe("Performed an action");
  });
});

describe("getActivityEmoji", () => {
  it("returns stable emoji tokens for representative activity types", () => {
    expect(getActivityEmoji(ActivityType.VOTED_REFERENDUM)).toBe("🗳️");
    expect(getActivityEmoji(ActivityType.DEPOSITED_PRIZE)).toBe("💰");
    expect(getActivityEmoji(ActivityType.CONTACTED_ASSIGNEE)).toBe("📣");
  });

  it("returns fallback emoji for unknown type", () => {
    expect(getActivityEmoji("UNKNOWN")).toBe("📌");
  });
});

describe("getBadgeDescription", () => {
  it("returns representative badge descriptions without freezing all copy", () => {
    expect(getBadgeDescription(BadgeType.FIRST_COMPARISON)).toContain("comparison");
    expect(getBadgeDescription(BadgeType.HUNDRED_COMPARISONS)).toContain("100");
  });

  it("returns fallback for unknown badge", () => {
    expect(getBadgeDescription("UNKNOWN")).toBe("Achievement unlocked");
  });
});
