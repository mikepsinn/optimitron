"use client";

import type { Session } from "next-auth";
import { REFERENDUMS } from "@/config/referendums";

export async function syncPendingReferendumVotes(
  session?: Session | null,
): Promise<void> {
  for (const config of Object.values(REFERENDUMS)) {
    try {
      await config.syncPending(session);
    } catch {
      // Per-referendum sync failures must not block the others.
    }
  }
}
