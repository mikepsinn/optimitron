"use client";

import type { HumanityManagerStatusInput } from "@/lib/humanity-manager-status-content";
import { HumanityManagerStatus } from "@/lib/humanity-manager-status.web";

export function HumanityManagerStatusPanel({
  status,
}: {
  status: HumanityManagerStatusInput;
}) {
  return <HumanityManagerStatus input={status} />;
}
