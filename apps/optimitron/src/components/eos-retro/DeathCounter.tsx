"use client";

import { useEffect, useState } from "react";
import { GLOBAL_DISEASE_DEATHS_PER_MINUTE } from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { useDeathTick } from "@/hooks/useDeathTick";

/**
 * Corner chip: deaths from curable disease while the page has been open.
 * Uses the Page Visibility API — the "open" count only accrues while the tab
 * is visible; time away accrues separately and is reported on return.
 * Fixed bottom-left (the CampaignActionFab owns bottom-right), single line,
 * pointer-events none, low z-index: it may float over the page but can never
 * block a click or hide interactive content (the page reserves bottom
 * padding for it).
 */
export function DeathCounter() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReducedMotion(true);
    }
  }, []);

  const { open, away } = useDeathTick({
    enabled: !reducedMotion,
    trackVisibility: true,
  });

  if (reducedMotion) {
    return (
      <aside aria-label="Disease death rate" className="er-death-counter">
        <ParameterValue
          display="integer"
          param={GLOBAL_DISEASE_DEATHS_PER_MINUTE}
          presentation="inline"
        />{" "}
        people die of curable diseases every minute.
      </aside>
    );
  }

  const opened = Math.floor(open);
  const awayCount = Math.floor(away);

  return (
    <aside aria-label="Deaths while this page was open" className="er-death-counter">
      <span className="er-death-n" data-volatile="page-open-deaths">
        {opened.toLocaleString()}
      </span>{" "}
      died of curable diseases while this page was open
      {awayCount >= 1 ? (
        <>
          {" "}
          (+
          <span className="er-death-n" data-volatile="away-deaths">
            {awayCount.toLocaleString()}
          </span>{" "}
          while you were away)
        </>
      ) : null}
      .
    </aside>
  );
}
