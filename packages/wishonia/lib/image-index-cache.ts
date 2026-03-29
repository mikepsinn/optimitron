import { prepareImageIndex, type IndexedManualImage, type ManualImageEntry } from "./manual-images";

const IMAGE_INDEX_URL = "https://manual.warondisease.org/assets/image-index.json";
const CACHE_TTL_MS = 5 * 60 * 1000;

let cachedIndex: IndexedManualImage[] = [];
let lastFetchTime = 0;
let fetchPromise: Promise<IndexedManualImage[]> | null = null;

export async function getImageIndex(): Promise<IndexedManualImage[]> {
  const now = Date.now();

  if (cachedIndex.length > 0 && now - lastFetchTime < CACHE_TTL_MS) {
    return cachedIndex;
  }

  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const response = await fetch(IMAGE_INDEX_URL);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = (await response.json()) as { images?: ManualImageEntry[] };
      cachedIndex = prepareImageIndex(data.images ?? []);
      lastFetchTime = Date.now();
    } catch (error) {
      console.error("[image-index-cache] Failed to fetch:", error);
    }

    return cachedIndex;
  })();

  try {
    return await fetchPromise;
  } finally {
    fetchPromise = null;
  }
}
