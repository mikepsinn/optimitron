"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { API_ROUTES } from "@/lib/api-routes";
import { NavItemLink } from "@/components/navigation/NavItemLink";
import {
  WISHOCRATIC_ITEMS,
  getActualGovernmentAllocations,
  type WishocraticItemId,
} from "@/lib/wishocracy-data";
import { alignmentLink, getSignInPath, wishocracyLink } from "@/lib/routes";

type WishocracyLandingSummary = {
  averageAllocations: Record<WishocraticItemId, number>;
  totalUsers: number;
  totalAllocations: number;
  topItems: Array<{
    itemId: WishocraticItemId;
    percentage: number;
  }>;
};

function createEmptySummary(): WishocracyLandingSummary {
  const averageAllocations = Object.keys(WISHOCRATIC_ITEMS).reduce((allocations, itemId) => {
    allocations[itemId as WishocraticItemId] = 0;
    return allocations;
  }, {} as Record<WishocraticItemId, number>);

  return {
    averageAllocations,
    totalUsers: 0,
    totalAllocations: 0,
    topItems: [],
  };
}

export function WishocracyLandingSection() {
  const [summary, setSummary] = useState<WishocracyLandingSummary>(createEmptySummary);
  const governmentAllocations = useMemo(() => getActualGovernmentAllocations(), []);

  useEffect(() => {
    let isActive = true;

    async function loadSummary() {
      try {
        const response = await fetch(API_ROUTES.wishocracy.averageAllocations);
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as WishocracyLandingSummary;
        if (isActive) {
          setSummary(payload);
        }
      } catch {
        // Keep the landing section resilient when the API is unavailable.
      }
    }

    void loadSummary();

    return () => {
      isActive = false;
    };
  }, []);

  const rows = useMemo(() => {
    const source = summary.topItems.length
      ? summary.topItems
      : (Object.keys(WISHOCRATIC_ITEMS) as WishocraticItemId[]).map((itemId) => ({
          itemId,
          percentage: summary.averageAllocations[itemId],
        }));

    return source.slice(0, 5).map(({ itemId, percentage }) => ({
      itemId,
      communityPercent: percentage,
      governmentPercent: governmentAllocations[itemId],
      item: WISHOCRATIC_ITEMS[itemId],
    }));
  }, [governmentAllocations, summary.averageAllocations, summary.topItems]);

  const hasCommunityData = summary.totalUsers > 0;
  const topItem = hasCommunityData ? rows[0] : null;

  return (
    <section className="border-y-4 border-primary bg-brutal-cyan">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <div className="mb-4 inline-flex border-4 border-primary bg-foreground px-3 py-1 text-xs font-black uppercase text-background">
              Wishocracy Live
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tight text-foreground sm:text-4xl">
              Community Budget Priorities
            </h2>
            <p className="mt-4 max-w-2xl text-base font-bold leading-relaxed text-foreground">
              Save your allocation, compare it with current government spending,
              and see which priorities rise to the top across the community.
            </p>
            <div className="mt-6 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="border-4 border-primary bg-background px-4 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="text-2xl font-black text-foreground">
                  {summary.totalUsers > 0 ? summary.totalUsers.toLocaleString() : "Live"}
                </div>
                <div className="text-xs font-bold uppercase text-muted-foreground">
                  Saved Voters
                </div>
              </div>
              <div className="border-4 border-primary bg-background px-4 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="text-2xl font-black text-foreground">
                  {summary.totalAllocations > 0 ? summary.totalAllocations.toLocaleString() : "Growing"}
                </div>
                <div className="text-xs font-bold uppercase text-muted-foreground">
                  Comparisons Logged
                </div>
              </div>
              <div className="border-4 border-primary bg-background px-4 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="text-lg font-black text-foreground">
                  {topItem?.item.name ?? "Starts With You"}
                </div>
                <div className="text-xs font-bold uppercase text-muted-foreground">
                  Top Priority
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <NavItemLink
                item={wishocracyLink}
                variant="custom"
                className="inline-flex items-center justify-center border-4 border-primary bg-brutal-pink px-8 py-3 text-sm font-black uppercase text-brutal-pink-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
              >
                Make Your Allocation
              </NavItemLink>
              <Link
                href={getSignInPath(wishocracyLink.href)}
                className="inline-flex items-center justify-center border-4 border-primary bg-background px-8 py-3 text-sm font-black uppercase text-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
              >
                Sign In to Save and Share
              </Link>
              <NavItemLink
                item={alignmentLink}
                variant="custom"
                className="inline-flex items-center justify-center border-4 border-primary bg-brutal-yellow px-8 py-3 text-sm font-black uppercase text-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
              >
                See Alignment Reports
              </NavItemLink>
            </div>
          </div>

          <div className="border-4 border-primary bg-background p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black uppercase text-foreground">Top Community Allocations</h3>
                <p className="text-xs font-bold text-muted-foreground">
                  Live averages from saved Wishocracy submissions
                </p>
              </div>
              <div className="text-right text-[11px] font-bold uppercase text-muted-foreground">
                Community vs Govt
              </div>
            </div>

            <div className="space-y-4">
              {rows.map((row) => (
                <div key={row.itemId}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{row.item.icon}</span>
                      <span className="text-sm font-black uppercase text-foreground">
                        {row.item.name}
                      </span>
                    </div>
                    <div className="text-right text-xs font-bold uppercase text-muted-foreground">
                      {row.communityPercent.toFixed(1)}% vs {row.governmentPercent.toFixed(1)}%
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-5 overflow-hidden border-4 border-primary bg-muted">
                      <div
                        className="h-full bg-brutal-pink"
                        style={{ width: `${row.communityPercent}%` }}
                      />
                    </div>
                    <div className="h-5 overflow-hidden border-4 border-primary bg-muted">
                      <div
                        className="h-full bg-foreground"
                        style={{ width: `${row.governmentPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-5 text-xs font-bold leading-relaxed text-muted-foreground">
              Pink bars show the saved community average. Black bars show current
              government allocations across the same Wishocracy categories.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
