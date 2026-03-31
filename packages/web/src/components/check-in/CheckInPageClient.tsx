"use client";

import { useState } from "react";
import Link from "next/link";
import { ArcadeTag } from "@/components/ui/arcade-tag";
import { DailyCheckInCard } from "@/components/profile/DailyCheckInCard";
import { CheckInHistoryCard } from "@/components/profile/CheckInHistoryCard";
import { ROUTES } from "@/lib/routes";
import type { CheckInPageData, ProfilePageData } from "@/lib/profile";

interface CheckInPageClientProps {
  initialData: CheckInPageData;
}

export function CheckInPageClient({ initialData }: CheckInPageClientProps) {
  const [currentCheckIn, setCurrentCheckIn] = useState(initialData.currentCheckIn);
  const [history, setHistory] = useState(initialData.history);

  function handleSaved(data: ProfilePageData) {
    setCurrentCheckIn(data.currentCheckIn);
    setHistory(data.history);
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <ArcadeTag>Daily Check-In</ArcadeTag>
        <h1 className="text-4xl font-black uppercase tracking-tight text-foreground">
          HOW ARE YOU <span className="text-brutal-pink">TODAY</span>?
        </h1>
        <p className="max-w-2xl text-base font-bold text-foreground">
          Thirty seconds. Health and happiness on a scale of 1–5.
          On my planet this takes four seconds but your brains
          apparently need &quot;a moment to reflect.&quot;
        </p>
      </section>

      <DailyCheckInCard currentCheckIn={currentCheckIn} onSaved={handleSaved} />

      <CheckInHistoryCard history={history} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href={ROUTES.census}
          className="block border-4 border-primary bg-brutal-cyan p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
        >
          <h3 className="text-sm font-black uppercase text-brutal-cyan-foreground">Update Census Data</h3>
          <p className="mt-1 text-xs font-bold text-brutal-cyan-foreground">
            Income, location, demographics — the permanent record stuff.
          </p>
        </Link>
        <Link
          href={ROUTES.wishocracy}
          className="block border-4 border-primary bg-brutal-yellow p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
        >
          <h3 className="text-sm font-black uppercase text-brutal-yellow-foreground">Budget Allocation</h3>
          <p className="mt-1 text-xs font-bold text-brutal-yellow-foreground">
            Tell me what you think Earth should spend money on.
          </p>
        </Link>
      </div>
    </div>
  );
}
