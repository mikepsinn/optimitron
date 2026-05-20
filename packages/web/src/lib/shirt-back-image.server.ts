import crypto from "node:crypto";
import QRCode from "qrcode";
import sharp from "sharp";
import { WAR_ON_DISEASE_CANONICAL_ORIGIN } from "@/lib/domains";
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
const SHIRT_PAPER_COLOR = "#ffffff";
const SHIRT_INK_COLOR = "#000000";
const SHIRT_TEXT_CENTER_X_PX = SHIRT_PRINT_WIDTH_PX / 2;
const SHIRT_SERIF_FONT = "Georgia, 'Times New Roman', serif";
const SHIRT_MONO_FONT = "'Courier New', monospace";
const SHIRT_MONO_AVERAGE_GLYPH_WIDTH_EM = 0.62;
const SHIRT_TARGET_URL_MAX_LENGTH = 512;
const SHIRT_QR_TARGET_ORIGIN = new URL(WAR_ON_DISEASE_CANONICAL_ORIGIN).origin;
export const SHIRT_VISIBLE_TARGET_MIN_FONT_SIZE = 48;
const SHIRT_VISIBLE_TARGET_MAX_FONT_SIZE = 116;
const SHIRT_VISIBLE_TARGET_MAX_WIDTH_PX = 2480;
const SHIRT_VISIBLE_TARGET_Y_PX = 2675;
const SHIRT_FRONT_LINE_LAYOUT = [
  { fontSize: 330, y: 1230 },
  { fontSize: 430, y: 1665 },
  { fontSize: 330, y: 2100 },
] as const;
const SHIRT_BACK_RULE_LAYOUT = {
  bottomY: 1150,
  strokeWidth: 14,
  topY: 370,
  x1: 260,
  x2: 2740,
} as const;
const SHIRT_BACK_LINE_LAYOUT = [
  { fontSize: 180, y: 520 },
  { fontSize: 165, y: 750 },
  { fontSize: 180, y: 980 },
] as const;
const SHIRT_QR_FRAME_LAYOUT = {
  size: 1100,
  strokeWidth: 22,
  x: 950,
  y: 1330,
} as const;
const SHIRT_QR_IMAGE_LAYOUT = {
  left: 1010,
  top: 1390,
  width: 980,
} as const;

function escapeSvgText(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function svgTextLine(text: string, y: number, fontSize: number) {
  return [
    `<text x="${SHIRT_TEXT_CENTER_X_PX}" y="${y}"`,
    ` fill="${SHIRT_INK_COLOR}" font-family="${SHIRT_SERIF_FONT}"`,
    ` font-size="${fontSize}" font-weight="900" text-anchor="middle">`,
    escapeSvgText(text),
    "</text>",
  ].join("");
}

function getFittingMonoFontSize(
  text: string,
  maxWidth: number,
  maxFontSize: number,
  minFontSize: number,
) {
  return Math.max(
    minFontSize,
    Math.min(
      maxFontSize,
      Math.floor(
        maxWidth /
          Math.max(text.length * SHIRT_MONO_AVERAGE_GLYPH_WIDTH_EM, 1),
      ),
    ),
  );
}

export function getShirtVisibleTargetFontSize(text: string) {
  return getFittingMonoFontSize(
    text,
    SHIRT_VISIBLE_TARGET_MAX_WIDTH_PX,
    SHIRT_VISIBLE_TARGET_MAX_FONT_SIZE,
    SHIRT_VISIBLE_TARGET_MIN_FONT_SIZE,
  );
}

function baseSvg(content: string) {
  return Buffer.from(
    `<svg width="${SHIRT_PRINT_WIDTH_PX}" height="${SHIRT_PRINT_HEIGHT_PX}" viewBox="0 0 ${SHIRT_PRINT_WIDTH_PX} ${SHIRT_PRINT_HEIGHT_PX}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${SHIRT_PRINT_WIDTH_PX}" height="${SHIRT_PRINT_HEIGHT_PX}" fill="${SHIRT_PAPER_COLOR}"/>
      ${content}
    </svg>`,
  );
}

function assertTargetLength(value: string, label: string) {
  if (value.length === 0 || value.length > SHIRT_TARGET_URL_MAX_LENGTH) {
    throw new Error(
      `${label} must be 1-${SHIRT_TARGET_URL_MAX_LENGTH} characters.`,
    );
  }
}

function getVisibleTargetFromQrTarget(qrTarget: URL) {
  const pathAndQuery =
    qrTarget.pathname === "/" && !qrTarget.search
      ? ""
      : `${qrTarget.pathname}${qrTarget.search}`;
  return `${qrTarget.host}${pathAndQuery}`;
}

function parseShirtQrTarget(qrTarget: string) {
  assertTargetLength(qrTarget, "qrTarget");

  let parsedTarget: URL;
  try {
    parsedTarget = new URL(qrTarget);
  } catch {
    throw new Error("qrTarget must be an absolute URL.");
  }

  if (parsedTarget.origin !== SHIRT_QR_TARGET_ORIGIN) {
    throw new Error(`qrTarget must use ${SHIRT_QR_TARGET_ORIGIN}.`);
  }

  if (parsedTarget.username || parsedTarget.password || parsedTarget.hash) {
    throw new Error("qrTarget must not include credentials or a URL fragment.");
  }

  return parsedTarget;
}

function assertShirtArtworkTargets({
  qrTarget,
  visibleTargetUrl,
}: {
  qrTarget: string;
  visibleTargetUrl: string;
}) {
  const parsedQrTarget = parseShirtQrTarget(qrTarget);
  assertTargetLength(visibleTargetUrl, "visibleTargetUrl");

  if (visibleTargetUrl !== getVisibleTargetFromQrTarget(parsedQrTarget)) {
    throw new Error(
      "visibleTargetUrl must match qrTarget without the protocol.",
    );
  }
}

function svgBackRule(y: number) {
  return [
    `<line x1="${SHIRT_BACK_RULE_LAYOUT.x1}"`,
    ` x2="${SHIRT_BACK_RULE_LAYOUT.x2}" y1="${y}" y2="${y}"`,
    ` stroke="${SHIRT_INK_COLOR}"`,
    ` stroke-width="${SHIRT_BACK_RULE_LAYOUT.strokeWidth}"/>`,
  ].join("");
}

function svgQrFrame() {
  return [
    `<rect x="${SHIRT_QR_FRAME_LAYOUT.x}" y="${SHIRT_QR_FRAME_LAYOUT.y}"`,
    ` width="${SHIRT_QR_FRAME_LAYOUT.size}"`,
    ` height="${SHIRT_QR_FRAME_LAYOUT.size}"`,
    ` fill="${SHIRT_PAPER_COLOR}" stroke="${SHIRT_INK_COLOR}"`,
    ` stroke-width="${SHIRT_QR_FRAME_LAYOUT.strokeWidth}"/>`,
  ].join("");
}

function svgVisibleTargetLabel(text: string, fontSize: number) {
  return [
    `<text x="${SHIRT_TEXT_CENTER_X_PX}" y="${SHIRT_VISIBLE_TARGET_Y_PX}"`,
    ` fill="${SHIRT_INK_COLOR}" font-family="${SHIRT_MONO_FONT}"`,
    ` font-size="${fontSize}" font-weight="900" text-anchor="middle">`,
    escapeSvgText(text),
    "</text>",
  ].join("");
}

export async function generateShirtFrontImage(): Promise<Buffer> {
  const [lineOne, lineTwo, lineThree] = CAMPAIGN_PRINT_COPY.shirtFrontLines;
  const [firstLineLayout, secondLineLayout, thirdLineLayout] =
    SHIRT_FRONT_LINE_LAYOUT;
  const svg = baseSvg(`
    ${svgTextLine(lineOne, firstLineLayout.y, firstLineLayout.fontSize)}
    ${svgTextLine(lineTwo, secondLineLayout.y, secondLineLayout.fontSize)}
    ${svgTextLine(lineThree, thirdLineLayout.y, thirdLineLayout.fontSize)}
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
  assertShirtArtworkTargets({ qrTarget, visibleTargetUrl });

  const visibleTargetLabel = visibleTargetUrl.toUpperCase();
  const visibleTargetFontSize = getShirtVisibleTargetFontSize(
    visibleTargetLabel,
  );
  const qrPng = await QRCode.toBuffer(qrTarget, {
    color: {
      dark: SHIRT_INK_COLOR,
      light: SHIRT_PAPER_COLOR,
    },
    errorCorrectionLevel: "H",
    margin: 0,
    type: "png",
    width: SHIRT_QR_IMAGE_LAYOUT.width,
  });

  const [firstLineLayout, secondLineLayout, thirdLineLayout] =
    SHIRT_BACK_LINE_LAYOUT;
  const svg = baseSvg(`
    ${svgBackRule(SHIRT_BACK_RULE_LAYOUT.topY)}
    ${svgTextLine(SHIRT_BACK_COPY_LINES[0], firstLineLayout.y, firstLineLayout.fontSize)}
    ${svgTextLine(SHIRT_BACK_COPY_LINES[1], secondLineLayout.y, secondLineLayout.fontSize)}
    ${svgTextLine(SHIRT_BACK_COPY_LINES[2], thirdLineLayout.y, thirdLineLayout.fontSize)}
    ${svgBackRule(SHIRT_BACK_RULE_LAYOUT.bottomY)}
    ${svgQrFrame()}
    ${svgVisibleTargetLabel(visibleTargetLabel, visibleTargetFontSize)}
  `);

  return sharp(svg)
    .composite([
      {
        input: qrPng,
        left: SHIRT_QR_IMAGE_LAYOUT.left,
        top: SHIRT_QR_IMAGE_LAYOUT.top,
      },
    ])
    .png()
    .withMetadata({ density: SHIRT_PRINT_DPI })
    .toBuffer();
}

function objectKeyPart(value: string) {
  const fallback = crypto
    .createHash("sha256")
    .update(value)
    .digest("hex")
    .slice(0, 16);
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
