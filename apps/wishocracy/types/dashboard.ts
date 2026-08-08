import type { EnabledProviders } from "@/lib/auth-utils"

export interface DashboardUser {
  id: string
  name: string
  username: string | null
  email: string
  bio: string
  location: string
  country: string | null
  isPublic: boolean
  referralCode: string
  organization: string | null
  organizationId: string | null
  image: string | null
  newsletterSubscribed: boolean
  website: string | null
  headline: string | null
  coverImage: string | null
}

export interface DashboardStats {
  referrals: number
  shares: number
  reach: number
  rank: number
}

export interface DashboardBadge {
  id: string
  name: string
  description: string
  earned: boolean
}

export interface DashboardSocialAccounts {
  twitter: string | null
  linkedin: string | null
  facebook: string | null
  google: string | null
  github: string | null
  discord: string | null
}

export interface DashboardActivity {
  id: string
  type: string
  text: string
  time: string
  emoji: string
}

export interface DashboardProgress {
  current: number
  target: number
}

export interface DashboardOrganization {
  id: string
  name: string
  slug: string | null
  status: string
  voteCount: number
  createdAt: Date
}

export interface DashboardOrganizations {
  created: DashboardOrganization[]
}

export interface DashboardAllocation {
  user: number | null
  average: number
}

export interface DashboardPublicRecruit {
  id: string
  name: string | null
  username: string | null
  image: string | null
  depth: number
}

export interface DashboardReferralTree {
  directCount: number
  totalDownstreamCount: number
  maxDepth: number
  publicRecruits: DashboardPublicRecruit[]
}

export interface DashboardReferralInvitation {
  id: string
  recipientName: string
  inviteeContact: string | null
  contactMethod: "EMAIL" | "SMS" | "IN_PERSON" | null
  inviteToken: string | null
  referralUrl: string
  messageText: string | null
  status: "PENDING" | "REMINDED" | "VOTED" | "DECLINED"
  votedAt: Date | null
  copiedAt: Date | null
  sentAt: Date | null
  remindersSent: number
  lastRemindedAt: Date | null
  confirmedAt: Date | null
  createdAt: Date
}

export interface DashboardData {
  user: DashboardUser
  stats: DashboardStats
  referralTree: DashboardReferralTree
  referralInvitations: DashboardReferralInvitation[]
  badges: DashboardBadge[]
  socialAccounts: DashboardSocialAccounts
  enabledProviders: EnabledProviders
  activities: DashboardActivity[]
  globalProgress: DashboardProgress
  allocation: DashboardAllocation
  organizations: DashboardOrganizations
}

export interface LeaderboardEntry {
  rank: number
  userId: string
  name: string
  image: string | null
  referrals: number
}

