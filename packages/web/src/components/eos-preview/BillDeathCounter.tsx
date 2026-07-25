"use client";

import { useEffect, useState } from "react";
import { GLOBAL_DISEASE_DEATHS_PER_MINUTE } from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { useDeathTick } from "@/hooks/useDeathTick";

/**
 * Section 1 (The Bill) live counter — top-right, small, ticking.
 * "XX people died of curable diseases while this page was open."
 * Reuses the shared death-rate math (useDeathTick) so the rate lives in one
 * place, and the Page Visibility API so the "open" count only accrues while
 * the tab is visible; time away is credited on return.
 */
export function BillDeathCounter() {
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
      <aside aria-label="Disease death rate">
        <ParameterValue
          className="eos-death-n"
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
    <aside aria-label="Deaths from curable disease while this page was open">
      <span className="eos-death-n" data-volatile="page-open-deaths">
        {opened.toLocaleString()}
      </span>{" "}
      people died of curable diseases while this page was open.
      {awayCount >= 1 ? (
        <>
          {" "}
          <span className="eos-death-n" data-volatile="away-deaths">
            {awayCount.toLocaleString()}
          </span>{" "}
          more died while you were away.
        </>
      ) : null}
    </aside>
  );
}
