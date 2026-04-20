import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DistributionPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/signin");
  if (!(session.user as { isAdmin?: boolean }).isAdmin) return <div>Not authorized</div>;

  const targets = await prisma.reasoningDistributionTarget.findMany({
    orderBy: [{ liveStatus: "asc" }, { ceilingEstimate: "desc" }],
  });
  const policy = await prisma.reasoningDistributionPolicyState.findMany();
  const byKey = new Map(
    policy.map((p) => [
      `${p.organizationId ?? ""}|${p.localeKey ?? ""}|${p.channel ?? ""}|${p.surface ?? ""}`,
      p,
    ]),
  );

  return (
    <div className="max-w-5xl mx-auto p-6">
      <Link href="/admin/reasoning" className="text-xs font-black uppercase underline">
        ← back
      </Link>
      <h1 className="text-3xl font-black uppercase mt-3 mb-6">Distribution</h1>

      <div className="border-4 border-primary">
        <table className="w-full text-xs">
          <thead className="bg-foreground text-background">
            <tr>
              <th className="text-left p-2">Org</th>
              <th className="text-left p-2">Locale</th>
              <th className="text-left p-2">Channel</th>
              <th className="text-left p-2">Surface</th>
              <th className="text-left p-2">Live</th>
              <th className="text-right p-2">Ceiling</th>
              <th className="text-right p-2">Yield</th>
              <th className="text-right p-2">Priority</th>
            </tr>
          </thead>
          <tbody>
            {targets.map((t) => {
              const k = `${t.organizationId ?? ""}|${t.localeKey ?? ""}|${t.channel ?? ""}|${t.surface ?? ""}`;
              const p = byKey.get(k);
              return (
                <tr key={t.id} className="border-t-2 border-primary">
                  <td className="p-2">{t.organizationId ?? "—"}</td>
                  <td className="p-2">{t.localeKey ?? "—"}</td>
                  <td className="p-2">{t.channel ?? "—"}</td>
                  <td className="p-2">{t.surface ?? "—"}</td>
                  <td className="p-2">{t.liveStatus}</td>
                  <td className="p-2 text-right">{t.ceilingEstimate.toLocaleString()}</td>
                  <td className="p-2 text-right">{p?.currentYield?.toFixed(3) ?? "—"}</td>
                  <td className="p-2 text-right">{p?.onboardingPriority?.toFixed(2) ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
