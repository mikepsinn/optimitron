"use client";

import { ShareLinkButtons } from "@/components/shared/ShareLinkButtons";

interface ShareOverdueListButtonsProps {
  overdueCount: number;
  economicLoss: string;
  livesLost: string;
  tasksUrl: string;
  labelClassName?: string;
  variant?: "text" | "icon";
}

export function ShareOverdueListButtons({
  overdueCount,
  economicLoss,
  livesLost,
  tasksUrl,
  labelClassName,
  variant,
}: ShareOverdueListButtonsProps) {
  const shareText = `${overdueCount} world leaders are overdue on signing the 1% Treaty. Estimated cost of their delay: ${livesLost} lives and ${economicLoss}. See who's stalling:`;

  return (
    <ShareLinkButtons
      emailSubject={`${overdueCount} leaders are stalling the 1% Treaty`}
      label={variant === "icon" ? undefined : "Share The Whole List"}
      labelClassName={labelClassName}
      shareText={shareText}
      url={tasksUrl}
      variant={variant}
    />
  );
}
