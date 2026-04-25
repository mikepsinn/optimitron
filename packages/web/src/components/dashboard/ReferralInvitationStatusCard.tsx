"use client";

import Link from "next/link";
import { CheckCircle2, Clipboard, Mail, Send, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/retroui/Button";
import { Card } from "@/components/retroui/Card";
import { ROUTES } from "@/lib/routes";

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
  recipientEmailStep: number;
  nextRecipientEmailAt: string | null;
}

function getStatusCopy(invitation: ReferralInvitationSummary) {
  if (invitation.status === "CONVERTED") {
    return {
      bgClass: "bg-brutal-cyan text-brutal-cyan-foreground",
      icon: CheckCircle2,
      label: "Confirmed",
    };
  }
  if (invitation.status === "SENT") {
    return {
      bgClass: "bg-brutal-yellow text-brutal-yellow-foreground",
      icon: Mail,
      label: "Email sent",
    };
  }
  if (invitation.status === "COPIED") {
    return {
      bgClass: "bg-brutal-pink text-brutal-pink-foreground",
      icon: Clipboard,
      label: "Copied",
    };
  }
  if (invitation.status === "DECLINED" || invitation.status === "CANCELLED") {
    return {
      bgClass: "bg-primary text-primary-foreground",
      icon: XCircle,
      label: invitation.status === "DECLINED" ? "Declined" : "Cancelled",
    };
  }
  return {
    bgClass: "bg-background text-foreground",
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

export function ReferralInvitationStatusCard() {
  const [invitations, setInvitations] = useState<ReferralInvitationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void fetch("/api/referral-invitations")
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

  const visibleInvitations = useMemo(() => invitations.slice(0, 8), [invitations]);

  if (isLoading || visibleInvitations.length === 0) {
    return null;
  }

  const confirmedCount = invitations.filter((invitation) => invitation.status === "CONVERTED").length;
  const pendingCount = invitations.length - confirmedCount;

  return (
    <Card className="overflow-hidden border-4 border-primary bg-background p-0 text-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <div className="border-b-4 border-primary bg-brutal-cyan px-5 py-4 text-brutal-cyan-foreground">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-xl font-black uppercase leading-tight">
              Tracked Invitations
            </h3>
            <p className="text-sm font-bold leading-snug">
              {confirmedCount} confirmed. {pendingCount} pending.
            </p>
          </div>
          <Link className="text-sm font-black uppercase underline" href={ROUTES.tasks}>
            View tasks
          </Link>
        </div>
      </div>

      <div className="divide-y-4 divide-primary">
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
                  <span className={`inline-flex items-center gap-1 border-4 border-primary px-2 py-1 text-[10px] font-black uppercase ${statusCopy.bgClass}`}>
                    <StatusIcon className="h-3 w-3 stroke-[3px]" aria-hidden="true" />
                    {statusCopy.label}
                  </span>
                </div>
                <p className="mt-1 text-xs font-bold uppercase text-muted-foreground">
                  {invitation.recipientEmail
                    ? `${invitation.recipientEmail} · ${invitation.recipientEmailStep}/4 reminders`
                    : "Copy invitation"}
                  {activityDate ? ` · ${activityDate}` : ""}
                </p>
              </div>

              {invitation.taskId ? (
                <Button
                  asChild
                  className="h-10 justify-center border-4 border-primary bg-background px-3 text-xs font-black uppercase text-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
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
