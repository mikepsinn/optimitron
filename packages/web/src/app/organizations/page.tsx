import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-utils";
import { getManageableOrganizationsForUser } from "@/lib/organization.server";
import { getOrganizationPath, getSignInPath, ROUTES } from "@/lib/routes";

export const dynamic = "force-dynamic";

export default async function OrganizationsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect(getSignInPath(ROUTES.organizations));
  }

  const organizations = await getManageableOrganizationsForUser(user.id);

  return (
    <section className="mx-auto max-w-3xl px-4 py-16">
      <header className="mb-10 border-b-2 border-foreground pb-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Organizations
        </p>
        <h1 className="text-3xl font-black uppercase text-foreground sm:text-4xl">
          Organization Campaign Tools
        </h1>
        <p className="mt-3 max-w-2xl text-sm font-bold text-muted-foreground">
          Create or open an organization link, then share or embed the survey.
        </p>
        {organizations.length > 0 ? (
          <Link
            href={ROUTES.endorse}
            className="mt-6 inline-block border-2 border-foreground bg-foreground px-5 py-3 text-sm font-black uppercase text-background hover:bg-background hover:text-foreground"
          >
            Create Organization
          </Link>
        ) : null}
      </header>

      {organizations.length === 0 ? (
        <div className="border-2 border-foreground bg-background p-5">
          <p className="font-bold text-muted-foreground">
            No organizations are connected to your account yet.
          </p>
          <Link
            href={ROUTES.endorse}
            className="mt-4 inline-block border-2 border-foreground bg-foreground px-5 py-3 text-sm font-black uppercase text-background hover:bg-background hover:text-foreground"
          >
            Create Organization
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {organizations.map((organization) => (
            <li key={organization.id}>
              <Link
                href={getOrganizationPath(organization.slug)}
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
