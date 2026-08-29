/**
 * Black-and-white serif text OG image copy model, ported from the
 * monolith's `lib/black-white-text-og-image.ts`. This app passes explicit
 * copy structs, so the nav-item derivation helpers stayed behind.
 */

export interface BlackWhiteTextOgImageSize {
  height: number;
  width: number;
}

export interface BlackWhiteTextOgImageCopy {
  eyebrow?: string;
  footer?: string;
  primaryLines: readonly string[];
  secondaryLines?: readonly string[];
}

export const BLACK_WHITE_TEXT_OG_SERIF_FONT_FAMILY = "Libre Baskerville";

export const BLACK_WHITE_TEXT_OG_IMAGE_PRESETS = {
  openGraph: { width: 1200, height: 630 },
} as const satisfies Record<string, BlackWhiteTextOgImageSize>;

function withFinalPunctuation(text: string): string {
  return /[.!?]$/u.test(text) ? text : `${text}.`;
}

export function buildBlackWhiteTextOgAltText(
  copy: BlackWhiteTextOgImageCopy,
): string {
  const segments = [
    copy.eyebrow,
    copy.primaryLines.join(" "),
    ...(copy.secondaryLines ?? []),
    copy.footer,
  ]
    .map((segment) => segment?.trim())
    .filter((segment): segment is string => Boolean(segment));

  return segments.map(withFinalPunctuation).join(" ");
}
