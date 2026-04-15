"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { ArcadeTag } from "@/components/ui/arcade-tag";
import { ShareLinkButtons } from "@/components/shared/ShareLinkButtons";
import { SortableTaskList } from "@/components/tasks/task-list-controls";
import type { ReferendumSiteDashboardContent } from "@/content/referendum-sites/types";
import { buildUserReferralUrl } from "@/lib/url";
import {
  formatCompactCount,
  formatCompactCurrency,
  getTaskDelayStats,
} from "@/lib/tasks/accountability";
import { OPTIMITRON_CANONICAL_ORIGIN } from "@/lib/site";

const VERIFIED_TASK_STATUS = "VERIFIED";
type ReferendumDashboardTasks = ComponentProps<typeof SortableTaskList>["tasks"];
type ReferendumDashboardUser = {
  username?: string | null;
  referralCode?: string | null;
};

function StatTile({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[20px] border border-[#8e6b48]/25 bg-[#fffaf0]/85 p-5 shadow-[0_10px_20px_rgba(58,42,25,0.08)]">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8e6b48]">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black uppercase text-[#23180d] [font-family:var(--v0-font-libre-baskerville)] sm:text-4xl">
        {value}
      </p>
    </div>
  );
}

export function ReferendumSiteDashboardClient({
  blockerTasks,
  content,
  initialUser,
  welcome,
}: {
  blockerTasks: ReferendumDashboardTasks;
  content: ReferendumSiteDashboardContent;
  initialUser: ReferendumDashboardUser;
  welcome: boolean;
}) {
  const referralLink = buildUserReferralUrl(initialUser);
  const openTasks = blockerTasks.filter(
    (task) => task.status !== VERIFIED_TASK_STATUS,
  );
  const totals = openTasks.reduce(
    (acc, task) => {
      const delay = getTaskDelayStats(task);
      acc.economic += delay.currentEconomicValueUsdLost ?? 0;
      acc.humanLives += delay.currentHumanLivesLost ?? 0;
      return acc;
    },
    { economic: 0, humanLives: 0 },
  );

  return (
    <div className="min-h-screen bg-[#ece2d0] pb-20">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <ArcadeTag>1% Treaty Mission Dashboard</ArcadeTag>
          <h1 className="mt-4 text-4xl font-black uppercase tracking-tight text-[#23180d] [font-family:var(--v0-font-libre-baskerville)] sm:text-5xl md:text-6xl">
            Signed.
            <br />
            Now Make Them Sign.
          </h1>
        </div>

        <section className="mb-8 rounded-[28px] border border-[#8e6b48]/25 bg-[#f7f1e4]/88 p-6 shadow-[0_16px_30px_rgba(58,42,25,0.08)] sm:p-8">
          <p className="text-2xl font-black uppercase text-[#23180d] [font-family:var(--v0-font-libre-baskerville)]">
            {content.welcomeTitle}
          </p>
          <p className="mt-3 max-w-3xl text-base font-bold leading-7 text-[#5f4830] sm:text-lg">
            {welcome ? content.welcomeBody : content.urgencyBody}
          </p>
        </section>

        <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <section className="rounded-[28px] border border-[#8e6b48]/25 bg-[#f7f1e4]/88 p-6 shadow-[0_16px_30px_rgba(58,42,25,0.08)] sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8e6b48]">
              Share
            </p>
            <h2 className="mt-2 text-3xl font-black uppercase text-[#23180d] [font-family:var(--v0-font-libre-baskerville)]">
              {content.shareTitle}
            </h2>
            <p className="mt-3 max-w-2xl text-base font-bold leading-7 text-[#5f4830]">
              {content.shareBody}
            </p>
            <div className="mt-6 rounded-[20px] border border-[#8e6b48]/25 bg-[#fffaf0]/85 p-4">
              <ShareLinkButtons
                label="Personal referral link"
                labelClassName="text-[#6b5337]"
                shareText={content.shareText}
                url={referralLink}
                emailSubject={content.shareEmailSubject}
              />
              <p className="mt-4 break-all text-xs font-bold text-[#6b5337]">
                {referralLink}
              </p>
            </div>
          </section>

          <section className="rounded-[28px] border border-[#8e6b48]/25 bg-[#f7f1e4]/88 p-6 shadow-[0_16px_30px_rgba(58,42,25,0.08)] sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8e6b48]">
              Urgency
            </p>
            <h2 className="mt-2 text-3xl font-black uppercase text-[#23180d] [font-family:var(--v0-font-libre-baskerville)]">
              {content.urgencyTitle}
            </h2>
            <p className="mt-3 text-base font-bold leading-7 text-[#5f4830]">
              {content.urgencyBody}
            </p>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatTile
                label={content.statsLeadersLabel}
                value={formatCompactCount(openTasks.length)}
              />
              <StatTile
                label={content.statsDeathsLabel}
                value={formatCompactCount(totals.humanLives)}
              />
              <StatTile
                label={content.statsMoneyLabel}
                value={formatCompactCurrency(totals.economic)}
              />
            </div>
          </section>
        </div>

        <section className="rounded-[28px] border border-[#8e6b48]/25 bg-[#f7f1e4]/88 p-6 shadow-[0_16px_30px_rgba(58,42,25,0.08)] sm:p-8">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8e6b48]">
                Accountability
              </p>
              <h2 className="mt-2 text-3xl font-black uppercase text-[#23180d] [font-family:var(--v0-font-libre-baskerville)]">
                {content.tasksTitle}
              </h2>
              <p className="mt-3 max-w-3xl text-base font-bold leading-7 text-[#5f4830]">
                {content.tasksBody}
              </p>
            </div>
            <Link
              href="/tasks"
              className="text-sm font-black uppercase tracking-[0.12em] text-[#5e2e1f] underline decoration-[#8e6b48]/60 decoration-2 underline-offset-4 transition-colors hover:text-[#23180d] hover:decoration-[#23180d]"
            >
              {content.shareCtaLabel}
            </Link>
          </div>

          {openTasks.length > 0 ? (
            <SortableTaskList tasks={openTasks} pageSize={12} />
          ) : (
            <div className="rounded-[20px] border border-[#8e6b48]/25 bg-[#fffaf0]/85 p-6 text-center text-sm font-bold text-[#5f4830]">
              No outstanding treaty blocker tasks are visible right now.
            </div>
          )}
        </section>

        <div className="mt-6 text-right">
          <Link
            href={`${OPTIMITRON_CANONICAL_ORIGIN}/dashboard`}
            className="text-sm font-black uppercase tracking-[0.12em] text-[#5e2e1f] underline decoration-[#8e6b48]/60 decoration-2 underline-offset-4 transition-colors hover:text-[#23180d] hover:decoration-[#23180d]"
          >
            {content.fullDashboardLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
