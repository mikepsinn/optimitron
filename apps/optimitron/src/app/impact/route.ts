import { type NextRequest, NextResponse } from "next/server";
import { requireReferendumSiteContent } from "@/lib/referendum-site-content.server";
import { getSiteFromHeaders } from "@/lib/site";

export function GET(request: NextRequest) {
  const site = getSiteFromHeaders(request.headers);
  const content = requireReferendumSiteContent(site);
  const target = new URL(content.impactUrl);

  target.search = request.nextUrl.search;

  return NextResponse.redirect(target, 307);
}
