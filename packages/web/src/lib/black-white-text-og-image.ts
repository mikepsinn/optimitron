interface BlackWhiteTextOgNavItemInput {
  description?: string;
  label: string;
  socialPreview?: {
    blackWhiteTextOgImage?: BlackWhiteTextOgImageCopy;
    description?: string;
    title?: string;
  };
  tagline?: string;
}

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
  facebookCover: { width: 1640, height: 624 },
  linkedInPageCover: { width: 4200, height: 700 },
  linkedInProfileBanner: { width: 1584, height: 396 },
  openGraph: { width: 1200, height: 630 },
  socialSquare: { width: 1080, height: 1080 },
  socialStory: { width: 1080, height: 1920 },
  xCard: { width: 1200, height: 600 },
} as const satisfies Record<string, BlackWhiteTextOgImageSize>;

function withFinalPunctuation(text: string): string {
  return /[.!?]$/u.test(text) ? text : `${text}.`;
}

function splitIntoBalancedLines(
  text: string,
  { maxCharsPerLine, maxLines }: { maxCharsPerLine: number; maxLines: number },
): string[] {
  const words = text.trim().split(/\s+/u).filter(Boolean);
  if (words.length === 0) return [];

  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;

    if (current && next.length > maxCharsPerLine && lines.length < maxLines - 1) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines.slice(0, maxLines);
}

export function getBlackWhiteTextOgImageCopyForNavItem(
  item: BlackWhiteTextOgNavItemInput,
): BlackWhiteTextOgImageCopy {
  if (item.socialPreview?.blackWhiteTextOgImage) {
    return item.socialPreview.blackWhiteTextOgImage;
  }

  const title = item.socialPreview?.title ?? item.label;
  const description =
    item.socialPreview?.description ?? item.tagline ?? item.description;
  const primaryLines = splitIntoBalancedLines(title, {
    maxCharsPerLine: 22,
    maxLines: 3,
  });
  const secondaryLines = description
    ? splitIntoBalancedLines(description, {
        maxCharsPerLine: 44,
        maxLines: 2,
      })
    : [];

  return {
    primaryLines: primaryLines.length ? primaryLines : [item.label],
    ...(secondaryLines.length ? { secondaryLines } : {}),
  };
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

export function buildBlackWhiteTextOgAltTextForNavItem(
  item: BlackWhiteTextOgNavItemInput,
): string {
  return buildBlackWhiteTextOgAltText(
    getBlackWhiteTextOgImageCopyForNavItem(item),
  );
}
