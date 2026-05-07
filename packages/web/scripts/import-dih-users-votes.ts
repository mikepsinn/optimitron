import "./load-env";
import { readFileSync, statSync } from "fs";
import { pathToFileURL } from "url";
import {
  ReferendumStatus,
  ReferendumVoteSource,
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
  counts: { users: number; votes: number; referralInvitations: number };
  users: ExportedUser[];
  votes: ExportedVote[];
  referralInvitations: ExportedReferralInvitation[];
}

interface ImportSummary {
  users: {
    created: number;
    updated: number;
    skipped: number;
    errors: number;
    /** New users whose source referralCode collides with an existing dest user. */
    referralCodeCollisions: number;
  };
  votes: { created: number; updated: number; skipped: number; errors: number };
  referralInvitations: {
    created: number;
    skipped: number;
    errors: number;
  };
}

interface PreImportState {
  users: number;
  treatyVotes: number;
  referralInvitations: number;
  treatyReferendumId: string | null;
}

async function captureDestinationState(): Promise<PreImportState> {
  const referendum = await prisma.referendum.findUnique({
    where: { slug: TREATY_REFERENDUM_SLUG },
    select: { id: true, deletedAt: true },
  });
  const referendumId =
    referendum && !referendum.deletedAt ? referendum.id : null;

  const [users, treatyVotes, referralInvitations] = await Promise.all([
    prisma.user.count({ where: { isSystem: false } }),
    referendumId
      ? prisma.referendumVote.count({
          where: { referendumId, deletedAt: null },
        })
      : Promise.resolve(0),
    prisma.referralInvitation.count(),
  ]);
  return { users, treatyVotes, referralInvitations, treatyReferendumId: referendumId };
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

async function importUsers(
  payload: ExportPayload,
  options: ImportOptions,
): Promise<{
  summary: ImportSummary["users"];
  oldUserIdToNew: Map<string, string>;
}> {
  const summary: ImportSummary["users"] = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    referralCodeCollisions: 0,
  };
  const oldToNew = new Map<string, string>();

  for (const exportedUser of payload.users) {
    if (!exportedUser.email) {
      summary.skipped += 1;
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

      // Dry-run path: do the same lookups so we can report what *would*
      // happen against the live destination DB, but skip every write.
      if (options.dryRun) {
        if (existing) {
          summary.updated += 1;
          oldToNew.set(exportedUser.id, existing.id);
        } else {
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
        }
        continue;
      }

      const userData = {
        email: exportedUser.email,
        emailVerified: parseDate(exportedUser.emailVerified),
        newsletterSubscribed: exportedUser.newsletterSubscribed,
        countryCode,
        isAdmin: exportedUser.isAdmin,
      };

      let user: { id: string };
      if (existing) {
        user = await prisma.user.update({
          where: { id: existing.id },
          data: userData,
          select: { id: true },
        });
        summary.updated += 1;
      } else {
        // Keep the source referralCode when free; otherwise fall back to
        // the dest default so old /vote/<code> links keep working for as
        // many migrated users as possible.
        const referralCodeTaken = await prisma.user.findUnique({
          where: { referralCode: exportedUser.referralCode },
          select: { id: true },
        });
        if (referralCodeTaken) summary.referralCodeCollisions += 1;
        user = await prisma.user.create({
          data: {
            ...userData,
            ...(referralCodeTaken
              ? {}
              : { referralCode: exportedUser.referralCode }),
            createdAt: parseDate(exportedUser.createdAt) ?? new Date(),
          },
          select: { id: true },
        });
        summary.created += 1;
      }

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
    updated: 0,
    skipped: 0,
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
      summary.skipped += 1;
      continue;
    }
    const newUserId = oldToNew.get(vote.userId);
    if (!newUserId) {
      summary.skipped += 1;
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
          // update. Project as "would create new" since the user write
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
        if (existing) summary.updated += 1;
        else summary.created += 1;
        continue;
      }

      if (!personId) {
        summary.skipped += 1;
        continue;
      }
      const referredByUserId = vote.referredByUserId
        ? oldToNew.get(vote.referredByUserId) ?? null
        : null;
      const answer =
        vote.answer === "YES" ? VotePosition.YES : VotePosition.NO;
      const data = {
        userId: newUserId,
        personId,
        referendumId: referendum.id,
        answer,
        voteSource: ReferendumVoteSource.SELF,
        referredByUserId,
        isPublic: true,
        originUrl: vote.sourceUrl,
        createdAt: parseDate(vote.createdAt) ?? new Date(),
      };
      const result = await prisma.referendumVote.upsert({
        where: {
          referendumId_personId: {
            referendumId: referendum.id,
            personId,
          },
        },
        create: data,
        update: {
          // On re-import, refresh the answer + originUrl + referrer if the
          // source has more recent data, but don't reset the createdAt
          // (first-vote-wins semantics in the destination).
          answer: data.answer,
          originUrl: data.originUrl,
          referredByUserId: data.referredByUserId,
        },
        select: { id: true, createdAt: true },
      });
      const isNew =
        Math.abs(result.createdAt.getTime() - data.createdAt.getTime()) < 1000;
      if (isNew) {
        summary.created += 1;
      } else {
        summary.updated += 1;
      }
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
      await prisma.referralInvitation.create({
        data: {
          referrerId,
          inviteeName: invitation.inviteeName,
          inviteeContact: invitation.inviteeContact ?? null,
          inviteToken: invitation.inviteToken ?? null,
          messageText: invitation.messageText ?? null,
          status: invitation.status as never,
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
    `   Destination before: ${before.users} users, ${before.treatyVotes} treaty votes, ${before.referralInvitations} invitations${
      before.treatyReferendumId
        ? ""
        : "  ⚠️  treaty referendum NOT FOUND — vote import will fail"
    }`,
  );

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

  const after = options.dryRun ? before : await captureDestinationState();

  console.log("\n" + JSON.stringify(
    {
      users: userSummary,
      votes: voteSummary,
      referralInvitations: invitationSummary,
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
    };
    console.log(
      `\n📊 Projected destination after real run: ${projected.users} users (+${userSummary.created}), ${projected.treatyVotes} treaty votes (+${voteSummary.created}), ${projected.referralInvitations} invitations (+${invitationSummary.created}).`,
    );
    if (userSummary.referralCodeCollisions > 0) {
      console.log(
        `   ⚠️  ${userSummary.referralCodeCollisions} new users will get a fresh referralCode (source code already taken in destination). Old /vote/<code> links for those users will not resolve.`,
      );
    }
    if (userSummary.skipped > 0) {
      console.log(
        `   ⚠️  ${userSummary.skipped} source users have no email and will be skipped.`,
      );
    }
    if (voteSummary.skipped > 0) {
      console.log(
        `   ⚠️  ${voteSummary.skipped} source votes have no userId mapping and will be skipped.`,
      );
    }
    if (invitationSummary.skipped > 0) {
      console.log(
        `   ⚠️  ${invitationSummary.skipped} source invitations would be skipped (already present, or referrer not mapped).`,
      );
    }
  } else {
    console.log(
      `\n📊 Destination after: ${after.users} users (+${after.users - before.users}), ${after.treatyVotes} treaty votes (+${after.treatyVotes - before.treatyVotes}), ${after.referralInvitations} invitations (+${after.referralInvitations - before.referralInvitations}).`,
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
