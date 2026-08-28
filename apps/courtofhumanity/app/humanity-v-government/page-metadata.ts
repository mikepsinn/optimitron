import type { Metadata } from "next";
import { HUMANITY_V_GOVERNMENT_FULL_DAMAGES_PER_CAPITA_LABEL } from "@optimitron/data/referendums";
import {
  buildBlackWhiteTextOgAltText,
  type BlackWhiteTextOgImageCopy,
} from "@/lib/black-white-text-og-image";
import { ROUTES } from "@/lib/routes";

/**
 * Metadata for /humanity-v-government, ported from the monolith's
 * `humanityVGovernmentLink` nav-item definition. Titles and descriptions are
 * unchanged; the canonical URL and OG footer now belong to
 * courtofhumanity.org.
 */

const humanityVGovernmentDamagesTitle =
  HUMANITY_V_GOVERNMENT_FULL_DAMAGES_PER_CAPITA_LABEL.replace(
    " million",
    " Million",
  );

export const HUMANITY_V_GOVERNMENT_OG_IMAGE_COPY = {
  eyebrow: "Humanity v. Government",
  footer: "CourtOfHumanity.org",
  primaryLines: [
    "You May Be Owed",
    humanityVGovernmentDamagesTitle,
    "Render Your Verdict",
  ],
  secondaryLines: ["Court of Humanity class action"],
} satisfies BlackWhiteTextOgImageCopy;

export const HUMANITY_V_GOVERNMENT_OG_IMAGE_PATH =
  `${ROUTES.humanityVGovernment}/opengraph-image`;

export const HUMANITY_V_GOVERNMENT_OG_ALT = buildBlackWhiteTextOgAltText(
  HUMANITY_V_GOVERNMENT_OG_IMAGE_COPY,
);

export const HUMANITY_V_GOVERNMENT_METADATA_TITLE = `You May Be Owed ${humanityVGovernmentDamagesTitle} | Humanity v. Government`;

export const HUMANITY_V_GOVERNMENT_METADATA_DESCRIPTION = `Render your verdict in the Court of Humanity class action against the governments of Earth. The claim says each living human may be owed ${HUMANITY_V_GOVERNMENT_FULL_DAMAGES_PER_CAPITA_LABEL} in full damages.`;

export const HUMANITY_V_GOVERNMENT_METADATA: Metadata = {
  title: HUMANITY_V_GOVERNMENT_METADATA_TITLE,
  description: HUMANITY_V_GOVERNMENT_METADATA_DESCRIPTION,
  alternates: {
    canonical: ROUTES.humanityVGovernment,
  },
  openGraph: {
    title: HUMANITY_V_GOVERNMENT_METADATA_TITLE,
    description: HUMANITY_V_GOVERNMENT_METADATA_DESCRIPTION,
    images: [
      {
        url: HUMANITY_V_GOVERNMENT_OG_IMAGE_PATH,
        width: 1200,
        height: 630,
        alt: HUMANITY_V_GOVERNMENT_OG_ALT,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: HUMANITY_V_GOVERNMENT_METADATA_TITLE,
    description: HUMANITY_V_GOVERNMENT_METADATA_DESCRIPTION,
    images: [HUMANITY_V_GOVERNMENT_OG_IMAGE_PATH],
  },
};
