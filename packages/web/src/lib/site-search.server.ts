import {
  getManualSearchIndex,
  searchManualContent,
  type ManualSearchEntry,
} from "@/lib/manual-search.server";
import {
  searchStaticSiteDocuments,
  type StaticSiteSearchDocument,
} from "@/lib/site-search";
import type { SiteConfig } from "@/lib/site";
import { searchTasks, type TaskSearchResult } from "@/lib/tasks.server";

const MANUAL_BASE_URL = "https://manual.warondisease.org";

export interface ManualSiteSearchResult {
  description: string;
  href: string;
  score: number;
  section: string | null;
  title: string;
}

export interface SiteSearchResults {
  manual: ManualSiteSearchResult[];
  manualError: string | null;
  pages: Array<StaticSiteSearchDocument & { score: number }>;
  query: string;
  tasks: TaskSearchResult[];
  totalResults: number;
}

function dedupeManualResults(results: ManualSiteSearchResult[]) {
  const seen = new Set<string>();

  return results.filter((result) => {
    const key = `${result.href.toLowerCase()}::${result.title.toLowerCase()}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function getManualEntryHref(entry: ManualSearchEntry) {
  const rawUrl = entry.url?.trim();

  if (rawUrl) {
    if (/^https?:\/\//i.test(rawUrl)) {
      return rawUrl;
    }

    return `${MANUAL_BASE_URL}${rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`}`;
  }

  const rawPath = entry.path?.trim();
  if (rawPath) {
    return `${MANUAL_BASE_URL}/${rawPath.replace(/^\//, "")}`;
  }

  return MANUAL_BASE_URL;
}

export async function searchSiteContent(
  query: string,
  options?: {
    pageLimit?: number;
    site?: SiteConfig;
    taskLimit?: number;
    userId?: string | null;
  },
): Promise<SiteSearchResults> {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return {
      manual: [],
      manualError: null,
      pages: [],
      query: trimmedQuery,
      tasks: [],
      totalResults: 0,
    };
  }

  const [pages, tasks, manualResponse] = await Promise.all([
    Promise.resolve(
      searchStaticSiteDocuments(trimmedQuery, {
        limit: options?.pageLimit ?? 12,
        site: options?.site,
      }),
    ),
    searchTasks(trimmedQuery, {
      limit: options?.taskLimit ?? 12,
      userId: options?.userId ?? null,
    }),
    (async () => {
      try {
        const manualIndex = await getManualSearchIndex();
        const manualResults = dedupeManualResults(
          searchManualContent(
          manualIndex,
          trimmedQuery,
          8,
          3200,
        ).results.map((result) => ({
            description: result.entry.description ?? "Manual reference",
            href: getManualEntryHref(result.entry),
            score: Number(result.score.toFixed(3)),
            section: result.entry.section ?? result.entry.sections?.[0] ?? null,
            title: result.entry.title ?? "Untitled",
          })),
        );

        return {
          manual: manualResults,
          manualError: null,
        };
      } catch (error) {
        console.error("[site-search] Manual index unavailable:", error);

        return {
          manual: [] satisfies ManualSiteSearchResult[],
          manualError: "Manual search is temporarily unavailable.",
        };
      }
    })(),
  ]);

  return {
    manual: manualResponse.manual,
    manualError: manualResponse.manualError,
    pages,
    query: trimmedQuery,
    tasks,
    totalResults: pages.length + tasks.length + manualResponse.manual.length,
  };
}
