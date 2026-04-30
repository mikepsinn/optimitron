export interface LocalMcpIdentity {
  isAdmin: boolean;
  userId: string | undefined;
}

export async function resolveLocalMcpIdentity(): Promise<LocalMcpIdentity> {
  const userId = process.env.MCP_USER_ID?.trim();
  if (userId) {
    return { isAdmin: true, userId };
  }

  const email = process.env.MCP_USER_EMAIL?.trim();
  if (!email) {
    return { isAdmin: true, userId: undefined };
  }

  const { prisma } = await import("./prisma");
  const user = await prisma.user.findFirst({
    where: { email },
    select: { id: true, isAdmin: true },
  });

  return {
    isAdmin: user?.isAdmin === true,
    userId: user?.id,
  };
}
