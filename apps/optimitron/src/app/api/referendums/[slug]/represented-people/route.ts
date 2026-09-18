import { NextResponse } from "next/server";
import { submitTreatyRepresentedPerson, type RepresentedPersonRouteContext } from "@optimitron/site-kit/lib/treaty-represented-person-registration.server";
import { requireAuth } from "@/lib/auth-utils";
import { ensurePersonForUser } from "@/lib/person.server";
import { prisma } from "@/lib/prisma";
import { TREATY_REFERENDUM_SLUG } from "@/lib/treaty";

export async function POST(request: Request, context: RepresentedPersonRouteContext) {
  const { slug } = await context.params;
  if (slug === TREATY_REFERENDUM_SLUG) {
    return submitTreatyRepresentedPerson(request, context, { prisma, requireAuth, ensurePersonForUser });
  }
  return NextResponse.json({
    error: "This Court endpoint has moved. Reconnect on Court of Humanity.",
    code: "COURT_ENDPOINT_MOVED",
    endpoint: `https://courtofhumanity.org/api/referendums/${encodeURIComponent(slug)}/represented-people`,
  }, { status: 410 });
}
