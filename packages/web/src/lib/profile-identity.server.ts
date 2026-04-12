import { prisma } from "@/lib/prisma";
import type { DashboardUser, DashboardSocialAccount } from "@/types/dashboard";
import {
  getUserDisplayAvatar,
  getUserDisplayHandle,
  getUserDisplayName,
} from "@/lib/user-display";

export interface ProfileIdentityData {
  user: DashboardUser;
  socialAccounts: DashboardSocialAccount[];
  linkedAuthProviderIds: string[];
}

export async function getProfileIdentityData(
  userId: string,
): Promise<ProfileIdentityData | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      person: {
        select: {
          id: true,
          handle: true,
          displayName: true,
          image: true,
        },
      },
      accounts: {
        where: { deletedAt: null },
        select: { provider: true },
      },
      socialAccounts: true,
    },
  });

  if (!user) {
    return null;
  }

  return {
    user: {
      id: user.id,
      name: getUserDisplayName(user),
      username: getUserDisplayHandle(user),
      email: user.email,
      bio: user.bio || "",
      headline: user.headline || null,
      website: user.website || null,
      coverImage: user.coverImage || null,
      isPublic: user.isPublic,
      referralCode: user.referralCode,
      image: getUserDisplayAvatar(user),
      newsletterSubscribed: user.newsletterSubscribed,
    },
    socialAccounts: user.socialAccounts.map((sa) => ({
      platform: sa.platform,
      username: sa.username,
      walletAddress: sa.walletAddress,
      isPrimary: sa.isPrimary,
      verifiedAt: sa.verifiedAt,
    })),
    linkedAuthProviderIds: Array.from(
      new Set(user.accounts.map((account) => account.provider.toLowerCase())),
    ),
  };
}
