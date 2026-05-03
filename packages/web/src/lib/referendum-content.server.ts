import { prisma } from "@/lib/prisma";

export interface ReferendumPageContent {
  question: string;
  bodyMarkdown: string | null;
}

export async function getReferendumPageContent(
  slug: string,
): Promise<ReferendumPageContent | null> {
  return prisma.referendum.findUnique({
    where: { slug, deletedAt: null },
    select: {
      question: true,
      bodyMarkdown: true,
    },
  });
}
