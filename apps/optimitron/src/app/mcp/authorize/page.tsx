import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  buildMcpAuthorizeSignInPath,
  buildMcpConsentAuthorizeUrl,
  getIssuerUrl,
  getMcpRequestOrigin,
  isRedirectUriAllowed,
  shouldRedirectMcpAuthorizeToIssuer,
} from "@/lib/mcp-oauth";
import {
  DEFAULT_CONSENT_SCOPES,
  allowedMcpScopesForUser,
  isHumanApprovalOAuthRedirectUri,
  scopesFromWire,
  scopesToWire,
} from "@/lib/mcp-scopes";
import { prisma } from "@/lib/prisma";
import { McpConsentForm } from "./consent-form";
import {
  resolveOAuthResource,
  LEGACY_MCP_RESOURCE,
  filterCourtMcpScopes,
} from "@/lib/mcp-court-oauth";

function invalidRequest(message: string) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-foreground text-background">
      <div className="border-4 border-primary bg-background text-foreground p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h1 className="text-2xl font-black uppercase">Invalid Request</h1>
        <p className="mt-2 font-bold">{message}</p>
      </div>
    </div>
  );
}

export default async function McpAuthorizePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  let resource: string;
  try {
    resource = resolveOAuthResource(params.resource);
  } catch {
    return invalidRequest("Unknown or unavailable OAuth resource.");
  }
  const requestedResource =
    typeof params.resource === "string" ? params.resource : undefined;
  const clientId =
    typeof params.client_id === "string" ? params.client_id : null;
  const redirectUri =
    typeof params.redirect_uri === "string" ? params.redirect_uri : null;
  const state = typeof params.state === "string" ? params.state : null;
  const scope =
    typeof params.scope === "string"
      ? params.scope
      : scopesToWire(DEFAULT_CONSENT_SCOPES);
  const codeChallenge =
    typeof params.code_challenge === "string" ? params.code_challenge : null;

  if (!clientId || !redirectUri || !codeChallenge) {
    return invalidRequest("Missing required OAuth parameters.");
  }

  // Validate the client and redirect URI before rendering the form. The
  // Deny button navigates the browser to redirect_uri, so rendering consent
  // for an unregistered redirect target is an open redirect.
  const client = await prisma.oAuthClient.findUnique({
    where: { clientId },
    select: { redirectUris: true, clientName: true },
  });
  if (!client) {
    return invalidRequest("Unknown OAuth client.");
  }
  const clientName = client.clientName ?? clientId;
  if (!isRedirectUriAllowed(client.redirectUris, redirectUri)) {
    return invalidRequest("Redirect URI is not registered for this client.");
  }

  const headerStore = await headers();
  const requestOrigin = getMcpRequestOrigin(
    new Request(`${getIssuerUrl()}/mcp/authorize`, {
      headers: headerStore,
    }),
  );
  if (shouldRedirectMcpAuthorizeToIssuer(requestOrigin)) {
    // Campaign hosts can reach this page via shared deployment routing.
    // Bounce to the canonical issuer before NextAuth so login cookies and
    // the post-login callback stay on one origin.
    redirect(
      buildMcpConsentAuthorizeUrl({
        client_id: clientId,
        redirect_uri: redirectUri,
        state,
        scope,
        code_challenge: codeChallenge,
        client_name: clientName,
        resource: requestedResource,
      }).toString(),
    );
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect(buildMcpAuthorizeSignInPath(params));
  }

  const requestedScopes = scopesFromWire(scope);
  const [user, memberships, existingGrant] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    }),
    prisma.organizationMember.findMany({
      where: {
        organization: { deletedAt: null },
        userId: session.user.id,
      },
      orderBy: { joinedAt: "asc" },
      select: {
        organization: { select: { id: true, name: true, slug: true } },
        role: true,
      },
    }),
    prisma.oAuthGrant.findFirst({
      where: {
        clientId,
        userId: session.user.id,
        resource,
      },
      select: { active: true, organizationIds: true },
    }),
  ]);
  const allAvailableScopes = allowedMcpScopesForUser(user?.isAdmin === true, {
    allowHumanApproval: isHumanApprovalOAuthRedirectUri(redirectUri),
  });
  const availableScopes =
    resource === LEGACY_MCP_RESOURCE
      ? allAvailableScopes
      : filterCourtMcpScopes(allAvailableScopes, user?.isAdmin === true);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background text-foreground">
      <div className="w-full max-w-lg">
        <div className="border-4 border-primary bg-background text-foreground p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h1
            id="mcp-authorize-heading"
            className="text-2xl font-black uppercase mb-2"
          >
            Authorize App
          </h1>
          <p className="font-bold text-muted-foreground mb-6">
            <span className="text-foreground">{clientName}</span>{" "}
            {resource === LEGACY_MCP_RESOURCE
              ? "wants to access your Optimitron account. Tick the permissions you want to grant."
              : "wants to access Court of Humanity with your Optimitron account. Tick the permissions you want to grant."}
          </p>
          {resource !== LEGACY_MCP_RESOURCE && (
            <p className="text-sm font-bold text-muted-foreground mb-6 break-all">
              Resource: {resource}
            </p>
          )}

          <McpConsentForm
            resource={requestedResource}
            isCourtResource={resource !== LEGACY_MCP_RESOURCE}
            clientId={clientId}
            redirectUri={redirectUri}
            state={state}
            requestedScopes={requestedScopes}
            availableScopes={availableScopes}
            availableOrganizations={memberships.map((membership) => ({
              ...membership.organization,
              role: membership.role,
            }))}
            codeChallenge={codeChallenge}
            initialOrganizationIds={
              existingGrant?.active ? existingGrant.organizationIds : []
            }
          />

          <p className="text-xs font-bold text-muted-foreground mt-6">
            Signed in as {session.user.email ?? session.user.name ?? "Unknown"}
          </p>
        </div>
      </div>
    </div>
  );
}
