import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { ensurePersonForUser } from "@/lib/person.server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const data = await req.json();

    let normalizedHandle: string | null | undefined = undefined;

    if ("username" in data) {
      const raw = (data.username ?? "").trim();

      if (raw === "") {
        normalizedHandle = null;
      } else {
        if (raw.length < 3 || raw.length > 24) {
          return NextResponse.json(
            { error: "Player name must be between 3 and 24 characters." },
            { status: 400 },
          );
        }

        if (!/^[a-zA-Z0-9_-]+$/.test(raw)) {
          return NextResponse.json(
            {
              error:
                "Player name can only include letters, numbers, hyphens, and underscores.",
            },
            { status: 400 },
          );
        }

        // Handles live on Person now (canonical), so the uniqueness check
        // queries Person.handle. The User.username column is still mirrored
        // below for legacy callers, but is no longer the source of truth.
        const lowered = raw.toLowerCase();
        const collision = await prisma.person.findFirst({
          where: {
            handle: lowered,
            user: { NOT: { id: userId } },
          },
          select: { id: true },
        });

        if (collision) {
          return NextResponse.json(
            { error: "That player name is already taken. Please choose another." },
            { status: 400 },
          );
        }

        normalizedHandle = lowered;
      }
    }

    // Make sure a Person row exists and is linked. ensurePersonForUser is
    // idempotent and safe to call before any Person update.
    await ensurePersonForUser(userId);

    await prisma.$transaction(async (tx) => {
      const userRecord = await tx.user.findUniqueOrThrow({
        where: { id: userId },
        select: { personId: true },
      });

      // Person is canonical for displayName / handle / image. Write here first.
      if (userRecord.personId) {
        await tx.person.update({
          where: { id: userRecord.personId },
          data: {
            ...(typeof data.name === "string"
              ? { displayName: data.name }
              : {}),
            ...(normalizedHandle !== undefined ? { handle: normalizedHandle } : {}),
            ...(typeof data.bio === "string" ? { bio: data.bio } : {}),
          },
        });
      }

      // Mirror displayName/handle to the legacy User columns so that any code
      // path still reading them keeps working until Phase 3 drops the columns.
      await tx.user.update({
        where: { id: userId },
        data: {
          name: data.name,
          bio: data.bio,
          isPublic: data.isPublic,
          newsletterSubscribed: data.newsletterSubscribed,
          website: data.website,
          headline: data.headline,
          coverImage: data.coverImage,
          ...(normalizedHandle !== undefined
            ? { username: normalizedHandle }
            : {}),
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
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
