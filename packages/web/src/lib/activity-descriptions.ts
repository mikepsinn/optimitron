import { ActivityType, BadgeType } from "@optomitron/db";

const BADGE_NAMES: Record<string, string> = {
  [BadgeType.FIRST_COMPARISON]: "First Comparison",
  [BadgeType.HUNDRED_COMPARISONS]: "Hundred Comparisons",
  [BadgeType.FIRST_RECRUIT]: "First Recruit",
  [BadgeType.TEN_RECRUITS]: "Ten Recruits",
  [BadgeType.VERIFIED_HUMAN]: "Verified Human",
  [BadgeType.EARLY_ADOPTER]: "Early Adopter",
  [BadgeType.DEPOSITOR]: "Depositor",
};

const PLATFORM_NAMES: Record<string, string> = {
  TWITTER: "Twitter/X",
  GITHUB: "GitHub",
  ETHEREUM: "Ethereum",
  BASE: "Base",
  DISCORD: "Discord",
  TELEGRAM: "Telegram",
};

interface ActivityMetadata {
  badgeType?: string;
  platform?: string;
  amount?: number;
  organizationName?: string;
  referredUserId?: string;
}

/**
 * Generate a human-readable activity description.
 * Written in Wishonia's voice where appropriate.
 */
export function getActivityDescription(
  type: string,
  metadata?: ActivityMetadata | string,
): string {
  const meta: ActivityMetadata =
    typeof metadata === "string"
      ? JSON.parse(metadata || "{}")
      : metadata || {};

  switch (type) {
    case ActivityType.VOTED_REFERENDUM:
      return "Voted in the referendum. Democracy: attempted.";

    case ActivityType.SUBMITTED_COMPARISON:
      return "Submitted a pairwise comparison — one data point closer to a functioning civilisation.";

    case ActivityType.DEPOSITED_PRIZE:
      if (meta.amount) {
        return `Deposited $${meta.amount} into the Earth Optimization Prize. Positive expected value, even for pessimists.`;
      }
      return "Deposited into the Earth Optimization Prize.";

    case ActivityType.RECRUITED_VOTER:
      return "Recruited a new voter. The network grows.";

    case ActivityType.VERIFIED_PERSONHOOD:
      return "Verified personhood — confirmed: not a bot. Probably.";

    case ActivityType.TRACKED_MEASUREMENT:
      return "Tracked a health measurement. Your future self will thank you.";

    case ActivityType.UPDATED_PROFILE:
      if (meta.platform) {
        return `Disconnected ${PLATFORM_NAMES[meta.platform] || meta.platform} account`;
      }
      return "Updated profile";

    case ActivityType.EARNED_BADGE:
      if (meta.badgeType) {
        return `Earned the ${BADGE_NAMES[meta.badgeType] || meta.badgeType} badge. Well done, human.`;
      }
      return "Earned a new badge.";

    case ActivityType.CREATED_SURVEY:
      return "Created a survey. Gathering data like a proper civilisation.";

    case ActivityType.COMPLETED_SURVEY:
      return "Completed a survey — your preferences have been noted.";

    case ActivityType.JOINED_ORGANIZATION:
      if (meta.organizationName) {
        return `Joined ${meta.organizationName}`;
      }
      return "Joined an organization";

    default:
      return "Performed an action";
  }
}

/**
 * Get the emoji for an activity type.
 */
export function getActivityEmoji(type: string): string {
  const emojis: Record<string, string> = {
    [ActivityType.VOTED_REFERENDUM]: "🗳️",
    [ActivityType.SUBMITTED_COMPARISON]: "⚖️",
    [ActivityType.DEPOSITED_PRIZE]: "💰",
    [ActivityType.RECRUITED_VOTER]: "👥",
    [ActivityType.VERIFIED_PERSONHOOD]: "🪪",
    [ActivityType.TRACKED_MEASUREMENT]: "📊",
    [ActivityType.UPDATED_PROFILE]: "✏️",
    [ActivityType.EARNED_BADGE]: "🏆",
    [ActivityType.CREATED_SURVEY]: "📝",
    [ActivityType.COMPLETED_SURVEY]: "✅",
    [ActivityType.JOINED_ORGANIZATION]: "🏛️",
  };
  return emojis[type] || "📌";
}

/**
 * Get the display name for a badge type.
 */
export function getBadgeName(type: string): string {
  return BADGE_NAMES[type] || type;
}

/**
 * Get the description for a badge type.
 */
export function getBadgeDescription(type: string): string {
  const descriptions: Record<string, string> = {
    [BadgeType.FIRST_COMPARISON]:
      "Completed your first pairwise comparison",
    [BadgeType.HUNDRED_COMPARISONS]:
      "Completed 100 pairwise comparisons — serious contributor",
    [BadgeType.FIRST_RECRUIT]: "Recruited your first person",
    [BadgeType.TEN_RECRUITS]: "Recruited 10 people",
    [BadgeType.VERIFIED_HUMAN]:
      "Verified personhood — one human, one voice",
    [BadgeType.EARLY_ADOPTER]: "Joined in the first month",
    [BadgeType.DEPOSITOR]:
      "Deposited into the Earth Optimization Prize",
  };
  return descriptions[type] || "Achievement unlocked";
}
