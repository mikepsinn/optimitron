import { STATUS_QUO_QUEUE_CLEARANCE_YEARS } from "@optimitron/data/parameters";
import { formatFlowWords } from "@/lib/treaty-share-flow-parameters";

export type ReferralInvitationMessageFormat = "TASK_NOTIFICATION" | "SINCERE";

const statusQuoQueueYearsText = formatFlowWords(STATUS_QUO_QUEUE_CLEARANCE_YEARS, 3);

export function getReferralInvitationFirstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name.trim();
}

export function buildReferralInvitationMessage(input: {
  inviteUrl: string;
  messageFormat: ReferralInvitationMessageFormat;
  recipientName: string;
  senderName?: string | null;
}): string {
  const recipient = getReferralInvitationFirstName(input.recipientName) || "there";

  if (input.messageFormat === "TASK_NOTIFICATION") {
    return [
      "Overdue task: End War and Disease",
      "",
      `Assigned by: ${input.senderName || "A voter"}`,
      "Time required: 30 seconds",
      `Due: about ${statusQuoQueueYearsText} years ago`,
      "",
      "Please vote on the 1% Treaty:",
      input.inviteUrl,
    ].join("\n");
  }

  return `Hi ${recipient}. I love you very much and I don't want you to get a horrible disease and die. Could you please take 30 seconds to respond to this stupid survey in order to end war and disease? ${input.inviteUrl}`;
}
