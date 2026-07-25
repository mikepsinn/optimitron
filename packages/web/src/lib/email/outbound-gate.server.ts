/**
 * Reads the `OutboundMessageGate` row on every send. No cache: one indexed
 * single-row lookup is nothing next to the Resend round trip, and a cached
 * emergency stop is not an emergency stop.
 */
import { createLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import type { OutboundGateState } from "@/lib/email/outbound-gate";

const log = createLogger("outbound-gate");

/** The one row. */
export const OUTBOUND_MESSAGE_GATE_ID = "global";

const OPEN_GATE: OutboundGateState = { allowlist: [], stopAllOutbound: false };

/**
 * Current gate state, or `null` when the row could not be read — callers treat
 * `null` as fail-closed for everything except recipient-initiated mail.
 *
 * A missing row is not a failure: the gate is an emergency STOP, not an enable
 * switch, and agent-initiated mail is already held by the approval pipeline.
 */
export async function readOutboundMessageGate(): Promise<OutboundGateState | null> {
  try {
    const row = await prisma.outboundMessageGate.findUnique({
      where: { id: OUTBOUND_MESSAGE_GATE_ID },
      select: { allowlist: true, stopAllOutbound: true },
    });
    return row ?? OPEN_GATE;
  } catch (error) {
    log.error("Failed to read the outbound message gate", { error });
    return null;
  }
}

export async function setOutboundMessageGate(input: {
  allowlist?: string[];
  reason?: string | null;
  stopAllOutbound: boolean;
  updatedByUserId: string;
}): Promise<OutboundGateState> {
  const row = await prisma.outboundMessageGate.upsert({
    where: { id: OUTBOUND_MESSAGE_GATE_ID },
    create: {
      allowlist: input.allowlist ?? [],
      id: OUTBOUND_MESSAGE_GATE_ID,
      reason: input.reason ?? null,
      stopAllOutbound: input.stopAllOutbound,
      updatedByUserId: input.updatedByUserId,
    },
    update: {
      ...(input.allowlist ? { allowlist: input.allowlist } : {}),
      reason: input.reason ?? null,
      stopAllOutbound: input.stopAllOutbound,
      updatedByUserId: input.updatedByUserId,
    },
    select: { allowlist: true, stopAllOutbound: true },
  });
  return row;
}
