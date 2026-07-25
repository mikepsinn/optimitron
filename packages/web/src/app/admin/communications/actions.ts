"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth-utils";
import { dispatchApprovedOutboundMessage } from "@/lib/email/outbound-message-dispatch.server";
import { decideExternalActionRequest } from "@/lib/tasks/external-action.server";

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
