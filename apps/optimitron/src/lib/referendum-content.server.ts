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

  // Preview DB safety net: when the row exists but `bodyMarkdown` is empty
  // (stale preview snapshots, mid-rollout migrations), fall back to the
  // bundled treaty markdown so `/treaty` always renders a body. NOT a
  // generic "row missing" fallback — if the row doesn't exist, that's a
  // seeding bug and should fail loud (CI now seeds before the smoke test;
  // the prior row-missing fallback masked an out-of-order CI workflow).
  if (slug === TREATY_REFERENDUM_SLUG && !row.bodyMarkdown) {
    return {
      ...row,
      bodyMarkdown: shareableSnippets.onePercentTreatyText.markdown,
    };
  }

  return row;
}
