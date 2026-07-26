import { prisma } from "@/lib/prisma";
import {
  EMAIL_SCOPES,
  isMasterScope,
  isTransactionalScope,
  type EmailScope,
} from "@/lib/email/scopes";

const MASTER_SCOPE = "all" satisfies EmailScope;

interface SuppressionState {
  newsletterSubscribed: boolean;
  unsubscribedScopes: readonly string[];
}

/**
 * Pure predicate. Exported for tests; production callers should use
 * {@link canSendEmailToUser} which looks the user up first.
 */
export function isSendAllowed(scope: EmailScope, state: SuppressionState): boolean {
  if (isTransactionalScope(scope)) return true;
  if (!state.newsletterSubscribed) return false;
  if (state.unsubscribedScopes.includes(MASTER_SCOPE)) return false;
  if (state.unsubscribedScopes.includes(scope)) return false;
  return true;
}

/**
 * Decide whether an outbound email to `userId` with the given `scope` should
 * be delivered. Transactional scopes bypass all user preferences. For
 * non-transactional scopes, the master kill switch (`newsletterSubscribed=false`
 * OR `unsubscribedScopes` containing `"all"`) blocks everything; otherwise the
 * specific scope must be absent from `unsubscribedScopes`.
 *
 * Designed to live inside {@link sendResendEmail} so call sites cannot forget.
 * Missing users are treated as NOT allowed — if we can't look them up, we
 * don't email.
 */
export async function canSendEmailToUser(userId: string, scope: EmailScope): Promise<boolean> {
  if (isTransactionalScope(scope)) return true;

  try {
    const user = await getEmailSuppressionStateForUser(userId);
    if (!user) return false;
    return isSendAllowed(scope, user);
  } catch (error) {
    console.error("[CAN-SEND] Failed to check suppression state", userId, scope, error);
    return false;
  }
}

export async function getEmailSuppressionStateForUser(userId: string): Promise<SuppressionState | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      newsletterSubscribed: true,
      unsubscribedScopes: true,
    },
  });
}

/** Lowercase + trim, so a suppression written from one path matches a send from another. */
export function normalizeSuppressionEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Address-keyed twin of {@link getEmailSuppressionStateForUser}, for recipients
 * with no `User` row — the people an agent cold-contacts.
 *
 * Shaped into the same {@link SuppressionState} so both identity kinds run
 * through the one {@link isSendAllowed} predicate. `newsletterSubscribed` is
 * true because there is no per-address equivalent of the account-level toggle;
 * the "all" row in `EmailSuppression` is how a non-user says "never again".
 */
export async function getEmailSuppressionStateForAddress(
  email: string,
): Promise<SuppressionState> {
  const rows = await prisma.emailSuppression.findMany({
    where: { email: normalizeSuppressionEmail(email) },
    select: { scope: true },
  });
  return {
    newsletterSubscribed: true,
    unsubscribedScopes: rows.map((row) => row.scope),
  };
}

/**
 * Decide whether an outbound email to a bare address with the given `scope`
 * should be delivered. Transactional scopes bypass suppression, exactly as they
 * do for users — a sign-in link must reach someone who opted out of campaign
 * mail.
 *
 * Designed to live inside the send functions so call sites cannot forget, and
 * fails closed on lookup error for the same reason {@link canSendEmailToUser}
 * does: if we cannot check, we do not send.
 */
export async function canSendEmailToAddress(email: string, scope: EmailScope): Promise<boolean> {
  if (isTransactionalScope(scope)) return true;

  const normalized = normalizeSuppressionEmail(email);
  if (!normalized) return false;

  try {
    return isSendAllowed(scope, await getEmailSuppressionStateForAddress(normalized));
  } catch (error) {
    console.error("[CAN-SEND] Failed to check address suppression", normalized, scope, error);
    return false;
  }
}

export function isMasterSuppressed(state: SuppressionState): boolean {
  return !state.newsletterSubscribed || state.unsubscribedScopes.includes(MASTER_SCOPE);
}

/** Convenience for UI: given the current state, what scopes are off? */
export function currentlyUnsubscribedLabels(state: SuppressionState): string[] {
  if (isMasterSuppressed(state)) {
    return [EMAIL_SCOPES[MASTER_SCOPE].label];
  }
  return state.unsubscribedScopes
    .filter((s): s is EmailScope => s in EMAIL_SCOPES && !isMasterScope(s as EmailScope))
    .map((s) => EMAIL_SCOPES[s].label);
}
