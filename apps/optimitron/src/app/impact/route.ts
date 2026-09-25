import { type NextRequest, NextResponse } from "next/server";
import { getReferendumSiteContent } from "@/content/referendum-sites";

// The impact dashboard belongs to the 1% Treaty campaign, so this route always
// sends visitors to that campaign's impact site.
export function GET(request: NextRequest) {
  const target = new URL(
    getReferendumSiteContent("onePercentTreaty").impactUrl,
  );

  target.search = request.nextUrl.search;

  return NextResponse.redirect(target, 307);
}
