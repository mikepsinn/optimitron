import { headers } from "next/headers";
import { Analytics } from "@vercel/analytics/next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { getSiteVariantUiConfig } from "@/config/site-variant-ui";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getAllSiteConfigs, getSiteFromHeaders } from "@/lib/site";
import { ROUTES } from "@/lib/routes";
import { OAUTH_CONSENT_FLOW_HEADER } from "@/lib/oauth-consent-flow";
import { isLocalSiteVariantOverrideEnabled } from "@/lib/site-dev-override";
import { DevSiteVariantSwitcher } from "@/components/site/DevSiteVariantSwitcher";
import { SiteChromeFrame } from "@/components/site/SiteChromeFrame";
import { CampaignActionFab } from "@/components/site/CampaignActionFab";
import { MicrosoftClarity } from "@/components/site/MicrosoftClarity";

// The OAuth consent screen is reached from whichever site the user is
// connecting, so it must not wear this app's navbar, footer, or campaign
// prompts. It stays chrome-free on every site variant.
const GLOBAL_MINIMAL_CHROME_PREFIXES = [ROUTES.mcpAuthorize] as const;

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
  const inOAuthConsentFlow = hdrs.get(OAUTH_CONSENT_FLOW_HEADER) === "1";
  const minimalRoutePrefixes = [
    ...site.routePolicy.minimalChromePrefixes,
    ...GLOBAL_MINIMAL_CHROME_PREFIXES,
  ];

  if (site.chromeVariant === "referendum") {
    return (
      <>
        <SiteChromeFrame
          navbar={<Navbar config={ui.nav} />}
          footer={<Footer siteKey={site.key} />}
          minimalRoutePrefixes={minimalRoutePrefixes}
          forceMinimal={inOAuthConsentFlow}
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
        <MicrosoftClarity />
        {site.analyticsId ? <GoogleAnalytics gaId={site.analyticsId} /> : null}
      </>
    );
  }

  return (
    <>
      <SiteChromeFrame
        navbar={<Navbar config={ui.nav} />}
        footer={<Footer siteKey={site.key} />}
        minimalRoutePrefixes={minimalRoutePrefixes}
        forceMinimal={inOAuthConsentFlow}
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
      <MicrosoftClarity />
      {site.analyticsId ? <GoogleAnalytics gaId={site.analyticsId} /> : null}
    </>
  );
}
