import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth-utils";
import { canManageOrganization } from "@/lib/organization.server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function OrganizationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(`/organizations/${id}`)}`);
  }

  const [canManage, org] = await Promise.all([
    canManageOrganization(user.id, id),
    prisma.organization.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { joinedAt: "asc" },
        },
        referendumPositions: {
          where: { deletedAt: null },
          include: {
            referendum: { select: { id: true, slug: true, title: true } },
          },
          orderBy: { updatedAt: "desc" },
        },
      },
    }),
  ]);

  if (!org || org.deletedAt) notFound();

  const isAllowed = canManage || user.isAdmin;
  if (!isAllowed) {
    return (
      <section className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-3xl font-black uppercase text-foreground">
          Access denied
        </h1>
        <p className="mt-4 font-bold text-muted-foreground">
          You are not a manager of this organization.
        </p>
        <Link href="/" className="mt-6 inline-block underline font-bold">
          Return home
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-16">
      <header className="mb-10 border-b-2 border-foreground pb-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Organization · {org.status.toLowerCase()}
        </p>
        <h1 className="text-3xl font-black uppercase text-foreground sm:text-4xl [font-family:var(--v0-font-libre-baskerville)]">
          {org.name}
        </h1>
        {org.website ? (
          <a
            href={org.website}
            rel="noreferrer"
            className="mt-2 inline-block text-sm font-bold underline text-muted-foreground"
          >
            {org.website}
          </a>
        ) : null}
      </header>

      <div className="space-y-10">
        <div>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Profile
          </h2>
          <dl className="space-y-2 text-base font-bold text-foreground">
            <div>
              <dt className="inline text-muted-foreground">Type: </dt>
              <dd className="inline">{org.type}</dd>
            </div>
            <div>
              <dt className="inline text-muted-foreground">Contact: </dt>
              <dd className="inline">{org.contactEmail ?? "—"}</dd>
            </div>
            {org.description ? (
              <div>
                <dt className="inline text-muted-foreground">About: </dt>
                <dd className="inline">{org.description}</dd>
              </div>
            ) : null}
          </dl>
        </div>

        <div>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Members
          </h2>
          <ul className="space-y-2">
            {org.members.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between border-2 border-foreground bg-background px-3 py-2 text-sm font-bold"
              >
                <span>{m.user.name ?? m.user.email ?? m.user.id}</span>
                <span className="text-xs uppercase text-muted-foreground">
                  {m.role}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Referendum positions
          </h2>
          {org.referendumPositions.length === 0 ? (
            <p className="text-sm font-bold text-muted-foreground">
              No positions submitted yet.{" "}
              <Link href="/endorse" className="underline">
                Submit one on /endorse
              </Link>
              .
            </p>
          ) : (
            <ul className="space-y-3">
              {org.referendumPositions.map((p) => (
                <li
                  key={p.id}
                  className="border-2 border-foreground bg-background p-3 text-sm font-bold"
                >
                  <div className="flex items-center justify-between">
                    <span>{p.referendum.title}</span>
                    <span className="text-xs uppercase text-muted-foreground">
                      {p.position} · {p.status.toLowerCase()}
                    </span>
                  </div>
                  {p.statement ? (
                    <p className="mt-2 italic text-muted-foreground">
                      &ldquo;{p.statement}&rdquo;
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
