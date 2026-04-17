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
  const { alternates, openGraph, ...restOverrides } = overrides ?? {};

  return {
    title,
    description,
    alternates: {
      canonical: item.href,
      ...alternates,
    },
    openGraph: {
      title,
      description,
      ...openGraph,
    },
    ...restOverrides,
  };
}

interface SiteMetadataInput {
  description: string;
  title: string;
}

export function getSiteMetadata(
  site: SiteConfig,
  page: SiteMetadataInput,
  pathnameOrOverrides?: string | Partial<Metadata>,
  overrides?: Partial<Metadata>,
): Metadata {
  const pathname =
    typeof pathnameOrOverrides === "string" ? pathnameOrOverrides : "/";
  const metadataOverrides =
    typeof pathnameOrOverrides === "string" ? overrides : pathnameOrOverrides;
  const {
    alternates,
    openGraph,
    ...restOverrides
  } = metadataOverrides ?? {};

  return {
    title: page.title,
    description: page.description,
    metadataBase: new URL(site.canonicalOrigin),
    alternates: {
      canonical: pathname,
      ...alternates,
    },
    openGraph: {
      title: page.title,
      description: page.description,
      siteName: site.name,
      images: [site.ogImage],
      type: "website",
      ...openGraph,
    },
    ...restOverrides,
  };
}
