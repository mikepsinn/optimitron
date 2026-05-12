export interface TreatyOgImageSize {
  height: number;
  width: number;
}

export interface TreatyOgImageCopy {
  eyebrow?: string;
  footer?: string;
  primaryLines: readonly string[];
  secondaryLines?: readonly string[];
}

export const TREATY_OG_SERIF_FONT_FAMILY = "Libre Baskerville";

export const TREATY_OG_IMAGE_PRESETS = {
  facebookCover: { width: 1640, height: 624 },
  linkedInPageCover: { width: 4200, height: 700 },
  linkedInProfileBanner: { width: 1584, height: 396 },
  openGraph: { width: 1200, height: 630 },
  socialSquare: { width: 1080, height: 1080 },
  socialStory: { width: 1080, height: 1920 },
  xCard: { width: 1200, height: 600 },
} as const satisfies Record<string, TreatyOgImageSize>;

function withFinalPunctuation(text: string): string {
  return /[.!?]$/u.test(text) ? text : `${text}.`;
}

export function buildTreatyOgAltText(copy: TreatyOgImageCopy): string {
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
