import type { MetadataRoute } from "next";
import { ROUTES } from "@/lib/routes";

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ??
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3001");

/** Static pages — all public routes from the ROUTES config */
const STATIC_ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: ROUTES.home, priority: 1.0, changeFrequency: "daily" },
  // The Game
  { path: ROUTES.prize, priority: 0.9, changeFrequency: "daily" },
  { path: ROUTES.scoreboard, priority: 0.9, changeFrequency: "daily" },
  { path: ROUTES.wishocracy, priority: 0.9, changeFrequency: "weekly" },
  { path: ROUTES.referendum, priority: 0.9, changeFrequency: "daily" },
  { path: ROUTES.iab, priority: 0.7, changeFrequency: "weekly" },
  { path: ROUTES.video, priority: 0.8, changeFrequency: "monthly" },
  { path: ROUTES.demo, priority: 0.8, changeFrequency: "monthly" },
  // Analysis
  { path: ROUTES.outcomes, priority: 0.8, changeFrequency: "weekly" },
  { path: ROUTES.compare, priority: 0.7, changeFrequency: "weekly" },
  { path: ROUTES.misconceptions, priority: 0.7, changeFrequency: "weekly" },
  { path: ROUTES.discoveries, priority: 0.6, changeFrequency: "weekly" },
  // Governance
  { path: ROUTES.agencies, priority: 0.7, changeFrequency: "weekly" },
  { path: ROUTES.governments, priority: 0.8, changeFrequency: "weekly" },
  { path: ROUTES.alignment, priority: 0.7, changeFrequency: "weekly" },
  { path: ROUTES.dcbo, priority: 0.6, changeFrequency: "weekly" },
  { path: ROUTES.domb, priority: 0.6, changeFrequency: "weekly" },
  { path: ROUTES.dgao, priority: 0.6, changeFrequency: "weekly" },
  { path: ROUTES.dtreasury, priority: 0.6, changeFrequency: "weekly" },
  { path: ROUTES.dtreasuryDfed, priority: 0.5, changeFrequency: "monthly" },
  { path: ROUTES.dtreasuryDirs, priority: 0.5, changeFrequency: "monthly" },
  { path: ROUTES.dtreasuryDssa, priority: 0.5, changeFrequency: "monthly" },
  { path: ROUTES.ddod, priority: 0.5, changeFrequency: "monthly" },
  { path: ROUTES.dih, priority: 0.5, changeFrequency: "weekly" },
  { path: ROUTES.dcensus, priority: 0.5, changeFrequency: "monthly" },
  // Planets
  { path: ROUTES.wishonia, priority: 0.6, changeFrequency: "monthly" },
  { path: ROUTES.moronia, priority: 0.6, changeFrequency: "monthly" },
  // Meta
  { path: ROUTES.about, priority: 0.5, changeFrequency: "monthly" },
  { path: ROUTES.tools, priority: 0.6, changeFrequency: "weekly" },
  { path: ROUTES.contribute, priority: 0.5, changeFrequency: "monthly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return STATIC_ROUTES.map(({ path, priority, changeFrequency }) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));
}
