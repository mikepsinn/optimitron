export type ReferralInvitationMessageFormat = "TASK_NOTIFICATION" | "SINCERE";

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
      `Here's ${recipient}'s task assignment:`,
      "",
      "⚠️ **[OVERDUE] End War and Disease**",
      "",
      "TASK: End War and Disease",
      `ASSIGNED BY: ${input.senderName || "A voter"}`,
      "STATUS: Overdue (by approximately 443 years)",
      "PRIORITY: Critical",
      "ESTIMATED TIME: 30 seconds",
      "ACTION REQUIRED: Vote on the 1% Treaty",
      "",
      "NOTE: This task was originally due several centuries ago but kept getting deprioritized in favor of building 122 apocalypses worth of nuclear weapons. Management apologizes for the delay.",
      "",
      `[ COMPLETE TASK → ${input.inviteUrl} ]`,
    ].join("\n");
  }

  return `Hi ${recipient}. I love you very much and I don't want you to get a horrible disease and die. Could you please take 30 seconds to respond to this stupid survey in order to end war and disease? ${input.inviteUrl}`;
}
