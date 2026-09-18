import type { Metadata } from "next";
import * as Sentry from "@sentry/nextjs";
import { getSiteConfig } from "./site-config";
import { getBaseUrl } from "./url";

export function buildSiteMetadata(): Metadata {
  const config = getSiteConfig();
  const baseUrl = getBaseUrl();
  const title = config.ogMetadata.title || config.title;
  const description = config.ogMetadata.description || config.description;

  return {
    title: config.title,
    description: config.description,
    metadataBase: new URL(config.canonicalUrl || baseUrl),
    // Next resolves ./ against the current route, including in inherited
    // layout metadata. An absolute origin here canonicalizes every child to /.
    alternates: { canonical: "./" },
    icons: config.icons,
    openGraph: {
      type: "website",
      locale: "en_US",
      url: baseUrl,
      siteName: config.title,
      title,
      description,
      images: [
        {
          url: config.ogMetadata.image,
          width: config.ogMetadata.width,
          height: config.ogMetadata.height,
          alt: config.ogMetadata.alt || config.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [config.ogMetadata.twitterImage?.url || config.ogMetadata.image],
    },
    other: {
      ...Sentry.getTraceData(),
    },
  };
}
