import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getOptionalReferendumSiteContent } from "@/content/referendum-sites";
import { EarthOptimizationServicesLandingPage } from "@/components/site/EarthOptimizationServicesLandingPage";
import { OnePercentTreatyLandingPage } from "@/components/site/OnePercentTreatyLandingPage";
import { SiteVariantLandingPage } from "@/components/site/SiteVariantLandingPage";
import { authOptions } from "@/lib/auth";
import { getRootSiteMetadata, getSiteMetadata } from "@/lib/metadata";
import { prisma } from "@/lib/prisma";
import { getReferendumSiteHomeData } from "@/lib/referendum-site.server";
import { ROUTES } from "@/lib/routes";
import { getSiteFromHeaders } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const hdrs = await headers();
  const site = getSiteFromHeaders(hdrs);

  if (site.pageVariants.home === "onePercentTreatyLanding") {
    const content = getOptionalReferendumSiteContent(site.contentKey);
    if (content) {
      return getSiteMetadata(site, content.metadata.home, "/");
    }
  }

  return getRootSiteMetadata(site);
}

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const hdrs = await headers();
  const site = getSiteFromHeaders(hdrs);
  if (site.pageVariants.home === "onePercentTreatyLanding") {
    const resolvedParams = (await searchParams) ?? {};
    const rawPage = resolvedParams.signersPage;
    const signersPageParam = Array.isArray(rawPage) ? rawPage[0] : rawPage;
    const signersPage = signersPageParam
      ? Math.max(1, parseInt(signersPageParam, 10) || 1)
      : 1;
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ?? null;

    // Returning voters skip the slider entirely. The dashboard is the
    // post-vote experience: handle picker, share link, composer, tasks.
    // No reason to make them re-watch the question they already answered.
    if (userId && site.primaryReferendumSlug) {
      const existingVote = await prisma.referendumVote.findFirst({
        where: {
          userId,
          referendum: { slug: site.primaryReferendumSlug },
          deletedAt: null,
        },
        select: { id: true },
      });
      if (existingVote) {
        redirect(ROUTES.dashboard);
      }
    }

    const data = await getReferendumSiteHomeData(site, {
      signersPage,
      currentUserId: userId,
    });
    if (!data) {
      return (
        <section className="mx-auto max-w-2xl px-4 py-24 text-center">
          <h1 className="text-3xl font-black uppercase">{site.name}</h1>
          <p className="mt-4 font-bold text-muted-foreground">
            Referendum not found.
          </p>
        </section>
      );
    }

    return <OnePercentTreatyLandingPage data={data} />;
  }

  if (site.pageVariants.home === "initiativeLanding") {
    return <SiteVariantLandingPage site={site} />;
  }

  if (site.pageVariants.home === "eosLanding") {
    return <EarthOptimizationServicesLandingPage />;
  }

  return <EarthOptimizationServicesLandingPage />;
}
