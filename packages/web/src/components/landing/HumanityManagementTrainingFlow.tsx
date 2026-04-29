"use client";

import { nanoid } from "nanoid";
import {
  ArrowRight,
  Check,
  Clipboard,
  ExternalLink,
  Mail,
  MessageCircle,
  Phone,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/retroui/Button";
import { Input } from "@/components/retroui/Input";
import { Label } from "@/components/retroui/Label";
import { Textarea } from "@/components/retroui/Textarea";
import {
  TreatyFlowButtonRow,
  TreatyFlowParagraph,
  TreatyFlowShell,
  treatyInputClass,
  treatyPrimaryButtonClass,
  treatySecondaryButtonClass,
  treatyTextareaClass,
} from "@/components/landing/TreatyFlowShell";
import { ParameterValue } from "@/components/shared/ParameterValue";
import {
  trackHumanityTrainingContactAction,
  trackHumanityTrainingMilestone,
  trackHumanityTrainingShareAction,
  trackHumanityTrainingScreenAdvanced,
} from "@/lib/analytics";
import { copyTextToClipboard } from "@/lib/clipboard";
import {
  buildReferralInvitationMessage,
  getReferralInvitationFirstName,
  type ReferralInvitationMessageFormat,
} from "@/lib/referral-invitation-copy";
import {
  buildReferralInvitationShareMessage,
  createReferralInvitationRequest,
  getReferralInvitationSenderName,
  updateReferralInvitationRequest,
  type ReferralInvitationClientRecord,
  type ReferralInvitationContactMethod,
} from "@/lib/referral-invitation-client";
import { ROUTES } from "@/lib/routes";
import {
  buildChannelHref,
  embedShareAttemptId,
  type ShareableChannel,
} from "@/lib/share-channels";
import {
  FLOW_VOTER_LIVES_SAVED_ROUNDED,
  FLOW_VOTER_SUFFERING_YEARS_PREVENTED,
} from "@/lib/treaty-share-flow-parameters";
import { buildUserInviteReferralUrl, buildUserReferralUrl, getBaseUrl } from "@/lib/url";

type TrainingScreen =
  | "promotion"
  | "share"
  | "composer"
  | "confirm"
  | "impact"
  | "complete";
type PendingManualAction = "copy" | "sms" | "call" | null;

interface TrainingReferralUser {
  name?: string | null;
  referralCode?: string | null;
  username?: string | null;
}

const primaryButtonClass = treatyPrimaryButtonClass;
const secondaryButtonClass = treatySecondaryButtonClass;

const draftInviteUrl = "warondisease.org";

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function MessageModeToggle({
  value,
  onChange,
}: {
  value: ReferralInvitationMessageFormat;
  onChange: (value: ReferralInvitationMessageFormat) => void;
}) {
  const options: Array<{ label: string; value: ReferralInvitationMessageFormat }> = [
    { label: "Love mode", value: "SINCERE" },
    { label: "Bossy mode", value: "TASK_NOTIFICATION" },
  ];

  return (
    <div
      aria-label="Message mode"
      className="grid grid-cols-2 overflow-hidden border border-[var(--treaty-ink)]"
      role="group"
    >
      {options.map((option, index) => {
        const selected = value === option.value;
        return (
          <button
            aria-pressed={selected}
            className={[
              "min-h-14 px-3 py-3 text-center text-xs font-black uppercase tracking-[0.16em] transition-colors sm:text-sm",
              index > 0 ? "border-l border-[var(--treaty-ink)]" : "",
              selected
                ? "bg-[var(--treaty-ink)] text-[#fffaf0]"
                : "bg-[var(--treaty-paper)] text-[var(--treaty-ink)] hover:bg-[#efe4cf]",
            ].join(" ")}
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function buildDraftReferralMessage(input: {
  messageFormat: ReferralInvitationMessageFormat;
  recipientName: string;
  senderName: string;
}) {
  return buildReferralInvitationMessage({
    inviteUrl: draftInviteUrl,
    messageFormat: input.messageFormat,
    recipientName: input.recipientName.trim() || "there",
    senderName: input.senderName,
  });
}

function replaceDraftInviteUrl(messageText: string, inviteUrl: string) {
  const text = messageText.trim();
  if (!text) return inviteUrl;

  const draftUrlPattern = /https?:\/\/warondisease\.org|warondisease\.org/g;
  const textWithInviteUrl = text.replace(draftUrlPattern, inviteUrl);
  if (textWithInviteUrl !== text || textWithInviteUrl.includes(inviteUrl)) {
    return textWithInviteUrl;
  }

  return `${textWithInviteUrl}\n\n${inviteUrl}`;
}

function phoneHref(kind: "sms" | "tel", rawPhone: string, body?: string) {
  const phone = rawPhone.replace(/[^\d+]/g, "");
  if (!phone) return null;
  if (kind === "tel") return `tel:${phone}`;
  return `sms:${phone}${body ? `?&body=${encodeURIComponent(body)}` : ""}`;
}

function formatCompletedCount(value: number) {
  return value === 1 ? "1 human" : `${value} humans`;
}

function formatNextHumanOrdinal(value: number) {
  if (value <= 0) return "your first";
  if (value === 1) return "your second";
  return "your next";
}

function buildTrainingReferralShareMessage(input: {
  referralUrl: string;
  senderName: string;
}) {
  return [
    `${input.senderName} voted on the 1% Treaty.`,
    "It would redirect 1% of military spending into pragmatic clinical trials and save billions of lives.",
    "Vote here:",
    input.referralUrl,
  ].join("\n");
}

function hasReferralIdentifier(
  user: TrainingReferralUser | null | undefined,
): user is TrainingReferralUser {
  return Boolean(user?.username?.trim() || user?.referralCode?.trim());
}

export function HumanityManagementTrainingFlow({
  initialCompletedContactCount = 0,
  initialShareCompleted = false,
  initialTrainingCompleted = false,
  referralUrl: initialReferralUrl,
  referralUser: initialReferralUser,
  shareReferralTaskId,
}: {
  initialCompletedContactCount?: number;
  initialShareCompleted?: boolean;
  initialTrainingCompleted?: boolean;
  referralUrl: string;
  referralUser: TrainingReferralUser;
  shareReferralTaskId?: string | null;
}) {
  const { data: session } = useSession();
  const startsComplete =
    initialTrainingCompleted ||
    (initialShareCompleted && initialCompletedContactCount >= 2);
  const [screen, setScreen] = useState<TrainingScreen>(
    startsComplete ? "complete" : "promotion",
  );
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [messageFormat, setMessageFormat] =
    useState<ReferralInvitationMessageFormat>("SINCERE");
  const [invitation, setInvitation] = useState<ReferralInvitationClientRecord | null>(null);
  const [message, setMessage] = useState("");
  const [messageEdited, setMessageEdited] = useState(false);
  const [pendingManualAction, setPendingManualAction] = useState<PendingManualAction>(null);
  const [pendingManualShareAttemptId, setPendingManualShareAttemptId] =
    useState<string | null>(null);
  const [completedInvitationIds, setCompletedInvitationIds] = useState<Set<string>>(new Set());
  const [completedCount, setCompletedCount] = useState(
    Math.min(Math.max(initialCompletedContactCount, 0), 2),
  );
  const [lastRecipientName, setLastRecipientName] = useState("");
  const [hasSharedReferralUrl, setHasSharedReferralUrl] =
    useState(initialShareCompleted);
  const [shareCopyState, setShareCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [isSharingReferralUrl, setIsSharingReferralUrl] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const referralUser = hasReferralIdentifier(session?.user)
    ? session?.user
    : initialReferralUser;
  const senderName = getReferralInvitationSenderName(referralUser);
  const baseUrl = getBaseUrl();
  const builtReferralUrl = buildUserReferralUrl(referralUser, baseUrl);
  const referralUrl = builtReferralUrl === baseUrl ? initialReferralUrl : builtReferralUrl;
  const shareMessage = buildTrainingReferralShareMessage({ referralUrl, senderName });
  const firstName = getReferralInvitationFirstName(recipientName);
  const displayName = firstName || "this human";
  const trimmedPhone = recipientPhone.trim();

  const go = useCallback((next: TrainingScreen) => {
    setScreen((previous) => {
      if (previous !== next) {
        trackHumanityTrainingScreenAdvanced({
          from: previous,
          to: next,
          completedCount,
        });
      }
      return next;
    });
  }, [completedCount]);

  const resetCurrentRecipient = useCallback(() => {
    setRecipientName("");
    setRecipientEmail("");
    setRecipientPhone("");
    setInvitation(null);
    setMessage("");
    setMessageEdited(false);
    setPendingManualAction(null);
    setPendingManualShareAttemptId(null);
    setCopyState("idle");
    setError(null);
  }, []);

  const logTrainingShareAttempt = useCallback(async (input: {
    channel: string;
    id: string;
    renderedMessage: string;
    templateBody: string | null;
    templateId: string | null;
    wasEdited: boolean;
  }) => {
    const [templateHash, renderedHash] = await Promise.all([
      input.templateBody ? sha256Hex(input.templateBody) : Promise.resolve(null),
      sha256Hex(input.renderedMessage),
    ]);
    const response = await fetch("/api/share-attempts", {
      body: JSON.stringify({
        id: input.id,
        source: "IN_APP",
        surface: "humanity_management_training",
        channel: input.channel,
        taskId: shareReferralTaskId ?? null,
        templateId: input.templateId,
        templateHash,
        templateBody: input.templateBody,
        renderedMessage: input.renderedMessage,
        renderedHash,
        wasEdited: input.wasEdited,
        context: {
          purpose: "humanity_management_training_referral_share",
        },
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    if (!response.ok) {
      throw new Error("Training could not record that share yet. Try again.");
    }
  }, [shareReferralTaskId]);

  const completeReferralShareAction = useCallback(async (input: {
    channel: ShareableChannel | "copy-link" | "copy-message";
    mode: "link" | "message";
  }) => {
    if (isSharingReferralUrl) return;

    const shareAttemptId = nanoid();
    const attributedReferralUrl = embedShareAttemptId(
      referralUrl,
      referralUrl,
      shareAttemptId,
    );
    const renderedMessage =
      input.mode === "link"
        ? attributedReferralUrl
        : embedShareAttemptId(shareMessage, referralUrl, shareAttemptId);
    const isCopyAction =
      input.channel === "copy-link" || input.channel === "copy-message";
    const href = isCopyAction
      ? null
      : buildChannelHref(input.channel as ShareableChannel, {
          message: renderedMessage,
          shareText: "Vote on the 1% Treaty",
          shareUrl: attributedReferralUrl,
          taskTitle: "Vote on the 1% Treaty",
          taskUrl: referralUrl,
        });
    const popup =
      href && input.channel !== "email" ? window.open("about:blank", "_blank") : null;
    if (popup) popup.opener = null;

    setError(null);
    setShareCopyState("idle");
    setIsSharingReferralUrl(true);

    try {
      if (isCopyAction) {
        await copyTextToClipboard(renderedMessage);
        setShareCopyState("copied");
      }

      await logTrainingShareAttempt({
        id: shareAttemptId,
        channel: input.channel,
        renderedMessage,
        templateBody: input.mode === "message" ? shareMessage : null,
        templateId: input.mode === "message" ? "humanity_management_training_referral" : null,
        wasEdited: false,
      });

      trackHumanityTrainingShareAction({
        channel: input.channel,
        completedCount,
      });
      setHasSharedReferralUrl(true);

      if (href && input.channel === "email") {
        window.location.href = href;
      } else if (href && popup) {
        popup.location.href = href;
      } else if (href) {
        window.open(href, "_blank", "noopener,noreferrer");
      }
    } catch (caught) {
      if (popup) popup.close();
      if (isCopyAction) setShareCopyState("error");
      setError(
        caught instanceof Error
          ? caught.message
          : "Training could not record that share yet. Try again.",
      );
    } finally {
      setIsSharingReferralUrl(false);
    }
  }, [
    completedCount,
    isSharingReferralUrl,
    logTrainingShareAttempt,
    referralUrl,
    shareMessage,
  ]);

  const createInvitation = useCallback(async (input: {
    contactMethod: ReferralInvitationContactMethod;
    messageText?: string | null;
  }) => {
    if (invitation) return invitation;

    const trimmedName = recipientName.trim();
    if (!trimmedName) {
      setError("First name is required.");
      return null;
    }

    setIsCreating(true);
    setError(null);

    try {
      const created = await createReferralInvitationRequest({
        contactMethod: input.contactMethod,
        messageFormat,
        messageText: input.messageText ?? null,
        recipientEmail: recipientEmail.trim() || null,
        recipientName: trimmedName,
      });
      setInvitation(created);
      return created;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create this invitation.");
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [invitation, messageFormat, recipientEmail, recipientName]);

  useEffect(() => {
    if (screen !== "composer" || invitation || messageEdited) return;
    setMessage(buildDraftReferralMessage({
      messageFormat,
      recipientName,
      senderName,
    }));
  }, [invitation, messageEdited, messageFormat, recipientName, screen, senderName]);

  useEffect(() => {
    if (screen !== "composer" || !invitation || messageEdited) return;
    setMessage(buildReferralInvitationShareMessage({
      invitation,
      messageFormat,
      senderName,
      user: referralUser,
    }));
  }, [invitation, messageEdited, messageFormat, referralUser, screen, senderName]);

  const completeCurrentInvitation = useCallback(async (
    invitationOverride?: ReferralInvitationClientRecord | null,
  ) => {
    const activeInvitation = invitationOverride ?? invitation;
    if (!activeInvitation) {
      setError("Create an invitation first.");
      return;
    }

    if (completedInvitationIds.has(activeInvitation.id)) {
      go("impact");
      return;
    }

    if (pendingManualAction) {
      const inviteUrl = buildUserInviteReferralUrl(referralUser, activeInvitation.inviteToken, getBaseUrl());
      const messageText = replaceDraftInviteUrl(message, inviteUrl);
      const shareAttemptId =
        pendingManualShareAttemptId ?? (pendingManualAction === "copy" ? undefined : nanoid());

      try {
        await updateReferralInvitationRequest({
          action: "markManualContacted",
          id: activeInvitation.id,
          messageText,
          shareAttemptId,
          wasEdited: messageEdited,
        });
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not mark this contact.");
        return;
      }
    }

    const nextCompletedCount = completedCount + 1;
    setCompletedInvitationIds((ids) => {
      const next = new Set(ids);
      next.add(activeInvitation.id);
      return next;
    });
    setLastRecipientName(getReferralInvitationFirstName(activeInvitation.recipientName));
    setCompletedCount(nextCompletedCount);
    trackHumanityTrainingContactAction({
      action: "manual_contacted",
      completedCount: nextCompletedCount,
      hasEmail: Boolean(activeInvitation.recipientEmail),
      hasPhone: Boolean(trimmedPhone),
      messageFormat,
    });
    trackHumanityTrainingMilestone({
      completedCount: nextCompletedCount,
      milestone: nextCompletedCount >= 2 ? "second_contact_completed" : "first_contact_completed",
    });
    go(nextCompletedCount >= 2 ? (hasSharedReferralUrl ? "complete" : "share") : "impact");
  }, [
    completedCount,
    completedInvitationIds,
    go,
    hasSharedReferralUrl,
    invitation,
    message,
    messageEdited,
    messageFormat,
    pendingManualAction,
    pendingManualShareAttemptId,
    referralUser,
    trimmedPhone,
  ]);

  const handleCopy = useCallback(async () => {
    const created = await createInvitation({ contactMethod: "COPY" });
    if (!created) return;

    const defaultText = buildReferralInvitationShareMessage({
      invitation: created,
      messageFormat,
      senderName,
      user: referralUser,
    });
    const inviteUrl = buildUserInviteReferralUrl(referralUser, created.inviteToken, getBaseUrl());
    const text = messageEdited ? replaceDraftInviteUrl(message, inviteUrl) : defaultText;
    const shareAttemptId = nanoid();
    const copiedText = embedShareAttemptId(text, inviteUrl, shareAttemptId);

    try {
      await copyTextToClipboard(copiedText);
      await updateReferralInvitationRequest({
        action: "markCopied",
        id: created.id,
        messageText: copiedText,
        shareAttemptId,
        wasEdited: text !== defaultText,
      });
      setMessage(copiedText);
      setMessageEdited(false);
      setCopyState("copied");
      setPendingManualAction("copy");
      setPendingManualShareAttemptId(shareAttemptId);
      trackHumanityTrainingContactAction({
        action: "copy",
        completedCount,
        hasEmail: Boolean(created.recipientEmail),
        hasPhone: Boolean(trimmedPhone),
        messageFormat,
      });
      go("confirm");
    } catch {
      setCopyState("error");
      setError("Copy failed.");
    }
  }, [completedCount, createInvitation, go, message, messageEdited, messageFormat, referralUser, senderName, trimmedPhone]);

  const handleSendEmail = useCallback(async () => {
    const trimmedEmail = recipientEmail.trim();
    if (!trimmedEmail) return;

    setIsSending(true);
    setError(null);
    try {
      const customMessage = messageEdited ? message : null;
      let invitationId = invitation?.id ?? null;
      let createdInvitation = invitation;
      if (!invitationId) {
        createdInvitation = await createInvitation({
          contactMethod: "EMAIL",
          messageText: customMessage,
        });
        if (!createdInvitation) return;
        invitationId = createdInvitation.id;
      }

      const payload = await updateReferralInvitationRequest({
        action: "sendMessage",
        id: invitationId,
        messageText: customMessage,
      });
      if (payload.status !== "sent" && payload.status !== "queued") {
        throw new Error(payload.error ?? "Could not send this invitation.");
      }
      if (payload.status === "queued") {
        setError("Email did not go out yet. Copy, text, or call to complete this outreach now.");
        return;
      }

      trackHumanityTrainingContactAction({
        action: "send_email",
        completedCount,
        hasEmail: true,
        hasPhone: Boolean(trimmedPhone),
        messageFormat,
      });
      await completeCurrentInvitation(createdInvitation);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not send this invitation.");
    } finally {
      setIsSending(false);
    }
  }, [
    completeCurrentInvitation,
    completedCount,
    createInvitation,
    invitation,
    message,
    messageEdited,
    messageFormat,
    recipientEmail,
    trimmedPhone,
  ]);

  const handleSms = useCallback(async () => {
    const created = await createInvitation({ contactMethod: "SMS" });
    if (!created) return;

    const inviteUrl = buildUserInviteReferralUrl(referralUser, created.inviteToken, getBaseUrl());
    const shareAttemptId = nanoid();
    const text = embedShareAttemptId(
      replaceDraftInviteUrl(message, inviteUrl),
      inviteUrl,
      shareAttemptId,
    );
    const href = phoneHref("sms", recipientPhone, text);

    setMessage(text);
    setMessageEdited(false);
    setPendingManualAction("sms");
    setPendingManualShareAttemptId(shareAttemptId);
    trackHumanityTrainingContactAction({
      action: "sms",
      completedCount,
      hasEmail: Boolean(created.recipientEmail),
      hasPhone: Boolean(href),
      messageFormat,
    });
    go("confirm");
    if (href) {
      window.location.href = href;
    }
  }, [completedCount, createInvitation, go, message, messageFormat, recipientPhone, referralUser]);

  const handleCall = useCallback(async () => {
    const created = await createInvitation({ contactMethod: "OTHER" });
    if (!created) return;

    const href = phoneHref("tel", recipientPhone);
    setPendingManualAction("call");
    setPendingManualShareAttemptId(nanoid());
    trackHumanityTrainingContactAction({
      action: "call",
      completedCount,
      hasEmail: Boolean(created.recipientEmail),
      hasPhone: Boolean(href),
      messageFormat,
    });
    go("confirm");
    if (href) {
      window.location.href = href;
    }
  }, [completedCount, createInvitation, go, messageFormat, recipientPhone]);

  const goDashboard = useCallback(() => {
    trackHumanityTrainingMilestone({
      completedCount,
      milestone: "dashboard_exit",
    });
    window.location.href = ROUTES.dashboard;
  }, [completedCount]);

  const renderScreen = () => {
    switch (screen) {
      case "promotion":
        return (
          <>
            <div className="space-y-6">
              <p className="text-center text-xs font-black uppercase tracking-[0.24em] text-[var(--treaty-ink-muted)]">
                Humanity Management Training
              </p>
              <h1 className="text-center text-3xl font-black uppercase leading-tight text-[var(--treaty-ink)] sm:text-5xl">
                You are now a Humanity Manager
              </h1>
              <TreatyFlowParagraph>
                Earth Optimization Services, LLC has assigned you one tiny
                management task: get two humans to vote on the 1% Treaty.
              </TreatyFlowParagraph>
              <div className="border-y border-[var(--treaty-ink)]/30 py-5 text-center text-lg font-black leading-8 text-[var(--treaty-ink)] sm:text-left">
                <p>
                  Your vote: <ParameterValue param={FLOW_VOTER_SUFFERING_YEARS_PREVENTED} figures={2} /> years of suffering prevented.
                </p>
                <p>
                  Your vote: <ParameterValue param={FLOW_VOTER_LIVES_SAVED_ROUNDED} figures={2} /> lives saved.
                </p>
              </div>
              <TreatyFlowParagraph>
                Training objective: share your referral URL, then give two
                humans their voting tasks. Start with the easiest yes.
              </TreatyFlowParagraph>
            </div>
            <Button
              className={primaryButtonClass}
              onClick={() => go(hasSharedReferralUrl ? "composer" : "share")}
            >
              Start training
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Button>
          </>
        );

      case "share":
        return (
          <>
            <div className="space-y-5">
              <p className="text-center text-xs font-black uppercase tracking-[0.22em] text-[var(--treaty-ink-muted)]">
                First task: public signal
              </p>
              <TreatyFlowParagraph>
                Share your referral URL first. It is the lowest-effort way to
                start the lineage before you make two direct asks.
              </TreatyFlowParagraph>
              <p className="break-all border border-[var(--treaty-ink)] bg-[#fffdf8] px-3 py-3 text-sm font-bold leading-6 text-[var(--treaty-ink)]">
                {referralUrl}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                className={primaryButtonClass}
                disabled={isSharingReferralUrl}
                onClick={() => void completeReferralShareAction({
                  channel: "copy-link",
                  mode: "link",
                })}
              >
                <Clipboard className="h-5 w-5" aria-hidden="true" />
                {isSharingReferralUrl
                  ? "Recording..."
                  : shareCopyState === "copied"
                    ? "Copied"
                    : "Copy URL"}
              </Button>
              <Button
                className={secondaryButtonClass}
                disabled={isSharingReferralUrl}
                onClick={() => void completeReferralShareAction({
                  channel: "copy-message",
                  mode: "message",
                })}
              >
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
                Copy message
              </Button>
              <Button
                className={secondaryButtonClass}
                disabled={isSharingReferralUrl}
                onClick={() => void completeReferralShareAction({
                  channel: "x",
                  mode: "message",
                })}
              >
                <ExternalLink className="h-5 w-5" aria-hidden="true" />
                Post on X
              </Button>
              <Button
                className={secondaryButtonClass}
                disabled={isSharingReferralUrl}
                onClick={() => void completeReferralShareAction({
                  channel: "linkedin",
                  mode: "message",
                })}
              >
                <ExternalLink className="h-5 w-5" aria-hidden="true" />
                LinkedIn
              </Button>
            </div>
            <TreatyFlowButtonRow>
              <Button
                className={primaryButtonClass}
                disabled={!hasSharedReferralUrl}
                onClick={() => go(completedCount >= 2 ? "complete" : "composer")}
              >
                Continue
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Button>
            </TreatyFlowButtonRow>
            {shareCopyState === "error" ? (
              <p className="border border-[var(--treaty-ink)] bg-[#fffdf8] px-3 py-2 text-sm font-black text-[var(--treaty-ink)]">
                Copy failed.
              </p>
            ) : null}
          </>
        );

      case "composer":
        return (
          <>
            <div className="space-y-5">
              <p className="text-center text-xs font-black uppercase tracking-[0.22em] text-[var(--treaty-ink-muted)]">
                {formatCompletedCount(completedCount)} assigned. Goal: 2 voting tasks.
              </p>
              <TreatyFlowParagraph>
                Give {formatNextHumanOrdinal(completedCount)} human their treaty voting task.
              </TreatyFlowParagraph>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase" htmlFor="training-recipient-name">
                    To
                  </Label>
                  <Input
                    id="training-recipient-name"
                    value={recipientName}
                    onChange={(event) => {
                      setRecipientName(event.target.value);
                      setInvitation(null);
                      setMessage("");
                      setMessageEdited(false);
                      setError(null);
                    }}
                    placeholder="First name"
                    className={treatyInputClass}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase" htmlFor="training-recipient-email">
                    Email optional
                  </Label>
                  <Input
                    id="training-recipient-email"
                    value={recipientEmail}
                    onChange={(event) => {
                      setRecipientEmail(event.target.value);
                      setInvitation(null);
                      setError(null);
                    }}
                    placeholder="jake@example.com"
                    className={treatyInputClass}
                    type="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase" htmlFor="training-recipient-phone">
                    Phone optional
                  </Label>
                  <Input
                    id="training-recipient-phone"
                    value={recipientPhone}
                    onChange={(event) => setRecipientPhone(event.target.value)}
                    placeholder="+1 555 123 4567"
                    className={treatyInputClass}
                    type="tel"
                  />
                </div>
              </div>
              <MessageModeToggle
                value={messageFormat}
                onChange={(nextFormat) => {
                  if (nextFormat === messageFormat) return;
                  setMessageFormat(nextFormat);
                  setInvitation(null);
                  setMessage("");
                  setMessageEdited(false);
                  setError(null);
                }}
              />
              <Textarea
                value={message}
                onChange={(event) => {
                  setMessage(event.target.value);
                  setMessageEdited(true);
                }}
                className={`${treatyTextareaClass} min-h-56 font-mono text-sm`}
                disabled={isCreating}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                className={primaryButtonClass}
                onClick={() => void handleCopy()}
                disabled={isCreating || recipientName.trim() === ""}
              >
                <Clipboard className="h-5 w-5" aria-hidden="true" />
                {copyState === "copied" ? "Copied" : "Copy"}
              </Button>
              <Button
                className={secondaryButtonClass}
                onClick={() => void handleSms()}
                disabled={isCreating || recipientName.trim() === "" || trimmedPhone === ""}
              >
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
                Text
              </Button>
              <Button
                className={secondaryButtonClass}
                onClick={() => void handleCall()}
                disabled={isCreating || recipientName.trim() === "" || trimmedPhone === ""}
              >
                <Phone className="h-5 w-5" aria-hidden="true" />
                Call
              </Button>
              {recipientEmail.trim() ? (
                <Button
                  className={secondaryButtonClass}
                  onClick={() => void handleSendEmail()}
                  disabled={isCreating || isSending || recipientName.trim() === ""}
                >
                  <Mail className="h-5 w-5" aria-hidden="true" />
                  <span className="min-w-0 truncate">
                    {isSending ? "Sending..." : "Send email"}
                  </span>
                </Button>
              ) : null}
            </div>
          </>
        );

      case "confirm":
        return (
          <>
            <div className="space-y-4">
              <TreatyFlowParagraph>
                {pendingManualAction === "call"
                  ? `Call ${displayName}. Use the message as your script if your brain politely blanks.`
                  : `Send it to ${displayName}, then come back here when it is actually sent.`}
              </TreatyFlowParagraph>
              <p className="border-y border-[var(--treaty-ink)]/30 py-4 text-center text-sm font-bold leading-7 text-[var(--treaty-ink-soft)] sm:text-left">
                One completed assignment creates a private Earth optimization
                task for this person and lets your dashboard track whether they vote.
              </p>
            </div>
            <TreatyFlowButtonRow>
              <Button className={secondaryButtonClass} onClick={() => go("composer")}>
                Edit
              </Button>
              <Button className={primaryButtonClass} onClick={() => void completeCurrentInvitation()}>
                <Check className="h-5 w-5" aria-hidden="true" />
                I contacted them
              </Button>
            </TreatyFlowButtonRow>
          </>
        );

      case "impact":
        return (
          <>
            <div className="space-y-4">
              <p className="text-center text-xs font-black uppercase tracking-[0.22em] text-[var(--treaty-ink-muted)]">
                Training progress: {formatCompletedCount(completedCount)} assigned
              </p>
              <TreatyFlowParagraph>
                {lastRecipientName || "That human"} added to your direct
                reports. When they vote: +<ParameterValue param={FLOW_VOTER_SUFFERING_YEARS_PREVENTED} figures={2} /> years of suffering prevented, +<ParameterValue param={FLOW_VOTER_LIVES_SAVED_ROUNDED} figures={2} /> lives saved.
              </TreatyFlowParagraph>
            </div>
            <TreatyFlowButtonRow>
              <Button
                className={primaryButtonClass}
                onClick={() => {
                  resetCurrentRecipient();
                  go("composer");
                }}
              >
                Assign second human
              </Button>
            </TreatyFlowButtonRow>
          </>
        );

      case "complete":
        return (
          <>
            <div className="space-y-4">
              <p className="text-center text-xs font-black uppercase tracking-[0.22em] text-[var(--treaty-ink-muted)]">
                Humanity Management Training complete
              </p>
              <TreatyFlowParagraph>
                Two humans assigned. If they vote, they get the same pleasant
                management surprise.
              </TreatyFlowParagraph>
              <TreatyFlowParagraph>
                Your dashboard tracks who voted, who is pending, and who needs
                another nudge.
              </TreatyFlowParagraph>
            </div>
            <TreatyFlowButtonRow>
              <Button
                className={secondaryButtonClass}
                onClick={() => {
                  resetCurrentRecipient();
                  go("composer");
                }}
              >
                Assign another human
              </Button>
              <Button className={primaryButtonClass} onClick={goDashboard}>
                Open dashboard
              </Button>
            </TreatyFlowButtonRow>
          </>
        );
    }
  };

  return (
    <TreatyFlowShell
      data-screen={screen}
      data-testid="humanity-management-training-flow"
      contentClassName="max-w-3xl"
    >
      <div className="space-y-6 p-5">
        {renderScreen()}
        {error ? (
          <p className="border border-[var(--treaty-ink)] bg-[#fffdf8] px-3 py-2 text-sm font-black text-[var(--treaty-ink)]">
            {error}
          </p>
        ) : null}
      </div>
    </TreatyFlowShell>
  );
}
