"use client";

import Link from "next/link";
import { DashboardShareCard } from "@/components/dashboard/DashboardShareCard";
import { HumanityManagerStatusPanel } from "@/components/dashboard/HumanityManagerStatusPanel";
import type { HumanityManagerStatusInput } from "@/lib/humanity-manager-status-content";
import { ROUTES } from "@/lib/routes";
import { useRequestSiteOrigin } from "@/lib/request-site-origin";
import { buildUserReferralUrl } from "@/lib/url";
import type { DashboardUser } from "@/types/dashboard";

interface TreatyTaskDashboardClientProps {
  humanityManagerStatus: HumanityManagerStatusInput;
  user: DashboardUser;
}

const OTHER_ACTIONS: Array<{ href: string; label: string; body: string }> = [
  {
    href: ROUTES.plaintiffs,
    label: "Register a plaintiff",
    body: "Each named relative adds $10.6M to your family's share of the demanded recovery.",
  },
  {
    href: ROUTES.employees,
    label: "Remind overdue presidents",
    body: "193 heads of government. 1.4 years overdue on a 30-second task.",
  },
  {
    href: ROUTES.join,
    label: "Join as an organization",
    body: "If you speak for a company, charity, coalition, or church.",
  },
];

export function TreatyTaskDashboardClient({
  humanityManagerStatus,
  user: initialUser,
}: TreatyTaskDashboardClientProps) {
  const user = initialUser;
  const requestOrigin = useRequestSiteOrigin();
  const referralLink = buildUserReferralUrl(user, requestOrigin);

  return (
    <div className="min-h-screen bg-[var(--treaty-paper)] text-[var(--treaty-ink)] [font-family:var(--v0-font-libre-baskerville)]">
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:py-12">
        <div className="flex flex-col items-start justify-between gap-4 border-b border-[var(--treaty-ink)]/30 pb-4 sm:flex-row">
          <h1 className="text-3xl font-black uppercase tracking-tight sm:text-4xl">
            Humanity Management Dashboard
          </h1>
        </div>

        <DashboardShareCard referralUrl={referralLink} showAssignmentForm />

        <HumanityManagerStatusPanel status={humanityManagerStatus} />

        <details className="group border border-[var(--treaty-ink)]/30 bg-[var(--treaty-paper)]">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-black uppercase tracking-[0.14em] text-[var(--treaty-ink)] marker:hidden">
            <span className="inline-block w-4">▸</span>
            Other ways to help
          </summary>
          <ul className="border-t border-[var(--treaty-ink)]/30 px-4 py-3">
            {OTHER_ACTIONS.map((action) => (
              <li
                key={action.href}
                className="border-b border-[var(--treaty-ink)]/15 py-3 last:border-b-0"
              >
                <Link
                  href={action.href}
                  className="block hover:underline"
                >
                  <p className="text-sm font-black uppercase tracking-[0.08em]">
                    {action.label}
                  </p>
                  <p className="mt-1 text-xs font-bold text-[var(--treaty-ink)]/70">
                    {action.body}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </details>
      </div>
    </div>
  );
}
