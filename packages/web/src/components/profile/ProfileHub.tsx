"use client";

import { useState } from "react";
import Link from "next/link";
import { PushNotificationPrompt } from "@/components/notifications/PushNotificationPrompt";
import { ProfileSnapshotForm } from "@/components/profile/ProfileSnapshotForm";
import { VoteTokenBalanceCard } from "@/components/prize/VoteTokenBalanceCard";
import type { ProfilePageData } from "@/lib/profile";
import { ROUTES } from "@/lib/routes";

interface ProfileHubProps {
  initialData: ProfilePageData;
}

export function ProfileHub({ initialData }: ProfileHubProps) {
  const [data, setData] = useState(initialData);

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-brutal-pink">
          Your Data
        </p>
        <h1 className="text-4xl font-black uppercase tracking-tight text-foreground">
          CENSUS DATA
        </h1>
        <p className="max-w-3xl text-base font-bold text-foreground">
          Income, location, demographics. The data that turns you from
          a rounding error into a data point worth optimizing for.
        </p>
      </section>

      {/* CTAs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ProfileCTA
          href={ROUTES.checkIn}
          label="Daily Check-In"
          description="Rate your health and happiness. Thirty seconds. Every day."
          color="bg-brutal-pink"
          textColor="text-brutal-pink-foreground"
        />
        <ProfileCTA
          href={ROUTES.wishocracy}
          label="Wishocracy"
          description="Set your ideal budget priorities via pairwise comparisons"
          color="bg-brutal-cyan"
          textColor="text-brutal-cyan-foreground"
        />
        <ProfileCTA
          href={ROUTES.alignment}
          label="Alignment"
          description="See which politicians match your priorities"
          color="bg-brutal-yellow"
          textColor="text-brutal-yellow-foreground"
        />
        <ProfileCTA
          href={ROUTES.referendum}
          label="Referendums"
          description="Vote on active proposals and earn referral rewards"
          color="bg-background"
          textColor="text-foreground"
        />
      </div>

      <ProfileSnapshotForm profile={data.profile} onSaved={setData} />

      <VoteTokenBalanceCard />

      <PushNotificationPrompt />
    </div>
  );
}

function ProfileCTA({
  href,
  label,
  description,
  color,
  textColor,
}: {
  href: string;
  label: string;
  description: string;
  color: string;
  textColor: string;
}) {
  return (
    <Link
      href={href}
      className={`block border-4 border-primary ${color} p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]`}
    >
      <h3 className={`text-sm font-black uppercase ${textColor}`}>{label}</h3>
      <p className={`mt-1 text-xs font-bold ${textColor}`}>{description}</p>
    </Link>
  );
}
