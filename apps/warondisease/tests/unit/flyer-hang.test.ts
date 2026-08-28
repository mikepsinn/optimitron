import { describe, expect, it } from "vitest";
import {
  buildFlyerHangPlaceTaskKey,
  getUserHangFlyersTaskKey,
  isFlyerHangPlaceTaskKey,
} from "@optimitron/db/task-keys";
import {
  buildFlyerHangGridId,
  buildGridSlotPlaceCandidates,
  parseOverpassFlyerHangPlaces,
  taskKeyForFlyerHangPlace,
} from "@optimitron/site-kit/lib/flyer-hang/places";
import {
  compareFlyerHangPriority,
  getFlyerHangFreshness,
} from "@optimitron/site-kit/lib/flyer-hang/staleness";

describe("flyer hang task keys", () => {
  it("builds stable place keys for dedupe", () => {
    expect(
      buildFlyerHangPlaceTaskKey({ placeId: "node:123", source: "osm" }),
    ).toBe("flyer-hang:place:osm:node:123");
    expect(
      buildFlyerHangPlaceTaskKey({
        placeId: "30.27:-97.74:library",
        source: "grid",
      }),
    ).toBe("flyer-hang:place:grid:30.27:-97.74:library");
  });

  it("recognizes place keys and personal hang plan keys", () => {
    expect(isFlyerHangPlaceTaskKey("flyer-hang:place:osm:node:1")).toBe(true);
    expect(isFlyerHangPlaceTaskKey("program:one-percent-treaty:user:u1")).toBe(
      false,
    );
    expect(getUserHangFlyersTaskKey("user_1")).toBe(
      "program:one-percent-treaty:user:user_1:hangFlyers",
    );
  });
});

describe("flyer hang places", () => {
  it("builds the same grid slots for users in the same cell", () => {
    const a = buildGridSlotPlaceCandidates({
      city: "Austin",
      latitude: 30.2711,
      longitude: -97.7437,
    });
    const b = buildGridSlotPlaceCandidates({
      city: "Austin",
      latitude: 30.274,
      longitude: -97.741,
    });
    expect(buildFlyerHangGridId(30.2711, -97.7437)).toBe(
      buildFlyerHangGridId(30.274, -97.741),
    );
    expect(a.map((place) => taskKeyForFlyerHangPlace(place))).toEqual(
      b.map((place) => taskKeyForFlyerHangPlace(place)),
    );
    expect(a).toHaveLength(5);
  });

  it("parses Overpass elements into nearby places", () => {
    const places = parseOverpassFlyerHangPlaces(
      {
        elements: [
          {
            id: 9,
            lat: 30.27,
            lon: -97.74,
            tags: { amenity: "library", name: "Central Library" },
            type: "node",
          },
          {
            id: 10,
            center: { lat: 31.0, lon: -97.0 },
            tags: { amenity: "cafe" },
            type: "way",
          },
        ],
      },
      { latitude: 30.27, longitude: -97.74 },
    );
    expect(places).toHaveLength(1);
    expect(places[0]?.name).toBe("Central Library");
    expect(places[0]?.placeId).toBe("node:9");
  });
});

describe("flyer hang staleness", () => {
  const now = new Date("2026-08-10T12:00:00.000Z");

  it("marks never-hung and old hangs as stale", () => {
    expect(getFlyerHangFreshness({ lastHungAt: null, now }).status).toBe(
      "never_hung",
    );
    expect(
      getFlyerHangFreshness({
        lastHungAt: "2026-07-01T12:00:00.000Z",
        now,
      }).status,
    ).toBe("stale");
    expect(
      getFlyerHangFreshness({
        lastHungAt: "2026-08-05T12:00:00.000Z",
        now,
      }).status,
    ).toBe("fresh");
  });

  it("ranks stale and never-hung before fresh, then by distance", () => {
    const ranked = [
      {
        distanceKm: 0.2,
        isStale: false,
        lastHungAt: new Date("2026-08-08T00:00:00.000Z"),
      },
      {
        distanceKm: 1.5,
        isStale: true,
        lastHungAt: new Date("2026-06-01T00:00:00.000Z"),
      },
      { distanceKm: 0.8, isStale: true, lastHungAt: null },
    ].sort(compareFlyerHangPriority);
    expect(ranked.map((row) => row.distanceKm)).toEqual([0.8, 1.5, 0.2]);
  });
});
