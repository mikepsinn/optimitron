import type { Metadata } from "next";

import { buildBlackWhiteTextOgAltTextForNavItem } from "./black-white-text-og-image";
import type { NavItem } from "./routes";
import type { SiteConfig } from "./site";
import {
  getSiteIcons,
  getSiteManifestPath,
  getSiteSocialImage,
  getSiteTwitterImage,
} from "./site-assets";

/**
 * Generate Next.js Metadata from a NavItem definition.
 * Single source of truth — routes.ts descriptions drive both nav UI and page <head>.
 */
export function getRouteMetadata(
  item: NavItem,
  overrides?: Partial<Metadata>,
): Metadata {
  const title = item.label;
  const description = item.description ?? "";
  const { alternates, openGraph, ...restOverrides } = overrides ?? {};
  const socialPreview = item.socialPreview;
  const socialTitle = socialPreview?.title ?? title;
  const socialDescription = socialPreview?.description ?? description;
  const socialImageAlt =
    socialPreview?.image?.alt ??
    (socialPreview?.blackWhiteTextOgImage
      ? buildBlackWhiteTextOgAltTextForNavItem(item)
      : null);
  const socialImage = socialPreview?.image
    ? {
        ...socialPreview.image,
        ...(socialImageAlt ? { alt: socialImageAlt } : {}),
      }
    : null;

  return {
    title,
    description,
    alternates: {
      canonical: item.href,
      ...alternates,
    },
    openGraph: {
      title: socialTitle,
      description: socialDescription,
      ...(socialImage ? { images: [socialImage] } : {}),
      ...openGraph,
    },
    ...(socialImage
      ? {
          twitter: {
            card: "summary_large_image" as const,
            title: socialTitle,
            description: socialDescription,
            images: [socialImage.url],
          },
        }
      : {}),
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
    title: { absolute: page.title },
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
      images: [getSiteSocialImage(site)],
      type: "website",
      ...openGraph,
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
      images: [getSiteTwitterImage(site)],
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
    title: { absolute: root.title },
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
      images: [getSiteSocialImage(site)],
      type: "website",
      ...openGraph,
    },
    twitter: {
      card: "summary_large_image",
      title: root.twitterTitle,
      description: root.twitterDescription,
      images: [getSiteTwitterImage(site)],
      ...twitter,
    },
    ...restOverrides,
  };
}

export function getRootLayoutMetadata(site: SiteConfig): Metadata {
  const metadata = site.rootMetadata;

  return {
    metadataBase: new URL(site.canonicalOrigin),
    applicationName: site.name,
    creator: site.organizationName,
    publisher: site.organizationName,
    title: {
      default: metadata.title,
      template: `%s | ${site.name}`,
    },
    description: metadata.description,
    keywords: metadata.keywords,
    openGraph: {
      siteName: site.name,
      title: metadata.openGraphTitle,
      description: metadata.openGraphDescription,
      type: "website",
      images: [getSiteSocialImage(site)],
    },
    twitter: {
      card: "summary_large_image",
      title: metadata.twitterTitle,
      description: metadata.twitterDescription,
      images: [getSiteTwitterImage(site)],
    },
    icons: getSiteIcons(site),
    manifest: getSiteManifestPath(site),
  };
}
