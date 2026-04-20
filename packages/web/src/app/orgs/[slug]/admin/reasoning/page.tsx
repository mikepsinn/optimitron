/**
 * /orgs/[slug]/admin/reasoning — self-serve org admin.
 *
 * Scoped to the org identified by `slug`. Server-side permission check
 * via OrgFork + session membership. Edit surface limited to the org's
 * `allowedSlots`.
 */

import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function OrgAdminPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect(`/auth/signin?callbackUrl=/orgs/${slug}/admin/reasoning`);

  const org = await prisma.organization.findUnique({
    where: { slug },
  });
  if (!org) return notFound();

  const membership = await prisma.organizationMember.findFirst({
    where: { organizationId: org.id, userId: session.user.id },
  });
  if (!membership) return <NotAuthorized />;

  const fork = await prisma.reasoningOrgFork.findUnique({
    where: { organizationId: org.id },
    include: {
      variantSet: {
        include: {
          arms: { orderBy: [{ slot: "asc" }, { slotKey: "asc" }] },
        },
      },
    },
  });

  if (!fork) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-3xl font-black uppercase mb-3">{org.name}</h1>
        <p className="text-sm text-muted-foreground">
          No reasoning fork yet. An admin must create one via
          <code className="ml-1">POST /api/admin/reasoning/orgs</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-black uppercase mb-1">
        {org.name} · Reasoning
      </h1>
      <p className="text-sm text-muted-foreground mb-4">
        Variant set: <span className="font-black">{fork.variantSet.name}</span>{" "}
        · Editable slots: {fork.allowedSlots.join(", ")}
      </p>

      <div className="mb-6 flex gap-3 text-xs font-black uppercase">
        <Link href={`/orgs/${slug}/admin/reasoning/leaderboard`} className="underline">
          Leaderboard
        </Link>
      </div>

      <h2 className="text-lg font-black uppercase mb-2">Arms</h2>
      <div className="border-4 border-primary">
        <table className="w-full text-xs">
          <thead className="bg-foreground text-background">
            <tr>
              <th className="text-left p-2">Slot</th>
              <th className="text-left p-2">SlotKey</th>
              <th className="text-left p-2">Locale</th>
              <th className="text-left p-2">ArmKey</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Editable?</th>
            </tr>
          </thead>
          <tbody>
            {fork.variantSet.arms.map((a) => {
              const editable = fork.allowedSlots.includes(a.slot);
              return (
                <tr key={a.id} className="border-t-2 border-primary">
                  <td className="p-2">{a.slot}</td>
                  <td className="p-2 font-bold">{a.slotKey}</td>
                  <td className="p-2">{a.localeKey}</td>
                  <td className="p-2">{a.armKey}</td>
                  <td className="p-2">{a.status}</td>
                  <td className="p-2">{editable ? "✓" : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NotAuthorized() {
  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-3xl font-black uppercase">Not a member</h1>
      <p className="mt-3 font-bold">
        You must be a member of this organization to access its reasoning admin.
      </p>
    </div>
  );
}
