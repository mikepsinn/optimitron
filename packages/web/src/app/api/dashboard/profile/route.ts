import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import {
  ProfileValidationError,
  updateUserProfile,
} from "@/lib/profile-identity.server";

export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const data = await req.json();

    await updateUserProfile(userId, {
      name: typeof data.name === "string" ? data.name : undefined,
      bio: typeof data.bio === "string" ? data.bio : undefined,
      username: "username" in data ? (data.username as string | null) : undefined,
      headline: "headline" in data ? (data.headline as string | null) : undefined,
      website: "website" in data ? (data.website as string | null) : undefined,
      coverImage:
        "coverImage" in data ? (data.coverImage as string | null) : undefined,
      isPublic: typeof data.isPublic === "boolean" ? data.isPublic : undefined,
      newsletterSubscribed:
        typeof data.newsletterSubscribed === "boolean"
          ? data.newsletterSubscribed
          : undefined,
      unsubscribedScopes: Array.isArray(data.unsubscribedScopes)
        ? (data.unsubscribedScopes as string[])
        : undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ProfileValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}
