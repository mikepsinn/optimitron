import { prisma } from "@/lib/prisma";
import { readVercelGeo } from "@/lib/geo/vercel-geo";

/**
 * Backfill missing location columns on the User row from Vercel geo headers.
 * No-op if the user already has a countryCode, or the request has no geo.
 * Fire-and-forget; failures are logged and swallowed so the caller (a server
 * component) never fails for a telemetry reason.
 */
export async function backfillUserLocationFromHeaders(
  userId: string,
  requestHeaders: Headers,
): Promise<void> {
  const geo = readVercelGeo(requestHeaders);
  if (!geo.countryCode && !geo.regionCode && !geo.city && geo.latitude == null) {
    return;
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        countryCode: true,
        regionCode: true,
        city: true,
        latitude: true,
        longitude: true,
        timeZone: true,
      },
    });
    if (!existing) return;

    const data: Record<string, string | number> = {};
    if (!existing.countryCode && geo.countryCode) data.countryCode = geo.countryCode;
    if (!existing.regionCode && geo.regionCode) data.regionCode = geo.regionCode;
    if (!existing.city && geo.city) data.city = geo.city;
    if (existing.latitude == null && geo.latitude != null) data.latitude = geo.latitude;
    if (existing.longitude == null && geo.longitude != null) data.longitude = geo.longitude;
    if (!existing.timeZone && geo.timeZone) data.timeZone = geo.timeZone;

    if (Object.keys(data).length === 0) return;

    await prisma.user.update({ where: { id: userId }, data });

    if (data.countryCode) {
      await prisma.person
        .updateMany({
          where: { user: { id: userId }, countryCode: null },
          data: { countryCode: data.countryCode as string },
        })
        .catch((error) => {
          // Person backfill is best-effort — the user.countryCode write above
          // already succeeded, so we tolerate failure here. But it's our own
          // DB write, so a failure is a real bug we should see and fix.
          console.error("[GEO BACKFILL] Person countryCode backfill failed", userId, error);
        });
    }
  } catch (error) {
    console.error("[GEO BACKFILL] Failed to backfill user location", userId, error);
  }
}
