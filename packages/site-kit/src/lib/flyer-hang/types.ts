import type { getFlyerHangFreshness } from "./staleness";

export type FlyerHangNearbyTask = {
  distanceKm: number;
  freshness: ReturnType<typeof getFlyerHangFreshness>;
  href: string;
  id: string;
  lastHungAt: string | null;
  latitude: number;
  locationText: string | null;
  longitude: number;
  name: string;
  source: string;
  taskKey: string;
  title: string;
};
