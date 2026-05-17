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
  handle?: string | null;
  headline?: string | null;
  image?: string | null;
  website?: string | null;
  coverImage?: string | null;
  isPublic?: boolean;
  newsletterSubscribed?: boolean;
  unsubscribedScopes?: string[];
}

export class ProfileValidationError extends Error {
  constructor(
    message: string,
    public readonly field: "handle" | "name" | "bio" | "other" = "other",
  ) {
    super(message);
    this.name = "ProfileValidationError";
  }
}

/**
 * Validate a public link handle (3–24 chars, [A-Za-z0-9_-]) and resolve it to
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
      "Link name must be between 3 and 24 characters.",
      "handle",
    );
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    throw new ProfileValidationError(
      "Link name can only include letters, numbers, hyphens, and underscores.",
      "handle",
    );
  }
  return trimmed.toLowerCase();
}

/**
 * Canonical profile writer. Person owns every public-display field; User
 * keeps only newsletter/unsubscribe preferences. This helper writes both in
 * a transaction and is shared between the dashboard PATCH route and the MCP
 * `updateMyProfile` tool.
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
  const handle = "handle" in input ? normalizeHandle(input.handle) : undefined;

  if (handle && handle.length > 0) {
    const collision = await prisma.person.findFirst({
      where: { handle, user: { NOT: { id: userId } } },
      select: { id: true },
    });
    if (collision) {
      throw new ProfileValidationError(
        "That link name is already taken. Please choose another.",
        "handle",
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
      // Person owns all public-display fields (handle, displayName, bio,
      // headline, coverImage, website, isPublic). User keeps account-only
      // state (newsletter prefs, unsubscribed scopes, etc.).
      await tx.person.update({
        where: { id: userRecord.personId },
        data: {
          ...(typeof input.name === "string"
            ? { displayName: input.name }
            : {}),
          ...(handle !== undefined ? { handle } : {}),
          ...(typeof input.bio === "string" ? { bio: input.bio } : {}),
          ...(typeof input.headline === "string" || input.headline === null
            ? { headline: input.headline }
            : {}),
          ...(typeof input.image === "string" || input.image === null
            ? { image: input.image }
            : {}),
          ...(typeof input.website === "string" || input.website === null
            ? { website: input.website }
            : {}),
          ...(typeof input.coverImage === "string" || input.coverImage === null
            ? { coverImage: input.coverImage }
            : {}),
          ...(typeof input.isPublic === "boolean"
            ? { isPublic: input.isPublic }
            : {}),
        },
      });
    }

    const unsubscribedScopesUpdate = Array.isArray(input.unsubscribedScopes)
      ? input.unsubscribedScopes.filter(
          (s): s is EmailScope =>
            isEmailScope(s) && !isTransactionalScope(s) && !isMasterScope(s),
        )
      : undefined;

    // Only account-level fields (newsletter/unsubscribe prefs) live on User.
    // Skip the user.update entirely when there's nothing account-y to write.
    if (
      typeof input.newsletterSubscribed === "boolean" ||
      unsubscribedScopesUpdate !== undefined
    ) {
      await tx.user.update({
        where: { id: userId },
        data: {
          ...(typeof input.newsletterSubscribed === "boolean"
            ? { newsletterSubscribed: input.newsletterSubscribed }
            : {}),
          ...(unsubscribedScopesUpdate !== undefined
            ? { unsubscribedScopes: unsubscribedScopesUpdate }
            : {}),
        },
      });
    }
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
          bio: true,
          headline: true,
          website: true,
          coverImage: true,
          isPublic: true,
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
      handle: getUserDisplayHandle(user),
      email: user.email,
      bio: user.person?.bio ?? "",
      headline: user.person?.headline ?? null,
      website: user.person?.website ?? null,
      coverImage: user.person?.coverImage ?? null,
      downstreamConversionCount: user.downstreamConversionCount,
      isPublic: user.person?.isPublic ?? false,
      referralCode: user.referralCode,
      image: getUserDisplayAvatar(user),
      newsletterSubscribed: user.newsletterSubscribed,
      person: user.person,
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
