import type { NextRequest } from "next/server";
import { generateBlackWhiteTextOgImageResponseForNavItem } from "@/lib/black-white-text-og-image-response";
import { getInternalNavItemForPath, ROUTES } from "@/lib/routes";

export const runtime = "nodejs";
export const revalidate = 3600;

export async function GET(request: NextRequest) {
  const pathname = request.nextUrl.searchParams.get("path") ?? ROUTES.home;
  const navItem = getInternalNavItemForPath(pathname);

  if (!navItem) {
    return new Response("No route metadata found for OG image path.", {
      status: 404,
    });
  }

  return generateBlackWhiteTextOgImageResponseForNavItem(navItem);
}
