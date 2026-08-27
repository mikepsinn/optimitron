import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-utils";
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

function readFiniteNumber(value: unknown, min: number, max: number) {
  return typeof value === "number" &&
    Number.isFinite(value) &&
    value >= min &&
    value <= max
    ? value
    : null;
}

function readLatitude(value: unknown) {
  return readFiniteNumber(value, -90, 90);
}

function readLongitude(value: unknown) {
  return readFiniteNumber(value, -180, 180);
}

export async function POST(request: Request) {
  const sessionUser = await getSessionUser();
  const userId = sessionUser?.id;
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

  const latitude = readLatitude(body.latitude) ?? user.latitude;
  const longitude = readLongitude(body.longitude) ?? user.longitude;
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
    readLatitude(body.latitude) != null &&
    readLongitude(body.longitude) != null &&
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

  try {
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
  } catch (error) {
    console.error("[FLYER HANG] Failed to load nearby tasks", userId, error);
    return NextResponse.json(
      { error: "Could not load hang spots.", needsLocation: false, places: [] },
      { status: 500 },
    );
  }
}
