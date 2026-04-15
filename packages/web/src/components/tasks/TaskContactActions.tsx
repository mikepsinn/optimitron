"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/retroui/Button";
import { getUsernameOrReferralCode } from "@/lib/referral.client";
import { useRequestSiteOrigin } from "@/lib/request-site-origin";
import {
  resolveTaskContactAction,
  type TaskContactDelayStats,
  type TaskContactLike,
} from "@/lib/tasks/contact";
import { buildTaskUrl } from "@/lib/url";

interface TaskContactActionsProps {
  baseUrl?: string;
  compact?: boolean;
  contactActionCount?: number;
  delayStats: TaskContactDelayStats;
  task: TaskContactLike;
  taskId: string;
}

export function TaskContactActions({
  baseUrl,
  compact = false,
  contactActionCount,
  delayStats,
  task,
  taskId,
}: TaskContactActionsProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const { data: session } = useSession();
  const requestOrigin = useRequestSiteOrigin();
  const referralId = getUsernameOrReferralCode(session?.user);
  const taskUrl = useMemo(
    () => buildTaskUrl(taskId, baseUrl ?? requestOrigin, referralId),
    [baseUrl, requestOrigin, taskId, referralId],
  );
  const action = useMemo(
    () => resolveTaskContactAction({ delayStats, task, taskUrl }),
    [delayStats, task, taskUrl],
  );

  if (!action) {
    return null;
  }

  const contactAction = action;

  async function trackContact() {
    try {
      await fetch(`/api/tasks/${taskId}/contact`, {
        body: JSON.stringify({
          channel: contactAction.channel,
          href: contactAction.href,
          message: contactAction.message,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
    } catch {
      // Tracking is advisory; never block the contact flow on analytics.
    }
  }

  function handleCopyMessage() {
    void navigator.clipboard
      .writeText(contactAction.message)
      .then(() => {
        setCopyState("copied");
        window.setTimeout(() => setCopyState("idle"), 1500);
      })
      .catch(() => {
        setCopyState("error");
        window.setTimeout(() => setCopyState("idle"), 2000);
      });
  }

  function handleOpenContact() {
    void trackContact();

    if (contactAction.channel === "email") {
      window.location.href = contactAction.href;
      return;
    }

    window.open(contactAction.href, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-brutal-pink">
        Push This Task
      </p>
      {!compact ? (
        <div className="border-4 border-foreground bg-background p-3">
          <p className="text-sm font-bold leading-6">{contactAction.message}</p>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          className="font-black uppercase"
          size="sm"
          type="button"
          variant="outline"
          onClick={handleOpenContact}
        >
          {contactAction.label}
        </Button>
        <Button
          className="font-black uppercase"
          size="sm"
          type="button"
          variant="outline"
          onClick={handleCopyMessage}
        >
          {copyState === "copied"
            ? "Message Copied"
            : copyState === "error"
              ? "Copy Failed"
              : "Copy Message"}
        </Button>
      </div>
      {!compact && typeof contactActionCount === "number" ? (
        <p className="text-xs font-bold uppercase text-muted-foreground">
          {contactActionCount.toLocaleString("en-US")} recorded contact actions
        </p>
      ) : null}
    </div>
  );
}
