import type { Prisma } from "@optimitron/db";
import { getPersonHref } from "./person-href";

/**
 * The single source of truth for "what columns do we need to render a user".
 *
 * Inline this fragment in any Prisma `select` that needs display data:
 *
 *   prisma.user.findUnique({
 *     where: { id },
 *     select: { ...userDisplaySelect, otherField: true },
 *   })
 *
 * The shape includes both the User-level columns (legacy mirror cache —
 * `name`, `username`, `image`, `email`) and the Person-level columns
 * (canonical — `displayName`, `handle`, `image`). The display helpers below
 * read Person first and fall back through the User columns. When we
 * eventually drop the User mirror columns, this fragment + the helpers are
 * the only places that need to change.
 */
export const userDisplaySelect = {
  id: true,
  name: true,
  username: true,
  image: true,
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
  name?: string | null;
  username?: string | null;
  image?: string | null;
  email?: string | null;
  person?: {
    id: string;
    handle?: string | null;
    displayName?: string | null;
    image?: string | null;
  } | null;
}

/**
 * Resolve the display name for a user. Reads `Person.displayName` first, then
 * falls back through the legacy User columns to email, and finally to a
 * literal "Anonymous" so callers never get an empty string. Trim-aware.
 */
export function getUserDisplayName(user: UserForDisplay | null | undefined): string {
  if (!user) return "Anonymous";
  return (
    user.person?.displayName?.trim() ||
    user.name?.trim() ||
    user.username?.trim() ||
    user.email?.trim() ||
    "Anonymous"
  );
}

/**
 * Resolve the handle for a user (for "@handle" rendering). Returns null if
 * neither Person.handle nor User.username is set — callers should fall back
 * to `getUserDisplayName` for the bare display label in that case.
 */
export function getUserDisplayHandle(
  user: UserForDisplay | null | undefined,
): string | null {
  if (!user) return null;
  return user.person?.handle ?? user.username ?? null;
}

/**
 * Resolve the avatar URL for a user. Person.image first, then the legacy
 * User.image. Returns null when neither exists so callers can render a
 * fallback initial.
 */
export function getUserDisplayAvatar(
  user: UserForDisplay | null | undefined,
): string | null {
  if (!user) return null;
  return user.person?.image ?? user.image ?? null;
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
 * otherwise the display name. Use this anywhere you'd otherwise type
 * `user.username ?? user.name ?? "Anonymous"`.
 */
export function getUserDisplayLabel(
  user: UserForDisplay | null | undefined,
): string {
  const handle = getUserDisplayHandle(user);
  if (handle) return `@${handle}`;
  return getUserDisplayName(user);
}
