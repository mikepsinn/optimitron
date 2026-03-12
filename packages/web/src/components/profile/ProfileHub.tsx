"use client";

import { useState } from "react";
import { CheckInHistoryCard } from "@/components/profile/CheckInHistoryCard";
import { DailyCheckInCard } from "@/components/profile/DailyCheckInCard";
import { ProfileSnapshotForm } from "@/components/profile/ProfileSnapshotForm";
import type { ProfilePageData } from "@/lib/profile";

interface ProfileHubProps {
  initialData: ProfilePageData;
}

export function ProfileHub({ initialData }: ProfileHubProps) {
  const [data, setData] = useState(initialData);

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-pink-600">
          Your Data
        </p>
        <h1 className="text-4xl font-black uppercase tracking-tight text-black">
          Census + Daily Check-In
        </h1>
        <p className="max-w-3xl text-base font-medium text-black/70">
          Save your location and census snapshot, then rate your health and happiness over
          time.
        </p>
      </section>

      <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
        <ProfileSnapshotForm profile={data.profile} onSaved={setData} />
        <DailyCheckInCard currentCheckIn={data.currentCheckIn} onSaved={setData} />
      </div>

      <CheckInHistoryCard history={data.history} />
    </div>
  );
}
