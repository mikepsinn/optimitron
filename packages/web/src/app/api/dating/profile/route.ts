import {
  DatingProfileStatus,
  DatingRelationshipIntent,
} from "@optimitron/db/enums";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-utils";
import { getOwnDatingProfile, saveDatingProfile } from "@/lib/dating.server";

export const runtime = "nodejs";

const ProfileBodySchema = z.object({
  bio: z.string().max(2000).nullish(),
  campaignDateIdeas: z.array(z.string().max(120)).max(8).optional(),
  displayCity: z.string().max(80).nullish(),
  displayCountryCode: z.string().max(2).nullish(),
  displayRegionCode: z.string().max(16).nullish(),
  headline: z.string().max(140).nullish(),
  lookingForText: z.string().max(1000).nullish(),
  relationshipIntents: z.array(z.nativeEnum(DatingRelationshipIntent)).max(8).optional(),
  safetyAcknowledged: z.boolean().optional(),
  status: z.nativeEnum(DatingProfileStatus).optional(),
  wantsCampaignDates: z.boolean().optional(),
});

export async function GET() {
  try {
    const { userId } = await requireAuth();
    const profile = await getOwnDatingProfile(userId);
    return NextResponse.json({ profile });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[dating] Failed to load profile:", error);
    return NextResponse.json(
      { error: "Failed to load dating profile." },
      { status: 500 },
    );
  }
}
export async function PATCH(request: Request) {
  try {
    const { userId } = await requireAuth();
    const parsed = ProfileBodySchema.parse(await request.json());
    const profile = await saveDatingProfile(userId, parsed);
    return NextResponse.json({ profile, success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid dating profile." },
        { status: 400 },
      );
    }
    console.error("[dating] Failed to save profile:", error);
    return NextResponse.json(
      { error: "Failed to save dating profile." },
      { status: 500 },
    );
  }
}
