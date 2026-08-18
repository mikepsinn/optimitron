import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import type {
  BlackWhiteTextOgImageCopy,
  BlackWhiteTextOgImageSize,
} from "./black-white-text-og-image";
import {
  BLACK_WHITE_TEXT_OG_IMAGE_PRESETS,
  BLACK_WHITE_TEXT_OG_SERIF_FONT_FAMILY,
  getBlackWhiteTextOgImageCopyForNavItem,
} from "./black-white-text-og-image";
import type { NavItem } from "./routes";

type BlackWhiteTextOgFont = {
  data: ArrayBuffer;
  name: typeof BLACK_WHITE_TEXT_OG_SERIF_FONT_FAMILY;
  style: "normal";
  weight: 400 | 700;
};

let fontPromise: Promise<BlackWhiteTextOgFont[]> | null = null;

function toArrayBuffer(buffer: Buffer): ArrayBuffer {
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ) as ArrayBuffer;
}

function getBlackWhiteTextOgFonts(): Promise<BlackWhiteTextOgFont[]> {
  fontPromise ??= Promise.all([
    readFile(
      path.join(process.cwd(), "public/fonts/libre-baskerville-400.ttf"),
    ),
    readFile(
      path.join(process.cwd(), "public/fonts/libre-baskerville-700.ttf"),
    ),
  ]).then(([regular, bold]) => [
    {
      data: toArrayBuffer(regular),
      name: BLACK_WHITE_TEXT_OG_SERIF_FONT_FAMILY,
      style: "normal",
      weight: 400,
    },
    {
      data: toArrayBuffer(bold),
      name: BLACK_WHITE_TEXT_OG_SERIF_FONT_FAMILY,
      style: "normal",
      weight: 700,
    },
  ]);
  return fontPromise;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function estimatePrimaryFontSize({
  copy,
  padding,
  size,
}: {
  copy: BlackWhiteTextOgImageCopy;
  padding: number;
  size: BlackWhiteTextOgImageSize;
}): number {
  const averageSerifGlyphWidth = 0.54;
  const averageBoldCapsGlyphWidth = 0.62;
  const longestPrimaryLine = Math.max(
    ...copy.primaryLines.map((line) => line.length),
    1,
  );
  const longestSecondaryLine = Math.max(
    ...(copy.secondaryLines ?? []).map((line) => line.length),
    0,
  );
  const availableWidth = size.width - padding * 2;
  const availableHeight = size.height - padding * 2;
  const primaryWidthFit =
    availableWidth / (longestPrimaryLine * averageSerifGlyphWidth);
  const secondaryWidthFit = longestSecondaryLine
    ? availableWidth / (longestSecondaryLine * averageBoldCapsGlyphWidth * 0.33)
    : Number.POSITIVE_INFINITY;
  const footerWidthFit = copy.footer
    ? availableWidth / (copy.footer.length * averageBoldCapsGlyphWidth * 0.31)
    : Number.POSITIVE_INFINITY;
  const eyebrowWidthFit = copy.eyebrow
    ? availableWidth / (copy.eyebrow.length * averageBoldCapsGlyphWidth * 0.25)
    : Number.POSITIVE_INFINITY;
  const primaryLineUnits = copy.primaryLines.length * 0.96;
  const eyebrowUnits = copy.eyebrow ? 0.51 : 0;
  const secondaryUnits = copy.secondaryLines?.length
    ? copy.secondaryLines.length * 0.38 + 0.31
    : 0;
  const footerUnits = copy.footer ? 0.66 : 0;
  const heightFit =
    availableHeight /
    Math.max(primaryLineUnits + eyebrowUnits + secondaryUnits + footerUnits, 1);

  return Math.round(
    clamp(
      Math.min(
        primaryWidthFit,
        secondaryWidthFit,
        footerWidthFit,
        eyebrowWidthFit,
        heightFit,
      ),
      42,
      230,
    ),
  );
}

function BlackWhiteTextOgImage({
  copy,
  size,
}: {
  copy: BlackWhiteTextOgImageCopy;
  size: BlackWhiteTextOgImageSize;
}) {
  const padding = Math.round(
    clamp(Math.min(size.width, size.height) * 0.09, 48, 170),
  );
  const primaryFontSize = estimatePrimaryFontSize({
    copy,
    padding,
    size,
  });
  const eyebrowFontSize = Math.round(clamp(primaryFontSize * 0.25, 18, 44));
  const secondaryFontSize = Math.round(clamp(primaryFontSize * 0.33, 24, 58));
  const footerFontSize = Math.round(clamp(primaryFontSize * 0.31, 22, 54));

  return (
    <div
      style={{
        alignItems: "center",
        backgroundColor: "#fff",
        color: "#000",
        display: "flex",
        height: "100%",
        justifyContent: "center",
        padding,
        width: "100%",
      }}
    >
      <div
        style={{
          alignItems: "center",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          maxWidth: "100%",
          textAlign: "center",
        }}
      >
        {copy.eyebrow ? (
          <div
            style={{
              display: "flex",
              fontFamily: BLACK_WHITE_TEXT_OG_SERIF_FONT_FAMILY,
              fontSize: eyebrowFontSize,
              fontWeight: 700,
              lineHeight: 1,
              marginBottom: Math.round(primaryFontSize * 0.26),
              textTransform: "uppercase",
            }}
          >
            {copy.eyebrow}
          </div>
        ) : null}

        <div
          style={{
            alignItems: "center",
            display: "flex",
            flexDirection: "column",
            fontFamily: BLACK_WHITE_TEXT_OG_SERIF_FONT_FAMILY,
            fontSize: primaryFontSize,
            fontWeight: 400,
            lineHeight: 0.96,
          }}
        >
          {copy.primaryLines.map((line) => (
            <div key={line} style={{ display: "flex" }}>
              {line}
            </div>
          ))}
        </div>

        {copy.secondaryLines?.length ? (
          <div
            style={{
              alignItems: "center",
              display: "flex",
              flexDirection: "column",
              fontFamily: BLACK_WHITE_TEXT_OG_SERIF_FONT_FAMILY,
              fontSize: secondaryFontSize,
              fontWeight: 700,
              lineHeight: 1.15,
              marginTop: Math.round(primaryFontSize * 0.31),
              textTransform: "uppercase",
            }}
          >
            {copy.secondaryLines.map((line) => (
              <div key={line} style={{ display: "flex" }}>
                {line}
              </div>
            ))}
          </div>
        ) : null}

        {copy.footer ? (
          <div
            style={{
              display: "flex",
              fontFamily: BLACK_WHITE_TEXT_OG_SERIF_FONT_FAMILY,
              fontSize: footerFontSize,
              fontWeight: 700,
              lineHeight: 1,
              marginTop: Math.round(primaryFontSize * 0.35),
              textTransform: "uppercase",
            }}
          >
            {copy.footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export async function generateBlackWhiteTextOgImageResponse(
  copy: BlackWhiteTextOgImageCopy,
  size: BlackWhiteTextOgImageSize = BLACK_WHITE_TEXT_OG_IMAGE_PRESETS.openGraph,
): Promise<ImageResponse> {
  const fonts = await getBlackWhiteTextOgFonts();
  return new ImageResponse(<BlackWhiteTextOgImage copy={copy} size={size} />, {
    fonts,
    height: size.height,
    width: size.width,
  });
}

export function generateBlackWhiteTextOgImageResponseForNavItem(
  item: NavItem,
  size: BlackWhiteTextOgImageSize = BLACK_WHITE_TEXT_OG_IMAGE_PRESETS.openGraph,
): Promise<ImageResponse> {
  return generateBlackWhiteTextOgImageResponse(
    getBlackWhiteTextOgImageCopyForNavItem(item),
    size,
  );
}
