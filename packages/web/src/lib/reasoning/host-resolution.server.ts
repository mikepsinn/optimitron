/**
 * Host → organization resolution.
 *
 * Primary path: DB-driven `ReasoningOrganizationDomain` lookup. Allows
 * new orgs to register CNAMEs without a code deploy (per the "never
 * touch code again" goal).
 *
 * Static `site.ts` remains as a fallback for known canonical hosts.
 */

import { prisma } from "@/lib/prisma";
import type { Surface } from "./types";

export type OrgHostResolution = {
  organizationId: string | null;
  /** True iff the resolution came from a trusted source (DB or static site config). */
  verified: boolean;
  /** Which surface this host implies — "hosted" for CNAME routes, etc. */
  surface: Surface;
  /** The raw host string (lowercased). */
  hostKey: string;
};

/**
 * Resolve an incoming request's hostname to an organizationId + surface.
 *
 * Call this once per request from the reasoning page's server component.
 * Never trust URL query params for organizationId — this is the only
 * authoritative path.
 */
export async function resolveOrgFromHost(
  rawHost: string | null | undefined,
): Promise<OrgHostResolution> {
  const hostKey = normalizeHost(rawHost);
  if (!hostKey) {
    return {
      organizationId: null,
      verified: false,
      surface: "hosted",
      hostKey: "",
    };
  }

  const dbHit = await prisma.reasoningOrganizationDomain.findUnique({
    where: { host: hostKey },
  });

  if (dbHit && dbHit.status === "ACTIVE" && dbHit.tlsVerified && dbHit.cnameVerified) {
    return {
      organizationId: dbHit.organizationId,
      verified: true,
      surface: "hosted",
      hostKey,
    };
  }

  // Fallback: the default canonical/referendum hosts resolve to no org
  // (surface is still hosted). Callers may layer static `site.ts`
  // resolution on top; that code path already exists in the repo and
  // isn't duplicated here.
  return {
    organizationId: null,
    verified: false,
    surface: "hosted",
    hostKey,
  };
}

function normalizeHost(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw.toLowerCase().replace(/:\d+$/, "").trim();
}
