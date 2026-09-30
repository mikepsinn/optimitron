import type { Metadata } from "next"

import { getSiteConfigForVariant } from "@optimitron/site-kit/lib/site-config"
import { VARIANTS } from "@optimitron/site-kit/lib/site-variant-types"

const SITE_URL = "https://acceleratedmedicine.org"
const { ogMetadata } = getSiteConfigForVariant(VARIANTS.ACCELERATED_MEDICINE)
const ogImage = `${SITE_URL}${ogMetadata.image}`

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
  const url = `${SITE_URL}${path}`
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      images: [
        {
          alt: ogMetadata.alt,
          height: ogMetadata.height,
          url: ogImage,
          width: ogMetadata.width,
        },
      ],
      url,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  }
}
