"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface PositionRow {
  id: string;
  orgName: string;
  orgId: string;
  orgStatus: string;
  referendumTitle: string;
  referendumSlug: string;
  positionValue: string;
  status: string;
  statement: string | null;
  submittedBy: string | null;
}

export function AdminPositionRow({ position }: { position: PositionRow }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  async function patch(status: "APPROVED" | "REJECTED") {
    setPending(status);
    try {
      const res = await fetch(
        `/api/admin/referendum-positions/${position.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      if (res.ok) router.refresh();
    } finally {
      setPending(null);
    }
  }

  return (
    <li className="border-2 border-foreground bg-background p-4 text-sm font-bold">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-lg font-black uppercase text-foreground">
            {position.orgName}{" "}
            <span className="text-xs text-muted-foreground">
              (org: {position.orgStatus.toLowerCase()})
            </span>
          </p>
          <p className="text-muted-foreground">
            {position.referendumTitle} · {position.positionValue}
          </p>
          {position.statement ? (
            <p className="mt-2 italic text-muted-foreground">
              &ldquo;{position.statement}&rdquo;
            </p>
          ) : null}
          {position.submittedBy ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Submitted by {position.submittedBy}
            </p>
          ) : null}
          <Link
            href={`/organizations/${position.orgId}`}
            className="mt-2 inline-block text-xs underline"
          >
            Inspect org
          </Link>
        </div>
        <div className="flex flex-shrink-0 flex-col gap-2">
          <button
            type="button"
            onClick={() => patch("APPROVED")}
            disabled={pending !== null || position.status === "APPROVED"}
            className="border-2 border-foreground bg-brutal-green px-3 py-1 text-xs font-black uppercase disabled:opacity-40"
          >
            {pending === "APPROVED" ? "…" : "Approve"}
          </button>
          <button
            type="button"
            onClick={() => patch("REJECTED")}
            disabled={pending !== null || position.status === "REJECTED"}
            className="border-2 border-foreground bg-brutal-red px-3 py-1 text-xs font-black uppercase text-background disabled:opacity-40"
          >
            {pending === "REJECTED" ? "…" : "Reject"}
          </button>
        </div>
      </div>
    </li>
  );
}
