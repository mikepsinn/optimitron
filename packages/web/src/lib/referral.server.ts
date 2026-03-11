import { prisma } from "@/lib/prisma";

export async function findUserByUsernameOrReferralCode(identifier: string | null | undefined) {
  const value = identifier?.trim();
  if (!value) {
    return null;
  }

  return prisma.user.findFirst({
    where: {
      OR: [
        { referralCode: value },
        {
          username: {
            equals: value,
            mode: "insensitive",
          },
        },
      ],
    },
  });
}

export function getReferralVoteCount(userId: string) {
  return prisma.vote.count({
    where: { referredByUserId: userId },
  });
}
