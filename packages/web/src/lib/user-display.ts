import type { Prisma } from "@optimitron/db";
import { getPersonHref } from "./person-href";

/**
 * The single source of truth for "what columns do we need to render a user".
 * Spread into any Prisma `select` that needs display data:
 *
 *   prisma.user.findUnique({
 *     where: { id },
 *     select: { ...userDisplaySelect, otherField: true },
 *   })
 *
 * Person owns every public-display field; User contributes only `id` and
 * `email` (auth identifiers that the helpers need for fallbacks like
 * "Anonymous" rendering when a Person hasn't been linked yet).
 */
export const userDisplaySelect = {
  id: true,
  email: true,
  person: {
    select: {
      id: true,
      handle: true,
      displayName: true,
      image: true,
    },
  },
} satisfies Prisma.UserSelect;

/**
 * Minimal user shape these display helpers accept. Matches the
 * `userDisplaySelect` fragment above. Components that receive a "user" object
 * (whether from `getCurrentUser`, a Prisma query, or a session token) should
 * type their prop as `UserForDisplay` so the helpers can read uniformly.
 */
export interface UserForDisplay {
  id: string;
  email?: string | null;
  person?: {
    id: string;
    handle?: string | null;
    displayName?: string | null;
    image?: string | null;
  } | null;
}

/**
 * Resolve the display name for a user. Reads `Person.displayName`, falls back
 * to email, and finally to a literal "Anonymous" so callers never get an
 * empty string. Trim-aware.
 */
export function getUserDisplayName(user: UserForDisplay | null | undefined): string {
  if (!user) return "Anonymous";
  return (
    user.person?.displayName?.trim() ||
    user.email?.trim() ||
    "Anonymous"
  );
}

/**
 * Resolve the handle for a user (for "@handle" rendering). Returns null if
 * the user has no linked Person with a handle — callers should fall back to
 * `getUserDisplayName` for the bare display label in that case.
 */
export function getUserDisplayHandle(
  user: UserForDisplay | null | undefined,
): string | null {
  if (!user) return null;
  return user.person?.handle ?? null;
}

/**
 * Resolve the avatar URL for a user. Returns null when the Person has no
 * image so callers can render a fallback initial.
 */
export function getUserDisplayAvatar(
  user: UserForDisplay | null | undefined,
): string | null {
  if (!user) return null;
  return user.person?.image ?? null;
}

/**
 * Resolve a `/people/{handle}` href for a user. Returns null if the user has
 * no linked Person at all — callers should not render a link in that case.
 */
export function getUserDisplayHref(
  user: UserForDisplay | null | undefined,
): string | null {
  if (!user?.person) return null;
  return getPersonHref(user.person);
}

/**
 * The canonical "display label" for a user — `@handle` if a handle exists,
 * otherwise the display name.
 */
export function getUserDisplayLabel(
  user: UserForDisplay | null | undefined,
): string {
  const handle = getUserDisplayHandle(user);
  if (handle) return `@${handle}`;
  return getUserDisplayName(user);
}
