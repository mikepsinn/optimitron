import type { Metadata } from "next";
import { EarthOptimizationGameLandingPage } from "@/components/site/EarthOptimizationGameLandingPage";
import { getRouteMetadata } from "@/lib/metadata";
import { gameLink } from "@/lib/routes";

export async function generateMetadata(): Promise<Metadata> {
  return getRouteMetadata(gameLink);
}

export default function GamePage() {
  return <EarthOptimizationGameLandingPage />;
}
