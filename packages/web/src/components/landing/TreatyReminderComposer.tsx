"use client";

import { nanoid } from "nanoid";
import { Mail, MessageCircle, Send, Smartphone } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Card } from "@/components/retroui/Card";
import { Button } from "@/components/retroui/Button";
import { Input } from "@/components/retroui/Input";
import { Label } from "@/components/retroui/Label";
import { getGovernmentLeader } from "@optimitron/data";
import { buildTaskShareTokens } from "@/lib/tasks/accountability";
import { getTreatyLevelCostOfDelay } from "@/lib/tasks/delay-attribution";
import {
  getUsableShareTemplates,
  pickDefaultShareTemplateId,
} from "@/lib/tasks/share-templates";
import { renderTemplate } from "@/lib/tasks/render-template";
import { ReminderComposer } from "@/components/tasks/task-row-share";
import { getCountryFromLocale } from "@/lib/detect-country";
import { copyTextToClipboard } from "@/lib/clipboard";
import {
  buildChannelHref,
  embedShareAttemptId,
  type ShareableChannel,
} from "@/lib/share-channels";
import {
  buildUserInviteReferralUrl,
  buildUserReferralUrl,
  getBaseUrl,
} from "@/lib/url";
import {
  createReferralInvitationRequest,
  updateReferralInvitationRequest,
  type ReferralInvitationContactMethod,
  type ReferralInvitationClientRecord,
} from "@/lib/referral-invitation-client";
import { insertGeneratedReferralInviteUrl } from "@/lib/referral-invitation-message-url";
import {
  getReferralInvitationFirstName,
  type ReferralInvitationMessageFormat,
} from "@/lib/referral-invitation-copy";

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const TREATY_DUE_AT = new Date("2026-04-14T00:00:00.000Z");
const DAY_MS = 1000 * 60 * 60 * 24;

type TreatyReminderRecipientMode = "president" | "humanity" | "one_human";
type OneHumanDirectChannel = "email-app" | "sms" | "telegram" | "whatsapp";
type CopyState = "idle" | "copied" | "error";
type SendState = "idle" | "sending" | "sent";

interface TreatyReminderComposerProps {
  cardClassName?: string;
  defaultCowardMode?: boolean;
  defaultRecipientMode?: TreatyReminderRecipientMode;
  surface?: string;
}

function getInvitationMessageFormat(
  templateId: string | null,
): ReferralInvitationMessageFormat {
  return templateId === "sincere" ? "SINCERE" : "TASK_NOTIFICATION";
}

function recipientModeLabel(mode: TreatyReminderRecipientMode) {
  switch (mode) {
    case "president":
      return "President";
    case "humanity":
      return "Humanity";
    case "one_human":
      return "One human";
  }
}

export function TreatyReminderComposer({
  cardClassName,
  defaultCowardMode = false,
  defaultRecipientMode,
  // Kept as "post_vote_reminders" for analytics continuity — historical
  // share-attempts records use this surface value. The component renamed
  // from PostVoteReminders → TreatyReminderComposer; the surface did not.
  surface = "post_vote_reminders",
}: TreatyReminderComposerProps = {}) {
  const { data: session } = useSession();
  const initialRecipientMode =
    defaultRecipientMode ?? (defaultCowardMode ? "humanity" : "president");
  const [recipientMode, setRecipientMode] =
    useState<TreatyReminderRecipientMode>(initialRecipientMode);
  const [messageCopyState, setMessageCopyState] = useState<CopyState>("idle");
  const [message, setMessage] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [invitation, setInvitation] =
    useState<ReferralInvitationClientRecord | null>(null);
  const [isCreatingInvitation, setIsCreatingInvitation] = useState(false);
  const [directChannelState, setDirectChannelState] =
    useState<OneHumanDirectChannel | null>(null);
  const [sendState, setSendState] = useState<SendState>("idle");
  const [error, setError] = useState<string | null>(null);

  const countryCode =
    session?.user?.countryCode || getCountryFromLocale() || "US";

  const baseUrl = getBaseUrl();
  const referralUrl = session?.user
    ? buildUserReferralUrl(session.user, baseUrl)
    : baseUrl;
  const delayDays = useMemo(
    () => Math.max(0, Math.ceil((Date.now() - TREATY_DUE_AT.getTime()) / DAY_MS)),
    [],
  );

  const recipientFirstName = getReferralInvitationFirstName(recipientName);
  const oneHumanTargetName = recipientFirstName || "there";
  const trimmedRecipientName = recipientName.trim();
  const trimmedRecipientEmail = recipientEmail.trim();

  const inviteUrl = useMemo(() => {
    if (!invitation) return null;
    return buildUserInviteReferralUrl(session?.user, invitation.inviteToken, baseUrl);
  }, [baseUrl, invitation, session?.user]);

  const { leaderTemplates, leaderTokenBag, leaderName } = useMemo(() => {
    const leader = getGovernmentLeader(countryCode);
    const targetLabel = leader?.leaderName ?? "Your Government";
    const tokens = buildTaskShareTokens({
      targetLabel,
      taskTitle: "Sign the 1% Treaty",
      currentDelayDays: delayDays,
      currentEconomicValueUsdLost: null,
      currentHumanLivesLost: null,
      countryCode,
      militaryBudgetUsdPerYear: leader?.militaryBudgetUsd ?? null,
      governmentBudgetUsdPerYear: leader?.governmentBudgetUsd ?? null,
      leaderHandle: null,
      citizenName: session?.user?.name || "A citizen",
      treatyUrl: referralUrl,
    });
    return {
      leaderTemplates: getUsableShareTemplates(tokens, "leader"),
      leaderTokenBag: tokens,
      leaderName: targetLabel,
    };
  }, [countryCode, delayDays, referralUrl, session?.user?.name]);

  const { humanityTemplates, humanityTokenBag } = useMemo(() => {
    const delay = getTreatyLevelCostOfDelay(delayDays);
    const tokens = buildTaskShareTokens({
      targetLabel: "humanity",
      taskTitle: "Sign the 1% Treaty",
      currentDelayDays: delayDays,
      currentEconomicValueUsdLost: delay?.wastedUsd ?? null,
      currentHumanLivesLost: delay?.deathsFromDelay ?? null,
      currentSufferingHoursLost: null,
      citizenName: session?.user?.name || "A citizen",
      treatyUrl: referralUrl,
    });
    return {
      humanityTemplates: getUsableShareTemplates(tokens, "humanity"),
      humanityTokenBag: tokens,
    };
  }, [delayDays, referralUrl, session?.user?.name]);

  const { oneHumanTemplates, oneHumanTokenBag } = useMemo(() => {
    const delay = getTreatyLevelCostOfDelay(delayDays);
    const tokens = buildTaskShareTokens({
      targetLabel: oneHumanTargetName,
      taskTitle: "Sign the 1% Treaty",
      currentDelayDays: delayDays,
      currentEconomicValueUsdLost: delay?.wastedUsd ?? null,
      currentHumanLivesLost: delay?.deathsFromDelay ?? null,
      currentSufferingHoursLost: null,
      citizenName: session?.user?.name || "A citizen",
      treatyUrl: referralUrl,
    });
    return {
      oneHumanTemplates: getUsableShareTemplates(tokens, "one_human"),
      oneHumanTokenBag: tokens,
    };
  }, [delayDays, oneHumanTargetName, referralUrl, session?.user?.name]);

  const [selectedLeaderTemplateId, setSelectedLeaderTemplateId] = useState<string | null>(
    () => pickDefaultShareTemplateId(leaderTemplates, "leader"),
  );
  const [selectedHumanityTemplateId, setSelectedHumanityTemplateId] = useState<string | null>(
    () => pickDefaultShareTemplateId(humanityTemplates, "humanity"),
  );
  const [selectedOneHumanTemplateId, setSelectedOneHumanTemplateId] = useState<string | null>(
    () => pickDefaultShareTemplateId(oneHumanTemplates, "one_human"),
  );

  useEffect(() => {
    if (leaderTemplates.length === 0) {
      setSelectedLeaderTemplateId(null);
      return;
    }
    if (
      selectedLeaderTemplateId == null ||
      !leaderTemplates.some((template) => template.id === selectedLeaderTemplateId)
    ) {
      setSelectedLeaderTemplateId(pickDefaultShareTemplateId(leaderTemplates, "leader"));
    }
  }, [leaderTemplates, selectedLeaderTemplateId]);

  useEffect(() => {
    if (humanityTemplates.length === 0) {
      setSelectedHumanityTemplateId(null);
      return;
    }
    if (
      selectedHumanityTemplateId == null ||
      !humanityTemplates.some((template) => template.id === selectedHumanityTemplateId)
    ) {
      setSelectedHumanityTemplateId(
        pickDefaultShareTemplateId(humanityTemplates, "humanity"),
      );
    }
  }, [humanityTemplates, selectedHumanityTemplateId]);

  useEffect(() => {
    if (oneHumanTemplates.length === 0) {
      setSelectedOneHumanTemplateId(null);
      return;
    }
    if (
      selectedOneHumanTemplateId == null ||
      !oneHumanTemplates.some((template) => template.id === selectedOneHumanTemplateId)
    ) {
      setSelectedOneHumanTemplateId(
        pickDefaultShareTemplateId(oneHumanTemplates, "one_human"),
      );
    }
  }, [oneHumanTemplates, selectedOneHumanTemplateId]);

  const templates =
    recipientMode === "president"
      ? leaderTemplates
      : recipientMode === "humanity"
        ? humanityTemplates
        : oneHumanTemplates;
  const tokenBag =
    recipientMode === "president"
      ? leaderTokenBag
      : recipientMode === "humanity"
        ? humanityTokenBag
        : oneHumanTokenBag;
  const selectedTemplateId =
    recipientMode === "president"
      ? selectedLeaderTemplateId
      : recipientMode === "humanity"
        ? selectedHumanityTemplateId
        : selectedOneHumanTemplateId;
  const setSelectedTemplateId =
    recipientMode === "president"
      ? setSelectedLeaderTemplateId
      : recipientMode === "humanity"
        ? setSelectedHumanityTemplateId
        : setSelectedOneHumanTemplateId;
  const targetLabel =
    recipientMode === "president"
      ? leaderName
      : recipientMode === "humanity"
        ? "Humanity"
        : recipientFirstName || "One human";

  const logShareAttempt = useCallback(
    async (input: {
      id: string;
      channel: string;
      renderedMessage: string;
      wasEdited: boolean;
      templateBody: string | null;
      templateId: string | null;
    }) => {
      try {
        const [templateHash, renderedHash] = await Promise.all([
          input.templateBody ? sha256Hex(input.templateBody) : Promise.resolve(null),
          sha256Hex(input.renderedMessage),
        ]);
        await fetch("/api/share-attempts", {
          body: JSON.stringify({
            id: input.id,
            source: "IN_APP",
            surface,
            channel: input.channel,
            templateId: input.templateId,
            templateHash,
            templateBody: input.templateBody,
            renderedMessage: input.renderedMessage,
            renderedHash,
            wasEdited: input.wasEdited,
            context: {
              countryCode,
              cowardMode: recipientMode === "humanity",
              recipientMode,
              targetLabel,
            },
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });
      } catch {
        // best-effort
      }
    },
    [countryCode, recipientMode, surface, targetLabel],
  );

  const initialMessage = useMemo(() => {
    if (!selectedTemplateId) {
      return "";
    }
    const template = templates.find((entry) => entry.id === selectedTemplateId);
    if (!template) {
      return "";
    }
    return renderTemplate(template.body, tokenBag);
  }, [selectedTemplateId, templates, tokenBag]);

  useEffect(() => {
    setMessage(initialMessage);
    setMessageCopyState("idle");
    setDirectChannelState(null);
    setSendState("idle");
    setError(null);
  }, [initialMessage]);

  const resetInvitationState = useCallback(() => {
    setInvitation(null);
    setMessageCopyState("idle");
    setDirectChannelState(null);
    setSendState("idle");
    setError(null);
  }, []);

  const createOneHumanInvitation = useCallback(async (
    options: {
      contactMethod?: ReferralInvitationContactMethod | null;
      messageText?: string | null;
    } = {},
  ) => {
    const name = trimmedRecipientName;
    if (!name) {
      setError("Add a name before assigning the task.");
      return null;
    }

    setIsCreatingInvitation(true);
    setError(null);
    try {
      const created = await createReferralInvitationRequest({
        contactMethod:
          options.contactMethod ??
          (trimmedRecipientEmail ? "EMAIL" : "COPY"),
        messageFormat: getInvitationMessageFormat(selectedOneHumanTemplateId),
        messageText: options.messageText ?? null,
        recipientEmail: trimmedRecipientEmail || null,
        recipientName: name,
      });
      setInvitation(created);
      return created;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create this task.");
      return null;
    } finally {
      setIsCreatingInvitation(false);
    }
  }, [selectedOneHumanTemplateId, trimmedRecipientEmail, trimmedRecipientName]);

  const buildOneHumanOutboundMessage = useCallback(async (
    options: {
      contactMethod?: ReferralInvitationContactMethod | null;
    } = {},
  ) => {
    const created =
      invitation ??
      await createOneHumanInvitation({
        contactMethod: options.contactMethod,
        messageText: message,
      });
    if (!created) return null;

    const createdInviteUrl = buildUserInviteReferralUrl(
      session?.user,
      created.inviteToken,
      baseUrl,
    );
    const shareAttemptId = nanoid();
    const outboundMessage = embedShareAttemptId(
      insertGeneratedReferralInviteUrl(message, createdInviteUrl, {
        draftReferralUrl: referralUrl,
      }),
      createdInviteUrl,
      shareAttemptId,
    );
    const attributedInviteUrl = embedShareAttemptId(
      createdInviteUrl,
      createdInviteUrl,
      shareAttemptId,
    );

    return {
      attributedInviteUrl,
      created,
      createdInviteUrl,
      outboundMessage,
      shareAttemptId,
    };
  }, [
    baseUrl,
    createOneHumanInvitation,
    invitation,
    message,
    referralUrl,
    session?.user,
  ]);

  const handleOneHumanCopy = useCallback(async () => {
    const outbound = await buildOneHumanOutboundMessage();
    if (!outbound) return;

    try {
      await copyTextToClipboard(outbound.outboundMessage);
      await updateReferralInvitationRequest({
        action: "markCopied",
        id: outbound.created.id,
        messageText: outbound.outboundMessage,
        shareAttemptId: outbound.shareAttemptId,
        shareChannel: "copy-message",
        wasEdited: message !== initialMessage,
      });
      setInvitation(outbound.created);
      setMessage(outbound.outboundMessage);
      setMessageCopyState("copied");
      window.setTimeout(() => setMessageCopyState("idle"), 1500);
    } catch {
      setMessageCopyState("error");
      window.setTimeout(() => setMessageCopyState("idle"), 2000);
    }
  }, [
    buildOneHumanOutboundMessage,
    initialMessage,
    message,
  ]);

  const handleOneHumanDirectShare = useCallback(async (
    channel: OneHumanDirectChannel,
  ) => {
    const contactMethod: ReferralInvitationContactMethod =
      channel === "sms"
        ? "SMS"
        : channel === "email-app" && trimmedRecipientEmail
          ? "EMAIL"
          : "OTHER";

    setDirectChannelState(channel);
    setError(null);
    try {
      const outbound = await buildOneHumanOutboundMessage({ contactMethod });
      if (!outbound) return;

      await updateReferralInvitationRequest({
        action: "markCopied",
        id: outbound.created.id,
        messageText: outbound.outboundMessage,
        shareAttemptId: outbound.shareAttemptId,
        shareChannel: channel,
        wasEdited: message !== initialMessage,
      });

      setInvitation(outbound.created);
      setMessage(outbound.outboundMessage);
      setMessageCopyState("copied");
      window.setTimeout(() => setMessageCopyState("idle"), 1500);

      const href = buildChannelHref(channel === "email-app" ? "email" : channel, {
        message: outbound.outboundMessage,
        recipientEmail: channel === "email-app" ? trimmedRecipientEmail || null : null,
        shareText: "Sign the 1% Treaty",
        shareUrl: outbound.attributedInviteUrl,
        taskUrl: outbound.createdInviteUrl,
        taskTitle: "Sign the 1% Treaty",
      });

      if (channel === "sms" || channel === "email-app") {
        window.location.href = href;
        return;
      }
      window.open(href, "_blank", "noopener,noreferrer");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not open that app.");
    } finally {
      setDirectChannelState(null);
    }
  }, [
    buildOneHumanOutboundMessage,
    initialMessage,
    message,
    trimmedRecipientEmail,
  ]);

  const handleOneHumanEmailSend = useCallback(async () => {
    if (!trimmedRecipientEmail) return;

    setSendState("sending");
    setError(null);
    try {
      let invitationId = invitation?.id ?? null;
      if (!invitationId) {
        const created = await createOneHumanInvitation({ messageText: message });
        if (!created?.recipientEmail) {
          setSendState("idle");
          return;
        }
        invitationId = created.id;
      }

      const payload = await updateReferralInvitationRequest({
        action: "sendMessage",
        id: invitationId,
        messageText: message,
      });
      if (payload.status !== "sent" && payload.status !== "queued") {
        throw new Error(payload.error ?? "Could not send this task.");
      }
      if (payload.status === "queued") {
        setError("Email did not go out yet. Copy it and send it manually.");
        setSendState("idle");
        return;
      }
      setSendState("sent");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not send this task.");
      setSendState("idle");
    }
  }, [
    createOneHumanInvitation,
    invitation,
    message,
    trimmedRecipientEmail,
  ]);

  const handleCopyMessage = useCallback(() => {
    if (recipientMode === "one_human") {
      void handleOneHumanCopy();
      return;
    }

    const shareAttemptId = nanoid();
    const wasEdited = message !== initialMessage;
    const outboundMessage = embedShareAttemptId(message, referralUrl, shareAttemptId);
    const selectedTemplate = selectedTemplateId
      ? templates.find((template) => template.id === selectedTemplateId) ?? null
      : null;

    void logShareAttempt({
      id: shareAttemptId,
      channel: "copy-message",
      renderedMessage: outboundMessage,
      wasEdited,
      templateBody: selectedTemplate?.body ?? null,
      templateId: selectedTemplate?.id ?? null,
    });

    void copyTextToClipboard(outboundMessage)
      .then(() => {
        setMessageCopyState("copied");
        window.setTimeout(() => setMessageCopyState("idle"), 1500);
      })
      .catch(() => {
        setMessageCopyState("error");
        window.setTimeout(() => setMessageCopyState("idle"), 2000);
      });
  }, [
    handleOneHumanCopy,
    initialMessage,
    logShareAttempt,
    message,
    recipientMode,
    referralUrl,
    selectedTemplateId,
    templates,
  ]);

  const handleChannel = useCallback(
    (channel: string) => {
      if (recipientMode === "one_human") return;

      if (channel === "copy-link") {
        const shareAttemptId = nanoid();
        const attributedReferralUrl = embedShareAttemptId(referralUrl, referralUrl, shareAttemptId);

        void logShareAttempt({
          id: shareAttemptId,
          channel: "copy-link",
          renderedMessage: attributedReferralUrl,
          wasEdited: false,
          templateBody: null,
          templateId: null,
        });

        void copyTextToClipboard(attributedReferralUrl);
        return;
      }

      const shareAttemptId = nanoid();
      const wasEdited = message !== initialMessage;
      const attributedReferralUrl = embedShareAttemptId(referralUrl, referralUrl, shareAttemptId);
      const outboundMessage = embedShareAttemptId(message, referralUrl, shareAttemptId);
      const selectedTemplate = selectedTemplateId
        ? templates.find((template) => template.id === selectedTemplateId) ?? null
        : null;

      void logShareAttempt({
        id: shareAttemptId,
        channel,
        renderedMessage: outboundMessage,
        wasEdited,
        templateBody: selectedTemplate?.body ?? null,
        templateId: selectedTemplate?.id ?? null,
      });

      const href = buildChannelHref(channel as ShareableChannel, {
        message: outboundMessage,
        shareText: "Sign the 1% Treaty",
        shareUrl: attributedReferralUrl,
        taskUrl: referralUrl,
        taskTitle: "Sign the 1% Treaty",
      });
      if (channel === "email") {
        window.location.href = href;
        return;
      }
      window.open(href, "_blank", "noopener,noreferrer");
    },
    [
      initialMessage,
      logShareAttempt,
      message,
      recipientMode,
      referralUrl,
      selectedTemplateId,
      templates,
    ],
  );

  const recipientSelector = (
    <div className="space-y-3">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-foreground">
        Step 1. Select recipient
      </p>
      <div className="grid overflow-hidden border-2 border-foreground sm:grid-cols-3">
        {(["president", "humanity", "one_human"] as const).map((mode, index) => {
          const selected = recipientMode === mode;
          return (
            <button
              key={mode}
              type="button"
              aria-pressed={selected}
              className={[
                "min-h-11 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] transition-colors",
                index > 0 ? "border-t-2 border-foreground sm:border-l-2 sm:border-t-0" : "",
                selected
                  ? "bg-foreground text-background"
                  : "bg-background text-foreground hover:bg-muted",
              ].join(" ")}
              onClick={() => {
                setRecipientMode(mode);
                setMessageCopyState("idle");
                setDirectChannelState(null);
                setSendState("idle");
                setError(null);
              }}
            >
              {recipientModeLabel(mode)}
            </button>
          );
        })}
      </div>

      {recipientMode === "one_human" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-[0.14em]" htmlFor="treaty-reminder-recipient-name">
              Name
            </Label>
            <Input
              id="treaty-reminder-recipient-name"
              value={recipientName}
              onChange={(event) => {
                setRecipientName(event.target.value);
                resetInvitationState();
              }}
              placeholder="Jake"
              className="min-h-10 border-2 border-foreground bg-background text-sm font-bold text-foreground shadow-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-[0.14em]" htmlFor="treaty-reminder-recipient-email">
              Email optional
            </Label>
            <Input
              id="treaty-reminder-recipient-email"
              type="email"
              value={recipientEmail}
              onChange={(event) => {
                setRecipientEmail(event.target.value);
                resetInvitationState();
              }}
              placeholder="jake@example.com"
              className="min-h-10 border-2 border-foreground bg-background text-sm font-bold text-foreground shadow-xs"
            />
          </div>
        </div>
      ) : null}
    </div>
  );

  const oneHumanActions =
    recipientMode === "one_human" ? (
      <div className="space-y-3">
        <div className="space-y-1.5">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-foreground">
            Send direct
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {([
              {
                channel: "sms",
                icon: <Smartphone className="h-4 w-4" aria-hidden="true" />,
                label: "Text",
              },
              {
                channel: "whatsapp",
                icon: <MessageCircle className="h-4 w-4" aria-hidden="true" />,
                label: "WhatsApp",
              },
              {
                channel: "telegram",
                icon: <Send className="h-4 w-4" aria-hidden="true" />,
                label: "Telegram",
              },
              {
                channel: "email-app",
                icon: <Mail className="h-4 w-4" aria-hidden="true" />,
                label: "Email app",
              },
            ] as const).map(({ channel, icon, label }) => (
              <Button
                key={channel}
                type="button"
                aria-label={label}
                onClick={() => void handleOneHumanDirectShare(channel)}
                disabled={
                  isCreatingInvitation ||
                  directChannelState != null ||
                  !trimmedRecipientName
                }
                className="min-h-10 justify-center border-2 border-foreground bg-background px-2 text-xs font-black uppercase tracking-[0.1em] text-foreground shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px]"
              >
                <span className="mr-2 shrink-0">{icon}</span>
                <span className="min-w-0 truncate">
                  {directChannelState === channel ? "Opening" : label}
                </span>
              </Button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          {trimmedRecipientEmail ? (
            <Button
              type="button"
              onClick={() => void handleOneHumanEmailSend()}
              disabled={
                isCreatingInvitation ||
                sendState === "sending" ||
                sendState === "sent" ||
                !trimmedRecipientName
              }
              className="min-h-10 flex-1 justify-center border-2 border-foreground bg-background px-3 text-xs font-black uppercase tracking-[0.12em] text-foreground shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px]"
            >
              <Mail className="mr-2 h-4 w-4" aria-hidden="true" />
              <span className="min-w-0 truncate">
                {sendState === "sent"
                  ? "Sent"
                  : sendState === "sending"
                    ? "Sending..."
                    : "Send email"}
              </span>
            </Button>
          ) : null}

          {invitation ? (
            <Button
              type="button"
              onClick={() => {
                setRecipientName("");
                setRecipientEmail("");
                resetInvitationState();
              }}
              className="min-h-10 justify-center border-2 border-foreground bg-background px-3 text-xs font-black uppercase tracking-[0.12em] text-foreground shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px]"
            >
              One more
            </Button>
          ) : null}
        </div>

        {inviteUrl ? (
          <p className="break-all border-t border-foreground/20 pt-3 text-[10px] font-bold text-muted-foreground">
            Invite link: {inviteUrl}
          </p>
        ) : null}

        {error ? (
          <p className="border-2 border-foreground bg-background px-3 py-2 text-sm font-black text-foreground">
            {error}
          </p>
        ) : null}
      </div>
    ) : null;

  if (templates.length === 0) return null;

  return (
    <Card
      className={
        cardClassName ??
        "overflow-hidden border-4 border-primary bg-background p-0 text-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
      }
    >
      <ReminderComposer
        availableTemplates={templates}
        message={message}
        messageCopyState={messageCopyState}
        onChannel={handleChannel}
        onCopy={handleCopyMessage}
        onMessageChange={(value) => {
          setMessage(value);
          if (recipientMode === "one_human") {
            setInvitation(null);
            setDirectChannelState(null);
            setSendState("idle");
          }
        }}
        onTemplateChange={setSelectedTemplateId}
        selectedTemplateId={selectedTemplateId}
        targetLabel={targetLabel}
        taskTitle="Sign the 1% Treaty"
        heading="Send Earth Optimization Task Reminder"
        copyIdleLabel={
          recipientMode === "one_human"
            ? "Step 3. Create Task + Copy"
            : "Step 3. Click to Copy"
        }
        copyCopiedLabel={
          recipientMode === "one_human"
            ? "Step 3. Task Copied"
            : "Step 3. Copied"
        }
        copyErrorLabel="Copy Failed"
        copyDisabled={
          recipientMode === "one_human" &&
          (isCreatingInvitation || !trimmedRecipientName)
        }
        extraControls={recipientSelector}
        hideDefaultActions={recipientMode === "one_human"}
        customActions={oneHumanActions}
        steps={[
          "Step 2. Select the funniest message",
          "Step 4. Select means of transmission and paste",
        ]}
      />
    </Card>
  );
}
