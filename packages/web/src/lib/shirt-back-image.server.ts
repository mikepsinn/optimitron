import crypto from "node:crypto";
import QRCode from "qrcode";
import sharp from "sharp";
import { uploadObject } from "@/lib/object-storage.server";

export const SHIRT_PRINT_WIDTH_PX = 3000;
export const SHIRT_PRINT_HEIGHT_PX = 3600;
export const SHIRT_PRINT_DPI = 300;
export const SHIRT_BACK_COPY =
  "I ended war and disease and all I got was this lousy t-shirt";
export const SHIRT_FRONT_COPY =
  "please take 30 seconds to end war and disease at warondisease.org";

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

function baseSvg(content: string) {
  return Buffer.from(
    `<svg width="${SHIRT_PRINT_WIDTH_PX}" height="${SHIRT_PRINT_HEIGHT_PX}" viewBox="0 0 ${SHIRT_PRINT_WIDTH_PX} ${SHIRT_PRINT_HEIGHT_PX}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${SHIRT_PRINT_WIDTH_PX}" height="${SHIRT_PRINT_HEIGHT_PX}" fill="#ffffff"/>
      ${content}
    </svg>`,
  );
}

export async function generateShirtFrontImage(): Promise<Buffer> {
  const svg = baseSvg(`
    <line x1="260" x2="2740" y1="730" y2="730" stroke="#000000" stroke-width="18"/>
    <line x1="260" x2="2740" y1="2800" y2="2800" stroke="#000000" stroke-width="18"/>
    ${svgTextLine("PLEASE TAKE", 1080, 230)}
    ${svgTextLine("30 SECONDS", 1340, 230)}
    ${svgTextLine("TO END", 1600, 230)}
    ${svgTextLine("WAR AND DISEASE", 1870, 210)}
    ${svgTextLine("AT", 2120, 180)}
    <text x="1500" y="2360" fill="#000000" font-family="'Courier New', monospace" font-size="158" font-weight="900" text-anchor="middle">warondisease.org</text>
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
    ${svgTextLine("I ENDED WAR AND DISEASE", 590, 160)}
    ${svgTextLine("AND ALL I GOT WAS THIS", 780, 152)}
    ${svgTextLine("LOUSY T-SHIRT", 970, 170)}
    <line x1="260" x2="2740" y1="1120" y2="1120" stroke="#000000" stroke-width="14"/>
    <rect x="950" y="1390" width="1100" height="1100" fill="#ffffff" stroke="#000000" stroke-width="22"/>
    <text x="1500" y="2700" fill="#000000" font-family="'Courier New', monospace" font-size="78" font-weight="900" text-anchor="middle">${escapeSvgText(visibleTargetUrl.toUpperCase())}</text>
  `);

  return sharp(svg)
    .composite([{ input: qrPng, left: 1010, top: 1450 }])
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
