"use client";

import { useMemo } from "react";
import { useSession } from "next-auth/react";
import { ShareLinkButtons } from "@/components/shared/ShareLinkButtons";
import { getUsernameOrReferralCode } from "@/lib/referral.client";
import { useRequestSiteOrigin } from "@/lib/request-site-origin";
import { buildTaskUrl } from "@/lib/url";

interface TaskShareButtonsProps {
  baseUrl?: string;
  taskId: string;
  shareText: string;
  taskTitle: string;
  variant?: "text" | "icon";
}

export function TaskShareButtons({
  baseUrl,
  taskId,
  shareText,
  taskTitle,
  variant,
}: TaskShareButtonsProps) {
  const { data: session } = useSession();
  const requestOrigin = useRequestSiteOrigin();
  const referralId = getUsernameOrReferralCode(session?.user);
  const taskUrl = useMemo(
    () => buildTaskUrl(taskId, baseUrl ?? requestOrigin, referralId),
    [baseUrl, requestOrigin, taskId, referralId],
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
      label={variant === "icon" ? undefined : "Send reminder"}
      onShare={() => { void trackShare(); }}
      shareText={shareText}
      url={taskUrl}
      variant={variant}
    />
  );
}
