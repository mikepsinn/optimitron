import { generateBlackWhiteTextOgImageResponse } from "@/lib/black-white-text-og-image-response";
import { HUMANITY_V_GOVERNMENT_OG_IMAGE_COPY } from "./page-metadata";

export const runtime = "nodejs";
export const revalidate = 3600;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return generateBlackWhiteTextOgImageResponse(
    HUMANITY_V_GOVERNMENT_OG_IMAGE_COPY,
    size,
  );
}
