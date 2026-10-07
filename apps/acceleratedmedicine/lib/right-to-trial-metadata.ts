import type { Metadata } from "next"

import { OPEN_GRAPH_IMAGE_URL, SITE } from "@/lib/site-settings"

const { openGraphImage } = SITE

/**
 * Right to Trial pages share as Right to Trial pages. Without their own
 * openGraph and twitter blocks they inherit the institute homepage's.
 */
export function rightToTrialMetadata({
  title,
  description,
  path,
}: {
  title: string
  description: string
  path: string
}): Metadata {
  const url = `${SITE.url}${path}`
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      images: [
        {
          alt: openGraphImage.alt,
          height: openGraphImage.height,
          url: OPEN_GRAPH_IMAGE_URL,
          width: openGraphImage.width,
        },
      ],
      url,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OPEN_GRAPH_IMAGE_URL],
    },
  }
}
