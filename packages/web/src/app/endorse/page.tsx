import { headers } from "next/headers";
import Link from "next/link";
import { getReferendumSiteContent } from "@/content/referendum-sites";
import { getCurrentUser } from "@/lib/auth-utils";
import { getSiteMetadata } from "@/lib/metadata";
import { getManageableOrganizationsForUser } from "@/lib/organization.server";
import { getSiteFromHost } from "@/lib/site";
import { EndorseForm } from "./EndorseForm";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const hdrs = await headers();
  const site = getSiteFromHost(hdrs.get("host"));
  const content = getReferendumSiteContent(site.contentKey);
  return getSiteMetadata(site, content.metadata.endorse, "/endorse");
}

export default async function EndorsePage() {
  const hdrs = await headers();
  const site = getSiteFromHost(hdrs.get("host"));
  const content = getReferendumSiteContent(site.contentKey);
  const user = await getCurrentUser();

  if (!site.primaryReferendumSlug) {
    return (
      <section className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-3xl font-black uppercase">Endorse</h1>
        <p className="mt-4 font-bold text-muted-foreground">
          No referendum is configured for this site.
        </p>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-3xl font-black uppercase text-foreground sm:text-4xl [font-family:var(--v0-font-libre-baskerville)]">
          {content.endorse.signInTitle}
        </h1>
        <p className="mt-4 text-base font-bold text-muted-foreground">
          {content.endorse.signInDescription}
        </p>
        <Link
          href={`/auth/signin?callbackUrl=${encodeURIComponent("/endorse")}`}
          className="mt-8 inline-block border-2 border-foreground bg-foreground px-6 py-3 text-sm font-black uppercase text-background hover:bg-background hover:text-foreground"
        >
          {content.endorse.signInLabel}
        </Link>
      </section>
    );
  }

  const manageableOrgs = await getManageableOrganizationsForUser(user.id);

  return (
    <section className="mx-auto max-w-2xl px-4 py-16">
      <header className="mb-10 text-center">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {content.endorse.eyebrow}
        </p>
        <h1 className="text-4xl font-black uppercase tracking-tight text-foreground sm:text-5xl [font-family:var(--v0-font-libre-baskerville)]">
          {content.endorse.title}
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-base font-bold text-muted-foreground">
          {content.endorse.description}
        </p>
      </header>

      <EndorseForm
        referendumSlug={site.primaryReferendumSlug}
        manageableOrgs={manageableOrgs.map((o) => ({
          id: o.id,
          name: o.name,
          status: o.status,
        }))}
      />

      <p className="mt-8 text-center text-xs font-bold text-muted-foreground">
        Already endorsed? See the full list on{" "}
        <Link href="/coalition" className="underline">
          {content.endorse.existingSupportersLabel}
        </Link>
        .
      </p>
    </section>
  );
}
