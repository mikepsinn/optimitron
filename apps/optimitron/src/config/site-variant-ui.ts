import {
  getSiteConfig,
  type SiteFooterConfig,
  type SiteKey,
  type SiteNavConfig,
  type SiteVariantUiConfig,
} from "@/lib/site";

export type { SiteFooterConfig, SiteNavConfig, SiteVariantUiConfig };

export function getSiteVariantUiConfig(
  siteKey: SiteKey,
): SiteVariantUiConfig {
  return getSiteConfig(siteKey).ui;
}
