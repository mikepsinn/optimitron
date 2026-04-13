"use client";

import { useMemo } from "react";
import { useSession } from "next-auth/react";
import { ShareLinkButtons } from "@/components/shared/ShareLinkButtons";
import { getUsernameOrReferralCode } from "@/lib/referral.client";
import { buildTaskUrl, getBaseUrl } from "@/lib/url";

interface TaskShareButtonsProps {
  taskId: string;
  shareText: string;
  taskTitle: string;
  variant?: "text" | "icon";
}

export function TaskShareButtons({
  taskId,
  shareText,
  taskTitle,
  variant,
}: TaskShareButtonsProps) {
  const { data: session } = useSession();
  const referralId = getUsernameOrReferralCode(session?.user);
  const taskUrl = useMemo(
    () => buildTaskUrl(taskId, getBaseUrl(), referralId),
    [taskId, referralId],
  );

  async function trackShare() {
    try {
      await fetch("/api/share/track", {
        body: JSON.stringify({
          taskId,
          templateLabel: "task-share",
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
    } catch {
      // Share tracking is best-effort only.
    }
  }

  return (
    <ShareLinkButtons
      emailSubject={taskTitle}
      label={variant === "icon" ? undefined : "Share This Task"}
      onShare={() => { void trackShare(); }}
      shareText={shareText}
      url={taskUrl}
      variant={variant}
    />
  );
}
