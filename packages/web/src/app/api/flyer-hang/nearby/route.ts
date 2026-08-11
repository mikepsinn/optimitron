import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { ensureNearbyFlyerHangTasks } from "@/lib/flyer-hang/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type NearbyBody = {
  city?: string | null;
  countryCode?: string | null;
  latitude?: number;
  longitude?: number;
  regionCode?: string | null;
};

function readFiniteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let body: NearbyBody = {};
  try {
    body = (await request.json()) as NearbyBody;
  } catch {
    body = {};
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      city: true,
      countryCode: true,
      latitude: true,
      longitude: true,
      personId: true,
      regionCode: true,
    },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const latitude = readFiniteNumber(body.latitude) ?? user.latitude;
  const longitude = readFiniteNumber(body.longitude) ?? user.longitude;
  if (latitude == null || longitude == null) {
    return NextResponse.json(
      {
        error: "Location required.",
        places: [],
        needsLocation: true,
      },
      { status: 400 },
    );
  }

  // Persist browser geolocation when the profile still lacks coordinates.
  if (
    readFiniteNumber(body.latitude) != null &&
    readFiniteNumber(body.longitude) != null &&
    (user.latitude == null || user.longitude == null)
  ) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        latitude,
        longitude,
        ...(body.city && !user.city ? { city: body.city } : {}),
        ...(body.countryCode && !user.countryCode
          ? { countryCode: body.countryCode }
          : {}),
        ...(body.regionCode && !user.regionCode
          ? { regionCode: body.regionCode }
          : {}),
      },
    });
  }

  const result = await ensureNearbyFlyerHangTasks({
    city: body.city ?? user.city,
    countryCode: body.countryCode ?? user.countryCode,
    createdByUserId: userId,
    latitude,
    longitude,
    personId: user.personId,
    regionCode: body.regionCode ?? user.regionCode,
    userId,
  });

  return NextResponse.json({
    needsLocation: false,
    personalTaskId: result.personalTaskId,
    places: result.places,
    usedOverpass: result.usedOverpass,
  });
}
