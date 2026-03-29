import type { ScoredResult } from "./search";
import { tokenize } from "./search";

export interface ManualImageEntry {
  path: string;
  filename?: string;
  title?: string;
  description?: string;
  keywords?: string[];
  imageType?: string;
  width?: number;
}

export interface IndexedManualImage extends ManualImageEntry {
  searchTokens: string[];
}

export interface ImageCandidate {
  path: string;
  title?: string;
  description?: string;
  score: number;
}

function imageSearchText(image: ManualImageEntry): string {
  return [
    image.path,
    image.filename,
    image.title,
    image.description,
    ...(image.keywords ?? []),
  ]
    .filter(Boolean)
    .join(" ");
}

function relevantSlugs(results: ScoredResult[]): string[] {
  return results
    .map((result) =>
      (result.entry.url ?? "")
        .replace(/\.html.*$/i, "")
        .replace(/^.*\//, "")
        .toLowerCase()
    )
    .filter(Boolean);
}

function scoreImage(
  image: IndexedManualImage,
  queryTokens: string[],
  slugs: string[]
): number {
  if (queryTokens.length === 0) return 0;

  let score = 0;
  const path = image.path.toLowerCase();

  for (const slug of slugs) {
    if (path.includes(slug)) score += 5;
  }

  for (const token of queryTokens) {
    if (image.searchTokens.includes(token)) score += 2;
  }

  const imageType = (image.imageType || "").toLowerCase();
  if (imageType === "chart" || imageType === "infographic") score += 1;

  return score;
}

export function prepareImageIndex(images: ManualImageEntry[]): IndexedManualImage[] {
  return images
    .filter((image) => {
      const imageType = (image.imageType || "").toLowerCase();
      return imageType !== "icon" && imageType !== "og" && (image.width || 0) >= 400;
    })
    .map((image) => ({
      ...image,
      searchTokens: tokenize(imageSearchText(image)),
    }));
}

export function findTopImageCandidates(
  images: IndexedManualImage[],
  query: string,
  results: ScoredResult[],
  count = 3
): ImageCandidate[] {
  const queryTokens = tokenize(query);
  const slugs = relevantSlugs(results);

  return images
    .map((image) => ({
      path: image.path,
      title: image.title,
      description: image.description,
      score: scoreImage(image, queryTokens, slugs),
    }))
    .filter((candidate) => candidate.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}

export function findRelevantImage(
  images: IndexedManualImage[],
  query: string,
  results: ScoredResult[]
): ImageCandidate | null {
  const [best] = findTopImageCandidates(images, query, results, 1);
  return best && best.score >= 4 ? best : null;
}
