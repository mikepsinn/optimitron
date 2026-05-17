import { headers } from "next/headers";
import { Analytics } from "@vercel/analytics/next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { getSiteVariantUiConfig } from "@/config/site-variant-ui";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getAllSiteConfigs, getSiteFromHeaders } from "@/lib/site";
import { isLocalSiteVariantOverrideEnabled } from "@/lib/site-dev-override";
import { DevSiteVariantSwitcher } from "@/components/site/DevSiteVariantSwitcher";
import { SiteChromeFrame } from "@/components/site/SiteChromeFrame";
import { CampaignActionFab } from "@/components/site/CampaignActionFab";

export async function SiteChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const hdrs = await headers();
  const site = getSiteFromHeaders(hdrs);
  const ui = getSiteVariantUiConfig(site.key);
  const showDevSiteSwitcher = isLocalSiteVariantOverrideEnabled(hdrs.get("host"));
  const devSiteOptions = showDevSiteSwitcher
    ? getAllSiteConfigs().map((config) => ({
        key: config.key,
        label: config.shortName,
      }))
    : [];

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
        {showDevSiteSwitcher ? (
          <DevSiteVariantSwitcher
            currentSiteKey={site.key}
            sites={devSiteOptions}
          />
        ) : null}
        <CampaignActionFab />
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
      {showDevSiteSwitcher ? (
        <DevSiteVariantSwitcher
          currentSiteKey={site.key}
          sites={devSiteOptions}
        />
      ) : null}
      <CampaignActionFab />
      <Analytics />
      {site.analyticsId ? <GoogleAnalytics gaId={site.analyticsId} /> : null}
    </>
  );
}
