"use client";

import { TreasuryHero } from "@/components/treasury/TreasuryHero";
import { TreasuryStatusCard } from "@/components/treasury/TreasuryStatusCard";
import { TreasuryAllocationViz } from "@/components/treasury/TreasuryAllocationViz";
import { WalletCard } from "@/components/treasury/WalletCard";
import { UBIRegistrationCard } from "@/components/treasury/UBIRegistrationCard";
import { DistributeUBICard } from "@/components/treasury/DistributeUBICard";
import { WishocracyLinkCard } from "@/components/treasury/WishocracyLinkCard";

export function TreasuryDashboard() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <TreasuryHero />
      <TreasuryStatusCard />
      <TreasuryAllocationViz />
      <WalletCard />
      <UBIRegistrationCard />
      <DistributeUBICard />
      <WishocracyLinkCard />
    </div>
  );
}
