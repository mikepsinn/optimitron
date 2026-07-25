"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth-utils";
import { dispatchApprovedOutboundMessage } from "@/lib/email/outbound-message-dispatch.server";
import { setOutboundMessageGate } from "@/lib/email/outbound-gate.server";
import { decideExternalActionRequest } from "@/lib/tasks/external-action.server";

/**
 * Pull or release the outbound emergency stop.
 *
 * The point of moving this out of an env var was that an operator can flip it
 * without a redeploy, which needs a button, not a psql session.
 */
export async function setOutboundEmergencyStop(formData: FormData) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) {
    throw new Error("Admin access required");
  }

  const stopAllOutbound = String(formData.get("stopAllOutbound") ?? "") === "1";
  const allowlist = String(formData.get("allowlist") ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
  const reason = String(formData.get("reason") ?? "").trim();

  await setOutboundMessageGate({
    allowlist,
    reason: reason || null,
    stopAllOutbound,
    updatedByUserId: user.id,
  });

  revalidatePath("/admin/communications");
}

/**
 * Approve or reject one pending outbound message.
 *
 * Server actions are their own endpoint, so this re-checks the session instead
 * of trusting the admin-gated page that rendered the button. Approving
 * dispatches immediately; the dispatcher re-verifies the payload hash before
 * anything leaves.
 */
export async function decideOutboundMessage(formData: FormData) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) {
    throw new Error("Admin access required");
  }

  const externalActionRequestId = String(
    formData.get("externalActionRequestId") ?? "",
  ).trim();
  const decision = String(formData.get("decision") ?? "").trim();
  if (!externalActionRequestId) {
    throw new Error("Missing external action request id");
  }
  if (decision !== "APPROVE" && decision !== "REJECT") {
    throw new Error("Decision must be APPROVE or REJECT");
  }

  await decideExternalActionRequest(
    { decision, externalActionRequestId },
    user.id,
  );

  if (decision === "APPROVE") {
    await dispatchApprovedOutboundMessage({
      approverUserId: user.id,
      externalActionRequestId,
    });
  }

  revalidatePath("/admin/communications");
}
