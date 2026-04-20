"use client";

import { useMemo } from "react";
import {
  computeEvDashboard,
  DEFAULT_EV_CONFIG,
  type EvConfig,
} from "@/lib/reasoning/ev";
import type { NodeId } from "@/lib/reasoning/types";
import { cn } from "@/lib/utils";
import { formatCurrencyShort, formatNumberShort } from "@/lib/formatters";

export function EvDashboard({
  claimProbabilities,
  conversionP,
  evConfig = DEFAULT_EV_CONFIG,
}: {
  claimProbabilities: Record<NodeId, number>;
  conversionP: number;
  evConfig?: EvConfig;
}) {
  const snapshot = useMemo(
    () => computeEvDashboard(claimProbabilities, conversionP, evConfig),
    [claimProbabilities, conversionP, evConfig],
  );
  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 border-t-4 border-primary bg-background p-3 shadow-[0_-4px_0_0_rgba(0,0,0,1)]",
      )}
    >
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 text-sm font-bold">
        <div className="flex flex-wrap items-center gap-4">
          <StatBlock
            label="P(all)"
            value={snapshot.chainProbability.toFixed(3)}
          />
          <StatBlock
            label="Lives/fwd"
            value={formatNumberShort(snapshot.expectedLivesPerForward)}
          />
          <StatBlock
            label="EV/fwd"
            value={formatCurrencyShort(snapshot.expectedValueUsdPerForward, { significantDigits: 3 })}
          />
          <StatBlock
            label="Ratio"
            value={`${formatNumberShort(snapshot.ratioToCost)} : 1`}
          />
        </div>
        <div
          className={cn(
            "rounded-none border-2 border-primary px-3 py-1 text-xs font-black uppercase",
            snapshot.isNegativeEv
              ? "bg-brutal-red text-brutal-red-foreground"
              : "bg-brutal-green text-brutal-green-foreground",
          )}
        >
          {snapshot.isNegativeEv
            ? "Advised against forwarding"
            : "EV positive"}
        </div>
      </div>
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-black uppercase text-muted-foreground">
        {label}
      </span>
      <span className="text-base font-black">{value}</span>
    </div>
  );
}
