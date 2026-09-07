import "server-only"
import {
  TREATY_REFERENDUM_SLUG,
  TRIAL_ABUNDANCE_REFERENDUM_SLUG,
  TRIAL_ABUNDANCE_SELF_FUNDED_ACCESS_REFERENDUM_SLUG,
} from "@optimitron/db/constants"
import { prisma } from "./prisma"
import { buildOfficialReferendumVoteWhere } from "./referendum-vote-classification.server"
import {
  MILITARY_ALLOCATION_ITEM_ID, TRIALS_ALLOCATION_ITEM_ID,
  summarizeFundingAllocations, summarizeVotePercentages,
} from "./survey-results"
import type { DashboardSurveyResults } from "./survey-results"

const questions = [
  { slug: TREATY_REFERENDUM_SLUG, title: "The 1% Treaty" },
  { slug: TRIAL_ABUNDANCE_REFERENDUM_SLUG, title: "Patient access" },
  { slug: TRIAL_ABUNDANCE_SELF_FUNDED_ACCESS_REFERENDUM_SLUG, title: "Patient-funded access" },
]

export async function getDashboardSurveyResults(userId: string): Promise<DashboardSurveyResults> {
  const slugs = questions.map(question => question.slug)
  const [referendums, votes, allocations] = await Promise.all([
    prisma.referendum.findMany({
      where: { slug: { in: slugs }, deletedAt: null },
      select: { id: true, slug: true, question: true },
    }),
    prisma.referendumVote.groupBy({
      by: ["referendumId", "answer"],
      where: {
        ...buildOfficialReferendumVoteWhere(),
        referendum: { slug: { in: slugs }, deletedAt: null },
      },
      _count: { _all: true },
    }),
    prisma.wishocraticAllocation.findMany({
      where: {
        deletedAt: null,
        user: { deletedAt: null },
        OR: [
          { itemAId: MILITARY_ALLOCATION_ITEM_ID, itemBId: TRIALS_ALLOCATION_ITEM_ID },
          { itemAId: TRIALS_ALLOCATION_ITEM_ID, itemBId: MILITARY_ALLOCATION_ITEM_ID },
        ],
      },
      select: { userId: true, itemAId: true, itemBId: true, allocationA: true, allocationB: true, updatedAt: true },
    }),
  ])
  return {
    questions: questions.flatMap(question => {
      const referendum = referendums.find(item => item.slug === question.slug)
      return referendum ? [{
        ...question,
        question: referendum.question,
        percentages: summarizeVotePercentages(votes.filter(vote => vote.referendumId === referendum.id)),
      }] : []
    }),
    funding: summarizeFundingAllocations(allocations, userId),
  }
}
