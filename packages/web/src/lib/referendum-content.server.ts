import { shareableSnippets } from "@optimitron/data/parameters";
import {
  COURT_OF_HUMANITY_QUESTION,
  COURT_OF_HUMANITY_TEXT,
} from "@optimitron/data/referendums";
import { COURT_OF_HUMANITY_SLUG } from "@/lib/court-of-humanity";
import { prisma } from "@/lib/prisma";
import { TREATY_REFERENDUM_SLUG } from "@/lib/treaty";

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

  const row = await prisma.referendum.findUnique({
    where: { slug, deletedAt: null },
    select: {
      question: true,
      bodyMarkdown: true,
    },
  });
  if (!row) return null;

  // Treaty body falls back to the bundled `onePercentTreatyText` snippet
  // when the DB row is empty — preview DBs, fresh seeds, or anywhere the
  // Referendum.bodyMarkdown column hasn't been populated would otherwise
  // render `/treaty` with only the headline + signature box and no
  // treaty text in between.
  if (slug === TREATY_REFERENDUM_SLUG && !row.bodyMarkdown) {
    return {
      ...row,
      bodyMarkdown: shareableSnippets.onePercentTreatyText.markdown,
    };
  }

  return row;
}
