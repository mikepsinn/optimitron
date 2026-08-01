import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getOptionalReferendumSiteContent } from "@/content/referendum-sites";
import { EarthOptimizationServicesLandingPage } from "@/components/site/EarthOptimizationServicesLandingPage";
import { EarthOptimizationGameLandingPage } from "@/components/site/EarthOptimizationGameLandingPage";
import { OnePercentTreatyLandingPage } from "@/components/site/OnePercentTreatyLandingPage";
import { SiteVariantLandingPage } from "@/components/site/SiteVariantLandingPage";
import { authOptions } from "@/lib/auth";
import {
  getRootSiteMetadata,
  getRouteMetadata,
  getSiteMetadata,
} from "@/lib/metadata";
import { prisma } from "@/lib/prisma";
import { gameLink, ROUTES } from "@/lib/routes";
import { getSiteFromHeaders } from "@/lib/site";

const NEXT_AUTH_SESSION_COOKIE_PATTERN =
  /(?:^|;\s*)(?:__Secure-)?next-auth\.session-token(?:\.\d+)?=/;

function hasNextAuthSessionCookie(cookie: string | null) {
  return NEXT_AUTH_SESSION_COOKIE_PATTERN.test(cookie ?? "");
}

export async function generateMetadata(): Promise<Metadata> {
  const hdrs = await headers();
  const site = getSiteFromHeaders(hdrs);

  if (site.pageVariants.home === "onePercentTreatyLanding") {
    const content = getOptionalReferendumSiteContent(site.contentKey);
    if (content) {
      return getSiteMetadata(site, content.metadata.home, "/");
    }
  }

  if (site.pageVariants.home === "optimitronLanding") {
    return getRouteMetadata(gameLink, {
      alternates: { canonical: ROUTES.home },
    });
  }

  return getRootSiteMetadata(site);
}

export default async function Home() {
  const hdrs = await headers();
  const site = getSiteFromHeaders(hdrs);
  if (site.pageVariants.home === "onePercentTreatyLanding") {
    const session = hasNextAuthSessionCookie(hdrs.get("cookie"))
      ? await getServerSession(authOptions)
      : null;
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

    if (!site.primaryReferendumSlug) {
      return (
        <section className="mx-auto max-w-2xl px-4 py-24 text-center">
          <h1 className="text-3xl font-black uppercase">{site.name}</h1>
          <p className="mt-4 font-bold text-muted-foreground">
            That referendum is not here. Vote on the homepage.
          </p>
        </section>
      );
    }

    return <OnePercentTreatyLandingPage />;
  }

  if (site.pageVariants.home === "initiativeLanding") {
    return <SiteVariantLandingPage site={site} />;
  }

  if (site.pageVariants.home === "optimitronLanding") {
    return <EarthOptimizationGameLandingPage />;
  }

  if (site.pageVariants.home === "eosLanding") {
    return <EarthOptimizationServicesLandingPage />;
  }

  return <EarthOptimizationServicesLandingPage />;
}
