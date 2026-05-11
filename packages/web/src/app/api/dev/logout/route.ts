import { NextResponse } from "next/server";

// `/api/dev/logout?next=/some-path` — clears the NextAuth session cookie
// and redirects to `next`. Triggered by the middleware when a request
// arrives with `?logout=1` query param.
//
// NOT env-gated. Clearing your own session cookie is harmless on any
// environment — it just signs the current viewer out.

function sanitizeNext(raw: string | null): string {
  if (!raw) return "/";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = sanitizeNext(url.searchParams.get("next"));

  const response = NextResponse.redirect(new URL(next, request.url), 307);

  // Clear both possible cookie names (HTTPS uses the __Secure- prefix; HTTP
  // localhost uses the bare name). Clearing both is cheap and avoids the
  // protocol-detection branch.
  for (const name of [
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
  ]) {
    response.cookies.set({ name, value: "", path: "/", maxAge: 0 });
  }
  return response;
}
