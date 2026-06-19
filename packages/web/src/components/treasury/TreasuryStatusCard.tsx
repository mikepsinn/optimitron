"use client";

import { formatWishes, useTreasuryData } from "@/hooks/useTreasuryData";

export function TreasuryStatusCard() {
  const {
    ubiPendingBalance,
    citizenCount,
    taxRateBps,
    totalSupply,
    maxSupply,
    isDemo,
  } = useTreasuryData();

  const citizenCountNum = Number(citizenCount);
  const perCitizen = citizenCountNum > 0 ? ubiPendingBalance / citizenCount : 0n;

  const stats = [
    {
      label: "UBI Pending",
      value: formatWishes(ubiPendingBalance),
      detail: "Awaiting distribution to citizens",
      color: "bg-background",
    },
    {
      label: "Per Citizen",
      value: citizenCountNum > 0 ? formatWishes(perCitizen) : "\u2014",
      detail: citizenCountNum > 0 ? "Next distribution" : "No citizens yet",
      color: "bg-background",
    },
    {
      label: "Registered Citizens",
      value: citizenCountNum.toLocaleString(),
      color: "bg-background",
    },
    {
      label: "Transaction Tax",
      value: `${(Number(taxRateBps) / 100).toFixed(1)}%`,
      detail: "On every wish transfer",
      color: "bg-background",
    },
    {
      label: "Circulating Supply",
      value: formatWishes(totalSupply),
      color: "bg-background",
    },
    {
      label: "Max Supply (Fixed)",
      value: formatWishes(maxSupply),
      detail: "No inflation. Ever.",
      color: "bg-background",
    },
  ];

  return (
    <section className="mb-16">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground">
          Treasury Status
        </h2>
        {isDemo && (
          <span className="border border-foreground bg-background px-2 py-0.5 text-[10px] font-black uppercase text-foreground">
            Demo
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 gap-x-6 border-y border-foreground/30 py-3 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="min-w-0 border-b border-foreground/20 py-3 text-foreground last:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0 lg:[&:nth-last-child(-n+3)]:border-b-0"
          >
            <div className="text-[10px] font-black uppercase text-muted-foreground">
              {stat.label}
            </div>
            <div className="mt-1 text-sm font-black leading-tight tabular-nums [overflow-wrap:anywhere]">
              {stat.value}
            </div>
            {stat.detail && (
              <div className="text-[10px] font-bold mt-0.5 text-muted-foreground">
                {stat.detail}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
