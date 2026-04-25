"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/retroui/Button";
import { getUsernameOrReferralCode } from "@/lib/referral.client";
import { useRequestSiteOrigin } from "@/lib/request-site-origin";
import {
  resolveTaskCommunicationAction,
  type TaskCommunicationDelayStats,
  type TaskCommunicationLike,
} from "@/lib/tasks/task-communication-action";
import { buildTaskUrl } from "@/lib/url";

interface TaskCommunicationActionsProps {
  baseUrl?: string;
  compact?: boolean;
  delayStats: TaskCommunicationDelayStats;
  task: TaskCommunicationLike;
  taskCommunicationCount?: number;
  taskId: string;
}

export function TaskCommunicationActions({
  baseUrl,
  compact = false,
  delayStats,
  task,
  taskCommunicationCount,
  taskId,
}: TaskCommunicationActionsProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const { data: session } = useSession();
  const requestOrigin = useRequestSiteOrigin();
  const referralId = getUsernameOrReferralCode(session?.user);
  const taskUrl = useMemo(
    () => buildTaskUrl(taskId, baseUrl ?? requestOrigin, referralId),
    [baseUrl, requestOrigin, taskId, referralId],
  );
  const action = useMemo(
    () => resolveTaskCommunicationAction({ delayStats, task, taskUrl }),
    [delayStats, task, taskUrl],
  );

  if (!action) {
    return null;
  }

  const communicationAction = action;

  async function recordCommunication() {
    try {
      await fetch(`/api/tasks/${taskId}/communications`, {
        body: JSON.stringify({
          channel: communicationAction.channel,
          endpointId: communicationAction.endpointId,
          href: communicationAction.href,
          message: communicationAction.message,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
    } catch {
      // Recording is advisory; never block the user's communication flow.
    }
  }

  function handleCopyMessage() {
    void navigator.clipboard
      .writeText(communicationAction.message)
      .then(() => {
        setCopyState("copied");
        window.setTimeout(() => setCopyState("idle"), 1500);
      })
      .catch(() => {
        setCopyState("error");
        window.setTimeout(() => setCopyState("idle"), 2000);
      });
  }

  function handleOpenCommunication() {
    void recordCommunication();

    if (communicationAction.channel === "mailto") {
      window.location.href = communicationAction.href;
      return;
    }

    window.open(communicationAction.href, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-brutal-pink">
        Push This Task
      </p>
      {!compact ? (
        <div className="border-4 border-foreground bg-background p-3">
          <p className="text-sm font-bold leading-6">{communicationAction.message}</p>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          className="font-black uppercase"
          size="sm"
          type="button"
          variant="outline"
          onClick={handleOpenCommunication}
        >
          {communicationAction.label}
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
      {!compact && typeof taskCommunicationCount === "number" ? (
        <p className="text-xs font-bold uppercase text-muted-foreground">
          {taskCommunicationCount.toLocaleString("en-US")} recorded communications
        </p>
      ) : null}
    </div>
  );
}
