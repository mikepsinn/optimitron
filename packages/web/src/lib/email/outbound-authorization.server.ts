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
 * Authorization values are unforgeable at runtime, not only in the type
 * system. Their factory functions register objects in a private WeakSet, and
 * the send boundary refuses hand-built lookalikes.
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

const sendAuthorizationBrand: unique symbol = Symbol("SendAuthorization");

export interface TransactionalSendAuthorization {
  readonly kind: "transactional";
  readonly reason: TransactionalSendReason;
  readonly [sendAuthorizationBrand]: true;
}

export interface OwnerSendAuthorization {
  readonly kind: "owner";
  readonly userId: string;
  readonly [sendAuthorizationBrand]: true;
}

export interface ApprovedSendAuthorization {
  readonly kind: "approved";
  /** The APPROVED ExternalActionRequest this send is executing. */
  readonly requestId: string;
  /** Hash the approver signed off on, re-verified against the live payload. */
  readonly approvedPayloadHash: string;
  readonly [sendAuthorizationBrand]: true;
}

export type SendAuthorization =
  | TransactionalSendAuthorization
  | OwnerSendAuthorization
  | ApprovedSendAuthorization;

/**
 * Objects minted by the trusted authorization functions. The WeakSet makes
 * forged literals fail the check without keeping authorizations alive.
 */
const mintedSendAuthorizations = new WeakSet<SendAuthorization>();

export function transactionalSend(
  reason: TransactionalSendReason,
): TransactionalSendAuthorization {
  const authorization: TransactionalSendAuthorization = {
    [sendAuthorizationBrand]: true,
    kind: "transactional",
    reason,
  };
  mintedSendAuthorizations.add(authorization);
  return authorization;
}

/**
 * Mint direct-send authority from the original browser request.
 *
 * Bearer credentials always resolve to the approval path, even when the same
 * request also carries a valid browser-session cookie. The session and live
 * User lookup happen here so callers cannot turn an arbitrary `userId` into
 * owner authority.
 */
export async function authorizeOwnerSend(
  request: Request,
): Promise<OwnerSendAuthorization | null> {
  const authHeader = request.headers.get("authorization")?.trim() ?? "";
  if (/^Bearer\b/iu.test(authHeader)) return null;

  // Dynamic imports avoid a module cycle through auth -> magic-link email ->
  // this authorization module. Nothing is loaded until a browser request
  // actually asks to mint owner authority.
  const [{ getServerSession }, { authOptions }] = await Promise.all([
    import("next-auth"),
    import("@/lib/auth"),
  ]);
  const session = await getServerSession(authOptions);
  const sessionUserId = session?.user?.id?.trim();
  if (!sessionUserId) return null;

  const user = await prisma.user.findFirst({
    where: { deletedAt: null, id: sessionUserId },
    select: { id: true },
  });
  if (!user) return null;

  const authorization: OwnerSendAuthorization = {
    [sendAuthorizationBrand]: true,
    kind: "owner",
    userId: user.id,
  };
  mintedSendAuthorizations.add(authorization);
  return authorization;
}

/** True when `authorization` is safe to dispatch. */
export function isGenuineSendAuthorization(
  authorization: SendAuthorization,
): boolean {
  return mintedSendAuthorizations.has(authorization);
}

export function assertGenuineSendAuthorization(
  authorization: SendAuthorization,
): void {
  if (!isGenuineSendAuthorization(authorization)) {
    throw new Error("Refusing to send: authorization was not genuinely minted");
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
  /** The exact stored provider envelope about to be dispatched. */
  payload: Record<string, unknown>;
  now?: Date;
}

/**
 * The one way to obtain an `approved` authorization.
 *
 * Re-derives the payload hash from the immutable request about to go out and
 * compares it to the hash the human approved.
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
    [sendAuthorizationBrand]: true,
    approvedPayloadHash: request.approvedPayloadHash,
    kind: "approved",
    requestId: request.id,
  };
  mintedSendAuthorizations.add(authorization);
  return authorization;
}
