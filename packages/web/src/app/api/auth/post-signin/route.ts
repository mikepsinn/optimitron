import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { applyPostSigninSync } from "@/lib/post-signin-sync.server";

export const runtime = "nodejs";

const LANDING_URL_MAX_LENGTH = 2048;

/// Query keys we strip before storage. These can carry one-time auth
/// secrets (OAuth code+state, magic-link tokens) that have no business
/// living in our `signupLandingUrl` forever. Belt-and-suspenders — the
/// landing URL captured at first page load shouldn't contain these
/// anyway, but a malicious or careless client could pass them in.
const SENSITIVE_QUERY_KEYS = new Set([
  "code",
  "state",
  "token",
  "session_state",
  "id_token",
  "access_token",
  "refresh_token",
]);

function sanitizeLandingUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    // Not a valid absolute URL — store the truncated raw string anyway,
    // it's still useful as forensic data even if malformed.
    return trimmed.slice(0, LANDING_URL_MAX_LENGTH);
  }
  for (const key of SENSITIVE_QUERY_KEYS) {
    url.searchParams.delete(key);
  }
  const sanitized = url.toString();
  return sanitized.length > LANDING_URL_MAX_LENGTH
    ? sanitized.slice(0, LANDING_URL_MAX_LENGTH)
    : sanitized;
}

async function readPostSigninBody(request: Request): Promise<Record<string, unknown>> {
  const text = await request.text();
  if (!text.trim()) {
    return {};
  }

  const parsed = JSON.parse(text);
  return parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? (parsed as Record<string, unknown>)
    : {};
}

export async function POST(request: Request) {
  try {
    const { userId } = await requireAuth();
    const body = await readPostSigninBody(request);

    const result = await applyPostSigninSync({
      userId,
      name: typeof body.name === "string" ? body.name : null,
      newsletterSubscribed:
        typeof body.newsletterSubscribed === "boolean" ? body.newsletterSubscribed : undefined,
      referralCode: typeof body.referralCode === "string" ? body.referralCode : null,
      shareAttemptId: typeof body.shareAttemptId === "string" ? body.shareAttemptId : null,
      // First URL the user landed on, captured by the client into
      // localStorage on first page load. Variant key is derivable from
      // the host on demand via getSiteFromHost — no separate column.
      // Cap at 2KB (matches the referral-invitation route) so a malicious
      // client can't blow up storage with megabyte URLs.
      signupLandingUrl:
        typeof body.signupLandingUrl === "string"
          ? sanitizeLandingUrl(body.signupLandingUrl)
          : null,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("[POST SIGNIN] Error:", error);
    return NextResponse.json({ error: "Failed to sync sign-in data." }, { status: 500 });
  }
}
