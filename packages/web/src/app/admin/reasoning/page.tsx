/**
 * /admin/reasoning — variant set list + health summary.
 */

import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ReasoningAdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/admin/reasoning");
  if (!(session.user as { isAdmin?: boolean }).isAdmin) {
    return <AccessDenied />;
  }

  const variantSets = await prisma.reasoningVariantSet.findMany({
    orderBy: [{ isCanonical: "desc" }, { name: "asc" }],
    include: {
      _count: { select: { arms: true } },
    },
  });
  const systemState = await prisma.reasoningSystemState.findUnique({
    where: { id: "singleton" },
  });
  const latestRGuard = await prisma.reasoningRGuardSnapshot.findFirst({
    orderBy: { snapshotAt: "desc" },
  });

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-black uppercase mb-6">
        Reasoning Admin
      </h1>

      <SystemHealthCard
        frozen={systemState?.allocatorForceCanonical ?? false}
        promoterFrozen={systemState?.promoterFrozen ?? false}
        topologyGateOpen={systemState?.topologyGateOpen ?? false}
        latestR={latestRGuard?.rSevenDay ?? null}
      />

      <div className="mb-4 flex gap-3 flex-wrap text-sm font-black uppercase">
        <Link href="/admin/reasoning/leaderboard" className="underline">
          Leaderboard
        </Link>
        <Link href="/admin/reasoning/r-guard" className="underline">
          R-Guard
        </Link>
        <Link href="/admin/reasoning/distribution" className="underline">
          Distribution
        </Link>
        <Link href="/admin/reasoning/locales" className="underline">
          Locales
        </Link>
        <Link href="/admin/reasoning/orgs" className="underline">
          Org forks
        </Link>
      </div>

      <h2 className="text-xl font-black uppercase mt-8 mb-3">Variant Sets</h2>
      <div className="border-4 border-primary">
        <table className="w-full">
          <thead className="bg-foreground text-background">
            <tr>
              <th className="text-left p-2 text-xs font-black uppercase">Name</th>
              <th className="text-left p-2 text-xs font-black uppercase">Status</th>
              <th className="text-left p-2 text-xs font-black uppercase">Arms</th>
              <th className="text-left p-2 text-xs font-black uppercase">Canonical?</th>
              <th className="text-left p-2 text-xs font-black uppercase">Org</th>
            </tr>
          </thead>
          <tbody>
            {variantSets.map((v) => (
              <tr key={v.id} className="border-t-2 border-primary">
                <td className="p-2 font-bold">
                  <Link
                    href={`/admin/reasoning/${v.id}`}
                    className="underline"
                  >
                    {v.name}
                  </Link>
                </td>
                <td className="p-2 text-xs">{v.status}</td>
                <td className="p-2 text-xs">{v._count.arms}</td>
                <td className="p-2 text-xs">{v.isCanonical ? "✓" : ""}</td>
                <td className="p-2 text-xs">{v.organizationId ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SystemHealthCard({
  frozen,
  promoterFrozen,
  topologyGateOpen,
  latestR,
}: {
  frozen: boolean;
  promoterFrozen: boolean;
  topologyGateOpen: boolean;
  latestR: number | null;
}) {
  return (
    <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
      <HealthCell
        label="Allocator"
        value={frozen ? "FORCE CANONICAL" : "normal"}
        bad={frozen}
      />
      <HealthCell
        label="Promoter"
        value={promoterFrozen ? "FROZEN" : "normal"}
        bad={promoterFrozen}
      />
      <HealthCell
        label="Topology gate"
        value={topologyGateOpen ? "OPEN" : "closed"}
        bad={false}
      />
      <HealthCell
        label="R (7d)"
        value={latestR !== null ? latestR.toFixed(3) : "—"}
        bad={latestR !== null && latestR < 0.7}
      />
    </div>
  );
}

function HealthCell({ label, value, bad }: { label: string; value: string; bad: boolean }) {
  return (
    <div
      className={`border-4 border-primary p-3 ${
        bad
          ? "bg-brutal-red text-brutal-red-foreground"
          : "bg-brutal-green text-brutal-green-foreground"
      }`}
    >
      <div className="text-xs font-black uppercase">{label}</div>
      <div className="text-sm font-black">{value}</div>
    </div>
  );
}

function AccessDenied() {
  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-3xl font-black uppercase">Access denied</h1>
      <p className="mt-4 font-bold">Admin only.</p>
    </div>
  );
}
