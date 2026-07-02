import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-utils";
import { createLogger } from "@/lib/logger";
import { createStripeConnectOnboardingLink } from "@/lib/stripe-connect.server";
import { getBaseUrl } from "@/lib/url";

export const runtime = "nodejs";

const log = createLogger("stripe-connect-onboarding-route");

const OnboardingLinkBodySchema = z.object({
  refreshUrl: z.string().trim().url().nullish(),
  returnUrl: z.string().trim().url().nullish(),
});

function defaultConnectReturnUrl() {
  return `${getBaseUrl()}/settings?stripe_connect=return`;
}

function defaultConnectRefreshUrl() {
  return `${getBaseUrl()}/settings?stripe_connect=refresh`;
}

// Client-supplied refresh/return URLs must return the user to our own app.
// `z.string().url()` alone permits any HTTPS host, which would let this endpoint
// mint Stripe onboarding links that redirect to an attacker-controlled site.
function resolveTrustedConnectUrl(
  value: string | null | undefined,
  fallback: string,
  request: Request,
) {
  if (value == null) return fallback;
  const candidate = new URL(value);
  const trustedOrigins = new Set([
    new URL(getBaseUrl()).origin,
    new URL(request.url).origin,
  ]);
  if (!trustedOrigins.has(candidate.origin)) {
    throw new Error("Invalid Stripe Connect redirect URL.");
  }
  return candidate.toString();
}

export async function POST(request: Request) {
  const parsed = OnboardingLinkBodySchema.safeParse(
    await request.json().catch(() => ({})),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid Stripe Connect onboarding payload." },
      { status: 400 },
    );
  }

  try {
    const { userId } = await requireAuth(request);
    const result = await createStripeConnectOnboardingLink({
      refreshUrl: resolveTrustedConnectUrl(
        parsed.data.refreshUrl,
        defaultConnectRefreshUrl(),
        request,
      ),
      returnUrl: resolveTrustedConnectUrl(
        parsed.data.returnUrl,
        defaultConnectReturnUrl(),
        request,
      ),
      userId,
    });

    return NextResponse.json({ data: result, success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (
      error instanceof Error &&
      error.message === "Invalid Stripe Connect redirect URL."
    ) {
      return NextResponse.json(
        { error: "Invalid Stripe Connect redirect URL." },
        { status: 400 },
      );
    }

    log.error("Failed to create Stripe Connect onboarding link", { error });
    return NextResponse.json(
      { error: "Failed to create Stripe Connect onboarding link." },
      { status: 400 },
    );
  }
}
