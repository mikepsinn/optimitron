import "./load-env";
import { readFileSync, statSync } from "fs";
import { pathToFileURL } from "url";
import {
  ReferendumStatus,
  ReferendumVoteSource,
  ReferralInvitationStatus,
  VotePosition,
} from "@optimitron/db";
import { ensurePersonForUser } from "../src/lib/person.server";
import { prisma } from "../src/lib/prisma";
import { TREATY_REFERENDUM_SLUG } from "../src/lib/treaty";

/**
 * Import users + votes + referral invitations exported from the
 * dih-neobrutalist project (run `scripts/export-users-votes.ts` there
 * first) into this project's schema.
 *
 * Idempotency:
 *   - User.email is the dedup key. Re-importing the same export updates
 *     non-key fields rather than creating duplicates.
 *   - ReferendumVote is keyed on `(referendumId, personId)` — re-importing
 *     leaves existing votes alone, only fills gaps.
 *   - ReferralInvitation is keyed on inviteToken when present, else on
 *     (referrer, inviteeName, createdAt) tuple match. New rows ignored if
 *     they would duplicate.
 *
 * Cross-project schema mapping:
 *   - Source User (single table) -> dest User + dest Person (via
 *     ensurePersonForUser). Source `name`/`username`/`image`/`bio`/
 *     `headline`/`coverImage`/`website`/`isPublic` move to Person.
 *   - Source `country` -> User.countryCode if it looks like an ISO code,
 *     otherwise stored on Person.countryCode best-effort.
 *   - Source Vote (single referendum implicit) -> dest ReferendumVote
 *     scoped to the treaty referendum (TREATY_REFERENDUM_SLUG).
 *
 * Usage:
 *   pnpm --dir packages/web tsx scripts/import-dih-users-votes.ts <path-to-export.json> [--dry-run]
 */

interface ExportedUser {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  image: string | null;
  referralCode: string;
  emailVerified: string | null;
  bio: string | null;
  country: string | null;
  isPublic: boolean;
  isAdmin: boolean;
  website: string | null;
  headline: string | null;
  coverImage: string | null;
  location: string | null;
  phoneNumber: string | null;
  phoneVerified: boolean;
  verifiedAt: string | null;
  newsletterSubscribed: boolean;
  emailNotifications: boolean;
  weeklyDigest: boolean;
  referralAlerts: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ExportedVote {
  id: string;
  answer: "YES" | "NO";
  militaryAllocationPercent: number | null;
  userId: string | null;
  referredByUserId: string | null;
  referralInvitationId: string | null;
  organizationId: string | null;
  sourceUrl: string | null;
  sourceReferrer: string | null;
  ipAddress: string | null;
  fingerprint: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ExportedWishocraticAllocation {
  id: string;
  userId: string;
  categoryA: string;
  categoryB: string;
  allocationA: number;
  allocationB: number;
  createdAt: string;
}

interface ExportedWishocraticCategorySelection {
  id: string;
  userId: string;
  categoryId: string;
  selected: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ExportedReferralInvitation {
  id: string;
  referrerId: string;
  inviteeName: string;
  inviteeContact: string | null;
  contactMethod: string | null;
  inviteToken: string | null;
  messageText: string | null;
  status: string;
  votedAt: string | null;
  copiedAt: string | null;
  sentAt: string | null;
  confirmedVoteId: string | null;
  confirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ExportPayload {
  exportedAt: string;
  source: string;
  counts: {
    users: number;
    votes: number;
    referralInvitations: number;
    wishocraticAllocations?: number;
    wishocraticCategorySelections?: number;
  };
  users: ExportedUser[];
  votes: ExportedVote[];
  referralInvitations: ExportedReferralInvitation[];
  wishocraticAllocations?: ExportedWishocraticAllocation[];
  wishocraticCategorySelections?: ExportedWishocraticCategorySelection[];
}

const REFERRAL_INVITATION_STATUS_VALUES = new Set<string>(
  Object.values(ReferralInvitationStatus),
);

interface ImportSummary {
  users: {
    /** New destination User rows created. */
    created: number;
    /** Existing destination users matched by email — left alone. */
    skippedAlreadyInDestination: number;
    /** Source rows with no email at all — bad data, dropped. */
    skippedNoEmail: number;
    errors: number;
    /** New users whose source referralCode collides with an existing dest user. */
    referralCodeCollisions: number;
  };
  votes: {
    created: number;
    /** Source vote already has a destination ReferendumVote for this person — left alone. */
    skippedAlreadyVoted: number;
    /** Source vote has no userId, or its userId didn't map to a known dest user. */
    skippedNoUser: number;
    errors: number;
  };
  referralInvitations: {
    created: number;
    skipped: number;
    errors: number;
  };
  wishocraticAllocations: {
    /** WishocraticAllocation rows that would be created. Includes both
     *  source-table-derived rows AND rows synthesized from each Vote's
     *  militaryAllocationPercent (Military / Pragmatic Clinical Trials pair). */
    created: number;
    /** Pairs already in destination — left alone (skip-on-conflict). */
    skipped: number;
    /** Source rows whose category strings don't map to a destination
     *  WishocraticItem (e.g., destination doesn't have that category). */
    skippedUnknownItem: number;
    /** Votes whose militaryAllocationPercent is null. */
    voteAllocationsNull: number;
    errors: number;
  };
  wishocraticItemInclusions: {
    created: number;
    skipped: number;
    skippedUnknownItem: number;
    errors: number;
  };
}

const MILITARY_ITEM_ID = "MILITARY_OPERATIONS";
const CLINICAL_TRIALS_ITEM_ID = "PRAGMATIC_CLINICAL_TRIALS";

interface PreImportState {
  users: number;
  treatyVotes: number;
  referralInvitations: number;
  wishocraticAllocations: number;
  wishocraticItemInclusions: number;
  treatyReferendumId: string | null;
}

async function captureDestinationState(): Promise<PreImportState> {
  const referendum = await prisma.referendum.findUnique({
    where: { slug: TREATY_REFERENDUM_SLUG },
    select: { id: true, deletedAt: true },
  });
  const referendumId =
    referendum && !referendum.deletedAt ? referendum.id : null;

  const [
    users,
    treatyVotes,
    referralInvitations,
    wishocraticAllocations,
    wishocraticItemInclusions,
  ] = await Promise.all([
    prisma.user.count({ where: { isSystem: false } }),
    referendumId
      ? prisma.referendumVote.count({
          where: { referendumId, deletedAt: null },
        })
      : Promise.resolve(0),
    prisma.referralInvitation.count(),
    prisma.wishocraticAllocation.count({ where: { deletedAt: null } }),
    prisma.wishocraticItemInclusion.count({ where: { deletedAt: null } }),
  ]);
  return {
    users,
    treatyVotes,
    referralInvitations,
    wishocraticAllocations,
    wishocraticItemInclusions,
    treatyReferendumId: referendumId,
  };
}

interface ImportOptions {
  inputFile: string;
  dryRun: boolean;
}

function parseArgs(argv: string[]): ImportOptions {
  const dryRun = argv.includes("--dry-run");
  const inputFile = argv.find((arg) => !arg.startsWith("--"));
  if (!inputFile) {
    throw new Error(
      "Pass the path to the export JSON file as the first arg.",
    );
  }
  return { dryRun, inputFile };
}

function looksLikeCountryCode(value: string | null): boolean {
  return (
    typeof value === "string" &&
    /^[A-Z]{2,3}$/.test(value) &&
    value.length <= 3
  );
}

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function parseVoteAnswer(answer: ExportedVote["answer"]): VotePosition | null {
  if (answer === "YES") return VotePosition.YES;
  if (answer === "NO") return VotePosition.NO;
  return null;
}

function parseReferralInvitationStatus(
  status: string,
): ReferralInvitationStatus | null {
  return REFERRAL_INVITATION_STATUS_VALUES.has(status)
    ? (status as ReferralInvitationStatus)
    : null;
}

async function importUsers(
  payload: ExportPayload,
  options: ImportOptions,
): Promise<{
  summary: ImportSummary["users"];
  oldUserIdToNew: Map<string, string>;
}> {
  const summary: ImportSummary["users"] = {
    created: 0,
    skippedAlreadyInDestination: 0,
    skippedNoEmail: 0,
    errors: 0,
    referralCodeCollisions: 0,
  };
  const oldToNew = new Map<string, string>();

  for (const exportedUser of payload.users) {
    if (!exportedUser.email) {
      summary.skippedNoEmail += 1;
      continue;
    }
    try {
      const countryCode = looksLikeCountryCode(exportedUser.country)
        ? exportedUser.country!
        : null;

      const existing = await prisma.user.findUnique({
        where: { email: exportedUser.email },
        select: { id: true },
      });

      // Skip-on-conflict semantic: existing destination users keep their
      // current User + Person state. Source data is older and could
      // clobber isAdmin, emailVerified, isPublic, etc. that the
      // destination has consciously set. We only need the id mapping so
      // downstream votes / allocations / inclusions can attach to the
      // existing user — but we won't overwrite anything.
      if (existing) {
        summary.skippedAlreadyInDestination += 1;
        oldToNew.set(exportedUser.id, existing.id);
        continue;
      }

      if (options.dryRun) {
        summary.created += 1;
        const referralCodeTaken = await prisma.user.findUnique({
          where: { referralCode: exportedUser.referralCode },
          select: { id: true },
        });
        if (referralCodeTaken) summary.referralCodeCollisions += 1;
        // Use the source id as a placeholder mapping during dry-run so
        // downstream vote / invitation projections can still resolve
        // referrers and detect skips. The actual import will rewrite it.
        oldToNew.set(exportedUser.id, exportedUser.id);
        continue;
      }

      // Keep the source referralCode when free; otherwise fall back to
      // the dest default so old /vote/<code> links keep working for as
      // many migrated users as possible.
      const referralCodeTaken = await prisma.user.findUnique({
        where: { referralCode: exportedUser.referralCode },
        select: { id: true },
      });
      if (referralCodeTaken) summary.referralCodeCollisions += 1;
      const user = await prisma.user.create({
        data: {
          email: exportedUser.email,
          emailVerified: parseDate(exportedUser.emailVerified),
          newsletterSubscribed: exportedUser.newsletterSubscribed,
          countryCode,
          isAdmin: false,
          ...(referralCodeTaken
            ? {}
            : { referralCode: exportedUser.referralCode }),
          createdAt: parseDate(exportedUser.createdAt) ?? new Date(),
        },
        select: { id: true },
      });
      summary.created += 1;

      const displayName =
        exportedUser.name?.trim() ||
        exportedUser.username?.trim() ||
        exportedUser.email.split("@")[0]!;
      await ensurePersonForUser(user.id, {
        displayName,
        image: exportedUser.image ?? null,
      });
      const userWithPerson = await prisma.user.findUnique({
        where: { id: user.id },
        select: { personId: true },
      });
      if (userWithPerson?.personId) {
        await prisma.person.update({
          where: { id: userWithPerson.personId },
          data: {
            isPublic: exportedUser.isPublic,
            ...(exportedUser.bio ? { bio: exportedUser.bio } : {}),
            ...(exportedUser.headline
              ? { headline: exportedUser.headline }
              : {}),
            ...(exportedUser.coverImage
              ? { coverImage: exportedUser.coverImage }
              : {}),
            ...(exportedUser.website ? { website: exportedUser.website } : {}),
            ...(countryCode ? { countryCode } : {}),
          },
        });
      }

      oldToNew.set(exportedUser.id, user.id);
    } catch (error) {
      summary.errors += 1;
      console.error(
        `[import:user] ${exportedUser.email} (old id ${exportedUser.id}):`,
        error,
      );
    }
  }

  return { summary, oldUserIdToNew: oldToNew };
}

async function importVotes(
  payload: ExportPayload,
  oldToNew: Map<string, string>,
  options: ImportOptions,
): Promise<ImportSummary["votes"]> {
  const summary: ImportSummary["votes"] = {
    created: 0,
    skippedAlreadyVoted: 0,
    skippedNoUser: 0,
    errors: 0,
  };

  const referendum = await prisma.referendum.findUnique({
    where: { slug: TREATY_REFERENDUM_SLUG },
    select: { id: true, status: true, deletedAt: true },
  });
  if (!referendum || referendum.deletedAt) {
    throw new Error(
      `Treaty referendum (${TREATY_REFERENDUM_SLUG}) not found in destination DB.`,
    );
  }
  if (referendum.status !== ReferendumStatus.ACTIVE) {
    console.warn(
      `[import:vote] referendum status is ${referendum.status}; importing votes anyway.`,
    );
  }

  for (const vote of payload.votes) {
    if (!vote.userId) {
      summary.skippedNoUser += 1;
      continue;
    }
    const newUserId = oldToNew.get(vote.userId);
    if (!newUserId) {
      summary.skippedNoUser += 1;
      continue;
    }
    try {
      // For dry-run, look up via email (the dest user might not exist yet
      // since we skipped the user-side create). For real run, the dest
      // user already exists so the personId lookup succeeds.
      const personId = (
        await prisma.user.findUnique({
          where: { id: newUserId },
          select: { personId: true },
        })
      )?.personId;

      if (options.dryRun) {
        if (!personId) {
          // The user doesn't exist in dest yet (dry-run didn't create it),
          // so we can't confirm whether the vote upsert would create or
          // skip. Project as "would create new" since the user write
          // would also create.
          summary.created += 1;
          continue;
        }
        const existing = await prisma.referendumVote.findUnique({
          where: {
            referendumId_personId: {
              referendumId: referendum.id,
              personId,
            },
          },
          select: { id: true },
        });
        if (existing) summary.skippedAlreadyVoted += 1;
        else summary.created += 1;
        continue;
      }

      if (!personId) {
        summary.skippedNoUser += 1;
        continue;
      }
      // Skip-on-conflict: if a destination vote already exists for this
      // (referendum, person), keep the destination value. Source data is
      // older — we don't want to flip a YES to NO or vice versa.
      const alreadyVoted = await prisma.referendumVote.findUnique({
        where: {
          referendumId_personId: {
            referendumId: referendum.id,
            personId,
          },
        },
        select: { id: true },
      });
      if (alreadyVoted) {
        summary.skippedAlreadyVoted += 1;
        continue;
      }
      const referredByUserId = vote.referredByUserId
        ? oldToNew.get(vote.referredByUserId) ?? null
        : null;
      const answer = parseVoteAnswer(vote.answer);
      if (!answer) {
        summary.errors += 1;
        console.error(
          `[import:vote] vote ${vote.id}: unknown answer ${String(vote.answer)}`,
        );
        continue;
      }
      await prisma.referendumVote.create({
        data: {
          userId: newUserId,
          personId,
          referendumId: referendum.id,
          answer,
          voteSource: ReferendumVoteSource.SELF,
          referredByUserId,
          isPublic: true,
          originUrl: vote.sourceUrl,
          createdAt: parseDate(vote.createdAt) ?? new Date(),
        },
      });
      summary.created += 1;
    } catch (error) {
      summary.errors += 1;
      console.error(
        `[import:vote] vote ${vote.id} (user ${vote.userId}):`,
        error,
      );
    }
  }

  return summary;
}

async function loadKnownWishocraticItemIds(): Promise<Set<string>> {
  const items = await prisma.wishocraticItem.findMany({
    where: { deletedAt: null },
    select: { id: true },
  });
  return new Set(items.map((i) => i.id));
}

async function importWishocraticAllocations(
  payload: ExportPayload,
  oldToNew: Map<string, string>,
  knownItemIds: Set<string>,
  options: ImportOptions,
): Promise<ImportSummary["wishocraticAllocations"]> {
  const summary: ImportSummary["wishocraticAllocations"] = {
    created: 0,
    skipped: 0,
    skippedUnknownItem: 0,
    voteAllocationsNull: 0,
    errors: 0,
  };

  // Synthesize a Military / Pragmatic-Clinical-Trials allocation pair from
  // each Vote's militaryAllocationPercent. The destination has a more
  // structured pairwise allocation system, but the source's per-vote
  // single-percent input maps cleanly to the (Military, Clinical Trials)
  // pair: allocationA = mil%, allocationB = 100 - mil%.
  const haveMilItem = knownItemIds.has(MILITARY_ITEM_ID);
  const haveTrialsItem = knownItemIds.has(CLINICAL_TRIALS_ITEM_ID);

  for (const vote of payload.votes) {
    if (vote.militaryAllocationPercent == null) {
      summary.voteAllocationsNull += 1;
      continue;
    }
    if (!haveMilItem || !haveTrialsItem) {
      summary.skippedUnknownItem += 1;
      continue;
    }
    if (!vote.userId) continue;
    const newUserId = oldToNew.get(vote.userId);
    if (!newUserId) continue;
    try {
      const existing = await prisma.wishocraticAllocation.findUnique({
        where: {
          userId_itemAId_itemBId: {
            userId: newUserId,
            itemAId: MILITARY_ITEM_ID,
            itemBId: CLINICAL_TRIALS_ITEM_ID,
          },
        },
        select: { id: true },
      });
      if (options.dryRun) {
        if (existing) summary.skipped += 1;
        else summary.created += 1;
        continue;
      }
      if (existing) {
        summary.skipped += 1;
        continue;
      }
      const allocationA = Math.max(
        0,
        Math.min(100, vote.militaryAllocationPercent),
      );
      const allocationB = 100 - allocationA;
      await prisma.wishocraticAllocation.create({
        data: {
          userId: newUserId,
          itemAId: MILITARY_ITEM_ID,
          itemBId: CLINICAL_TRIALS_ITEM_ID,
          allocationA,
          allocationB,
          createdAt: parseDate(vote.createdAt) ?? new Date(),
        },
      });
      summary.created += 1;
    } catch (error) {
      summary.errors += 1;
      console.error(
        `[import:vote-alloc] vote ${vote.id} (user ${vote.userId}):`,
        error,
      );
    }
  }

  // Pairwise allocations from the source's WishocraticAllocation table.
  // Source categoryA/B strings already match destination WishocraticItem
  // IDs, so the migration is direct — just verify the items exist.
  for (const allocation of payload.wishocraticAllocations ?? []) {
    const newUserId = oldToNew.get(allocation.userId);
    if (!newUserId) continue;
    if (
      !knownItemIds.has(allocation.categoryA) ||
      !knownItemIds.has(allocation.categoryB)
    ) {
      summary.skippedUnknownItem += 1;
      continue;
    }
    try {
      const existing = await prisma.wishocraticAllocation.findUnique({
        where: {
          userId_itemAId_itemBId: {
            userId: newUserId,
            itemAId: allocation.categoryA,
            itemBId: allocation.categoryB,
          },
        },
        select: { id: true },
      });
      if (options.dryRun) {
        if (existing) summary.skipped += 1;
        else summary.created += 1;
        continue;
      }
      if (existing) {
        summary.skipped += 1;
        continue;
      }
      await prisma.wishocraticAllocation.create({
        data: {
          userId: newUserId,
          itemAId: allocation.categoryA,
          itemBId: allocation.categoryB,
          allocationA: allocation.allocationA,
          allocationB: allocation.allocationB,
          createdAt: parseDate(allocation.createdAt) ?? new Date(),
        },
      });
      summary.created += 1;
    } catch (error) {
      summary.errors += 1;
      console.error(
        `[import:alloc] allocation ${allocation.id} (user ${allocation.userId}):`,
        error,
      );
    }
  }

  return summary;
}

async function importWishocraticItemInclusions(
  payload: ExportPayload,
  oldToNew: Map<string, string>,
  knownItemIds: Set<string>,
  options: ImportOptions,
): Promise<ImportSummary["wishocraticItemInclusions"]> {
  const summary: ImportSummary["wishocraticItemInclusions"] = {
    created: 0,
    skipped: 0,
    skippedUnknownItem: 0,
    errors: 0,
  };

  for (const selection of payload.wishocraticCategorySelections ?? []) {
    const newUserId = oldToNew.get(selection.userId);
    if (!newUserId) continue;
    if (!knownItemIds.has(selection.categoryId)) {
      summary.skippedUnknownItem += 1;
      continue;
    }
    try {
      const existing = await prisma.wishocraticItemInclusion.findUnique({
        where: {
          userId_itemId: { userId: newUserId, itemId: selection.categoryId },
        },
        select: { id: true },
      });
      if (options.dryRun) {
        if (existing) summary.skipped += 1;
        else summary.created += 1;
        continue;
      }
      if (existing) {
        summary.skipped += 1;
        continue;
      }
      await prisma.wishocraticItemInclusion.create({
        data: {
          userId: newUserId,
          itemId: selection.categoryId,
          included: selection.selected,
          createdAt: parseDate(selection.createdAt) ?? new Date(),
        },
      });
      summary.created += 1;
    } catch (error) {
      summary.errors += 1;
      console.error(
        `[import:inclusion] selection ${selection.id} (user ${selection.userId}):`,
        error,
      );
    }
  }

  return summary;
}

async function importReferralInvitations(
  payload: ExportPayload,
  oldToNew: Map<string, string>,
  options: ImportOptions,
): Promise<ImportSummary["referralInvitations"]> {
  const summary: ImportSummary["referralInvitations"] = {
    created: 0,
    skipped: 0,
    errors: 0,
  };

  for (const invitation of payload.referralInvitations) {
    const referrerId = oldToNew.get(invitation.referrerId);
    if (!referrerId) {
      summary.skipped += 1;
      continue;
    }
    try {
      // Idempotency: by inviteToken if present, else by (referrer + name +
      // createdAt) — close-enough fingerprint. Skip if a matching row
      // already exists. Same lookup runs in dry-run so we report whether
      // each invitation would actually be inserted.
      const existing = invitation.inviteToken
        ? await prisma.referralInvitation.findUnique({
            where: { inviteToken: invitation.inviteToken },
            select: { id: true },
          })
        : await prisma.referralInvitation.findFirst({
            where: {
              referrerId,
              inviteeName: invitation.inviteeName,
              createdAt: parseDate(invitation.createdAt) ?? undefined,
            },
            select: { id: true },
          });
      if (existing) {
        summary.skipped += 1;
        continue;
      }
      if (options.dryRun) {
        summary.created += 1;
        continue;
      }
      const status = parseReferralInvitationStatus(invitation.status);
      if (!status) {
        summary.errors += 1;
        console.error(
          `[import:invite] invitation ${invitation.id}: unknown status ${String(invitation.status)}`,
        );
        continue;
      }
      await prisma.referralInvitation.create({
        data: {
          referrerId,
          inviteeName: invitation.inviteeName,
          inviteeContact: invitation.inviteeContact ?? null,
          inviteToken: invitation.inviteToken ?? null,
          messageText: invitation.messageText ?? null,
          status,
          votedAt: parseDate(invitation.votedAt),
          copiedAt: parseDate(invitation.copiedAt),
          sentAt: parseDate(invitation.sentAt),
          confirmedAt: parseDate(invitation.confirmedAt),
          createdAt: parseDate(invitation.createdAt) ?? new Date(),
        },
      });
      summary.created += 1;
    } catch (error) {
      summary.errors += 1;
      console.error(
        `[import:invite] invitation ${invitation.id}:`,
        error,
      );
    }
  }

  return summary;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  console.log(
    `📥 ${options.dryRun ? "Dry-run" : "Importing"}: ${options.inputFile}`,
  );
  const sizeMB = (statSync(options.inputFile).size / 1024 / 1024).toFixed(2);
  console.log(`   Source size: ${sizeMB} MB`);

  const payload = JSON.parse(
    readFileSync(options.inputFile, "utf8"),
  ) as ExportPayload;
  console.log(
    `   Source counts: ${payload.counts.users} users, ${payload.counts.votes} votes, ${payload.counts.referralInvitations} invitations`,
  );

  const before = await captureDestinationState();
  console.log(
    `   Destination before: ${before.users} users, ${before.treatyVotes} treaty votes, ${before.referralInvitations} invitations, ${before.wishocraticAllocations} allocations, ${before.wishocraticItemInclusions} inclusions${
      before.treatyReferendumId
        ? ""
        : "  ⚠️  treaty referendum NOT FOUND — vote import will fail"
    }`,
  );

  const knownItemIds = await loadKnownWishocraticItemIds();
  console.log(`   Known WishocraticItem IDs: ${knownItemIds.size}`);

  const { summary: userSummary, oldUserIdToNew } = await importUsers(
    payload,
    options,
  );
  const voteSummary = await importVotes(payload, oldUserIdToNew, options);
  const invitationSummary = await importReferralInvitations(
    payload,
    oldUserIdToNew,
    options,
  );
  const allocationSummary = await importWishocraticAllocations(
    payload,
    oldUserIdToNew,
    knownItemIds,
    options,
  );
  const inclusionSummary = await importWishocraticItemInclusions(
    payload,
    oldUserIdToNew,
    knownItemIds,
    options,
  );

  const after = options.dryRun ? before : await captureDestinationState();

  console.log("\n" + JSON.stringify(
    {
      users: userSummary,
      votes: voteSummary,
      referralInvitations: invitationSummary,
      wishocraticAllocations: allocationSummary,
      wishocraticItemInclusions: inclusionSummary,
    },
    null,
    2,
  ));

  if (options.dryRun) {
    const projected = {
      users: before.users + userSummary.created,
      treatyVotes: before.treatyVotes + voteSummary.created,
      referralInvitations:
        before.referralInvitations + invitationSummary.created,
      wishocraticAllocations:
        before.wishocraticAllocations + allocationSummary.created,
      wishocraticItemInclusions:
        before.wishocraticItemInclusions + inclusionSummary.created,
    };
    console.log(
      `\n📊 Projected destination after real run: ${projected.users} users (+${userSummary.created}), ${projected.treatyVotes} treaty votes (+${voteSummary.created}), ${projected.referralInvitations} invitations (+${invitationSummary.created}), ${projected.wishocraticAllocations} allocations (+${allocationSummary.created}), ${projected.wishocraticItemInclusions} inclusions (+${inclusionSummary.created}).`,
    );
    if (allocationSummary.skippedUnknownItem > 0) {
      console.log(
        `   ⚠️  ${allocationSummary.skippedUnknownItem} allocations would be skipped because their categoryA/B doesn't match a destination WishocraticItem.`,
      );
    }
    if (inclusionSummary.skippedUnknownItem > 0) {
      console.log(
        `   ⚠️  ${inclusionSummary.skippedUnknownItem} inclusions would be skipped because their categoryId doesn't match a destination WishocraticItem.`,
      );
    }
    if (allocationSummary.voteAllocationsNull > 0) {
      console.log(
        `   ℹ️  ${allocationSummary.voteAllocationsNull} votes have no militaryAllocationPercent (NULL in source) — no Military/Trials pair created for them.`,
      );
    }
    if (userSummary.referralCodeCollisions > 0) {
      console.log(
        `   ⚠️  ${userSummary.referralCodeCollisions} new users will get a fresh referralCode (source code already taken in destination). Old /vote/<code> links for those users will not resolve.`,
      );
    }
    if (userSummary.skippedAlreadyInDestination > 0) {
      console.log(
        `   ℹ️  ${userSummary.skippedAlreadyInDestination} users already exist in destination (matched by email) — left untouched.`,
      );
    }
    if (userSummary.skippedNoEmail > 0) {
      console.log(
        `   ⚠️  ${userSummary.skippedNoEmail} source users have no email — bad data, dropped.`,
      );
    }
    if (voteSummary.skippedAlreadyVoted > 0) {
      console.log(
        `   ℹ️  ${voteSummary.skippedAlreadyVoted} votes skipped — destination user already has a treaty vote on file.`,
      );
    }
    if (voteSummary.skippedNoUser > 0) {
      console.log(
        `   ⚠️  ${voteSummary.skippedNoUser} votes have no userId mapping — bad data, dropped.`,
      );
    }
    if (invitationSummary.skipped > 0) {
      console.log(
        `   ⚠️  ${invitationSummary.skipped} source invitations would be skipped (already present, or referrer not mapped).`,
      );
    }
  } else {
    console.log(
      `\n📊 Destination after: ${after.users} users (+${after.users - before.users}), ${after.treatyVotes} treaty votes (+${after.treatyVotes - before.treatyVotes}), ${after.referralInvitations} invitations (+${after.referralInvitations - before.referralInvitations}), ${after.wishocraticAllocations} allocations (+${after.wishocraticAllocations - before.wishocraticAllocations}), ${after.wishocraticItemInclusions} inclusions (+${after.wishocraticItemInclusions - before.wishocraticItemInclusions}).`,
    );
    console.log(
      "\n✅ Import complete. Run `scripts/backfill-court-plaintiffs.ts` next to register imported YES voters as plaintiffs.",
    );
  }

  await prisma.$disconnect();
}

const isMain =
  process.argv[1] != null &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  void main().catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
}
