"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface OrgRow {
  id: string;
  name: string;
  type: string;
  website: string | null;
  status: string;
  createdAt: string;
}

export function AdminOrgRow({ org }: { org: OrgRow }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  async function patch(status: "APPROVED" | "REJECTED") {
    setPending(status);
    try {
      const res = await fetch(`/api/admin/organizations/${org.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) router.refresh();
    } finally {
      setPending(null);
    }
  }

  return (
    <tr className="border-b border-foreground">
      <td className="p-2">{org.name}</td>
      <td className="p-2 text-muted-foreground">{org.type}</td>
      <td className="p-2 text-muted-foreground">
        {org.website ? (
          <a className="underline" href={org.website} rel="noreferrer">
            link
          </a>
        ) : (
          "—"
        )}
      </td>
      <td className="p-2 text-muted-foreground">
        {new Date(org.createdAt).toLocaleDateString()}
      </td>
      <td className="p-2 text-right">
        <button
          type="button"
          onClick={() => patch("APPROVED")}
          disabled={pending !== null || org.status === "APPROVED"}
          className="mr-2 border-2 border-foreground bg-brutal-green px-3 py-1 text-xs font-black uppercase disabled:opacity-40"
        >
          {pending === "APPROVED" ? "…" : "Approve"}
        </button>
        <button
          type="button"
          onClick={() => patch("REJECTED")}
          disabled={pending !== null || org.status === "REJECTED"}
          className="border-2 border-foreground bg-brutal-red px-3 py-1 text-xs font-black uppercase text-background disabled:opacity-40"
        >
          {pending === "REJECTED" ? "…" : "Reject"}
        </button>
      </td>
    </tr>
  );
}
