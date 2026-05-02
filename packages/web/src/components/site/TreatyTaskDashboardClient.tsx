"use client";

import { LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TreatyReminderComposer } from "@/components/landing/TreatyReminderComposer";
import { ReferralLinkBanner } from "@/components/dashboard/ReferralLinkBanner";
import { Button } from "@/components/retroui/Button";
import { ProgramTaskSection } from "@/components/tasks/ProgramTaskSection";
import { TreatyContent } from "@/components/treaty/TreatyContent";
import { ROUTES } from "@/lib/routes";
import { useRequestSiteOrigin } from "@/lib/request-site-origin";
import { buildUserReferralUrl } from "@/lib/url";
import type { TaskCardTask } from "@/components/tasks/task-card";
import type { DashboardUser } from "@/types/dashboard";

interface TreatyTaskDashboardClientProps {
  user: DashboardUser;
  treatyProgram: TaskCardTask | null;
  signerTasks: TaskCardTask[];
}

// Treaty-paper themed wrapper for the handle/referral-link card. Replaces the
// default brutal-yellow Card so it sits naturally inside the treaty layout.
const TREATY_BANNER_CLASSNAME =
  "relative border border-[var(--treaty-ink)]/40 bg-[var(--treaty-paper)] p-6 sm:p-8 shadow-none mb-8";

export function TreatyTaskDashboardClient({
  user: initialUser,
  treatyProgram,
  signerTasks,
}: TreatyTaskDashboardClientProps) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [user, setUser] = useState(initialUser);
  const requestOrigin = useRequestSiteOrigin();
  const referralLink = buildUserReferralUrl(user, requestOrigin);

  const refreshPage = () => {
    void updateSession();
    router.refresh();
  };

  const overdueCount = signerTasks.filter(
    (t) => t.dueAt != null && t.dueAt.getTime() < Date.now(),
  ).length;

  return (
    <div className="min-h-screen bg-[var(--treaty-paper)] text-[var(--treaty-ink)] [font-family:var(--v0-font-libre-baskerville)]">
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:py-12">
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

        <ReferralLinkBanner
          user={user}
          referralLink={referralLink}
          onUserChange={setUser}
          onRefresh={refreshPage}
          dismissible={false}
          className={TREATY_BANNER_CLASSNAME}
          userFraming="manager"
          variant="treaty"
        />

        <TreatyReminderComposer />

        {treatyProgram ? (
          <ProgramTaskSection
            task={treatyProgram}
            subtasks={signerTasks}
            subtasksTitle={
              overdueCount > 0
                ? `↳ ${overdueCount} employees have overdue tasks`
                : undefined
            }
          />
        ) : null}

        <section className="pt-10">
          <TreatyContent />
        </section>
      </div>
    </div>
  );
}
