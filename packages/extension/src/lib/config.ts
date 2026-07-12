/**
 * API base configuration. Default is production; the options page can point
 * the extension at a local dev server instead.
 */

export const DEFAULT_API_BASE = "https://optimitron.com";
export const DEV_API_BASE = "http://localhost:3001";

const API_BASE_KEY = "apiBase";

export async function getApiBase(): Promise<string> {
  const result = await chrome.storage.local.get(API_BASE_KEY);
  const stored = result[API_BASE_KEY];
  if (typeof stored === "string" && stored.trim()) {
    return stored.trim().replace(/\/+$/g, "");
  }
  return DEFAULT_API_BASE;
}

export async function setApiBase(base: string): Promise<void> {
  const trimmed = base.trim().replace(/\/+$/g, "");
  if (!trimmed) {
    await chrome.storage.local.remove(API_BASE_KEY);
    return;
  }
  await chrome.storage.local.set({ [API_BASE_KEY]: trimmed });
}
