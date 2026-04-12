import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  // Include the linked Person so display reads can prefer Person.{handle,
  // displayName, image} over the legacy mirror columns. Returning the full
  // User row preserves every existing caller's field access.
  return prisma.user.findUnique({
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
    },
  });
}

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("Unauthorized");
  }

  return {
    userId,
    userEmail: session.user.email,
  };
}
