/**
 * Typed send authorization — the answer to "who said to send this?".
 *
 * Every outbound message carries one of three authorizations:
 *
 * - `transactional` — the recipient's own action produced this exact message
 *   (magic-link sign-in, a receipt for something they just did). Reasons are a
 *   closed union, so adding one is a reviewed code change.
 * - `owner` — a signed-in human pressed send in the web UI.
 * - `approved` — a human approved an `ExternalActionRequest` whose payload hash
 *   still matches the exact bytes about to go out.
 *
 * `approved` values are unforgeable at runtime, not only in the type system.
 * {@link authorizeApprovedSend} is the only function that registers an object
 * in the module-private `mintedApprovals` set, and the send boundary refuses
 * any `approved` authorization that is not in it. An agent that hand-builds
 * `{ kind: "approved", requestId }` gets an exception, not an email.
 */
import { ExternalActionRequestStatus } from "@optimitron/db/enums";
import { sha256CanonicalJson } from "@optimitron/data/parameters";
import { prisma } from "@/lib/prisma";

/**
 * Recipient-initiated sends. Each reason names a specific message the human on
 * the other end asked for by acting. This union is the whole allowlist — an
 * agent cannot invent a reason at runtime.
 */
export type TransactionalSendReason =
  | "magic_link"
  | "operator_monitor_forward"
  | "post_vote_share"
  | "referral_first_conversion"
  | "task_funding_pledge_confirmation"
  | "task_funding_pledge_decline"
  | "task_funding_pledge_receipt"
  | "monthly_chain_digest";

export interface TransactionalSendAuthorization {
  kind: "transactional";
  reason: TransactionalSendReason;
}

export interface OwnerSendAuthorization {
  kind: "owner";
  userId: string;
}

export interface ApprovedSendAuthorization {
  kind: "approved";
  /** The APPROVED ExternalActionRequest this send is executing. */
  requestId: string;
  /** Hash the approver signed off on, re-verified against the live payload. */
  approvedPayloadHash: string;
}

export type SendAuthorization =
  | TransactionalSendAuthorization
  | OwnerSendAuthorization
  | ApprovedSendAuthorization;

/**
 * Objects minted by {@link authorizeApprovedSend}. A WeakSet, so a forged
 * literal fails the check and nothing here keeps authorizations alive.
 */
const mintedApprovals = new WeakSet<ApprovedSendAuthorization>();

export function transactionalSend(
  reason: TransactionalSendReason,
): TransactionalSendAuthorization {
  return { kind: "transactional", reason };
}

export function ownerSend(userId: string): OwnerSendAuthorization {
  const trimmed = userId.trim();
  if (!trimmed) {
    throw new Error("Owner-authorized sends require a signed-in user id");
  }
  return { kind: "owner", userId: trimmed };
}

/** True when `authorization` is safe to dispatch. */
export function isGenuineSendAuthorization(
  authorization: SendAuthorization,
): boolean {
  if (authorization.kind !== "approved") return true;
  return mintedApprovals.has(authorization);
}

export function assertGenuineSendAuthorization(
  authorization: SendAuthorization,
): void {
  if (!isGenuineSendAuthorization(authorization)) {
    throw new Error(
      "Refusing to send: approved authorization was not minted by authorizeApprovedSend",
    );
  }
}

export class OutboundApprovalError extends Error {
  constructor(
    message: string,
    readonly code:
      | "not_found"
      | "not_approved"
      | "expired"
      | "payload_mismatch",
  ) {
    super(message);
    this.name = "OutboundApprovalError";
  }
}

export interface ApprovedSendVerificationInput {
  externalActionRequestId: string;
  /** Recipient the approver saw. */
  destination: string;
  /** Operation the approver saw. */
  operation: string;
  /** The exact message about to be dispatched, rebuilt from live rows. */
  payload: Record<string, unknown>;
  now?: Date;
}

/**
 * The one way to obtain an `approved` authorization.
 *
 * Re-derives the payload hash from the message that is actually about to go
 * out and compares it to the hash the human approved, so a draft edited after
 * approval cannot ride an old approval out the door.
 */
export async function authorizeApprovedSend(
  input: ApprovedSendVerificationInput,
): Promise<ApprovedSendAuthorization> {
  const request = await prisma.externalActionRequest.findFirst({
    where: { deletedAt: null, id: input.externalActionRequestId },
    select: {
      approvedPayloadHash: true,
      expiresAt: true,
      id: true,
      payloadHash: true,
      status: true,
    },
  });
  if (!request) {
    throw new OutboundApprovalError(
      "External action request not found",
      "not_found",
    );
  }
  if (request.status !== ExternalActionRequestStatus.APPROVED) {
    throw new OutboundApprovalError(
      `External action request is ${request.status}, not APPROVED`,
      "not_approved",
    );
  }
  if (
    !request.approvedPayloadHash ||
    request.approvedPayloadHash !== request.payloadHash
  ) {
    throw new OutboundApprovalError(
      "External action approval does not match its stored payload",
      "payload_mismatch",
    );
  }
  const now = input.now ?? new Date();
  if (request.expiresAt <= now) {
    throw new OutboundApprovalError(
      "External action approval has expired",
      "expired",
    );
  }

  const liveHash = await sha256CanonicalJson({
    destination: input.destination,
    operation: input.operation,
    payload: input.payload,
  });
  if (liveHash !== request.approvedPayloadHash) {
    throw new OutboundApprovalError(
      "Message changed after approval — approved payload hash no longer matches",
      "payload_mismatch",
    );
  }

  const authorization: ApprovedSendAuthorization = {
    approvedPayloadHash: request.approvedPayloadHash,
    kind: "approved",
    requestId: request.id,
  };
  mintedApprovals.add(authorization);
  return authorization;
}
