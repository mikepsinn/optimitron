"use client";

import type { OutcomeKind, TelemetryContext, VariantSlot } from "./types";

export type ReasoningClientOutcome = {
  outcomeKind: OutcomeKind;
  slot: VariantSlot;
  variantArmId?: string | null;
  value?: number | null;
  channel?: string | null;
};

export function postReasoningOutcomes(
  ctx: TelemetryContext,
  events: readonly ReasoningClientOutcome[],
): void {
  if (events.length === 0) return;

  const body = {
    events: events.map((event) => ({
      sessionId: ctx.sessionId,
      policyDecisionId: ctx.policyDecisionId,
      variantSetId: ctx.variantSetId,
      variantArmId: event.variantArmId ?? null,
      slot: event.slot,
      outcomeKind: event.outcomeKind,
      value: event.value ?? null,
      localeKey: ctx.localeKey,
      hostKey: ctx.hostKey,
      surface: ctx.surface,
      channel: event.channel ?? null,
      organizationId: ctx.organizationId,
      audienceTag: ctx.audienceTag,
      relationshipBucket: ctx.relationshipBucket,
      referredByUserId: ctx.referredByUserId,
      isControlHoldout: ctx.isControlHoldout,
    })),
  };

  void fetch("/api/reasoning/outcomes", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => {
    // Silent by design — telemetry failures should not block the flow.
  });
}
