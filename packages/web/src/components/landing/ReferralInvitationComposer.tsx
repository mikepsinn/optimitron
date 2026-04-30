"use client";

import { nanoid } from "nanoid";
import { Check, Clipboard, Mail } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/retroui/Button";
import { Input } from "@/components/retroui/Input";
import { Label } from "@/components/retroui/Label";
import { Textarea } from "@/components/retroui/Textarea";
import {
  treatyInputClass,
  treatyPrimaryButtonClass,
  treatySecondaryButtonClass,
  treatyTextareaClass,
} from "@/components/landing/TreatyFlowShell";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { copyTextToClipboard } from "@/lib/clipboard";
import {
  buildReferralInvitationMessage,
  getReferralInvitationFirstName,
  type ReferralInvitationMessageFormat,
} from "@/lib/referral-invitation-copy";
import { embedShareAttemptId } from "@/lib/share-channels";
import { buildUserInviteReferralUrl, getBaseUrl } from "@/lib/url";
import {
  FLOW_VOTER_LIVES_SAVED_ROUNDED,
  FLOW_VOTER_SUFFERING_HOURS_PREVENTED,
} from "@/lib/treaty-share-flow-parameters";

interface ReferralInvitation {
  id: string;
  inviteToken: string;
  recipientEmail: string | null;
  recipientName: string;
}

export function ReferralInvitationComposer() {
  const { data: session } = useSession();
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [messageFormat, setMessageFormat] =
    useState<ReferralInvitationMessageFormat>("TASK_NOTIFICATION");
  const [invitation, setInvitation] = useState<ReferralInvitation | null>(null);
  const [message, setMessage] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [sendState, setSendState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  const senderName =
    session?.user?.name?.trim() ||
    session?.user?.username?.trim() ||
    "A voter";

  const inviteUrl = useMemo(() => {
    if (!invitation) return null;
    return buildUserInviteReferralUrl(session?.user, invitation.inviteToken, getBaseUrl());
  }, [invitation, session?.user]);

  const firstName = getReferralInvitationFirstName(
    invitation?.recipientName || recipientName,
  );

  const resetForNext = useCallback(() => {
    setRecipientName("");
    setRecipientEmail("");
    setInvitation(null);
    setMessage("");
    setCopyState("idle");
    setSendState("idle");
    setError(null);
  }, []);

  const createInvitation = useCallback(async (
    options: { messageText?: string | null } = {},
  ) => {
    const trimmedName = recipientName.trim();
    if (!trimmedName) {
      setError("Add a first name before creating an invite.");
      return null;
    }

    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/referral-invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientName: trimmedName,
          recipientEmail: recipientEmail.trim() || null,
          contactMethod: recipientEmail.trim() ? "EMAIL" : "COPY",
          messageFormat,
          messageText: options.messageText ?? null,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        invitation?: ReferralInvitation;
      };

      if (!response.ok || !payload.invitation) {
        throw new Error(payload.error || "Could not create this invitation.");
      }

      const created = payload.invitation;
      const createdUrl = buildUserInviteReferralUrl(
        session?.user,
        created.inviteToken,
        getBaseUrl(),
      );
      const createdMessage = buildReferralInvitationMessage({
        inviteUrl: createdUrl,
        messageFormat,
        recipientName: created.recipientName,
        senderName,
      });

      setInvitation(created);
      setMessage(createdMessage);
      return { invitation: created, message: createdMessage };
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create this invitation.");
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [messageFormat, recipientEmail, recipientName, senderName, session?.user]);

  const markCopied = useCallback(
    async (
      createdInvitation: ReferralInvitation,
      copiedMessage: string,
      shareAttemptId: string,
      wasEdited: boolean,
    ) => {
      try {
        await fetch("/api/referral-invitations", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: createdInvitation.id,
            action: "markCopied",
            messageText: copiedMessage,
            shareAttemptId,
            wasEdited,
          }),
        });
      } catch {
        // Copying is the user-facing action; persistence is best-effort here.
      }
    },
    [],
  );

  const handleCopy = useCallback(async () => {
    const created = invitation ? { invitation, message } : await createInvitation();
    if (!created) return;

    try {
      const shareAttemptId = nanoid();
      const createdInviteUrl = buildUserInviteReferralUrl(
        session?.user,
        created.invitation.inviteToken,
        getBaseUrl(),
      );
      const defaultMessage = buildReferralInvitationMessage({
        inviteUrl: createdInviteUrl,
        messageFormat,
        recipientName: created.invitation.recipientName,
        senderName,
      });
      const copiedMessage = embedShareAttemptId(
        created.message,
        createdInviteUrl,
        shareAttemptId,
      );
      await copyTextToClipboard(copiedMessage);
      await markCopied(
        created.invitation,
        copiedMessage,
        shareAttemptId,
        created.message !== defaultMessage,
      );
      setMessage(copiedMessage);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1600);
    } catch {
      setCopyState("error");
      window.setTimeout(() => setCopyState("idle"), 2000);
    }
  }, [createInvitation, invitation, markCopied, message, messageFormat, senderName, session?.user]);

  const handleEmailSend = useCallback(async () => {
    const trimmedEmail = recipientEmail.trim();
    if (!trimmedEmail) return;

    setSendState("sending");
    setError(null);

    try {
      let invitationId = invitation?.id ?? null;
      if (!invitationId) {
        const created = await createInvitation({ messageText: message });
        if (!created?.invitation.recipientEmail) {
          setSendState("idle");
          return;
        }
        invitationId = created.invitation.id;
      }

      const response = await fetch("/api/referral-invitations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: invitationId,
          action: "sendMessage",
          messageText: message,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        status?: string;
      };
      if (!response.ok || (payload.status !== "sent" && payload.status !== "queued")) {
        throw new Error(payload.error ?? "Could not send this invitation.");
      }
      setSendState("sent");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not send this invitation.");
      setSendState("idle");
    }
  }, [createInvitation, invitation, message, recipientEmail]);

  return (
    <section className="mb-6 overflow-hidden border border-[var(--treaty-ink)] bg-[var(--treaty-paper)] p-0 text-[var(--treaty-ink)] shadow-none">
      <div className="border-b border-[var(--treaty-ink)]/30 px-5 py-4">
        <h3 className="text-lg font-black uppercase leading-tight tracking-tight sm:text-xl">
          Assign One Earth Optimization Task
        </h3>
        <p className="mt-2 text-sm font-bold leading-6 text-[var(--treaty-ink-soft)]">
          When {firstName || "they"} completes the Earth Optimization Task: +1 lifetime of
          suffering prevented, +<ParameterValue param={FLOW_VOTER_LIVES_SAVED_ROUNDED} figures={2} /> lives saved.
        </p>
      </div>

      <div className="space-y-5 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase" htmlFor="invite-recipient-name">
              First name
            </Label>
            <Input
              id="invite-recipient-name"
              value={recipientName}
              onChange={(event) => {
                setRecipientName(event.target.value);
                setInvitation(null);
                setMessage("");
                setSendState("idle");
              }}
              placeholder="Jake"
              className={treatyInputClass}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-black uppercase" htmlFor="invite-recipient-email">
              Their email (optional)
            </Label>
            <Input
              id="invite-recipient-email"
              type="email"
              value={recipientEmail}
              onChange={(event) => {
                setRecipientEmail(event.target.value);
                setInvitation(null);
                setMessage("");
                setSendState("idle");
              }}
              placeholder="jake@example.com"
              className={treatyInputClass}
            />
          </div>
        </div>

        <div className="grid overflow-hidden border border-[var(--treaty-ink)] sm:grid-cols-2">
          <Button
            type="button"
            onClick={() => {
              setMessageFormat("TASK_NOTIFICATION");
              setInvitation(null);
              setMessage("");
              setSendState("idle");
            }}
            className={
              messageFormat === "TASK_NOTIFICATION"
                ? "min-h-12 justify-center rounded-none border-0 bg-[var(--treaty-ink)] px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-[#fffaf0] shadow-none hover:translate-x-0 hover:translate-y-0"
                : "min-h-12 justify-center rounded-none border-0 bg-transparent px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-[var(--treaty-ink)] shadow-none hover:translate-x-0 hover:translate-y-0 hover:bg-[#efe4cf]"
            }
          >
            Assign the task
          </Button>
          <Button
            type="button"
            onClick={() => {
              setMessageFormat("SINCERE");
              setInvitation(null);
              setMessage("");
              setSendState("idle");
            }}
            className={
              messageFormat === "SINCERE"
                ? "min-h-12 justify-center rounded-none border-0 border-t border-[var(--treaty-ink)] bg-[var(--treaty-ink)] px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-[#fffaf0] shadow-none hover:translate-x-0 hover:translate-y-0 sm:border-l sm:border-t-0"
                : "min-h-12 justify-center rounded-none border-0 border-t border-[var(--treaty-ink)] bg-transparent px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-[var(--treaty-ink)] shadow-none hover:translate-x-0 hover:translate-y-0 hover:bg-[#efe4cf] sm:border-l sm:border-t-0"
            }
          >
            Send the nice one
          </Button>
        </div>

        {invitation && inviteUrl ? (
          <div className="space-y-3">
            <Label className="text-xs font-black uppercase" htmlFor="invite-message">
              Message
            </Label>
            <Textarea
              id="invite-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className={`${treatyTextareaClass} min-h-56 font-mono text-sm`}
            />
            <p className="break-all text-xs font-bold text-[var(--treaty-ink-muted)]">
              Invite link: {inviteUrl}
            </p>
          </div>
        ) : null}

        {error ? (
          <p className="border border-[var(--treaty-ink)] bg-[#fffdf8] px-3 py-2 text-sm font-black">
            {error}
          </p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            onClick={() => void handleCopy()}
            disabled={isCreating}
            className={`${treatyPrimaryButtonClass} flex-1`}
          >
            {copyState === "copied" ? (
              <Check className="mr-2 h-5 w-5" aria-hidden="true" />
            ) : (
              <Clipboard className="mr-2 h-5 w-5" aria-hidden="true" />
            )}
            {copyState === "copied"
              ? "Copied"
              : copyState === "error"
                ? "Copy Failed"
                : isCreating
                  ? "Creating..."
                  : "Copy"}
          </Button>

          {recipientEmail.trim() ? (
            <Button
              type="button"
              onClick={() => void handleEmailSend()}
              disabled={isCreating || sendState === "sending" || sendState === "sent"}
              className={`${treatySecondaryButtonClass} flex-1`}
            >
              <Mail className="mr-2 h-5 w-5" aria-hidden="true" />
              <span className="min-w-0 truncate">
                {sendState === "sent"
                  ? "Sent"
                  : sendState === "sending"
                    ? "Sending..."
                    : `Send email to ${recipientEmail.trim()} for me`}
              </span>
            </Button>
          ) : null}

          {invitation ? (
            <Button
              type="button"
              onClick={resetForNext}
              className={treatySecondaryButtonClass}
            >
              One more
            </Button>
          ) : null}
        </div>

        <p className="border-t border-[var(--treaty-ink)]/20 pt-4 text-xs font-bold leading-5 text-[var(--treaty-ink-muted)]">
          Pending impact uses the current per-vote estimate:{" "}
          <ParameterValue param={FLOW_VOTER_SUFFERING_HOURS_PREVENTED} figures={4} /> hours of suffering
          prevented and <ParameterValue param={FLOW_VOTER_LIVES_SAVED_ROUNDED} figures={2} /> lives saved per
          completed Earth Optimization Task.
        </p>
      </div>
    </section>
  );
}
