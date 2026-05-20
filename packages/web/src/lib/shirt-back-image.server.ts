import crypto from "node:crypto";
import QRCode from "qrcode";
import sharp from "sharp";
import {
  CAMPAIGN_PRINT_COPY,
  SHIRT_BACK_COPY_LINES,
} from "@/lib/messaging";
import { uploadObject } from "@/lib/object-storage.server";

export {
  SHIRT_BACK_COPY,
  SHIRT_BACK_COPY_LINES,
  SHIRT_FRONT_COPY,
} from "@/lib/messaging";

export const SHIRT_PRINT_WIDTH_PX = 3000;
export const SHIRT_PRINT_HEIGHT_PX = 3600;
export const SHIRT_PRINT_DPI = 300;

function escapeSvgText(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function svgTextLine(text: string, y: number, fontSize: number) {
  return `<text x="1500" y="${y}" fill="#000000" font-family="Georgia, 'Times New Roman', serif" font-size="${fontSize}" font-weight="900" text-anchor="middle">${escapeSvgText(text)}</text>`;
}

function getFittingMonoFontSize(
  text: string,
  maxWidth: number,
  maxFontSize: number,
) {
  return Math.min(
    maxFontSize,
    Math.floor(maxWidth / Math.max(text.length * 0.62, 1)),
  );
}

function baseSvg(content: string) {
  return Buffer.from(
    `<svg width="${SHIRT_PRINT_WIDTH_PX}" height="${SHIRT_PRINT_HEIGHT_PX}" viewBox="0 0 ${SHIRT_PRINT_WIDTH_PX} ${SHIRT_PRINT_HEIGHT_PX}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${SHIRT_PRINT_WIDTH_PX}" height="${SHIRT_PRINT_HEIGHT_PX}" fill="#ffffff"/>
      ${content}
    </svg>`,
  );
}

export async function generateShirtFrontImage(): Promise<Buffer> {
  const [pleaseTake, timeText, toEnd, warAndDisease, atText, urlText] =
    CAMPAIGN_PRINT_COPY.shirtFrontLines;
  const svg = baseSvg(`
    ${svgTextLine(pleaseTake, 850, 340)}
    ${svgTextLine(timeText, 1225, 390)}
    ${svgTextLine(toEnd, 1610, 440)}
    ${svgTextLine(warAndDisease, 1985, 270)}
    ${svgTextLine(atText, 2340, 430)}
    <text x="1500" y="2670" fill="#000000" font-family="'Courier New', monospace" font-size="238" font-weight="900" text-anchor="middle">${escapeSvgText(urlText.toLowerCase())}</text>
  `);

  return sharp(svg)
    .png()
    .withMetadata({ density: SHIRT_PRINT_DPI })
    .toBuffer();
}

export async function generateShirtBackImage({
  qrTarget,
  visibleTargetUrl,
}: {
  qrTarget: string;
  visibleTargetUrl: string;
}): Promise<Buffer> {
  const visibleTargetLabel = visibleTargetUrl.toUpperCase();
  const visibleTargetFontSize = getFittingMonoFontSize(
    visibleTargetLabel,
    2480,
    116,
  );
  const qrPng = await QRCode.toBuffer(qrTarget, {
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
    errorCorrectionLevel: "H",
    margin: 0,
    type: "png",
    width: 980,
  });

  const svg = baseSvg(`
    <line x1="260" x2="2740" y1="370" y2="370" stroke="#000000" stroke-width="14"/>
    ${svgTextLine(SHIRT_BACK_COPY_LINES[0], 520, 205)}
    ${svgTextLine(SHIRT_BACK_COPY_LINES[1], 760, 175)}
    ${svgTextLine(SHIRT_BACK_COPY_LINES[2], 1000, 205)}
    <line x1="260" x2="2740" y1="1150" y2="1150" stroke="#000000" stroke-width="14"/>
    <rect x="950" y="1330" width="1100" height="1100" fill="#ffffff" stroke="#000000" stroke-width="22"/>
    <text x="1500" y="2675" fill="#000000" font-family="'Courier New', monospace" font-size="${visibleTargetFontSize}" font-weight="900" text-anchor="middle">${escapeSvgText(visibleTargetLabel)}</text>
  `);

  return sharp(svg)
    .composite([{ input: qrPng, left: 1010, top: 1390 }])
    .png()
    .withMetadata({ density: SHIRT_PRINT_DPI })
    .toBuffer();
}

function objectKeyPart(value: string) {
  const fallback = crypto.createHash("sha256").update(value).digest("hex").slice(0, 16);
  return value.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 80) || fallback;
}

export async function composeAndUploadShirtArtwork({
  checkoutSessionId,
  qrTarget,
  visibleTargetUrl,
}: {
  checkoutSessionId: string;
  qrTarget: string;
  visibleTargetUrl: string;
}) {
  const [frontImage, backImage] = await Promise.all([
    generateShirtFrontImage(),
    generateShirtBackImage({ qrTarget, visibleTargetUrl }),
  ]);
  const orderKey = objectKeyPart(checkoutSessionId);
  const [frontUpload, backUpload] = await Promise.all([
    uploadObject({
      body: frontImage,
      contentType: "image/png",
      key: `shirt-orders/${orderKey}/order-front-${orderKey}.png`,
    }),
    uploadObject({
      body: backImage,
      contentType: "image/png",
      key: `shirt-orders/${orderKey}/order-back-${orderKey}.png`,
    }),
  ]);

  return {
    backDesignUrl: backUpload.publicUrl,
    frontDesignUrl: frontUpload.publicUrl,
  };
}
