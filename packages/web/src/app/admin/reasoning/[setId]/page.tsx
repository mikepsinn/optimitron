/**
 * /admin/reasoning/[setId] — arm list + per-slot counts.
 */

import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function VariantSetDetailPage({
  params,
}: {
  params: Promise<{ setId: string }>;
}) {
  const { setId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/signin");
  if (!(session.user as { isAdmin?: boolean }).isAdmin) return <div>Not authorized</div>;

  const set = await prisma.reasoningVariantSet.findUnique({
    where: { id: setId },
    include: {
      arms: {
        orderBy: [{ slot: "asc" }, { slotKey: "asc" }, { armKey: "asc" }],
      },
    },
  });
  if (!set) return notFound();

  const bySlot: Record<string, typeof set.arms> = {};
  for (const arm of set.arms) {
    bySlot[arm.slot] ??= [];
    bySlot[arm.slot]!.push(arm);
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <Link href="/admin/reasoning" className="text-xs font-black uppercase underline">
        ← back
      </Link>
      <h1 className="text-3xl font-black uppercase mt-3 mb-1">{set.name}</h1>
      <p className="text-sm text-muted-foreground mb-6">
        {set.description} · Status: {set.status}
        {set.isCanonical ? " · CANONICAL" : ""}
      </p>

      {Object.entries(bySlot).map(([slot, arms]) => (
        <section key={slot} className="mb-6">
          <h2 className="text-lg font-black uppercase mb-2">{slot}</h2>
          <div className="border-4 border-primary">
            <table className="w-full text-xs">
              <thead className="bg-foreground text-background">
                <tr>
                  <th className="text-left p-2">SlotKey</th>
                  <th className="text-left p-2">Channel</th>
                  <th className="text-left p-2">Locale</th>
                  <th className="text-left p-2">ArmKey</th>
                  <th className="text-left p-2">Family</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Tier</th>
                  <th className="text-left p-2">Shadow</th>
                </tr>
              </thead>
              <tbody>
                {arms.map((arm) => (
                  <tr key={arm.id} className="border-t-2 border-primary">
                    <td className="p-2 font-bold">{arm.slotKey}</td>
                    <td className="p-2">{arm.channel ?? "—"}</td>
                    <td className="p-2">{arm.localeKey}</td>
                    <td className="p-2">{arm.armKey}</td>
                    <td className="p-2">{arm.family}</td>
                    <td className="p-2">{arm.status}</td>
                    <td className="p-2">{arm.riskTier}</td>
                    <td className="p-2">
                      {arm.shadowGatePassed === null ? "—" : arm.shadowGatePassed ? "✓" : "✗"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
