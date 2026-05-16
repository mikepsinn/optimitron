import type { MetadataRoute } from "next";
import type { SiteConfig } from "@/lib/site";
import {
  AGENT_ENDPOINT_PATHS,
  MARKDOWN_MIRROR_PATHS,
  isCanonicalAgentReadableSite,
} from "./campaign-canon";
import { ROUTES } from "@/lib/routes";

type SitemapEntry = MetadataRoute.Sitemap[number];
type ChangeFrequency = NonNullable<SitemapEntry["changeFrequency"]>;

export interface AgentReadableSitemapRoute {
  changeFrequency: ChangeFrequency;
  path: string;
  priority: number;
}

export function getAgentReadableSitemapRoutes(
  site: SiteConfig,
): AgentReadableSitemapRoute[] {
  if (!isCanonicalAgentReadableSite(site)) return [];

  return [
    { path: "/llms.txt", priority: 0.9, changeFrequency: "daily" },
    { path: "/llms-full.txt", priority: 0.85, changeFrequency: "daily" },
    { path: ROUTES.faq, priority: 0.75, changeFrequency: "monthly" },
    ...MARKDOWN_MIRROR_PATHS.map((entry) => ({
      path: entry.path,
      priority: 0.75,
      changeFrequency: "weekly" as const,
    })),
    ...AGENT_ENDPOINT_PATHS.map((entry) => ({
      path: entry.path,
      priority: 0.7,
      changeFrequency: "hourly" as const,
    })),
  ];
}
