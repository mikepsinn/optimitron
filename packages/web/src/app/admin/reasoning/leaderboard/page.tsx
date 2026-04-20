import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { topArmsForSlot, underperformingArms } from "@/lib/reasoning/winners.server";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/signin");
  if (!(session.user as { isAdmin?: boolean }).isAdmin) return <div>Not authorized</div>;

  const slots = ["HANDOFF", "CHAIN_NODE", "OBJECTION_NODE", "REPLICATION_CTA"] as const;
  const topBySlot = await Promise.all(slots.map((s) => topArmsForSlot({ slot: s, limit: 5 })));
  const under = await underperformingArms({ limit: 10 });

  return (
    <div className="max-w-5xl mx-auto p-6">
      <Link href="/admin/reasoning" className="text-xs font-black uppercase underline">
        ← back
      </Link>
      <h1 className="text-3xl font-black uppercase mt-3 mb-6">Leaderboard</h1>

      {slots.map((slot, i) => (
        <section key={slot} className="mb-6">
          <h2 className="text-lg font-black uppercase mb-2">{slot} — top 5</h2>
          {topBySlot[i]!.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No HoldoutComparison rows yet for this slot.
            </p>
          ) : (
            <div className="border-4 border-primary">
              <table className="w-full text-xs">
                <thead className="bg-foreground text-background">
                  <tr>
                    <th className="text-left p-2">armId</th>
                    <th className="text-right p-2">lift</th>
                    <th className="text-right p-2">CI lower</th>
                    <th className="text-right p-2">CI upper</th>
                    <th className="text-right p-2">N</th>
                  </tr>
                </thead>
                <tbody>
                  {topBySlot[i]!.map((e) => (
                    <tr key={e.armId} className="border-t-2 border-primary">
                      <td className="p-2 font-mono">{e.armId.slice(0, 12)}</td>
                      <td className="p-2 text-right font-black">{e.liftPointEstimate.toFixed(3)}</td>
                      <td className="p-2 text-right">{e.liftCiLower.toFixed(3)}</td>
                      <td className="p-2 text-right">{e.liftCiUpper.toFixed(3)}</td>
                      <td className="p-2 text-right">{e.armExposures}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}

      <section className="mt-8">
        <h2 className="text-lg font-black uppercase mb-2">Retirement suggestions</h2>
        {under.length === 0 ? (
          <p className="text-sm text-muted-foreground">No arms flagged for retirement.</p>
        ) : (
          <ul className="space-y-1 text-xs">
            {under.map((u) => (
              <li key={u.armId}>
                <span className="font-mono">{u.armId.slice(0, 12)}</span> — upper CI{" "}
                <span className="font-black text-brutal-red">{u.liftCiUpper.toFixed(3)}</span>{" "}
                (N={u.armExposures})
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
