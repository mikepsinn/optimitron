import type { Metadata } from "next";
import { headers } from "next/headers";
import { EarthOptimizationGameLandingPage } from "@/components/site/EarthOptimizationGameLandingPage";
import { getRouteMetadata } from "@/lib/metadata";
import { gameLink, ROUTES } from "@/lib/routes";
import { getSiteFromHeaders } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const site = getSiteFromHeaders(await headers());

  return getRouteMetadata(
    gameLink,
    site.key === "optimitron"
      ? { alternates: { canonical: ROUTES.home } }
      : undefined,
  );
}

export default function GamePage() {
  return <EarthOptimizationGameLandingPage />;
}
