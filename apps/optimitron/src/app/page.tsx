import type { Metadata } from "next";
import { headers } from "next/headers";
import { OptimitronLandingPage } from "@/components/site/OptimitronLandingPage";
import { getRootSiteMetadata } from "@/lib/metadata";
import { getSiteFromHeaders } from "@/lib/site";

// optimitron.com/ is Earth Optimization Services, not the game. It used to
// borrow /game's metadata because it rendered the game page; now that it has
// its own landing page, it uses the site's own root metadata.
export async function generateMetadata(): Promise<Metadata> {
  const hdrs = await headers();
  return getRootSiteMetadata(getSiteFromHeaders(hdrs));
}

export default function Home() {
  return <OptimitronLandingPage />;
}
