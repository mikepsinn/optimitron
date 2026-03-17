import { describe, expect, it } from "vitest";
import { ActivityType, BadgeType } from "@optomitron/db";
import {
  getActivityDescription,
  getActivityEmoji,
  getBadgeName,
  getBadgeDescription,
} from "../activity-descriptions";

describe("getActivityDescription", () => {
  it("returns description for VOTED_REFERENDUM", () => {
    const desc = getActivityDescription(ActivityType.VOTED_REFERENDUM);
    expect(desc).toContain("referendum");
  });

  it("returns description for SUBMITTED_COMPARISON", () => {
    const desc = getActivityDescription(ActivityType.SUBMITTED_COMPARISON);
    expect(desc).toContain("comparison");
  });

  it("returns description for DEPOSITED_PRIZE with amount", () => {
    const desc = getActivityDescription(ActivityType.DEPOSITED_PRIZE, {
      amount: 100,
    });
    expect(desc).toContain("$100");
  });

  it("returns description for RECRUITED_VOTER", () => {
    const desc = getActivityDescription(ActivityType.RECRUITED_VOTER);
    expect(desc).toContain("voter");
  });

  it("returns description for UPDATED_PROFILE with platform disconnect", () => {
    const desc = getActivityDescription(ActivityType.UPDATED_PROFILE, {
      platform: "GITHUB",
    });
    expect(desc).toContain("GitHub");
  });

  it("returns description for EARNED_BADGE with badgeType", () => {
    const desc = getActivityDescription(ActivityType.EARNED_BADGE, {
      badgeType: BadgeType.FIRST_RECRUIT,
    });
    expect(desc).toContain("First Recruit");
  });

  it("parses JSON string metadata", () => {
    const desc = getActivityDescription(
      ActivityType.DEPOSITED_PRIZE,
      JSON.stringify({ amount: 50 }),
    );
    expect(desc).toContain("$50");
  });

  it("returns fallback for unknown type", () => {
    const desc = getActivityDescription("UNKNOWN_TYPE");
    expect(desc).toBe("Performed an action");
  });
});

describe("getActivityEmoji", () => {
  it("returns emoji for each known activity type", () => {
    expect(getActivityEmoji(ActivityType.VOTED_REFERENDUM)).toBe("🗳️");
    expect(getActivityEmoji(ActivityType.SUBMITTED_COMPARISON)).toBe("⚖️");
    expect(getActivityEmoji(ActivityType.DEPOSITED_PRIZE)).toBe("💰");
    expect(getActivityEmoji(ActivityType.RECRUITED_VOTER)).toBe("👥");
    expect(getActivityEmoji(ActivityType.EARNED_BADGE)).toBe("🏆");
  });

  it("returns fallback emoji for unknown type", () => {
    expect(getActivityEmoji("UNKNOWN")).toBe("📌");
  });
});

describe("getBadgeName", () => {
  it("returns display name for each badge type", () => {
    expect(getBadgeName(BadgeType.FIRST_COMPARISON)).toBe("First Comparison");
    expect(getBadgeName(BadgeType.FIRST_RECRUIT)).toBe("First Recruit");
    expect(getBadgeName(BadgeType.VERIFIED_HUMAN)).toBe("Verified Human");
    expect(getBadgeName(BadgeType.DEPOSITOR)).toBe("Depositor");
  });

  it("returns raw type for unknown badge", () => {
    expect(getBadgeName("UNKNOWN_BADGE")).toBe("UNKNOWN_BADGE");
  });
});

describe("getBadgeDescription", () => {
  it("returns description for each badge type", () => {
    expect(getBadgeDescription(BadgeType.FIRST_COMPARISON)).toContain(
      "first pairwise comparison",
    );
    expect(getBadgeDescription(BadgeType.HUNDRED_COMPARISONS)).toContain("100");
    expect(getBadgeDescription(BadgeType.EARLY_ADOPTER)).toContain(
      "first month",
    );
  });

  it("returns fallback for unknown badge", () => {
    expect(getBadgeDescription("UNKNOWN")).toBe("Achievement unlocked");
  });
});
