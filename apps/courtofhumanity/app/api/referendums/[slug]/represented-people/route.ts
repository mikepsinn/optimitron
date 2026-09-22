import { submitTreatyRepresentedPerson, type RepresentedPersonRouteContext } from "@optimitron/site-kit/lib/treaty-represented-person-registration.server";
import { requireAuth } from "@/lib/auth-utils";
import { ensurePersonForUser } from "@/lib/person.server";
import { prisma } from "@/lib/prisma";

export function POST(request: Request, context: RepresentedPersonRouteContext) {
  return submitTreatyRepresentedPerson(request, context, { prisma, requireAuth, ensurePersonForUser });
}
