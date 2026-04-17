"use client";

import { nanoid } from "nanoid";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Card } from "@/components/retroui/Card";
import { getGovernmentLeader } from "@optimitron/data";
import { buildTaskShareTokens } from "@/lib/tasks/accountability";
import { getUsableShareTemplates } from "@/lib/tasks/share-templates";
import { renderTemplate } from "@/lib/tasks/render-template";
import { ReminderComposer } from "@/components/tasks/task-row-share";
import { getCountryFromLocale } from "@/lib/detect-country";
import {
  buildChannelHref,
  embedShareAttemptId,
  type ShareableChannel,
} from "@/lib/share-channels";
import { buildUserReferralUrl, getBaseUrl } from "@/lib/url";

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** The treaty was due on this date; delay days accrue from here. */
const TREATY_DUE_AT = new Date("2026-04-14T00:00:00.000Z");
const DAY_MS = 1000 * 60 * 60 * 24;

function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
  return Promise.resolve();
}

export function PostVoteReminders() {
  const { data: session } = useSession();
  const [messageCopyState, setMessageCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [message, setMessage] = useState("");

  const countryCode =
    session?.user?.countryCode || getCountryFromLocale() || "US";

  const baseUrl = getBaseUrl();
  const referralUrl = session?.user
    ? buildUserReferralUrl(session.user, baseUrl)
    : baseUrl;

  const { templates, tokenBag, leaderName } = useMemo(() => {
    const leader = getGovernmentLeader(countryCode);
    const delayDays = Math.max(0, Math.ceil((Date.now() - TREATY_DUE_AT.getTime()) / DAY_MS));
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
    const usable = getUsableShareTemplates(tokens);
    return { templates: usable, tokenBag: tokens, leaderName: targetLabel };
  }, [countryCode, session?.user?.name, referralUrl]);

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
            surface: "post_vote_reminders",
            channel: input.channel,
            templateId: input.templateId,
            templateHash,
            templateBody: input.templateBody,
            renderedMessage: input.renderedMessage,
            renderedHash,
            wasEdited: input.wasEdited,
            context: { countryCode, leaderName },
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });
      } catch {
        // best-effort
      }
    },
    [countryCode, leaderName],
  );

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    () => templates[0]?.id ?? null,
  );

  useEffect(() => {
    if (templates.length === 0) {
      setSelectedTemplateId(null);
      return;
    }
    if (
      selectedTemplateId == null ||
      !templates.some((t) => t.id === selectedTemplateId)
    ) {
      setSelectedTemplateId(templates[0]?.id ?? null);
    }
  }, [templates, selectedTemplateId]);

  const initialMessage = useMemo(() => {
    if (selectedTemplateId) {
      const template = templates.find((t) => t.id === selectedTemplateId);
      if (template) {
        return renderTemplate(template.body, tokenBag);
      }
    }
    return "";
  }, [selectedTemplateId, templates, tokenBag]);

  useEffect(() => {
    setMessage(initialMessage);
    setMessageCopyState("idle");
  }, [initialMessage]);

  const handleCopyMessage = useCallback(() => {
    const shareAttemptId = nanoid();
    const wasEdited = message !== initialMessage;
    const outboundMessage = embedShareAttemptId(message, referralUrl, shareAttemptId);
    const selectedTemplate = selectedTemplateId
      ? templates.find((t) => t.id === selectedTemplateId) ?? null
      : null;

    void logShareAttempt({
      id: shareAttemptId,
      channel: "copy-message",
      renderedMessage: outboundMessage,
      wasEdited,
      templateBody: selectedTemplate?.body ?? null,
      templateId: selectedTemplate?.id ?? null,
    });

    void copyToClipboard(outboundMessage)
      .then(() => {
        setMessageCopyState("copied");
        window.setTimeout(() => setMessageCopyState("idle"), 1500);
      })
      .catch(() => {
        setMessageCopyState("error");
        window.setTimeout(() => setMessageCopyState("idle"), 2000);
      });
  }, [message, initialMessage, referralUrl, selectedTemplateId, templates, logShareAttempt]);

  const handleChannel = useCallback(
    (channel: string) => {
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

        void copyToClipboard(attributedReferralUrl);
        return;
      }

      const shareAttemptId = nanoid();
      const wasEdited = message !== initialMessage;
      const attributedReferralUrl = embedShareAttemptId(referralUrl, referralUrl, shareAttemptId);
      const outboundMessage = embedShareAttemptId(message, referralUrl, shareAttemptId);
      const selectedTemplate = selectedTemplateId
        ? templates.find((t) => t.id === selectedTemplateId) ?? null
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
    [message, referralUrl, initialMessage, selectedTemplateId, templates, logShareAttempt],
  );

  if (templates.length === 0) return null;

  return (
    <Card className="bg-background text-foreground border-4 border-primary p-0 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
      <ReminderComposer
        availableTemplates={templates}
        message={message}
        messageCopyState={messageCopyState}
        onChannel={handleChannel}
        onCopy={handleCopyMessage}
        onMessageChange={setMessage}
        onTemplateChange={setSelectedTemplateId}
        selectedTemplateId={selectedTemplateId}
        targetLabel={leaderName}
        taskTitle="Sign the 1% Treaty"
      />
    </Card>
  );
}
