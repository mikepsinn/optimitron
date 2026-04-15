"use client";

import { useEffect, useRef, useState } from "react";
import { BrutalCard } from "@/components/ui/brutal-card";
import { formatCompactCount, formatCompactCurrency } from "@/lib/tasks/accountability";

interface TaskWhileYouReadProps {
  deathsPerSecond: number | null;
  usdPerSecond: number | null;
}

export function TaskWhileYouRead({
  deathsPerSecond,
  usdPerSecond,
}: TaskWhileYouReadProps) {
  const mountedAt = useRef(Date.now());
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    if (deathsPerSecond == null && usdPerSecond == null) return;
    const id = window.setInterval(() => {
      setElapsedSec((Date.now() - mountedAt.current) / 1000);
    }, 1000);
    return () => window.clearInterval(id);
  }, [deathsPerSecond, usdPerSecond]);

  if (deathsPerSecond == null && usdPerSecond == null) return null;

  const deaths = deathsPerSecond != null ? deathsPerSecond * elapsedSec : null;
  const usd = usdPerSecond != null ? usdPerSecond * elapsedSec : null;

  return (
    <BrutalCard bgColor="red" padding="lg">
      <div className="space-y-3">
        <p className="text-xs font-black uppercase tracking-[0.18em]">
          While You Read This
        </p>
        <div className="space-y-1 font-mono text-lg font-black">
          {deaths != null ? (
            <div>💀 {formatCompactCount(deaths)} more humans died</div>
          ) : null}
          {usd != null ? (
            <div>💸 {formatCompactCurrency(usd)} more wasted</div>
          ) : null}
        </div>
      </div>
    </BrutalCard>
  );
}
