import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import {
  isEmailScope,
  isTransactionalScope,
  type EmailScope,
} from "@/lib/email/scopes";
import { prisma } from "@/lib/prisma";

function normalizeEmailPreferences(input: {
  newsletterSubscribed?: unknown;
  unsubscribedScopes?: unknown;
}) {
  const filteredScopes = Array.isArray(input.unsubscribedScopes)
    ? input.unsubscribedScopes.filter(
        (scope): scope is EmailScope =>
          isEmailScope(scope) && !isTransactionalScope(scope),
      )
    : [];

  const wantsNewsletter =
    typeof input.newsletterSubscribed === "boolean"
      ? input.newsletterSubscribed
      : !filteredScopes.includes("all");

  if (!wantsNewsletter || filteredScopes.includes("all")) {
    return {
      newsletterSubscribed: false,
      unsubscribedScopes: [
        ...filteredScopes.filter((scope) => scope !== "all"),
        "all" as const,
      ],
    };
  }

  return {
    newsletterSubscribed: true,
    unsubscribedScopes: filteredScopes.filter((scope) => scope !== "all"),
  };
}

export async function GET() {
  try {
    const { userId } = await requireAuth();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        newsletterSubscribed: true,
        unsubscribedScopes: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      emailPreferences: normalizeEmailPreferences(user),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Error fetching email preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch email preferences" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const normalized = normalizeEmailPreferences(await req.json());

    await prisma.user.update({
      where: { id: userId },
      data: normalized,
    });

    return NextResponse.json({
      success: true,
      emailPreferences: normalized,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Error updating email preferences:", error);
    return NextResponse.json(
      { error: "Failed to update email preferences" },
      { status: 500 },
    );
  }
}
