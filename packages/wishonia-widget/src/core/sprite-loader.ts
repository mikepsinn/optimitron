/** Tier-based sprite loading. Tier 0 is critical (idle + talking), others lazy. */

const TIER_0_SPRITES = [
  "neutral-smile",
  "neutral-closed",
  "neutral-open",
  "neutral-oh",
  "neutral-ee",
  "neutral-small",
  "blink-smile",
  "body-idle",
];

const TIER_1_SPRITES = [
  "happy-smile",
  "happy-open",
  "happy-oh",
  "happy-ee",
  "happy-closed",
  "happy-small",
  "excited-open",
  "excited-ee",
  "excited-oh",
  "excited-closed",
  "thinking-oh",
  "thinking-closed",
  "thinking-small",
  "body-presenting",
  "body-listening",
  "body-thinking",
];

const loaded = new Set<string>();

export function getSpriteUrl(
  name: string,
  basePath: string,
  format: "webp" | "png" = "png",
): string {
  return `${basePath}${name}.${format}`;
}

/** Preload a list of sprite URLs into the browser cache */
export function preloadSprites(
  names: string[],
  basePath: string,
  format: "webp" | "png" = "png",
): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();

  const promises = names
    .filter((n) => !loaded.has(n))
    .map(
      (name) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            loaded.add(name);
            resolve();
          };
          img.onerror = () => resolve(); // don't block on missing sprites
          img.src = getSpriteUrl(name, basePath, format);
        }),
    );

  return Promise.all(promises).then(() => undefined);
}

/** Preload tier 0 (critical) sprites */
export function preloadTier0(basePath: string, format: "webp" | "png" = "png") {
  return preloadSprites(TIER_0_SPRITES, basePath, format);
}

/** Preload tier 1 (presentation) sprites */
export function preloadTier1(basePath: string, format: "webp" | "png" = "png") {
  return preloadSprites(TIER_1_SPRITES, basePath, format);
}
