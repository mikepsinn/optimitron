import { shareableSnippets } from "@optimitron/data/parameters"
import { prisma } from "./prisma"
import { TREATY_REFERENDUM_SLUG } from "./treaty"

export interface TreatyPageContent {
  question: string
  bodyMarkdown: string
}

/**
 * The treaty document body for the /treaty reading-and-signing surface.
 *
 * The seeded referendum row is the source of truth. When the row exists but
 * `bodyMarkdown` is empty (stale preview snapshots, mid-rollout migrations),
 * fall back to the bundled treaty markdown so /treaty always renders a body.
 * A missing row is a seeding bug and fails loud.
 */
export async function getTreatyPageContent(): Promise<TreatyPageContent> {
  const row = await prisma.referendum.findUnique({
    where: { slug: TREATY_REFERENDUM_SLUG, deletedAt: null },
    select: {
      question: true,
      bodyMarkdown: true,
    },
  })
  if (!row) {
    throw new Error(
      `Treaty referendum "${TREATY_REFERENDUM_SLUG}" is not seeded in the database`,
    )
  }

  return {
    question: row.question,
    bodyMarkdown:
      row.bodyMarkdown || shareableSnippets.onePercentTreatyText.markdown,
  }
}
