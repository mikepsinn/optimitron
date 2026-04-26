import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DEFAULT_SCOPES, scopesFromWire, scopesToWire } from "@/lib/mcp-scopes";
import { McpConsentForm } from "./consent-form";

export default async function McpAuthorizePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const clientId = typeof params.client_id === "string" ? params.client_id : null;
  const redirectUri = typeof params.redirect_uri === "string" ? params.redirect_uri : null;
  const state = typeof params.state === "string" ? params.state : null;
  const scope = typeof params.scope === "string" ? params.scope : scopesToWire(DEFAULT_SCOPES);
  const codeChallenge = typeof params.code_challenge === "string" ? params.code_challenge : null;
  const clientName = typeof params.client_name === "string" ? params.client_name : clientId;

  if (!clientId || !redirectUri || !codeChallenge) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brutal-pink text-brutal-pink-foreground">
        <div className="border-4 border-primary bg-background text-foreground p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h1 className="text-2xl font-black uppercase">Invalid Request</h1>
          <p className="mt-2 font-bold">Missing required OAuth parameters.</p>
        </div>
      </div>
    );
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    const currentUrl = new URL("/mcp/authorize", process.env.NEXTAUTH_URL ?? "http://localhost:3001");
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === "string") currentUrl.searchParams.set(key, value);
    }
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(currentUrl.toString())}`);
  }

  const requestedScopes = scopesFromWire(scope);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-brutal-cyan text-brutal-cyan-foreground">
      <div className="w-full max-w-lg">
        <div className="border-4 border-primary bg-background text-foreground p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h1 className="text-2xl font-black uppercase mb-2">Authorize App</h1>
          <p className="font-bold text-muted-foreground mb-6">
            <span className="text-foreground">{clientName}</span> wants to access your Optimitron account. Tick the permissions you want to grant.
          </p>

          <McpConsentForm
            clientId={clientId}
            redirectUri={redirectUri}
            state={state}
            requestedScopes={requestedScopes}
            codeChallenge={codeChallenge}
          />

          <p className="text-xs font-bold text-muted-foreground mt-6">
            Signed in as {session.user.email ?? session.user.name ?? "Unknown"}
          </p>
        </div>
      </div>
    </div>
  );
}
