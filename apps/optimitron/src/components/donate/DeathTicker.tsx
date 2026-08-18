"use client";

import { GLOBAL_DISEASE_DEATHS_PER_MINUTE } from "@optimitron/data/parameters";
import { BrutalCard } from "@/components/ui/brutal-card";
import { ParameterValue } from "@/components/shared/ParameterValue";
import { useDeathTick } from "@/hooks/useDeathTick";

export function DeathTicker() {
  const { open } = useDeathTick();
  const count = Math.floor(open);

  return (
    <BrutalCard bgColor="red" shadowSize={8} className="mb-6">
      <div className="space-y-2 text-center">
        <p className="font-black uppercase text-xs tracking-[0.2em]">
          Humans permanently stopped since you opened this page
        </p>
        <p
          className="font-black text-5xl sm:text-6xl md:text-7xl tabular-nums leading-none"
          aria-live="polite"
        >
          {count.toLocaleString()}
        </p>
        <p className="font-bold text-sm">
          Rate: <ParameterValue param={GLOBAL_DISEASE_DEATHS_PER_MINUTE} figures={3} />.
          They had plans for next Tuesday.
        </p>
      </div>
    </BrutalCard>
  );
}
