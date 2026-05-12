import { generateBlackWhiteTextOgImageResponseForNavItem } from "@/lib/black-white-text-og-image-response";
import { humanityVGovernmentLink } from "@/lib/routes";

export const runtime = "nodejs";
export const revalidate = 3600;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return generateBlackWhiteTextOgImageResponseForNavItem(
    humanityVGovernmentLink,
    size,
  );
}
