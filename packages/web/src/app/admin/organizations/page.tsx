import { redirect } from "next/navigation";
import Link from "next/link";
import { OrgStatus } from "@optimitron/db";
import { getCurrentUser } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { AdminOrgRow } from "./AdminOrgRow";

export const dynamic = "force-dynamic";

export default async function AdminOrganizationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/signin?callbackUrl=/admin/organizations");
  if (!user.isAdmin) {
    return (
      <section className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-3xl font-black uppercase">Admin only</h1>
      </section>
    );
  }

  const params = await searchParams;
  const statusFilter =
    params.status && params.status in OrgStatus
      ? (params.status as OrgStatus)
      : OrgStatus.PENDING;

  const orgs = await prisma.organization.findMany({
    where: { status: statusFilter, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-black uppercase">
          Organizations ({statusFilter.toLowerCase()})
        </h1>
        <nav className="flex gap-2 text-xs font-bold uppercase">
          {Object.values(OrgStatus).map((s) => (
            <Link
              key={s}
              href={`/admin/organizations?status=${s}`}
              className={`border-2 border-foreground px-3 py-1 ${
                s === statusFilter
                  ? "bg-foreground text-background"
                  : "bg-background text-foreground"
              }`}
            >
              {s.toLowerCase()}
            </Link>
          ))}
        </nav>
      </header>

      {orgs.length === 0 ? (
        <p className="text-sm font-bold text-muted-foreground">
          No organizations in this bucket.
        </p>
      ) : (
        <table className="w-full border-collapse text-sm font-bold">
          <thead>
            <tr className="border-b-2 border-foreground">
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Type</th>
              <th className="p-2 text-left">Website</th>
              <th className="p-2 text-left">Created</th>
              <th className="p-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orgs.map((o) => (
              <AdminOrgRow
                key={o.id}
                org={{
                  id: o.id,
                  name: o.name,
                  type: o.type,
                  website: o.website,
                  status: o.status,
                  createdAt: o.createdAt.toISOString(),
                }}
              />
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
