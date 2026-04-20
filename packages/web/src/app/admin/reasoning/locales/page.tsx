import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LocalesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/signin");
  if (!(session.user as { isAdmin?: boolean }).isAdmin) return <div>Not authorized</div>;

  const locales = await prisma.reasoningLocaleConfig.findMany({
    orderBy: [{ enabled: "desc" }, { localeKey: "asc" }],
  });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Link href="/admin/reasoning" className="text-xs font-black uppercase underline">
        ← back
      </Link>
      <h1 className="text-3xl font-black uppercase mt-3 mb-6">Locales</h1>
      <div className="border-4 border-primary">
        <table className="w-full text-xs">
          <thead className="bg-foreground text-background">
            <tr>
              <th className="text-left p-2">Key</th>
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Enabled</th>
              <th className="text-right p-2">Audience</th>
              <th className="text-left p-2">Fallback</th>
              <th className="text-left p-2">Banned phrases</th>
            </tr>
          </thead>
          <tbody>
            {locales.map((l) => (
              <tr key={l.id} className="border-t-2 border-primary">
                <td className="p-2 font-bold">{l.localeKey}</td>
                <td className="p-2">{l.displayName}</td>
                <td className="p-2">{l.enabled ? "✓" : "—"}</td>
                <td className="p-2 text-right">
                  {l.audienceEstimate?.toLocaleString() ?? "—"}
                </td>
                <td className="p-2">{l.fallbackChain.join(",") || "—"}</td>
                <td className="p-2">
                  {Array.isArray(l.bannedPhrases) ? (l.bannedPhrases as string[]).length : 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Edit via <code>PUT /api/admin/reasoning/locales</code> — no schema change required.
      </p>
    </div>
  );
}
