import type { Metadata } from "next";
import {
  buildBlackWhiteTextOgAltTextForNavItem,
} from "@/lib/black-white-text-og-image";
import { getRouteMetadata } from "@/lib/metadata";
import { humanityVGovernmentLink } from "@/lib/routes";

const socialPreview = humanityVGovernmentLink.socialPreview;

if (!socialPreview?.image || !socialPreview.blackWhiteTextOgImage) {
  throw new Error("Humanity v. Government needs a social preview config.");
}

if (!socialPreview.title || !socialPreview.description) {
  throw new Error("Humanity v. Government needs social title and description.");
}

export const HUMANITY_V_GOVERNMENT_OG_IMAGE_PATH = socialPreview.image.url;

export const HUMANITY_V_GOVERNMENT_OG_ALT =
  buildBlackWhiteTextOgAltTextForNavItem(humanityVGovernmentLink);

export const HUMANITY_V_GOVERNMENT_METADATA_TITLE = socialPreview.title;

export const HUMANITY_V_GOVERNMENT_METADATA_DESCRIPTION =
  socialPreview.description;

export const HUMANITY_V_GOVERNMENT_METADATA: Metadata = getRouteMetadata(
  humanityVGovernmentLink,
  {
    description: HUMANITY_V_GOVERNMENT_METADATA_DESCRIPTION,
    title: HUMANITY_V_GOVERNMENT_METADATA_TITLE,
  },
);
