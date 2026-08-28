/** Days after a verified hang before the place ranks as needing a rehang. */
export const FLYER_HANG_STALE_AFTER_DAYS = 21;

/** Max place tasks returned / upserted per nearby ensure. */
export const FLYER_HANG_NEARBY_LIMIT = 12;

/** Search radius for Overpass POIs and listing distance filter (km). */
export const FLYER_HANG_SEARCH_RADIUS_KM = 5;

/** Grid cell size in degrees (~1.1 km at the equator). */
export const FLYER_HANG_GRID_DEGREES = 0.01;

export const FLYER_HANG_GRID_SLOTS = [
  {
    id: "library",
    title: "Hang a flyer at a nearby library",
    description:
      "Print your referral poster. Ask the library front desk or community-board owner first. Tape it where humans already stop to read. Photograph the hung flyer, then mark this task done so others know the board is covered.",
  },
  {
    id: "cafe",
    title: "Hang a flyer at a cafe with a community board",
    description:
      "Print your referral poster. Ask before taping. Prefer corkboards and windows that already hold local notices. Photograph the hung flyer, then mark this task done.",
  },
  {
    id: "campus",
    title: "Hang a flyer on a campus or school notice board",
    description:
      "Print your referral poster. Use public notice boards only. Ask staff when the board is managed. Photograph the hung flyer, then mark this task done.",
  },
  {
    id: "community",
    title: "Hang a flyer at a community center",
    description:
      "Print your referral poster. Ask at the desk for the public board. Photograph the hung flyer, then mark this task done.",
  },
  {
    id: "transit",
    title: "Hang a flyer near a busy transit stop board",
    description:
      "Print your referral poster. Use only boards that already hold public notices. Do not tape private property. Photograph the hung flyer, then mark this task done.",
  },
] as const;

export type FlyerHangGridSlotId = (typeof FLYER_HANG_GRID_SLOTS)[number]["id"];
