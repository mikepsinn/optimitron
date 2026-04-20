import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function OrgsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/signin");
  if (!(session.user as { isAdmin?: boolean }).isAdmin) return <div>Not authorized</div>;

  const forks = await prisma.reasoningOrgFork.findMany({
    include: { variantSet: true },
  });
  const domains = await prisma.reasoningOrganizationDomain.findMany({
    orderBy: { organizationId: "asc" },
  });

  return (
    <div className="max-w-5xl mx-auto p-6">
      <Link href="/admin/reasoning" className="text-xs font-black uppercase underline">
        ← back
      </Link>
      <h1 className="text-3xl font-black uppercase mt-3 mb-6">Org Forks</h1>

      <h2 className="text-lg font-black uppercase mb-2">Forks</h2>
      {forks.length === 0 ? (
        <p className="text-sm text-muted-foreground mb-6">No org forks yet.</p>
      ) : (
        <ul className="mb-6 space-y-1 text-xs">
          {forks.map((f) => (
            <li key={f.id}>
              <span className="font-mono">{f.organizationId}</span> → {f.variantSet.name}{" "}
              ({f.allowedSlots.join(", ")})
            </li>
          ))}
        </ul>
      )}

      <h2 className="text-lg font-black uppercase mb-2">Organization Domains</h2>
      {domains.length === 0 ? (
        <p className="text-sm text-muted-foreground">No org-hosted domains registered.</p>
      ) : (
        <div className="border-4 border-primary">
          <table className="w-full text-xs">
            <thead className="bg-foreground text-background">
              <tr>
                <th className="text-left p-2">Org</th>
                <th className="text-left p-2">Host</th>
                <th className="text-left p-2">Surface</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">CNAME</th>
                <th className="text-left p-2">TLS</th>
              </tr>
            </thead>
            <tbody>
              {domains.map((d) => (
                <tr key={d.id} className="border-t-2 border-primary">
                  <td className="p-2">{d.organizationId}</td>
                  <td className="p-2 font-bold">{d.host}</td>
                  <td className="p-2">{d.surfaceType}</td>
                  <td className="p-2">{d.status}</td>
                  <td className="p-2">{d.cnameVerified ? "✓" : "—"}</td>
                  <td className="p-2">{d.tlsVerified ? "✓" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
