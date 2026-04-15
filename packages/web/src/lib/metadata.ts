import type { Metadata } from "next";

import type { NavItem } from "./routes";
import type { SiteConfig } from "./site";

const SITE_NAME = "Optimitron";

/**
 * Generate Next.js Metadata from a NavItem definition.
 * Single source of truth — routes.ts descriptions drive both nav UI and page <head>.
 */
export function getRouteMetadata(
  item: NavItem,
  overrides?: Partial<Metadata>,
): Metadata {
  const title = `${item.label} | ${SITE_NAME}`;
  const description = item.description ?? "";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
    ...overrides,
  };
}

interface SiteMetadataInput {
  description: string;
  title: string;
}

export function getSiteMetadata(
  site: SiteConfig,
  page: SiteMetadataInput,
  overrides?: Partial<Metadata>,
): Metadata {
  return {
    title: page.title,
    description: page.description,
    metadataBase: new URL(site.canonicalOrigin),
    openGraph: {
      title: page.title,
      description: page.description,
      siteName: site.name,
      images: [site.ogImage],
      type: "website",
    },
    ...overrides,
  };
}
