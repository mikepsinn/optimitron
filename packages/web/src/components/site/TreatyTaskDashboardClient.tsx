"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { DashboardShareCard } from "@/components/dashboard/DashboardShareCard";
import { Button } from "@/components/retroui/Button";
import { ROUTES } from "@/lib/routes";
import { useRequestSiteOrigin } from "@/lib/request-site-origin";
import { buildUserReferralUrl } from "@/lib/url";
import type { TaskCardTask } from "@/components/tasks/task-card";
import type { DashboardUser } from "@/types/dashboard";

interface TreatyTaskDashboardClientProps {
  user: DashboardUser;
  signerTasks: TaskCardTask[];
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
    href: ROUTES.endorse,
    label: "Endorse as an organization",
    body: "If you speak for a company, charity, coalition, or church.",
  },
];

export function TreatyTaskDashboardClient({
  user: initialUser,
  signerTasks,
}: TreatyTaskDashboardClientProps) {
  const user = initialUser;
  const requestOrigin = useRequestSiteOrigin();
  const referralLink = buildUserReferralUrl(user, requestOrigin);
  const overdueSignerCount = signerTasks.length;

  return (
    <div className="min-h-screen bg-[var(--treaty-paper)] text-[var(--treaty-ink)] [font-family:var(--v0-font-libre-baskerville)]">
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:py-12">
        <div className="flex flex-col items-start justify-between gap-4 border-b border-[var(--treaty-ink)]/30 pb-4 sm:flex-row">
          <h1 className="text-3xl font-black uppercase tracking-tight sm:text-4xl">
            Humanity Management Dashboard
          </h1>
          <Button
            variant="outline"
            data-testid="sign-out-button"
            onClick={() => {
              void signOut({ callbackUrl: ROUTES.home });
            }}
            className="min-h-11 border border-[var(--treaty-ink)] bg-transparent px-3 text-xs font-black uppercase tracking-[0.14em] text-[var(--treaty-ink)] shadow-none hover:translate-x-0 hover:translate-y-0 hover:bg-[#efe4cf]"
          >
            <LogOut className="h-4 w-4 stroke-[2.5px]" />
          </Button>
        </div>

        <DashboardShareCard referralUrl={referralLink} />

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

        {overdueSignerCount > 0 ? (
          <details className="group border border-[var(--treaty-ink)]/30 bg-[var(--treaty-paper)]">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-black uppercase tracking-[0.14em] text-[var(--treaty-ink)] marker:hidden">
              <span className="inline-block w-4">▸</span>
              Your assigned tasks ({overdueSignerCount})
            </summary>
            <p className="border-t border-[var(--treaty-ink)]/30 px-4 py-3 text-xs font-bold text-[var(--treaty-ink)]/70">
              Per-leader sign-the-treaty reminders. Manage on{" "}
              <Link
                href={ROUTES.employees}
                className="font-black underline"
              >
                /employees
              </Link>
              .
            </p>
          </details>
        ) : null}
      </div>
    </div>
  );
}
