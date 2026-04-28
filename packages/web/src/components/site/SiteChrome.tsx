import { headers } from "next/headers";
import { Analytics } from "@vercel/analytics/next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { getReferendumSiteContent } from "@/content/referendum-sites";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { GameScoreBar } from "@/components/game/GameScoreBar";
import { getSiteFromHost } from "@/lib/site";
import { ReferendumSiteNavbar } from "@/components/site/ReferendumSiteNavbar";
import { ReferendumSiteFooter } from "@/components/site/ReferendumSiteFooter";
import { SiteChromeFrame } from "@/components/site/SiteChromeFrame";

export async function SiteChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const hdrs = await headers();
  const site = getSiteFromHost(hdrs.get("host"));
  const content = getReferendumSiteContent(site.contentKey);

  if (site.primaryReferendumSlug) {
    return (
      <>
        <SiteChromeFrame
          navbar={<ReferendumSiteNavbar config={site} />}
          footer={<ReferendumSiteFooter config={site} content={content} />}
        >
          {children}
        </SiteChromeFrame>
        {site.analyticsId ? <GoogleAnalytics gaId={site.analyticsId} /> : null}
      </>
    );
  }

  return (
    <>
      <SiteChromeFrame
        navbar={<Navbar />}
        footer={<Footer />}
        bottomBar={<GameScoreBar />}
      >
        {children}
      </SiteChromeFrame>
      <Analytics />
      {site.analyticsId ? <GoogleAnalytics gaId={site.analyticsId} /> : null}
    </>
  );
}
