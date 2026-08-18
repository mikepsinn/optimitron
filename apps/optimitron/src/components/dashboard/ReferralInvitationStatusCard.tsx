"use client";

import Link from "next/link";
import { CheckCircle2, Clipboard, Mail, Send, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/retroui/Button";
import { Card } from "@/components/retroui/Card";
import { API_ROUTES } from "@/lib/api-routes";
import { ROUTES } from "@/lib/routes";
import { FLOW_VOTER_LIVES_SAVED_ROUNDED } from "@/lib/treaty-share-flow-parameters";

type ReferralInvitationStatus =
  | "PENDING"
  | "COPIED"
  | "SENT"
  | "CONVERTED"
  | "DECLINED"
  | "CANCELLED";

interface ReferralInvitationSummary {
  id: string;
  recipientName: string;
  recipientEmail: string | null;
  status: ReferralInvitationStatus;
  taskId: string | null;
  copiedAt: string | null;
  sentAt: string | null;
  convertedAt: string | null;
}

type ReferralInvitationFilter =
  | "all"
  | "pending"
  | "copied"
  | "sent"
  | "confirmed"
  | "closed";

const FILTERS: Array<{ key: ReferralInvitationFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "copied", label: "Copied" },
  { key: "sent", label: "Sent" },
  { key: "confirmed", label: "Confirmed" },
  { key: "closed", label: "Closed" },
];

function matchesFilter(
  invitation: ReferralInvitationSummary,
  filter: ReferralInvitationFilter,
) {
  if (filter === "all") return true;
  if (filter === "pending") return invitation.status === "PENDING";
  if (filter === "copied") return invitation.status === "COPIED";
  if (filter === "sent") return invitation.status === "SENT";
  if (filter === "confirmed") return invitation.status === "CONVERTED";
  return invitation.status === "DECLINED" || invitation.status === "CANCELLED";
}

function getStatusCopy(invitation: ReferralInvitationSummary) {
  if (invitation.status === "CONVERTED") {
    return {
      bgClass: "bg-transparent text-[var(--treaty-ink)]",
      icon: CheckCircle2,
      label: "Confirmed",
    };
  }
  if (invitation.status === "SENT") {
    return {
      bgClass: "bg-transparent text-[var(--treaty-ink)]",
      icon: Mail,
      label: "Email sent",
    };
  }
  if (invitation.status === "COPIED") {
    return {
      bgClass: "bg-transparent text-[var(--treaty-ink)]",
      icon: Clipboard,
      label: "Copied",
    };
  }
  if (invitation.status === "DECLINED" || invitation.status === "CANCELLED") {
    return {
      bgClass: "bg-transparent text-[var(--treaty-ink-muted)]",
      icon: XCircle,
      label: invitation.status === "DECLINED" ? "Declined" : "Cancelled",
    };
  }
  return {
    bgClass: "bg-transparent text-[var(--treaty-ink)]",
    icon: Send,
    label: "Pending",
  };
}

function formatDate(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

function formatLives(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}

export function ReferralInvitationStatusCard() {
  const [invitations, setInvitations] = useState<ReferralInvitationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<ReferralInvitationFilter>("all");

  useEffect(() => {
    let cancelled = false;

    void fetch(API_ROUTES.referralInvitations.root)
      .then(async (response) => {
        if (!response.ok) return [];
        const payload = (await response.json()) as {
          invitations?: ReferralInvitationSummary[];
        };
        return payload.invitations ?? [];
      })
      .then((items) => {
        if (!cancelled) {
          setInvitations(items);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setInvitations([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredInvitations = useMemo(
    () => invitations.filter((invitation) => matchesFilter(invitation, filter)),
    [filter, invitations],
  );
  const visibleInvitations = useMemo(
    () => filteredInvitations.slice(0, 8),
    [filteredInvitations],
  );

  if (isLoading || invitations.length === 0) {
    return null;
  }

  const confirmedCount = invitations.filter((invitation) => invitation.status === "CONVERTED").length;
  const pendingCount = invitations.filter((invitation) =>
    ["PENDING", "COPIED", "SENT"].includes(invitation.status),
  ).length;
  const closedCount = invitations.length - confirmedCount - pendingCount;
  const confirmedLives = formatLives(
    confirmedCount * FLOW_VOTER_LIVES_SAVED_ROUNDED.value,
  );
  const pendingLives = formatLives(
    pendingCount * FLOW_VOTER_LIVES_SAVED_ROUNDED.value,
  );

  return (
    <Card className="overflow-hidden border border-[var(--treaty-ink)] bg-[var(--treaty-paper)] p-0 text-[var(--treaty-ink)] shadow-none">
      <div className="border-b border-[var(--treaty-ink)]/30 px-5 py-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-lg font-black uppercase leading-tight tracking-tight">
              Earth Optimization Tasks
            </h3>
            <p className="text-sm font-bold leading-6 text-[var(--treaty-ink-soft)]">
              {confirmedCount} confirmed. {pendingCount} pending.
              {closedCount > 0 ? ` ${closedCount} closed.` : ""}
            </p>
            <p className="text-xs font-black uppercase leading-5 tracking-[0.12em] text-[var(--treaty-ink-muted)]">
              Inverse Kills Score: {confirmedLives} confirmed lives. {pendingLives} pending lives.
            </p>
          </div>
          <Link className="text-sm font-black uppercase underline underline-offset-4" href={ROUTES.tasks}>
            View tasks
          </Link>
        </div>
      </div>

      <div className="border-b border-[var(--treaty-ink)]/30 px-5 py-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              className={
                item.key === filter
                  ? "border border-[var(--treaty-ink)] bg-[var(--treaty-ink)] px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#fffaf0]"
                  : "border border-[var(--treaty-ink)] bg-transparent px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[var(--treaty-ink)]"
              }
              key={item.key}
              onClick={() => setFilter(item.key)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-[var(--treaty-ink)]/20">
        {visibleInvitations.length === 0 ? (
          <p className="px-5 py-4 text-sm font-black uppercase text-[var(--treaty-ink-muted)]">
            No Earth optimization tasks in this state.
          </p>
        ) : null}
        {visibleInvitations.map((invitation) => {
          const statusCopy = getStatusCopy(invitation);
          const StatusIcon = statusCopy.icon;
          const activityDate =
            formatDate(invitation.convertedAt) ??
            formatDate(invitation.sentAt) ??
            formatDate(invitation.copiedAt);

          return (
            <div
              className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center"
              key={invitation.id}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-base font-black">
                    {invitation.recipientName}
                  </span>
                  <span className={`inline-flex items-center gap-1 border border-[var(--treaty-ink)]/40 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${statusCopy.bgClass}`}>
                    <StatusIcon className="h-3 w-3 stroke-[3px]" aria-hidden="true" />
                    {statusCopy.label}
                  </span>
                </div>
                <p className="mt-1 text-xs font-bold uppercase text-[var(--treaty-ink-muted)]">
                  {invitation.recipientEmail ?? "Copy invitation"}
                  {activityDate ? ` · ${activityDate}` : ""}
                </p>
              </div>

              {invitation.taskId ? (
                <Button
                  asChild
                  className="h-10 justify-center border border-[var(--treaty-ink)] bg-transparent px-3 text-xs font-black uppercase tracking-[0.12em] text-[var(--treaty-ink)] shadow-none hover:translate-x-0 hover:translate-y-0 hover:bg-[#efe4cf]"
                >
                  <Link href={`${ROUTES.tasks}/${invitation.taskId}`}>
                    Task
                  </Link>
                </Button>
              ) : null}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
