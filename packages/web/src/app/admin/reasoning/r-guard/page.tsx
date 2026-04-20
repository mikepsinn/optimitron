import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function RGuardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/signin");
  if (!(session.user as { isAdmin?: boolean }).isAdmin) return <div>Not authorized</div>;

  const snapshots = await prisma.reasoningRGuardSnapshot.findMany({
    orderBy: { snapshotAt: "desc" },
    take: 50,
  });
  const cvSnapshots = await prisma.reasoningChainValueGuardSnapshot.findMany({
    orderBy: { snapshotAt: "desc" },
    take: 50,
  });
  const systemState = await prisma.reasoningSystemState.findUnique({
    where: { id: "singleton" },
  });

  return (
    <div className="max-w-5xl mx-auto p-6">
      <Link href="/admin/reasoning" className="text-xs font-black uppercase underline">
        ← back
      </Link>
      <h1 className="text-3xl font-black uppercase mt-3 mb-6">R-Guard + Chain-Value Guard</h1>

      <div className="mb-4 p-4 border-4 border-primary">
        <h2 className="text-sm font-black uppercase mb-2">System state</h2>
        <p className="text-xs">allocatorForceCanonical: {String(systemState?.allocatorForceCanonical ?? false)}</p>
        <p className="text-xs">promoterFrozen: {String(systemState?.promoterFrozen ?? false)}</p>
        <p className="text-xs">topologyGateOpen: {String(systemState?.topologyGateOpen ?? false)}</p>
        <p className="text-xs">lastFreezeReason: {systemState?.lastFreezeReason ?? "—"}</p>
      </div>

      <h2 className="text-lg font-black uppercase mb-2">R snapshots</h2>
      <ul className="mb-6 space-y-1 text-xs">
        {snapshots.map((s) => (
          <li key={s.id} className={s.triggeredRevert ? "text-brutal-red font-black" : ""}>
            {s.snapshotAt.toISOString()} — R(7d): {s.rSevenDay.toFixed(4)}
            {s.triggeredRevert ? " — TRIGGERED REVERT" : ""}
          </li>
        ))}
      </ul>

      <h2 className="text-lg font-black uppercase mb-2">Chain-value guard snapshots</h2>
      <ul className="space-y-1 text-xs">
        {cvSnapshots.map((s) => (
          <li key={s.id} className={s.triggeredRevert ? "text-brutal-red font-black" : ""}>
            {s.snapshotAt.toISOString()} — Δ%: {(s.deltaPct * 100).toFixed(2)}%
            {s.triggeredRevert ? " — TRIGGERED REVERT" : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}
