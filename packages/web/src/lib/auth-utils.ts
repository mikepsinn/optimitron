import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  // Include the linked Person so display reads (handle / displayName /
  // image) work directly off the returned object. Returning the full User
  // row preserves account-level field access for callers that need it.
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
