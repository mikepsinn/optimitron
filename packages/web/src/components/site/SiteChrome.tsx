import { headers } from "next/headers";
import { Analytics } from "@vercel/analytics/next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { getSiteVariantUiConfig } from "@/config/site-variant-ui";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getSiteFromHeaders } from "@/lib/site";
import { SiteChromeFrame } from "@/components/site/SiteChromeFrame";

export async function SiteChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const hdrs = await headers();
  const site = getSiteFromHeaders(hdrs);
  const ui = getSiteVariantUiConfig(site.key);

  if (site.chromeVariant === "referendum") {
    return (
      <>
        <SiteChromeFrame
          navbar={<Navbar config={ui.nav} />}
          footer={<Footer siteKey={site.key} />}
          minimalRoutePrefixes={site.routePolicy.minimalChromePrefixes}
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
        navbar={<Navbar config={ui.nav} />}
        footer={<Footer siteKey={site.key} />}
        minimalRoutePrefixes={site.routePolicy.minimalChromePrefixes}
      >
        {children}
      </SiteChromeFrame>
      <Analytics />
      {site.analyticsId ? <GoogleAnalytics gaId={site.analyticsId} /> : null}
    </>
  );
}
