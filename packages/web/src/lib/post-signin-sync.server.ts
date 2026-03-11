import { prisma } from "@/lib/prisma";
import { recordReferralAttributionForUser } from "@/lib/referral.server";

interface PostSigninSyncInput {
  userId: string;
  name?: string | null;
  newsletterSubscribed?: boolean;
  referralCode?: string | null;
}

export async function applyPostSigninSync({
  userId,
  name,
  newsletterSubscribed,
  referralCode,
}: PostSigninSyncInput) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      newsletterSubscribed: true,
    },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  const trimmedName = name?.trim() || null;
  const updateData: { name?: string; newsletterSubscribed?: boolean } = {};

  if (trimmedName && !user.name) {
    updateData.name = trimmedName;
  }

  if (
    typeof newsletterSubscribed === "boolean" &&
    newsletterSubscribed !== user.newsletterSubscribed
  ) {
    updateData.newsletterSubscribed = newsletterSubscribed;
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
  }

  const referralRecorded = await recordReferralAttributionForUser(userId, referralCode);

  return {
    referralRecorded,
    userUpdated: Object.keys(updateData).length > 0,
  };
}
