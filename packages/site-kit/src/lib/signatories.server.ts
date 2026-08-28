import {
  ContentVisibility,
  OrganizationReferendumPositionStatus,
  OrgStatus,
  type Prisma,
  VotePosition,
} from "@optimitron/db"
import {
  VOTER_LIVES_SAVED,
  VOTER_SUFFERING_HOURS_PREVENTED,
} from "@optimitron/data/parameters"
import { DECLARATION_SLUG } from "./declaration"
import { prisma } from "./prisma"
import { userDisplaySelect, type UserForDisplay } from "./user-display"
import {
  buildMemorialReferendumVoteWhere,
  buildOfficialReferendumVoteWhere,
  buildRepresentedReferendumVoteWhere,
} from "./referendum-vote-classification.server"

/**
 * Ranked public signatories for a referendum.
 *
 * This is Optimitron's `getReferendumSiteHomeData` with everything that is not
 * signatory ranking removed. Optimitron keys that function on a `SiteConfig`
 * because one app serves several variants; the only two fields it reads are the
 * primary referendum slug and the content key, so a single-variant app can pass
 * the slug directly and skip `site.ts` entirely.
 *
 * The query set, the impact math and the two-pass ranking are unchanged from the
 * original, so the numbers a reader sees do not move with the page. The parts
 * that were dropped belong to the home page rather than the signatory list: the
 * referendum content record, and the late-employee task cards.
 */

export const PUBLIC_SIGNERS_PAGE_SIZE = 48

/**
 * Approved, publicly visible YES positions from live organizations. Copied
 * verbatim from referendum-site.server so the organization signatory list
 * filters identically.
 */
export function buildApprovedOrganizationPositionWhere(
  referendumId: string,
): Prisma.OrganizationReferendumPositionWhereInput {
  return {
    referendumId,
    position: VotePosition.YES,
    status: OrganizationReferendumPositionStatus.APPROVED,
    deletedAt: null,
    organization: {
      status: OrgStatus.APPROVED,
      deletedAt: null,
      visibility: ContentVisibility.PUBLIC,
    },
  }
}

export interface PublicSignerEntry {
  id: string;
  createdAt: Date;
  kind?: "human";
  rank: number;
  totalSignatureCount: number;
  referredYesCount: number;
  livesSaved: number;
  hoursPrevented: number;
  user: UserForDisplay;
}

export interface PublicSignersPage {
  currentUserSigner: PublicSignerEntry | null;
  signers: PublicSignerEntry[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PublicHumanSignatoryEntry extends PublicSignerEntry {
  kind: "human";
}

export interface PublicOrganizationSignatoryEntry {
  id: string;
  createdAt: Date;
  kind: "organization";
  rank: number;
  totalSignatureCount: number;
  referredYesCount: number;
  livesSaved: number;
  hoursPrevented: number;
  statement: string | null;
  organization: {
    description: string | null;
    id: string;
    name: string;
    slug: string;
    donationUrl: string | null;
    squareLogoUrl: string | null;
    website: string | null;
  };
}

export type PublicSignatoryEntry =
  | PublicHumanSignatoryEntry
  | PublicOrganizationSignatoryEntry;

export interface PublicSignatoriesPage {
  currentUserSigner: PublicHumanSignatoryEntry | null;
  currentUserStatus: PublicSignatoryUserStatus | null;
  signatories: PublicSignatoryEntry[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PublicSignatoryUserStatus {
  hasYesVote: boolean;
  isPublic: boolean;
  listed: boolean;
  rank: number | null;
  referredYesCount: number;
}


const TRANSIENT_PRISMA_CONNECTION_ERROR_MESSAGES = [
  "Server has closed the connection",
];

function isTransientPrismaConnectionError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const code =
    typeof (error as { code?: unknown }).code === "string"
      ? (error as { code?: string }).code
      : null;

  return (
    code === "P1017" ||
    TRANSIENT_PRISMA_CONNECTION_ERROR_MESSAGES.some((message) =>
      error.message.includes(message),
    )
  );
}

async function retryReadOnlyPrismaOperation<T>(
  operation: () => Promise<T>,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (!isTransientPrismaConnectionError(error)) {
      throw error;
    }

    return operation();
  }
}


export interface PublicSignatoriesOptions {
  /** Slug of the referendum whose signatories are listed. */
  referendumSlug: string
  /** 1-based page; values below 1 are clamped, values past the end land on the last page. */
  signersPage?: number
  /** Signed-in viewer, used to compute their own rank and listing status. */
  currentUserId?: string | null
}

export async function getPublicSignatoriesPage(
  options: PublicSignatoriesOptions,
): Promise<PublicSignatoriesPage | null> {
  const { referendumSlug } = options
  // Optimitron's getReferendumSiteContext looked this up without a deletedAt
  // filter while the signatory queries below all use one. A soft-deleted
  // referendum should not render a signatory page, so this diverges from the
  // original deliberately and matches the rest of the file.
  const referendum = await prisma.referendum.findFirst({
    where: { slug: referendumSlug, deletedAt: null },
    select: { id: true },
  })

  if (!referendum) {
    return null
  }

  const signatoryReferendumSlugs = Array.from(
    new Set(
      [referendumSlug, DECLARATION_SLUG].filter(
        (slug): slug is string => Boolean(slug),
      ),
    ),
  );
  const signatoryReferendums = await prisma.referendum.findMany({
    where: {
      deletedAt: null,
      slug: { in: signatoryReferendumSlugs },
    },
    select: { id: true, slug: true },
  });
  const signatoryReferendumIds = Array.from(
    new Set([
      referendum.id,
      ...signatoryReferendums.map((referendum) => referendum.id),
    ]),
  );
  const signatoryReferendumIdFilter =
    signatoryReferendumIds.length === 1
      ? signatoryReferendumIds[0]
      : signatoryReferendumIds;

  const publicSignersWhere = buildOfficialReferendumVoteWhere({
    answer: VotePosition.YES,
    publicOnly: true,
    referendumId: signatoryReferendumIdFilter,
  });
  const recruitedVoteWhere = buildOfficialReferendumVoteWhere({
    answer: VotePosition.YES,
    referendumId: referendum.id,
  });
  const recruitedSignatoryVoteWhere = buildOfficialReferendumVoteWhere({
    answer: VotePosition.YES,
    referendumId: signatoryReferendumIdFilter,
  });

  // Math.floor(NaN) is NaN and Math.max(1, NaN) is NaN, which would poison the
  // page number and the slice bounds. The /signatories caller runs the value
  // through parsePositivePageParam first, but this function is exported.
  const rawPage = Number(options.signersPage ?? 1);
  const requestedPage = Number.isFinite(rawPage)
    ? Math.max(1, Math.floor(rawPage))
    : 1;

  const [
    individualCount,
    representedHumanCount,
    memorialVoteCount,
    organizationCount,
    allPublicSigners,
    referrerCounts,
    allOrganizationSignatories,
    organizationReferrerCounts,
    currentUserProfile,
  ] = await retryReadOnlyPrismaOperation(() =>
    Promise.all([
      prisma.referendumVote.count({
        where: recruitedVoteWhere,
      }),
      prisma.referendumVote.count({
        where: buildRepresentedReferendumVoteWhere({
          answer: VotePosition.YES,
          publicOnly: true,
          referendumId: referendum.id,
        }),
      }),
      prisma.referendumVote.count({
        where: buildMemorialReferendumVoteWhere({
          answer: VotePosition.YES,
          publicOnly: true,
          referendumId: referendum.id,
        }),
      }),
      prisma.organizationReferendumPosition.count({
        where: buildApprovedOrganizationPositionWhere(referendum.id),
      }),
      prisma.referendumVote.findMany({
        where: publicSignersWhere,
        select: {
          id: true,
          createdAt: true,
          userId: true,
          user: { select: userDisplaySelect },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.referendumVote.groupBy({
        by: ["referredByUserId", "userId"],
        where: {
          ...recruitedSignatoryVoteWhere,
          referredByUserId: { not: null },
        },
        _count: { userId: true },
      }),
      prisma.organizationReferendumPosition.findMany({
        where: buildApprovedOrganizationPositionWhere(referendum.id),
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              website: true,
              squareLogoUrl: true,
              description: true,
              donationUrl: true,
            },
          },
        },
        orderBy: [{ updatedAt: "desc" }],
      }),
      prisma.referendumVote.groupBy({
        by: ["organizationId"],
        where: {
          ...recruitedVoteWhere,
          organizationId: { not: null },
        },
        _count: { organizationId: true },
      }),
      options.currentUserId
        ? prisma.user.findUnique({
            where: { id: options.currentUserId },
            select: {
              person: { select: { isPublic: true } },
              referendumVotes: {
                where: recruitedSignatoryVoteWhere,
                select: { id: true },
                take: 1,
              },
            },
          })
        : Promise.resolve(null),
    ]),
  );

  const referredCountByUserId = new Map<string, number>();
  for (const row of referrerCounts) {
    if (row.referredByUserId) {
      referredCountByUserId.set(
        row.referredByUserId,
        (referredCountByUserId.get(row.referredByUserId) ?? 0) + 1,
      );
    }
  }
  const referredCountByOrganizationId = new Map<string, number>();
  for (const row of organizationReferrerCounts) {
    if (row.organizationId) {
      referredCountByOrganizationId.set(
        row.organizationId,
        row._count.organizationId,
      );
    }
  }

  // Sort by referral count desc (tiebreak: earliest signup first), then
  // assign global ranks so page 2+ carries the correct #N across pages.
  const earliestPublicSignerByUserId = new Map<
    string,
    (typeof allPublicSigners)[number]
  >();
  for (const row of allPublicSigners) {
    const current = earliestPublicSignerByUserId.get(row.userId);
    if (!current || row.createdAt.getTime() < current.createdAt.getTime()) {
      earliestPublicSignerByUserId.set(row.userId, row);
    }
  }

  const ranked: PublicSignerEntry[] = Array.from(
    earliestPublicSignerByUserId.values(),
  )
    .map((row) => {
      const referredYesCount = referredCountByUserId.get(row.userId) ?? 0;
      const totalSignatureCount = 1 + referredYesCount;
      return {
        id: row.id,
        createdAt: row.createdAt,
        kind: "human" as const,
        totalSignatureCount,
        referredYesCount,
        livesSaved: VOTER_LIVES_SAVED.value * totalSignatureCount,
        hoursPrevented:
          VOTER_SUFFERING_HOURS_PREVENTED.value * totalSignatureCount,
        rank: 0,
        user: row.user as UserForDisplay,
      };
    })
    .sort((a, b) => {
      if (b.totalSignatureCount !== a.totalSignatureCount) {
        return b.totalSignatureCount - a.totalSignatureCount;
      }
      return a.createdAt.getTime() - b.createdAt.getTime();
    })
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

  const organizationSignatoryEntries: PublicOrganizationSignatoryEntry[] =
    allOrganizationSignatories
      .map((row) => {
        const referredYesCount =
          referredCountByOrganizationId.get(row.organizationId) ?? 0;
        return {
          id: row.id,
          createdAt: row.createdAt,
          kind: "organization" as const,
          totalSignatureCount: referredYesCount,
          referredYesCount,
          livesSaved: VOTER_LIVES_SAVED.value * referredYesCount,
          hoursPrevented:
            VOTER_SUFFERING_HOURS_PREVENTED.value * referredYesCount,
          rank: 0,
          statement: row.statement,
          organization: row.organization,
        };
      })
      .filter((entry) => entry.referredYesCount > 0);

  const rankedSignatories: PublicSignatoryEntry[] = [
    ...(ranked as PublicHumanSignatoryEntry[]),
    ...organizationSignatoryEntries,
  ]
    .sort((a, b) => {
      if (b.totalSignatureCount !== a.totalSignatureCount) {
        return b.totalSignatureCount - a.totalSignatureCount;
      }
      return a.createdAt.getTime() - b.createdAt.getTime();
    })
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

  const publicSignatoriesTotal = rankedSignatories.length;
  const publicSignersTotal = ranked.length;

  const totalPages = Math.max(
    1,
    Math.ceil(publicSignersTotal / PUBLIC_SIGNERS_PAGE_SIZE),
  );
  const page = Math.min(requestedPage, totalPages);
  const skip = (page - 1) * PUBLIC_SIGNERS_PAGE_SIZE;

  const signerRows = ranked.slice(skip, skip + PUBLIC_SIGNERS_PAGE_SIZE);
  const currentUserSigner = options.currentUserId
    ? (ranked.find((entry) => entry.user.id === options.currentUserId) ?? null)
    : null;
  const signatoriesTotalPages = Math.max(
    1,
    Math.ceil(publicSignatoriesTotal / PUBLIC_SIGNERS_PAGE_SIZE),
  );
  const signatoriesPage = Math.min(requestedPage, signatoriesTotalPages);
  const signatoriesSkip = (signatoriesPage - 1) * PUBLIC_SIGNERS_PAGE_SIZE;
  const signatoryRows = rankedSignatories.slice(
    signatoriesSkip,
    signatoriesSkip + PUBLIC_SIGNERS_PAGE_SIZE,
  );
  const currentUserSignatory = options.currentUserId
    ? (rankedSignatories.find(
        (entry): entry is PublicHumanSignatoryEntry =>
          entry.kind === "human" && entry.user.id === options.currentUserId,
      ) ?? null)
    : null;
  const currentUserStatus =
    options.currentUserId && currentUserProfile
      ? {
          hasYesVote: currentUserProfile.referendumVotes.length > 0,
          isPublic: currentUserProfile.person?.isPublic ?? false,
          listed: Boolean(currentUserSignatory),
          rank: currentUserSignatory?.rank ?? null,
          referredYesCount:
            referredCountByUserId.get(options.currentUserId) ?? 0,
        }
      : null;

  return {
    currentUserSigner: currentUserSignatory,
    currentUserStatus,
    signatories: signatoryRows,
    totalCount: publicSignatoriesTotal,
    page: signatoriesPage,
    pageSize: PUBLIC_SIGNERS_PAGE_SIZE,
    totalPages: signatoriesTotalPages,
  }
}
