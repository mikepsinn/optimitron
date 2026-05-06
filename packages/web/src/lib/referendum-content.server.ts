import {
  COURT_OF_HUMANITY_QUESTION,
  COURT_OF_HUMANITY_TEXT,
} from "@optimitron/data/referendums";
import { COURT_OF_HUMANITY_SLUG } from "@/lib/court-of-humanity";
import { prisma } from "@/lib/prisma";

export interface ReferendumPageContent {
  question: string;
  bodyMarkdown: string | null;
}

export async function getReferendumPageContent(
  slug: string,
): Promise<ReferendumPageContent | null> {
  if (slug === COURT_OF_HUMANITY_SLUG) {
    return {
      question: COURT_OF_HUMANITY_QUESTION,
      bodyMarkdown: COURT_OF_HUMANITY_TEXT.markdown,
    };
  }

  return prisma.referendum.findUnique({
    where: { slug, deletedAt: null },
    select: {
      question: true,
      bodyMarkdown: true,
    },
  });
}
