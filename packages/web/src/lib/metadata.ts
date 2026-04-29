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
    twitter,
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
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
      images: [site.rootMetadata.twitterImage],
      ...twitter,
    },
    ...restOverrides,
  };
}

export function getRootSiteMetadata(
  site: SiteConfig,
  pathname = "/",
  overrides?: Partial<Metadata>,
): Metadata {
  const { alternates, openGraph, twitter, ...restOverrides } = overrides ?? {};
  const root = site.rootMetadata;

  return {
    title: root.title,
    description: root.description,
    metadataBase: new URL(site.canonicalOrigin),
    alternates: {
      canonical: pathname,
      ...alternates,
    },
    openGraph: {
      title: root.openGraphTitle,
      description: root.openGraphDescription,
      siteName: site.name,
      images: [root.openGraphImage],
      type: "website",
      ...openGraph,
    },
    twitter: {
      card: "summary_large_image",
      title: root.twitterTitle,
      description: root.twitterDescription,
      images: [root.twitterImage],
      ...twitter,
    },
    ...restOverrides,
  };
}
