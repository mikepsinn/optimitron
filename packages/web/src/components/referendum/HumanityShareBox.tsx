"use client";

import { nanoid } from "nanoid";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Card } from "@/components/retroui/Card";
import { ReminderComposer } from "@/components/tasks/task-row-share";
import { copyTextToClipboard } from "@/lib/clipboard";
import {
  buildChannelHref,
  embedShareAttemptId,
  type ShareableChannel,
} from "@/lib/share-channels";
import { getTreatyLevelCostOfDelay } from "@/lib/tasks/delay-attribution";
import {
  getUsableHumanityShareTemplates,
  pickDefaultHumanityShareTemplateId,
} from "@/lib/tasks/humanity-share-templates";
import { renderTemplate } from "@/lib/tasks/render-template";
import { buildTaskShareTokens } from "@/lib/tasks/accountability";
import { buildUserReferralUrl, getBaseUrl } from "@/lib/url";

const TREATY_DUE_AT = new Date("2026-04-14T00:00:00.000Z");
const DAY_MS = 1000 * 60 * 60 * 24;

export function HumanityShareBox() {
  const { data: session } = useSession();
  const [messageCopyState, setMessageCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [message, setMessage] = useState("");

  const baseUrl = getBaseUrl();
  const referralUrl = session?.user
    ? buildUserReferralUrl(session.user, baseUrl)
    : baseUrl;

  const tokenBag = useMemo(() => {
    const delayDays = Math.max(
      0,
      Math.ceil((Date.now() - TREATY_DUE_AT.getTime()) / DAY_MS),
    );
    const delay = getTreatyLevelCostOfDelay(delayDays);

    return buildTaskShareTokens({
      targetLabel: "Humanity",
      taskTitle: "Sign the 1% Treaty",
      currentDelayDays: delayDays,
      currentEconomicValueUsdLost: delay?.wastedUsd ?? null,
      currentHumanLivesLost: delay?.deathsFromDelay ?? null,
      currentSufferingHoursLost: null,
      citizenName: session?.user?.name || "A citizen",
      treatyUrl: referralUrl,
    });
  }, [referralUrl, session?.user?.name]);

  const templates = useMemo(
    () => getUsableHumanityShareTemplates(tokenBag),
    [tokenBag],
  );

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    () => pickDefaultHumanityShareTemplateId(templates),
  );

  useEffect(() => {
    if (templates.length === 0) {
      setSelectedTemplateId(null);
      return;
    }

    if (
      selectedTemplateId == null ||
      !templates.some((template) => template.id === selectedTemplateId)
    ) {
      setSelectedTemplateId(pickDefaultHumanityShareTemplateId(templates));
    }
  }, [selectedTemplateId, templates]);

  const initialMessage = useMemo(() => {
    if (!selectedTemplateId) return "";
    const template = templates.find((entry) => entry.id === selectedTemplateId);
    if (!template) return "";
    return renderTemplate(template.body, tokenBag);
  }, [selectedTemplateId, templates, tokenBag]);

  useEffect(() => {
    setMessage(initialMessage);
    setMessageCopyState("idle");
  }, [initialMessage]);

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
        await fetch("/api/share-attempts", {
          body: JSON.stringify({
            ...input,
            source: "IN_APP",
            surface: "post_sign_humanity_share",
            context: { targetLabel: "Humanity" },
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });
      } catch {
        // best-effort
      }
    },
    [],
  );

  const handleCopyMessage = useCallback(() => {
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
    initialMessage,
    logShareAttempt,
    message,
    referralUrl,
    selectedTemplateId,
    templates,
  ]);

  const handleChannel = useCallback(
    (channel: string) => {
      if (channel === "copy-link") {
        const shareAttemptId = nanoid();
        const attributedReferralUrl = embedShareAttemptId(
          referralUrl,
          referralUrl,
          shareAttemptId,
        );

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
      const attributedReferralUrl = embedShareAttemptId(
        referralUrl,
        referralUrl,
        shareAttemptId,
      );
      const outboundMessage = embedShareAttemptId(
        message,
        referralUrl,
        shareAttemptId,
      );
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
      referralUrl,
      selectedTemplateId,
      templates,
    ],
  );

  if (templates.length === 0) {
    return null;
  }

  return (
    <Card className="w-full overflow-hidden border-2 border-[#8e6b48]/35 bg-background text-foreground shadow-[6px_6px_0_rgba(58,42,25,0.12)]">
      <ReminderComposer
        availableTemplates={templates}
        message={message}
        messageCopyState={messageCopyState}
        onChannel={handleChannel}
        onCopy={handleCopyMessage}
        onMessageChange={setMessage}
        onTemplateChange={setSelectedTemplateId}
        selectedTemplateId={selectedTemplateId}
        targetLabel="Humanity"
        taskTitle="Sign the 1% Treaty"
        heading="Share This Treaty"
        copyIdleLabel="Copy Share Message"
        copyCopiedLabel="Share Message Copied ✓"
        copyErrorLabel="Copy Failed"
      />
    </Card>
  );
}
