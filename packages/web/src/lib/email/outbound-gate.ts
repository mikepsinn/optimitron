/**
 * Outbound message gate — the operator emergency stop, evaluated at the send
 * boundary.
 *
 * State lives in the `OutboundMessageGate` row, not in an env var, so pulling
 * the stop takes effect on the next send instead of the next deploy. This
 * module is the pure decision function; `outbound-gate.server.ts` reads the
 * row.
 *
 * Failure behaviour is asymmetric on purpose:
 *
 * - Stop pulled → suppress everything, including sign-in links. It is a
 *   stop-the-world switch; an operator who pulls it wants silence.
 * - Gate unreadable → suppress everything except sign-in links. That is the one
 *   message whose absence locks a human out of their own account; a scheduled
 *   digest or a receipt can wait for a readable gate.
 *
 * Enforcement lives inside the lowest-level send paths in `@/lib/email/resend`
 * so no call site can forget it.
 */
import type {
  SendAuthorization,
  TransactionalSendReason,
} from "@/lib/email/outbound-authorization.server";

/**
 * The only mail that still goes out while the gate is unreadable. Keep this at
 * one entry unless a message can genuinely lock someone out of the app.
 */
const GATE_UNREADABLE_ALLOWED_REASONS: readonly TransactionalSendReason[] = [
  "magic_link",
];

export type OutboundSuppressionReason =
  | "emergency_stop"
  | "gate_unreadable"
  | "recipient_not_allowlisted";

export interface OutboundGateState {
  /** Stop-the-world switch. */
  stopAllOutbound: boolean;
  /**
   * Addresses ("a@b.org") and domains ("@b.org" or bare "b.org") allowed to
   * receive mail. Empty means no recipient restriction.
   */
  allowlist: readonly string[];
}

export type OutboundGateDecision =
  | { allowed: true }
  | { allowed: false; reason: OutboundSuppressionReason };

export function normalizeAllowlistEntries(
  entries: readonly string[] | null | undefined,
): string[] {
  return (entries ?? [])
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0);
}

export function isEmailAllowlisted(
  email: string,
  allowlistEntries: readonly string[],
): boolean {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;
  // No "@" in the recipient → not a routable address; never allowlisted.
  const domain = normalized.split("@")[1] ?? "";
  if (!domain) return false;

  return allowlistEntries.some((entry) => {
    if (entry.startsWith("@")) return domain === entry.slice(1);
    if (entry.includes("@")) return normalized === entry;
    // Bare token without "@" — treat as a domain so "example.org" and
    // "@example.org" behave identically (forgiving config parsing).
    return domain === entry;
  });
}

export function evaluateOutboundGate(input: {
  authorization: SendAuthorization;
  /** `null` when the gate row could not be read. */
  gate: OutboundGateState | null;
  to: string;
}): OutboundGateDecision {
  if (!input.gate) {
    const allowed =
      input.authorization.kind === "transactional" &&
      GATE_UNREADABLE_ALLOWED_REASONS.includes(input.authorization.reason);
    return allowed
      ? { allowed: true }
      : { allowed: false, reason: "gate_unreadable" };
  }
  if (input.gate.stopAllOutbound) {
    return { allowed: false, reason: "emergency_stop" };
  }

  const entries = normalizeAllowlistEntries(input.gate.allowlist);
  if (entries.length === 0) return { allowed: true };
  return isEmailAllowlisted(input.to, entries)
    ? { allowed: true }
    : { allowed: false, reason: "recipient_not_allowlisted" };
}
