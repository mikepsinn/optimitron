import type { MetadataRoute } from "next";
import {
  AGENT_ENDPOINT_PATHS,
  MARKDOWN_MIRROR_PATHS,
} from "./campaign-canon";

type SitemapEntry = MetadataRoute.Sitemap[number];
type ChangeFrequency = NonNullable<SitemapEntry["changeFrequency"]>;

export interface AgentReadableSitemapRoute {
  changeFrequency: ChangeFrequency;
  path: string;
  priority: number;
}

// This app serves the agent-readable files, so its sitemap lists them.
export function getAgentReadableSitemapRoutes(): AgentReadableSitemapRoute[] {
  return [
    { path: "/llms.txt", priority: 0.9, changeFrequency: "daily" },
    { path: "/llms-full.txt", priority: 0.85, changeFrequency: "daily" },
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
