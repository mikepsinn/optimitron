"use server";

import { ExternalActionRequestStatus } from "@optimitron/db/enums";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth-utils";
import { OUTBOUND_MESSAGE_OPERATION } from "@/lib/email/outbound-message-approval.server";
import { dispatchApprovedOutboundMessage } from "@/lib/email/outbound-message-dispatch.server";
import { decideExternalActionRequest } from "@/lib/tasks/external-action.server";

export async function decideTaskExternalAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Sign in required");

  const externalActionRequestId = String(
    formData.get("externalActionRequestId") ?? "",
  ).trim();
  const decision = String(formData.get("decision") ?? "").trim();

  const result = await decideExternalActionRequest(
    { decision, externalActionRequestId },
    user.id,
  );

  if (
    result.status === ExternalActionRequestStatus.APPROVED &&
    result.operation === OUTBOUND_MESSAGE_OPERATION
  ) {
    await dispatchApprovedOutboundMessage({
      approverUserId: user.id,
      externalActionRequestId: result.id,
    });
  }

  revalidatePath(`/tasks/${result.taskId}`);
}
