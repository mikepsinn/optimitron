"use client";

import { nanoid } from "nanoid";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Card } from "@/components/retroui/Card";
import { Switch } from "@/components/retroui/Switch";
import { getGovernmentLeader } from "@optimitron/data";
import { buildTaskShareTokens } from "@/lib/tasks/accountability";
import { getTreatyLevelCostOfDelay } from "@/lib/tasks/delay-attribution";
import {
  getUsableHumanityShareTemplates,
  pickDefaultHumanityShareTemplateId,
} from "@/lib/tasks/humanity-share-templates";
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
import { buildUserReferralUrl, getBaseUrl } from "@/lib/url";

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const TREATY_DUE_AT = new Date("2026-04-14T00:00:00.000Z");
const DAY_MS = 1000 * 60 * 60 * 24;

interface TreatyReminderComposerProps {
  cardClassName?: string;
  defaultCowardMode?: boolean;
  surface?: string;
}

export function TreatyReminderComposer({
  cardClassName,
  defaultCowardMode = false,
  // Kept as "post_vote_reminders" for analytics continuity — historical
  // share-attempts records use this surface value. The component renamed
  // from PostVoteReminders → TreatyReminderComposer; the surface did not.
  surface = "post_vote_reminders",
}: TreatyReminderComposerProps = {}) {
  const { data: session } = useSession();
  const [cowardMode, setCowardMode] = useState(defaultCowardMode);
  const [messageCopyState, setMessageCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [message, setMessage] = useState("");

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
      leaderTemplates: getUsableShareTemplates(tokens),
      leaderTokenBag: tokens,
      leaderName: targetLabel,
    };
  }, [countryCode, delayDays, referralUrl, session?.user?.name]);

  const { humanityTemplates, humanityTokenBag } = useMemo(() => {
    const delay = getTreatyLevelCostOfDelay(delayDays);
    const tokens = buildTaskShareTokens({
      targetLabel: "Humanity",
      taskTitle: "Sign the 1% Treaty",
      currentDelayDays: delayDays,
      currentEconomicValueUsdLost: delay?.wastedUsd ?? null,
      currentHumanLivesLost: delay?.deathsFromDelay ?? null,
      currentSufferingHoursLost: null,
      citizenName: session?.user?.name || "A citizen",
      treatyUrl: referralUrl,
    });
    return {
      humanityTemplates: getUsableHumanityShareTemplates(tokens),
      humanityTokenBag: tokens,
    };
  }, [delayDays, referralUrl, session?.user?.name]);

  const [selectedLeaderTemplateId, setSelectedLeaderTemplateId] = useState<string | null>(
    () => pickDefaultShareTemplateId(leaderTemplates),
  );
  const [selectedHumanityTemplateId, setSelectedHumanityTemplateId] = useState<string | null>(
    () => pickDefaultHumanityShareTemplateId(humanityTemplates),
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
      setSelectedLeaderTemplateId(pickDefaultShareTemplateId(leaderTemplates));
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
        pickDefaultHumanityShareTemplateId(humanityTemplates),
      );
    }
  }, [humanityTemplates, selectedHumanityTemplateId]);

  const templates = cowardMode ? humanityTemplates : leaderTemplates;
  const tokenBag = cowardMode ? humanityTokenBag : leaderTokenBag;
  const selectedTemplateId = cowardMode
    ? selectedHumanityTemplateId
    : selectedLeaderTemplateId;
  const setSelectedTemplateId = cowardMode
    ? setSelectedHumanityTemplateId
    : setSelectedLeaderTemplateId;
  const targetLabel = cowardMode ? "Humanity" : leaderName;

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
              cowardMode,
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
    [countryCode, cowardMode, surface, targetLabel],
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
  }, [initialMessage]);

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
    [initialMessage, logShareAttempt, message, referralUrl, selectedTemplateId, templates],
  );

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
        onMessageChange={setMessage}
        onTemplateChange={setSelectedTemplateId}
        selectedTemplateId={selectedTemplateId}
        targetLabel={targetLabel}
        taskTitle="Sign the 1% Treaty"
        heading="Send Earth Optimization Task Reminder"
        copyIdleLabel="Step 2. Click to Copy"
        copyCopiedLabel="Step 2. Copied ✓"
        copyErrorLabel="Copy Failed"
        headerAccessory={(
          <label className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">
              {cowardMode ? "Humanity Mode" : "Leader Mode"}
            </span>
            <Switch
              aria-label={cowardMode ? "Switch to leader mode" : "Switch to humanity mode"}
              checked={cowardMode}
              onCheckedChange={setCowardMode}
            />
          </label>
        )}
        steps={[
          "Step 1. Select the funniest message",
          "Step 3. Select means of transmission and paste",
        ]}
      />
    </Card>
  );
}
