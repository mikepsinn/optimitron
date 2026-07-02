import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-utils";
import { createStripeConnectOnboardingLink } from "@/lib/stripe-connect.server";
import { getBaseUrl } from "@/lib/url";

export const runtime = "nodejs";

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
      refreshUrl: parsed.data.refreshUrl ?? defaultConnectRefreshUrl(),
      returnUrl: parsed.data.returnUrl ?? defaultConnectReturnUrl(),
      userId,
    });

    return NextResponse.json({ data: result, success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create Stripe Connect onboarding link.",
      },
      { status: 400 },
    );
  }
}
