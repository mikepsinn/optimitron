import sharp from "sharp";
import { describe, expect, it } from "vitest";
import {
  buildImageUploadKey,
  normalizeImageUpload,
} from "../image-upload.server";

describe("normalizeImageUpload", () => {
  it("normalizes uploaded profile photos to bounded JPEG files", async () => {
    const source = await sharp({
      create: {
        width: 2400,
        height: 1400,
        channels: 4,
        background: { r: 20, g: 30, b: 40, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    const result = await normalizeImageUpload(
      new File([source], "portrait.png", { type: "image/png" }),
      { kind: "person-photo" },
    );
    const metadata = await sharp(result.buffer).metadata();

    expect(result.contentType).toBe("image/jpeg");
    expect(result.filename).toBe("portrait.jpg");
    expect(result.buffer.byteLength).toBeLessThan(source.byteLength);
    expect(metadata.format).toBe("jpeg");
    expect(metadata.width).toBeLessThanOrEqual(1024);
    expect(metadata.height).toBeLessThanOrEqual(1024);
  });

  it("rejects non-image uploads", async () => {
    await expect(
      normalizeImageUpload(
        new File([Buffer.from("not image")], "note.txt", {
          type: "text/plain",
        }),
        { kind: "person-photo" },
      ),
    ).rejects.toThrow("Unsupported image type");
  });

  it("normalizes organization square logos to transparent WebP uploads", async () => {
    const source = await sharp({
      create: {
        width: 1800,
        height: 1200,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 0.25 },
      },
    })
      .png()
      .toBuffer();

    const result = await normalizeImageUpload(
      new File([source], "org logo.png", { type: "image/png" }),
      { kind: "organization-square-logo" },
    );
    const metadata = await sharp(result.buffer).metadata();
    const key = buildImageUploadKey({
      filename: result.filename,
      kind: "organization-square-logo",
    });

    expect(result.contentType).toBe("image/webp");
    expect(result.filename).toBe("org-logo.webp");
    expect(metadata.format).toBe("webp");
    expect(metadata.hasAlpha).toBe(true);
    expect(metadata.width).toBeLessThanOrEqual(1024);
    expect(metadata.height).toBeLessThanOrEqual(1024);
    expect(key).toMatch(/^organizations\/logos\/\d{4}-\d{2}-\d{2}\//);
  });

  it("normalizes organization wordmarks without forcing a square crop", async () => {
    const source = await sharp({
      create: {
        width: 2600,
        height: 700,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      },
    })
      .png()
      .toBuffer();

    const result = await normalizeImageUpload(
      new File([source], "wordmark.png", { type: "image/png" }),
      { kind: "organization-wordmark-logo" },
    );
    const metadata = await sharp(result.buffer).metadata();
    const key = buildImageUploadKey({
      filename: result.filename,
      kind: "organization-wordmark-logo",
    });

    expect(result.contentType).toBe("image/webp");
    expect(result.filename).toBe("wordmark.webp");
    expect(metadata.format).toBe("webp");
    expect(metadata.hasAlpha).toBe(true);
    expect(metadata.width).toBeLessThanOrEqual(2000);
    expect(metadata.height).toBeLessThanOrEqual(800);
    expect(key).toMatch(/^organizations\/wordmarks\/\d{4}-\d{2}-\d{2}\//);
  });
});
