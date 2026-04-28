import {
  isEmailScope,
  isMasterScope,
  isTransactionalScope,
  type EmailScope,
} from "@/lib/email/scopes";
import { ensurePersonForUser } from "@/lib/person.server";
import { prisma } from "@/lib/prisma";
import type { DashboardUser, DashboardSocialAccount } from "@/types/dashboard";
import {
  getUserDisplayAvatar,
  getUserDisplayHandle,
  getUserDisplayName,
} from "@/lib/user-display";

export interface ProfileIdentityData {
  user: DashboardUser;
  socialAccounts: DashboardSocialAccount[];
  linkedAuthProviderIds: string[];
}

export interface UpdateProfileInput {
  name?: string;
  bio?: string;
  username?: string | null;
  headline?: string | null;
  website?: string | null;
  coverImage?: string | null;
  isPublic?: boolean;
  newsletterSubscribed?: boolean;
  unsubscribedScopes?: string[];
}

export class ProfileValidationError extends Error {
  constructor(
    message: string,
    public readonly field: "username" | "name" | "bio" | "other" = "other",
  ) {
    super(message);
    this.name = "ProfileValidationError";
  }
}

/**
 * Validate a player-name handle (3–24 chars, [A-Za-z0-9_-]) and resolve it to
 * a normalized lowercase form. Empty string clears the handle. Returns:
 *   - `null` when the caller wants to clear the handle.
 *   - `string` (lowercase) when the caller wants to set/change it.
 *   - `undefined` when the handle is not being edited.
 */
function normalizeHandle(raw: unknown): string | null | undefined {
  if (raw === undefined) return undefined;
  const trimmed = String(raw ?? "").trim();
  if (trimmed === "") return null;
  if (trimmed.length < 3 || trimmed.length > 24) {
    throw new ProfileValidationError(
      "Player name must be between 3 and 24 characters.",
      "username",
    );
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    throw new ProfileValidationError(
      "Player name can only include letters, numbers, hyphens, and underscores.",
      "username",
    );
  }
  return trimmed.toLowerCase();
}

/**
 * Canonical profile writer. Person is the source of truth for displayName /
 * handle / bio; User columns are a legacy mirror cache. This helper writes
 * Person first inside a transaction, mirrors to User, and is shared between
 * the dashboard PATCH route and the MCP `updateMyProfile` tool.
 *
 * Throws `ProfileValidationError` for handle-format and handle-collision
 * problems so callers can map to their own error envelope (HTTP 400 / MCP
 * isError). Other Prisma errors propagate.
 *
 * Returns the fresh `ProfileIdentityData` after the write.
 */
export async function updateUserProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<ProfileIdentityData | null> {
  const handle =
    "username" in input ? normalizeHandle(input.username) : undefined;

  if (handle && handle.length > 0) {
    const collision = await prisma.person.findFirst({
      where: { handle, user: { NOT: { id: userId } } },
      select: { id: true },
    });
    if (collision) {
      throw new ProfileValidationError(
        "That player name is already taken. Please choose another.",
        "username",
      );
    }
  }

  await ensurePersonForUser(userId);

  await prisma.$transaction(async (tx) => {
    const userRecord = await tx.user.findUniqueOrThrow({
      where: { id: userId },
      select: { personId: true },
    });

    if (userRecord.personId) {
      await tx.person.update({
        where: { id: userRecord.personId },
        data: {
          ...(typeof input.name === "string" ? { displayName: input.name } : {}),
          ...(handle !== undefined ? { handle } : {}),
          ...(typeof input.bio === "string" ? { bio: input.bio } : {}),
        },
      });
    }

    const unsubscribedScopesUpdate = Array.isArray(input.unsubscribedScopes)
      ? input.unsubscribedScopes.filter(
          (s): s is EmailScope =>
            isEmailScope(s) && !isTransactionalScope(s) && !isMasterScope(s),
        )
      : undefined;

    await tx.user.update({
      where: { id: userId },
      data: {
        ...(typeof input.name === "string" ? { name: input.name } : {}),
        ...(typeof input.bio === "string" ? { bio: input.bio } : {}),
        ...(typeof input.headline === "string" || input.headline === null
          ? { headline: input.headline }
          : {}),
        ...(typeof input.website === "string" || input.website === null
          ? { website: input.website }
          : {}),
        ...(typeof input.coverImage === "string" || input.coverImage === null
          ? { coverImage: input.coverImage }
          : {}),
        ...(typeof input.isPublic === "boolean" ? { isPublic: input.isPublic } : {}),
        ...(typeof input.newsletterSubscribed === "boolean"
          ? { newsletterSubscribed: input.newsletterSubscribed }
          : {}),
        ...(unsubscribedScopesUpdate !== undefined
          ? { unsubscribedScopes: unsubscribedScopesUpdate }
          : {}),
        ...(handle !== undefined ? { username: handle } : {}),
      },
    });
  });

  return getProfileIdentityData(userId);
}

export async function getProfileIdentityData(
  userId: string,
): Promise<ProfileIdentityData | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      person: {
        select: {
          id: true,
          handle: true,
          displayName: true,
          image: true,
        },
      },
      accounts: {
        where: { deletedAt: null },
        select: { provider: true },
      },
      socialAccounts: true,
    },
  });

  if (!user) {
    return null;
  }

  return {
    user: {
      id: user.id,
      name: getUserDisplayName(user),
      username: getUserDisplayHandle(user),
      email: user.email,
      bio: user.bio || "",
      headline: user.headline || null,
      website: user.website || null,
      coverImage: user.coverImage || null,
      isPublic: user.isPublic,
      referralCode: user.referralCode,
      image: getUserDisplayAvatar(user),
      newsletterSubscribed: user.newsletterSubscribed,
    },
    socialAccounts: user.socialAccounts.map((sa) => ({
      platform: sa.platform,
      username: sa.username,
      walletAddress: sa.walletAddress,
      isPrimary: sa.isPrimary,
      verifiedAt: sa.verifiedAt,
    })),
    linkedAuthProviderIds: Array.from(
      new Set(user.accounts.map((account) => account.provider.toLowerCase())),
    ),
  };
}
