import { redirect } from "next/navigation";
import Link from "next/link";
import { OrganizationReferendumPositionStatus } from "@optimitron/db";
import { getCurrentUser } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { AdminPositionRow } from "./AdminPositionRow";

export const dynamic = "force-dynamic";

export default async function AdminReferendumPositionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; referendumSlug?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/signin?callbackUrl=/admin/referendum-positions");
  if (!user.isAdmin) {
    return (
      <section className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-3xl font-black uppercase">Admin only</h1>
      </section>
    );
  }

  const params = await searchParams;
  const statusFilter =
    params.status && params.status in OrganizationReferendumPositionStatus
      ? (params.status as OrganizationReferendumPositionStatus)
      : OrganizationReferendumPositionStatus.PENDING;

  const where: Record<string, unknown> = {
    status: statusFilter,
    deletedAt: null,
  };
  if (params.referendumSlug) {
    where.referendum = { slug: params.referendumSlug };
  }

  const positions = await prisma.organizationReferendumPosition.findMany({
    where,
    include: {
      organization: {
        select: { id: true, name: true, status: true, website: true },
      },
      referendum: { select: { id: true, slug: true, title: true } },
      submittedBy: {
        select: {
          id: true,
          email: true,
          person: { select: { displayName: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-black uppercase">
          Referendum positions ({statusFilter.toLowerCase()})
        </h1>
        <nav className="flex flex-wrap gap-2 text-xs font-bold uppercase">
          <Link
            href="/admin/communications"
            className="border-2 border-foreground px-3 py-1"
          >
            communications
          </Link>
          {Object.values(OrganizationReferendumPositionStatus).map((s) => (
            <Link
              key={s}
              href={`/admin/referendum-positions?status=${s}${
                params.referendumSlug
                  ? `&referendumSlug=${params.referendumSlug}`
                  : ""
              }`}
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

      {positions.length === 0 ? (
        <p className="text-sm font-bold text-muted-foreground">
          No positions in this bucket.
        </p>
      ) : (
        <ul className="space-y-3">
          {positions.map((p) => (
            <AdminPositionRow
              key={p.id}
              position={{
                id: p.id,
                orgName: p.organization.name,
                orgId: p.organization.id,
                orgStatus: p.organization.status,
                referendumTitle: p.referendum.title,
                referendumSlug: p.referendum.slug,
                positionValue: p.position,
                status: p.status,
                statement: p.statement,
                submittedBy:
                  p.submittedBy?.person?.displayName ??
                  p.submittedBy?.email ??
                  null,
              }}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
