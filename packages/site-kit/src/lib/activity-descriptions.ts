import { ActivityType, BadgeType, VotePosition } from "@optimitron/db"

const BADGE_NAMES: Record<BadgeType, string> = {
  [BadgeType.FIRST_COMPARISON]: "First Comparison",
  [BadgeType.HUNDRED_COMPARISONS]: "Hundred Comparisons",
  [BadgeType.FIRST_RECRUIT]: "First Recruit",
  [BadgeType.TEN_RECRUITS]: "Ten Recruits",
  [BadgeType.VERIFIED_HUMAN]: "Verified Human",
  [BadgeType.EARLY_ADOPTER]: "Early Adopter",
  [BadgeType.DEPOSITOR]: "Depositor",
}

const VOTE_ANSWER_DISPLAY: Record<VotePosition, string> = {
  [VotePosition.YES]: "Yes",
  [VotePosition.NO]: "No",
  [VotePosition.ABSTAIN]: "Abstain",
}

const PLATFORM_NAMES: Record<string, string> = {
  google: "Google",
  github: "GitHub",
  GITHUB: "GitHub",
  twitter: "Twitter/X",
  TWITTER: "Twitter/X",
  discord: "Discord",
  DISCORD: "Discord",
  linkedin: "LinkedIn",
  facebook: "Facebook",
  TELEGRAM: "Telegram",
  telegram: "Telegram",
}

interface ActivityMetadata {
  answer?: VotePosition
  referredUserId?: string
  badgeType?: BadgeType
  platform?: string
  amount?: number
  isMonthly?: boolean
  organizationName?: string
}

export function getActivityDescription(
  type: ActivityType,
  metadata?: ActivityMetadata | string,
): string {
  const meta: ActivityMetadata =
    typeof metadata === "string" ? JSON.parse(metadata || "{}") : metadata || {}

  switch (type) {
    case ActivityType.VOTED_REFERENDUM: {
      const answer = meta.answer ? VOTE_ANSWER_DISPLAY[meta.answer] : "on"
      return `Voted ${answer} on the 1% Treaty question`
    }

    case ActivityType.RECRUITED_VOTER:
      if (meta.answer) {
        return `Referred a new voter who answered ${VOTE_ANSWER_DISPLAY[meta.answer]}`
      }
      return "Referred a new voter"

    case ActivityType.EARNED_BADGE:
      if (meta.badgeType) {
        return `Earned ${BADGE_NAMES[meta.badgeType]} Medal — Thank you for your service in the War on Disease! 🫡`
      }
      return "Earned a new Service Medal — Thank you for your service in the War on Disease! 🫡"

    case ActivityType.DONATED:
      if (meta.amount) {
        const kind = meta.isMonthly ? "monthly" : "one-time"
        return `Made a ${kind} donation of $${meta.amount}`
      }
      return meta.isMonthly ? "Set up monthly donation" : "Made a donation"

    case ActivityType.JOINED_ORGANIZATION:
      if (meta.organizationName) {
        return `Joined ${meta.organizationName}`
      }
      return "Joined an organization"

    case ActivityType.UPDATED_PROFILE:
      if (meta.platform) {
        return `Disconnected ${PLATFORM_NAMES[meta.platform] || meta.platform} account`
      }
      return "Updated profile"

    case ActivityType.SUBMITTED_COMPARISON:
      return "Submitted a treatment comparison"

    case ActivityType.DEPOSITED_PRIZE:
      return "Deposited prize funds"

    case ActivityType.CONTACTED_ASSIGNEE:
      return "Contacted a task assignee"

    case ActivityType.VERIFIED_PERSONHOOD:
      return "Verified personhood"

    case ActivityType.TRACKED_MEASUREMENT:
      return "Tracked a measurement"

    case ActivityType.CREATED_SURVEY:
      return "Created a survey"

    case ActivityType.COMPLETED_SURVEY:
      return "Completed a survey"

    case ActivityType.UNSUBSCRIBED:
      return "Unsubscribed from emails"

    case ActivityType.CONTENT_ACCESS_CHANGED:
      return "Content access changed"

    default:
      return "Performed an action"
  }
}

export function getActivityEmoji(type: ActivityType): string {
  const emojis: Record<ActivityType, string> = {
    [ActivityType.VOTED_REFERENDUM]: "✅",
    [ActivityType.SUBMITTED_COMPARISON]: "⚖️",
    [ActivityType.DEPOSITED_PRIZE]: "🏦",
    [ActivityType.DONATED]: "💝",
    [ActivityType.RECRUITED_VOTER]: "👥",
    [ActivityType.CONTACTED_ASSIGNEE]: "📬",
    [ActivityType.VERIFIED_PERSONHOOD]: "🪪",
    [ActivityType.TRACKED_MEASUREMENT]: "📏",
    [ActivityType.UPDATED_PROFILE]: "✏️",
    [ActivityType.EARNED_BADGE]: "🏆",
    [ActivityType.CREATED_SURVEY]: "📋",
    [ActivityType.COMPLETED_SURVEY]: "📝",
    [ActivityType.JOINED_ORGANIZATION]: "🏛️",
    [ActivityType.UNSUBSCRIBED]: "🔕",
    [ActivityType.CONTENT_ACCESS_CHANGED]: "🔑",
  }
  return emojis[type] || "📌"
}

export function getBadgeName(type: BadgeType): string {
  return BADGE_NAMES[type] || type
}

export function getBadgeDescription(type: BadgeType): string {
  const descriptions: Record<BadgeType, string> = {
    [BadgeType.FIRST_COMPARISON]: "Submitted your first comparison",
    [BadgeType.HUNDRED_COMPARISONS]: "Submitted 100 comparisons",
    [BadgeType.FIRST_RECRUIT]: "Recruited your first person",
    [BadgeType.TEN_RECRUITS]: "Recruited 10 people",
    [BadgeType.VERIFIED_HUMAN]: "Verified as a human",
    [BadgeType.EARLY_ADOPTER]: "Joined in first month",
    [BadgeType.DEPOSITOR]: "Deposited prize funds",
  }
  return descriptions[type] || "Achievement unlocked"
}

export function formatVoteAnswer(answer: VotePosition): string {
  return VOTE_ANSWER_DISPLAY[answer]
}
