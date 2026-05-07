import { randomUUID } from "node:crypto";
import path from "node:path";
import sharp from "sharp";
import type { ImageUploadKind } from "@/lib/image-upload-types";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const KIND_CONFIG = {
  "memorial-evidence-image": {
    flattenBackground: "#ffffff",
    keyPrefix: "memorial-evidence",
    maxInputBytes: 4 * 1024 * 1024,
    maxOutputHeight: 1600,
    maxOutputWidth: 1600,
    maxInputPixels: 16_000_000,
    outputContentType: "image/jpeg",
    outputExtension: "jpg",
    outputQuality: 84,
  },
  "organization-square-logo": {
    flattenBackground: null,
    keyPrefix: "organizations/logos",
    maxInputBytes: 4 * 1024 * 1024,
    maxOutputHeight: 1024,
    maxOutputWidth: 1024,
    maxInputPixels: 12_000_000,
    outputContentType: "image/webp",
    outputExtension: "webp",
    outputQuality: 90,
  },
  "organization-wordmark-logo": {
    flattenBackground: null,
    keyPrefix: "organizations/wordmarks",
    maxInputBytes: 4 * 1024 * 1024,
    maxOutputHeight: 800,
    maxOutputWidth: 2000,
    maxInputPixels: 16_000_000,
    outputContentType: "image/webp",
    outputExtension: "webp",
    outputQuality: 84,
  },
  "person-photo": {
    flattenBackground: "#ffffff",
    keyPrefix: "people/photos",
    maxInputBytes: 4 * 1024 * 1024,
    maxOutputHeight: 1024,
    maxOutputWidth: 1024,
    maxInputPixels: 12_000_000,
    outputContentType: "image/jpeg",
    outputExtension: "jpg",
    outputQuality: 84,
  },
} as const satisfies Record<
  ImageUploadKind,
  {
    flattenBackground: string | null;
    keyPrefix: string;
    maxInputBytes: number;
    maxOutputHeight: number;
    maxOutputWidth: number;
    maxInputPixels: number;
    outputContentType: "image/jpeg" | "image/webp";
    outputExtension: "jpg" | "webp";
    outputQuality: number;
  }
>;

export interface NormalizeImageUploadInput {
  kind: ImageUploadKind;
}

export interface NormalizedImageUpload {
  buffer: Buffer;
  contentType: "image/jpeg" | "image/webp";
  filename: string;
}

function filenameBase(filename: string) {
  const parsed = path.parse(filename || "image");
  return (parsed.name || "image").replace(/[^a-z0-9_-]+/gi, "-").slice(0, 80);
}

export function buildImageUploadKey(input: {
  filename: string;
  kind: ImageUploadKind;
}) {
  const config = KIND_CONFIG[input.kind];
  const dateSegment = new Date().toISOString().slice(0, 10);
  return `${config.keyPrefix}/${dateSegment}/${randomUUID()}-${filenameBase(
    input.filename,
  )}.${config.outputExtension}`;
}

export async function normalizeImageUpload(
  file: File,
  { kind }: NormalizeImageUploadInput,
): Promise<NormalizedImageUpload> {
  const config = KIND_CONFIG[kind];
  const contentType = file.type.toLowerCase();
  if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
    throw new Error("Unsupported image type.");
  }
  if (file.size > config.maxInputBytes) {
    throw new Error(
      `Image must be ${Math.round(config.maxInputBytes / 1024 / 1024)} MB or smaller after cropping.`,
    );
  }

  let source: Buffer;
  try {
    source = Buffer.from(await file.arrayBuffer());
  } catch {
    throw new Error("Could not read this image.");
  }

  let metadata: sharp.Metadata;
  try {
    metadata = await sharp(source, { failOn: "none" }).metadata();
  } catch {
    throw new Error("Could not read this image.");
  }

  if (
    typeof metadata.width === "number" &&
    typeof metadata.height === "number" &&
    metadata.width * metadata.height > config.maxInputPixels
  ) {
    throw new Error("Image has too many pixels.");
  }

  try {
    let image = sharp(source, {
      failOn: "none",
      limitInputPixels: config.maxInputPixels,
    })
      .rotate()
      .resize({
        fit: "inside",
        height: config.maxOutputHeight,
        withoutEnlargement: true,
        width: config.maxOutputWidth,
      });

    if (config.flattenBackground) {
      image = image.flatten({ background: config.flattenBackground });
    }

    const buffer =
      config.outputContentType === "image/jpeg"
        ? await image
            .jpeg({ mozjpeg: true, quality: config.outputQuality })
            .toBuffer()
        : await image
            .webp({ effort: 4, quality: config.outputQuality })
            .toBuffer();

    return {
      buffer,
      contentType: config.outputContentType,
      filename: `${filenameBase(file.name)}.${config.outputExtension}`,
    };
  } catch {
    throw new Error("Could not process this image.");
  }
}
