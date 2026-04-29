import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-utils";
import { getManageableOrganizationsForUser } from "@/lib/organization.server";

export const dynamic = "force-dynamic";

export default async function OrganizationsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent("/organizations")}`);
  }

  const organizations = await getManageableOrganizationsForUser(user.id);

  return (
    <section className="mx-auto max-w-3xl px-4 py-16">
      <header className="mb-10 border-b-2 border-foreground pb-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Organizations
        </p>
        <h1 className="text-3xl font-black uppercase text-foreground sm:text-4xl">
          Organization Survey Links
        </h1>
        <p className="mt-3 max-w-2xl text-sm font-bold text-muted-foreground">
          Give your audience a clean treaty survey link. They vote on your site;
          you get credited for helping humanity click the obvious rectangle.
        </p>
      </header>

      {organizations.length === 0 ? (
        <p className="font-bold text-muted-foreground">
          No organizations are connected to your account yet. A clipboard with
          zero clipboards attached is just a rectangle.
        </p>
      ) : (
        <ul className="space-y-3">
          {organizations.map((organization) => (
            <li key={organization.id}>
              <Link
                href={`/organizations/${organization.id}`}
                className="block border-2 border-foreground bg-background p-4 font-bold hover:bg-muted"
              >
                <span className="block text-lg font-black uppercase">
                  {organization.name}
                </span>
                <span className="text-sm text-muted-foreground">
                  {organization.status.toLowerCase()}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
