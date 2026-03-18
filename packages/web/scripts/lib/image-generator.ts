/**
 * Shared image generation for Optimitron.
 *
 * Single source of truth for:
 *   1. The default visual style (1950s retro scientific illustration)
 *   2. Brand colours
 *   3. Gemini image generation wrapper
 *
 * Every script that generates images should import from here.
 *
 * Usage:
 *   import { generateImage, buildPrompt, BRAND } from "./lib/image-generator";
 *
 *   const buffer = await generateImage(
 *     buildPrompt("A chart showing healthcare spending vs life expectancy"),
 *     { label: "health-chart", aspectRatio: "16:9" },
 *   );
 */

import { writeFileSync } from "fs";
import { join } from "path";

// ─── Brand Constants ─────────────────────────────────────────────

export const BRAND = {
  pink: "#EC4699",
  cyan: "#7BDDEA",
  yellow: "#FFDD57",
  black: "#000000",
  white: "#FFFFFF",
  bgDark: "#0f172a",
  bgDarkRgba: { r: 15, g: 23, b: 42, alpha: 255 },
} as const;

// ─── Default Style: 1950s Retro Scientific Illustration ─────────

/**
 * The master style directive prepended to every image generation prompt.
 *
 * 1950s Popular Science / atomic age / mid-century textbook illustration.
 * This is the canonical visual style for all Optimitron-generated images.
 */
export const DEFAULT_STYLE = `Use a fun 1950s retro scientific illustration style.`;

// ─── Prompt Builder ──────────────────────────────────────────────

/**
 * Build a complete prompt by combining the default style with a subject.
 *
 * @param subject - What the image should depict
 * @param options.style - Override the default style (rarely needed)
 * @param options.constraints - Additional constraints (e.g. "NO text")
 */
export function buildPrompt(
  subject: string,
  options?: { style?: string; constraints?: string },
): string {
  const style = options?.style ?? DEFAULT_STYLE;
  const parts = [style, "", subject];
  if (options?.constraints) {
    parts.push("", options.constraints);
  }
  return parts.join("\n");
}

// ─── Gemini Image Generation ─────────────────────────────────────

const GEMINI_IMAGE_MODEL = "gemini-2.5-flash-image";

interface GenerateOptions {
  /** Short label for logging and raw file naming */
  label: string;
  /** Aspect ratio (default: "1:1") */
  aspectRatio?: "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
  /** Directory to save the raw generation PNG (optional) */
  rawOutputDir?: string;
}

/**
 * Generate a single image using Google Gemini.
 *
 * @param prompt - Full prompt (use buildPrompt() to construct)
 * @param options - Label, aspect ratio, optional raw output dir
 * @returns PNG buffer
 */
export async function generateImage(
  prompt: string,
  options: GenerateOptions,
): Promise<Buffer> {
  const { label, aspectRatio = "1:1", rawOutputDir } = options;

  const { GoogleGenAI, Modality } = await import("@google/genai");

  const apiKey =
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ??
    process.env.GEMINI_API_KEY ??
    process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    throw new Error(
      "No Gemini API key. Set GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY.",
    );
  }

  const client = new GoogleGenAI({ apiKey });

  console.log(`\nGenerating "${label}" (${aspectRatio})...`);
  console.log(`  Model: ${GEMINI_IMAGE_MODEL}`);
  console.log(`  Prompt: ${prompt.slice(0, 80).replace(/\n/g, " ")}...`);

  const response = await client.models.generateContent({
    model: GEMINI_IMAGE_MODEL,
    contents: prompt,
    config: {
      responseModalities: [Modality.IMAGE],
      imageConfig: { aspectRatio: aspectRatio as any },
    },
  });

  const parts =
    response.candidates?.flatMap((c) => c.content?.parts ?? []) ?? [];

  for (const part of parts) {
    if (part.inlineData?.data) {
      const buffer = Buffer.from(part.inlineData.data, "base64");
      console.log(`  Got ${(buffer.length / 1024).toFixed(0)}KB`);

      if (rawOutputDir) {
        const rawPath = join(rawOutputDir, `_raw-${label}.png`);
        writeFileSync(rawPath, buffer);
      }

      return buffer;
    }
  }

  throw new Error(`Gemini returned no image data for "${label}"`);
}

// ─── Background Removal ─────────────────────────────────────────

/**
 * Remove the background from an image by sampling corner pixels
 * and making all similar-coloured pixels transparent.
 *
 * Useful when Gemini generates on a coloured background and you
 * need a transparent PNG (e.g. for icons).
 *
 * @param sourceBuffer - PNG buffer
 * @param tolerance - Colour distance tolerance (default 60)
 */
export async function removeBackground(
  sourceBuffer: Buffer,
  tolerance: number = 60,
): Promise<Buffer> {
  const sharp = (await import("sharp")).default;
  const { data, info } = await sharp(sourceBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = new Uint8Array(data.buffer, data.byteOffset, data.length);
  const w = info.width;
  const h = info.height;

  // Sample the four corners to detect background colour
  const corners = [
    0,
    (w - 1) * 4,
    (h - 1) * w * 4,
    ((h - 1) * w + (w - 1)) * 4,
  ];

  let rSum = 0, gSum = 0, bSum = 0;
  for (const idx of corners) {
    rSum += pixels[idx]!;
    gSum += pixels[idx + 1]!;
    bSum += pixels[idx + 2]!;
  }
  const bgR = Math.round(rSum / 4);
  const bgG = Math.round(gSum / 4);
  const bgB = Math.round(bSum / 4);

  let removed = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    const dr = Math.abs(pixels[i]! - bgR);
    const dg = Math.abs(pixels[i + 1]! - bgG);
    const db = Math.abs(pixels[i + 2]! - bgB);

    if (dr <= tolerance && dg <= tolerance && db <= tolerance) {
      pixels[i + 3] = 0;
      removed++;
    }
  }

  const pct = ((removed / (w * h)) * 100).toFixed(1);
  console.log(`  Background removal: rgb(${bgR},${bgG},${bgB}) → ${pct}% removed`);

  return sharp(Buffer.from(pixels.buffer), {
    raw: { width: w, height: h, channels: 4 },
  })
    .png()
    .toBuffer();
}
