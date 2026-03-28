import type { OrgType } from "@optimitron/db";

export interface DashboardUser {
  id: string;
  name: string;
  username: string | null;
  email: string;
  bio: string;
  headline: string | null;
  website: string | null;
  coverImage: string | null;
  isPublic: boolean;
  referralCode: string;
  image: string | null;
  newsletterSubscribed: boolean;
}

export interface DashboardStats {
  wishes: number;
  referrals: number;
  wishocraticAllocations: number;
  badges: number;
  rank: number;
}

export interface DashboardBadge {
  id: string;
  name: string;
  description: string;
  earned: boolean;
}

export interface DashboardActivity {
  id: string;
  type: string;
  text: string;
  time: string;
  emoji: string;
}

export interface DashboardSocialAccount {
  platform: string;
  username: string | null;
  walletAddress: string | null;
  isPrimary: boolean;
  verifiedAt: Date | null;
}

export interface DashboardOrganization {
  id: string;
  name: string;
  slug: string | null;
  type: OrgType;
  status: string;
  memberCount: number;
  createdAt: Date;
}

export interface DashboardNotificationPreference {
  type: string;
  channel: string;
  enabled: boolean;
}

export interface DashboardProgress {
  current: number;
  target: number;
}

export interface DashboardData {
  user: DashboardUser;
  stats: DashboardStats;
  badges: DashboardBadge[];
  activities: DashboardActivity[];
  organizations: {
    created: DashboardOrganization[];
  };
  globalProgress: DashboardProgress;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  image: string | null;
  referrals: number;
}
