"use client";

import {
  ClipboardList,
  Landmark,
  LogOut,
  MessageSquare,
  Scale,
  Share2,
  Users,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { RepresentedPersonForm } from "@/components/people/RepresentedPersonForm";
import { ReferralLinkBanner } from "@/components/dashboard/ReferralLinkBanner";
import { Button } from "@/components/retroui/Button";
import { PresidentManagementSystemSection } from "@/components/tasks/PresidentManagementSystemSection";
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

interface DisclosureState {
  isOpen: boolean;
  openAndScroll: (id: string) => void;
  setIsOpen: (nextOpen: boolean) => void;
}

// Treaty-paper themed wrapper for the handle/referral-link card. Replaces the
// default brutal-yellow Card so it sits naturally inside the treaty layout.
const TREATY_BANNER_CLASSNAME =
  "relative border border-[var(--treaty-ink)]/40 bg-[var(--treaty-paper)] p-6 sm:p-8 shadow-none mb-8";

function getTaskDueMs(task: TaskCardTask) {
  if (!task.dueAt) return null;
  return task.dueAt instanceof Date
    ? task.dueAt.getTime()
    : new Date(task.dueAt).getTime();
}

function countOverdueTasks(tasks: TaskCardTask[]) {
  const now = Date.now();
  return tasks.filter((task) => {
    const dueMs = getTaskDueMs(task);
    return dueMs != null && dueMs < now;
  }).length;
}

function usePersistentDisclosure(storageKey: string, defaultOpen: boolean) {
  const [isOpen, setIsOpenState] = useState(defaultOpen);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored === "open") setIsOpenState(true);
      if (stored === "closed") setIsOpenState(false);
    } catch {
      // Local storage can be disabled. The dashboard still works.
    }
  }, [storageKey]);

  const setIsOpen = (nextOpen: boolean) => {
    setIsOpenState(nextOpen);
    try {
      window.localStorage.setItem(storageKey, nextOpen ? "open" : "closed");
    } catch {
      // Ignore storage failures; the current click still updates state.
    }
  };

  const openAndScroll = (id: string) => {
    setIsOpen(true);
    window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  };

  return { isOpen, openAndScroll, setIsOpen };
}

function DashboardAction({
  body,
  href,
  icon: Icon,
  onClick,
  title,
}: {
  body: string;
  href?: string;
  icon: ComponentType<{ className?: string }>;
  onClick?: () => void;
  title: string;
}) {
  const content = (
    <>
      <Icon className="h-5 w-5 stroke-[2.5px]" />
      <span>
        <span className="block text-sm font-black uppercase tracking-[0.12em]">
          {title}
        </span>
        <span className="mt-1 block text-sm font-bold leading-6 text-[var(--treaty-ink-soft)]">
          {body}
        </span>
      </span>
    </>
  );
  const className =
    "flex min-h-28 w-full items-start gap-3 border border-[var(--treaty-ink)]/40 bg-transparent p-4 text-left text-[var(--treaty-ink)] shadow-none transition-colors hover:bg-background";

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={className} onClick={onClick}>
      {content}
    </button>
  );
}

function DashboardActionGrid({
  onOpenPresidentManagement,
  onOpenTreaty,
  overdueCount,
}: {
  onOpenPresidentManagement: () => void;
  onOpenTreaty: () => void;
  overdueCount: number;
}) {
  const presidentBody =
    overdueCount > 0
      ? `${overdueCount} national leaders need a reminder.`
      : "Track leaders and remind them to sign.";

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <DashboardAction
        icon={Share2}
        title="Share Treaty"
        body="Copy your link and bring in verified votes."
        href="#dashboard-referral"
      />
      <DashboardAction
        icon={Landmark}
        title="Manage Presidents"
        body={presidentBody}
        onClick={onOpenPresidentManagement}
      />
      <DashboardAction
        icon={Scale}
        title="Add Plaintiffs"
        body="Register humans for Humanity v. Government."
        href={ROUTES.plaintiffs}
      />
      <DashboardAction
        icon={ClipboardList}
        title="Tasks"
        body="Claim work or remind the person responsible."
        href={ROUTES.tasks}
      />
      <DashboardAction
        icon={Users}
        title="Add Organization"
        body="Join the campaign as an organization."
        href={ROUTES.endorse}
      />
      <DashboardAction
        icon={MessageSquare}
        title="Feedback"
        body="Tell us what is confusing, irritating, or broken."
        href={ROUTES.feedback}
      />
      <DashboardAction
        icon={Scale}
        title="Read Treaty"
        body="Open the exact treaty text when you need it."
        onClick={onOpenTreaty}
      />
    </section>
  );
}

function DashboardDisclosure({
  body,
  children,
  id,
  state,
  title,
}: {
  body: string;
  children: ReactNode;
  id: string;
  state: DisclosureState;
  title: string;
}) {
  return (
    <section
      className="scroll-mt-6 border-t border-[var(--treaty-ink)]/30 pt-6"
      id={id}
    >
      <button
        type="button"
        className="flex w-full items-start justify-between gap-4 text-left text-[var(--treaty-ink)]"
        onClick={() => state.setIsOpen(!state.isOpen)}
        aria-expanded={state.isOpen}
      >
        <span>
          <span className="block text-2xl font-black uppercase leading-tight sm:text-3xl">
            {title}
          </span>
          <span className="mt-2 block max-w-2xl text-sm font-bold leading-6 text-[var(--treaty-ink-soft)] sm:text-base">
            {body}
          </span>
        </span>
        <span className="shrink-0 border border-[var(--treaty-ink)] px-3 py-2 text-xs font-black uppercase tracking-[0.14em]">
          {state.isOpen ? "Hide" : "Open"}
        </span>
      </button>
      {state.isOpen ? <div className="mt-6">{children}</div> : null}
    </section>
  );
}

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
  const overdueCount = countOverdueTasks(signerTasks);
  const presidentManagementState = usePersistentDisclosure(
    "dashboard:president-management",
    overdueCount > 0,
  );
  const treatyState = usePersistentDisclosure("dashboard:treaty-text", false);

  const refreshPage = () => {
    void updateSession();
    router.refresh();
  };

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

        <DashboardActionGrid
          overdueCount={overdueCount}
          onOpenPresidentManagement={() =>
            presidentManagementState.openAndScroll("president-management")
          }
          onOpenTreaty={() => treatyState.openAndScroll("dashboard-treaty")}
        />

        <section id="dashboard-referral" className="scroll-mt-6">
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
        </section>

        <DashboardDisclosure
          id="president-management"
          state={presidentManagementState}
          title="President Management System"
          body={
            overdueCount > 0
              ? `${overdueCount} national leaders have overdue treaty tasks. Open this when you are ready to remind them.`
              : "Track national leaders, remind the overdue ones, and register plaintiffs from one place."
          }
        >
          <PresidentManagementSystemSection
            showIntro={false}
            signerTasks={signerTasks}
            treatyProgram={treatyProgram}
          >
            <RepresentedPersonForm onCreated={refreshPage} />
          </PresidentManagementSystemSection>
        </DashboardDisclosure>

        <DashboardDisclosure
          id="dashboard-treaty"
          state={treatyState}
          title="The 1% Treaty"
          body="Read the treaty text when you need exact words for recruiting, board review, or a stubborn human."
        >
          <TreatyContent />
        </DashboardDisclosure>
      </div>
    </div>
  );
}
