import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { applyPostSigninSync } from "@/lib/post-signin-sync.server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { userId } = await requireAuth();
    const body = await request.json();

    const result = await applyPostSigninSync({
      userId,
      name: typeof body.name === "string" ? body.name : null,
      newsletterSubscribed:
        typeof body.newsletterSubscribed === "boolean" ? body.newsletterSubscribed : undefined,
      referralCode: typeof body.referralCode === "string" ? body.referralCode : null,
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
