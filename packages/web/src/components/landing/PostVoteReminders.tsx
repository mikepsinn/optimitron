"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Card } from "@/components/retroui/Card";
import { getGovernmentLeader } from "@optimitron/data";
import { buildTaskShareTokens } from "@/lib/tasks/accountability";
import { getUsableShareTemplates } from "@/lib/tasks/share-templates";
import { renderTemplate } from "@/components/tasks/blocks/render-template";
import { ReminderComposer } from "@/components/tasks/task-row-share";
import { getCountryFromLocale } from "@/lib/detect-country";
import { buildUserReferralUrl, getBaseUrl } from "@/lib/url";

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
    void copyToClipboard(message)
      .then(() => {
        setMessageCopyState("copied");
        window.setTimeout(() => setMessageCopyState("idle"), 1500);
      })
      .catch(() => {
        setMessageCopyState("error");
        window.setTimeout(() => setMessageCopyState("idle"), 2000);
      });
  }, [message]);

  const handleChannel = useCallback(
    (channel: string) => {
      if (channel === "copy-link") {
        void copyToClipboard(referralUrl);
        return;
      }
      const encodedMessage = encodeURIComponent(message);
      const encodedUrl = encodeURIComponent(referralUrl);
      let href: string;
      if (channel === "x") {
        href = `https://twitter.com/intent/tweet?text=${encodedMessage}`;
      } else if (channel === "bluesky") {
        href = `https://bsky.app/intent/compose?text=${encodedMessage}`;
      } else if (channel === "linkedin") {
        href = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
      } else if (channel === "facebook") {
        href = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
      } else if (channel === "reddit") {
        href = `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodeURIComponent("Sign the 1% Treaty")}`;
      } else {
        // email
        const subject = encodeURIComponent("Sign the 1% Treaty");
        href = `mailto:?subject=${subject}&body=${encodedMessage}`;
        window.location.href = href;
        return;
      }
      window.open(href, "_blank", "noopener,noreferrer");
    },
    [message, referralUrl],
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
