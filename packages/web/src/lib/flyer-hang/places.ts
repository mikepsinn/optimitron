import { buildFlyerHangPlaceTaskKey } from "@optimitron/db/task-keys";
import {
  FLYER_HANG_GRID_DEGREES,
  FLYER_HANG_GRID_SLOTS,
  FLYER_HANG_SEARCH_RADIUS_KM,
  type FlyerHangGridSlotId,
} from "./constants";

export type FlyerHangPlaceCandidate = {
  city: string | null;
  countryCode: string | null;
  latitude: number;
  longitude: number;
  name: string;
  placeId: string;
  regionCode: string | null;
  source: "grid" | "osm";
  slotId?: FlyerHangGridSlotId;
};

export function buildFlyerHangGridId(latitude: number, longitude: number) {
  const lat = (Math.round(latitude / FLYER_HANG_GRID_DEGREES) * FLYER_HANG_GRID_DEGREES)
    .toFixed(2);
  const lng = (
    Math.round(longitude / FLYER_HANG_GRID_DEGREES) * FLYER_HANG_GRID_DEGREES
  ).toFixed(2);
  return `${lat}:${lng}`;
}

export function buildGridSlotPlaceCandidates(input: {
  city?: string | null;
  countryCode?: string | null;
  latitude: number;
  longitude: number;
  regionCode?: string | null;
}): FlyerHangPlaceCandidate[] {
  const gridId = buildFlyerHangGridId(input.latitude, input.longitude);
  const cityLabel = input.city?.trim() || "your area";

  return FLYER_HANG_GRID_SLOTS.map((slot, index) => {
    // Spread slots a few hundred meters around the grid center so ranking
    // by distance is stable and maps are not stacked on one point.
    const offsetLat = ((index % 3) - 1) * 0.002;
    const offsetLng = (Math.floor(index / 3) - 0.5) * 0.002;
    return {
      city: input.city?.trim() || null,
      countryCode: input.countryCode?.trim() || null,
      latitude: input.latitude + offsetLat,
      longitude: input.longitude + offsetLng,
      name: `${slot.title.replace(/^Hang a flyer at /i, "").replace(/^Hang a flyer /i, "")} (${cityLabel})`,
      placeId: `${gridId}:${slot.id}`,
      regionCode: input.regionCode?.trim() || null,
      slotId: slot.id,
      source: "grid" as const,
    };
  });
}

export function haversineKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

type OverpassElement = {
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
  type: "node" | "way" | "relation";
};

function pickCoords(element: OverpassElement) {
  if (typeof element.lat === "number" && typeof element.lon === "number") {
    return { latitude: element.lat, longitude: element.lon };
  }
  if (
    element.center &&
    typeof element.center.lat === "number" &&
    typeof element.center.lon === "number"
  ) {
    return { latitude: element.center.lat, longitude: element.center.lon };
  }
  return null;
}

function amenityLabel(tags: Record<string, string> | undefined) {
  const amenity = tags?.amenity;
  if (amenity === "library") return "Library";
  if (amenity === "community_centre" || amenity === "community_center") {
    return "Community center";
  }
  if (amenity === "university" || amenity === "college") return "Campus";
  if (amenity === "cafe") return "Cafe board";
  return "Public board";
}

export function parseOverpassFlyerHangPlaces(
  payload: unknown,
  origin: { latitude: number; longitude: number },
): FlyerHangPlaceCandidate[] {
  if (!payload || typeof payload !== "object") return [];
  const elements = (payload as { elements?: OverpassElement[] }).elements;
  if (!Array.isArray(elements)) return [];

  const places: FlyerHangPlaceCandidate[] = [];
  for (const element of elements) {
    const coords = pickCoords(element);
    if (!coords) continue;
    const distanceKm = haversineKm(origin, coords);
    if (distanceKm > FLYER_HANG_SEARCH_RADIUS_KM) continue;
    const name =
      element.tags?.name?.trim() ||
      `${amenityLabel(element.tags)} near you`;
    places.push({
      city: element.tags?.["addr:city"]?.trim() || null,
      countryCode: null,
      latitude: coords.latitude,
      longitude: coords.longitude,
      name,
      placeId: `${element.type}:${element.id}`,
      regionCode: null,
      source: "osm",
    });
  }

  places.sort(
    (a, b) => haversineKm(origin, a) - haversineKm(origin, b),
  );
  return places;
}

export function buildOverpassFlyerHangQuery(input: {
  latitude: number;
  longitude: number;
  radiusMeters?: number;
}) {
  const radius = Math.round(
    (input.radiusMeters ?? FLYER_HANG_SEARCH_RADIUS_KM * 1000),
  );
  const { latitude, longitude } = input;
  return `
[out:json][timeout:25];
(
  node["amenity"="library"](around:${radius},${latitude},${longitude});
  way["amenity"="library"](around:${radius},${latitude},${longitude});
  node["amenity"="community_centre"](around:${radius},${latitude},${longitude});
  way["amenity"="community_centre"](around:${radius},${latitude},${longitude});
  node["amenity"="university"](around:${radius},${latitude},${longitude});
  node["amenity"="college"](around:${radius},${latitude},${longitude});
  node["amenity"="cafe"]["board"="yes"](around:${radius},${latitude},${longitude});
);
out center tags 30;
`.trim();
}

export async function fetchOverpassFlyerHangPlaces(
  input: {
    latitude: number;
    longitude: number;
  },
  options?: {
    fetchImpl?: typeof fetch;
    endpoint?: string;
  },
): Promise<FlyerHangPlaceCandidate[]> {
  const fetchImpl = options?.fetchImpl ?? fetch;
  const endpoint =
    options?.endpoint ?? "https://overpass-api.de/api/interpreter";
  const query = buildOverpassFlyerHangQuery(input);
  const response = await fetchImpl(endpoint, {
    body: `data=${encodeURIComponent(query)}`,
    headers: { "content-type": "application/x-www-form-urlencoded" },
    method: "POST",
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) {
    throw new Error(`Overpass request failed: ${response.status}`);
  }
  const payload = await response.json();
  return parseOverpassFlyerHangPlaces(payload, input);
}

export function taskKeyForFlyerHangPlace(place: FlyerHangPlaceCandidate) {
  return buildFlyerHangPlaceTaskKey({
    placeId: place.placeId,
    source: place.source,
  });
}
