import { HUMANITY_V_GOVERNMENT_VERDICT_REFERENDUM_SLUG } from "@optimitron/db";
import { COURT_OF_HUMANITY_SLUG } from "@/lib/court-of-humanity";
import { prisma } from "@/lib/prisma";

/** Public self-service ballots; private case access never confers public voting. */
export function getPublicCourtVotingReferendum(slug: string) {
  return prisma.referendum.findFirst({
    where: {
      slug,
      deletedAt: null,
      publishedAt: { not: null },
      OR: [
        {
          slug: {
            in: [
              COURT_OF_HUMANITY_SLUG,
              HUMANITY_V_GOVERNMENT_VERDICT_REFERENDUM_SLUG,
            ],
          },
        },
        {
          kind: "COURT_CASE",
          OR: [
            {
              courtCasesAsJuryReferendum: {
                some: { isPublic: true, deletedAt: null },
              },
            },
            {
              courtCaseClaimsAsJuryReferendum: {
                some: {
                  isPublic: true,
                  deletedAt: null,
                  case: { isPublic: true, deletedAt: null },
                },
              },
            },
          ],
        },
      ],
    },
  });
}
