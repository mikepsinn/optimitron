import {
  buildReferralInvitationMessage,
  type ReferralInvitationMessageFormat,
} from "@/lib/referral-invitation-copy";
import { buildUserInviteReferralUrl, getBaseUrl } from "@/lib/url";

export type ReferralInvitationContactMethod = "EMAIL" | "COPY" | "SMS" | "OTHER";

export interface ReferralInvitationClientRecord {
  id: string;
  inviteToken: string;
  recipientEmail: string | null;
  recipientName: string;
}

export interface ReferralInvitationUser {
  name?: string | null;
  referralCode?: string | null;
  username?: string | null;
}

export type ReferralInvitationUpdateAction =
  | "markCopied"
  | "decline"
  | "cancel"
  | "sendMessage";

interface ReferralInvitationApiPayload {
  error?: string;
  invitation?: ReferralInvitationClientRecord;
  status?: string;
}

export function getReferralInvitationSenderName(
  user: ReferralInvitationUser | null | undefined,
) {
  return user?.name?.trim() || user?.username?.trim() || "A voter";
}

export function buildReferralInvitationShareMessage(input: {
  baseUrl?: string;
  invitation: ReferralInvitationClientRecord;
  messageFormat: ReferralInvitationMessageFormat;
  senderName: string;
  user: ReferralInvitationUser | null | undefined;
}) {
  const inviteUrl = buildUserInviteReferralUrl(
    input.user,
    input.invitation.inviteToken,
    input.baseUrl ?? getBaseUrl(),
  );

  return buildReferralInvitationMessage({
    inviteUrl,
    messageFormat: input.messageFormat,
    recipientName: input.invitation.recipientName,
    senderName: input.senderName,
  });
}

async function readReferralInvitationPayload(response: Response) {
  return response.json().catch(() => ({})) as Promise<ReferralInvitationApiPayload>;
}

export async function createReferralInvitationRequest(input: {
  contactMethod?: ReferralInvitationContactMethod | null;
  messageFormat: ReferralInvitationMessageFormat;
  messageText?: string | null;
  recipientEmail?: string | null;
  recipientName: string;
  shareAttemptId?: string | null;
}, fetcher: typeof fetch = fetch) {
  const response = await fetcher("/api/referral-invitations", {
    body: JSON.stringify(input),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  const payload = await readReferralInvitationPayload(response);

  if (!response.ok || !payload.invitation) {
    throw new Error(payload.error || "Could not create this invitation.");
  }

  return payload.invitation;
}

export async function updateReferralInvitationRequest(input: {
  action: ReferralInvitationUpdateAction;
  id: string;
  messageText?: string | null;
  shareAttemptId?: string | null;
  wasEdited?: boolean;
}, fetcher: typeof fetch = fetch) {
  const response = await fetcher("/api/referral-invitations", {
    body: JSON.stringify(input),
    headers: { "Content-Type": "application/json" },
    method: "PATCH",
  });
  const payload = await readReferralInvitationPayload(response);

  if (!response.ok) {
    throw new Error(payload.error || "Could not update this invitation.");
  }

  return payload;
}
