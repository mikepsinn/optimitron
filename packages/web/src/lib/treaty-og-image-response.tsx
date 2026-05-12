import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import type { TreatyOgImageCopy, TreatyOgImageSize } from "./treaty-og-image";
import {
  TREATY_OG_IMAGE_PRESETS,
  TREATY_OG_SERIF_FONT_FAMILY,
} from "./treaty-og-image";

type TreatyOgFont = {
  data: ArrayBuffer;
  name: typeof TREATY_OG_SERIF_FONT_FAMILY;
  style: "normal";
  weight: 400 | 700;
};

let fontPromise: Promise<TreatyOgFont[]> | null = null;

function toArrayBuffer(buffer: Buffer): ArrayBuffer {
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ) as ArrayBuffer;
}

function getTreatyOgFonts(): Promise<TreatyOgFont[]> {
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
      name: TREATY_OG_SERIF_FONT_FAMILY,
      style: "normal",
      weight: 400,
    },
    {
      data: toArrayBuffer(bold),
      name: TREATY_OG_SERIF_FONT_FAMILY,
      style: "normal",
      weight: 700,
    },
  ]);
  return fontPromise;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function getImageType(size: TreatyOgImageSize) {
  if (size.height > size.width * 1.2) return "tall";
  if (size.width > size.height * 2.2) return "wide";
  return "standard";
}

function TreatyOgImage({
  copy,
  size,
}: {
  copy: TreatyOgImageCopy;
  size: TreatyOgImageSize;
}) {
  const imageType = getImageType(size);
  const scale = Math.min(size.width / 1200, size.height / 630);
  const padding = Math.round(
    clamp(Math.min(size.width, size.height) * 0.09, 48, 170),
  );
  const primaryFontSize = Math.round(
    clamp(
      (imageType === "tall" ? 122 : imageType === "wide" ? 78 : 96) * scale,
      54,
      180,
    ),
  );
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
              fontFamily: TREATY_OG_SERIF_FONT_FAMILY,
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
            fontFamily: TREATY_OG_SERIF_FONT_FAMILY,
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
              fontFamily: TREATY_OG_SERIF_FONT_FAMILY,
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
              fontFamily: TREATY_OG_SERIF_FONT_FAMILY,
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

export async function createTreatyOgImageResponse(
  copy: TreatyOgImageCopy,
  size: TreatyOgImageSize = TREATY_OG_IMAGE_PRESETS.openGraph,
): Promise<ImageResponse> {
  const fonts = await getTreatyOgFonts();
  return new ImageResponse(<TreatyOgImage copy={copy} size={size} />, {
    fonts,
    height: size.height,
    width: size.width,
  });
}
