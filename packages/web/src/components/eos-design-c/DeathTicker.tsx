"use client";

import { useDeathTick } from "@/hooks/useDeathTick";

/**
 * Section 1's live counter. Small, corner-placed, ticking every second.
 * Pauses while the tab is hidden (Page Visibility API) and reports the
 * backlog when the visitor returns, so the number never lies about the
 * time they were actually looking at it.
 *
 * Uses the shared `useDeathTick` hook (elapsed real time via Date.now()
 * deltas, not a naive per-callback increment) so the count stays accurate
 * even when the interval is throttled by the browser.
 */
export function DeathTicker() {
  const { open, away } = useDeathTick({ trackVisibility: true });

  const died = Math.floor(open);
  const diedAway = Math.floor(away);

  return (
    <p className="dc-ticker" aria-live="off">
      <b>{died.toLocaleString("en-US")}</b> people died of curable diseases
      while this page was open.
      {diedAway > 0 ? (
        <>
          {" "}
          <b>{diedAway.toLocaleString("en-US")}</b> more died while you were
          away.
        </>
      ) : null}
    </p>
  );
}
