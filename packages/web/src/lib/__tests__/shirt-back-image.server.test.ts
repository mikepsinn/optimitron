import sharp from "sharp";
import { describe, expect, it } from "vitest";
import {
  SHIRT_BACK_COPY,
  SHIRT_FRONT_COPY,
  SHIRT_PRINT_HEIGHT_PX,
  SHIRT_PRINT_WIDTH_PX,
  SHIRT_VISIBLE_TARGET_MIN_FONT_SIZE,
  generateShirtBackImage,
  generateShirtFrontImage,
  getShirtVisibleTargetFontSize,
} from "../shirt-back-image.server";

describe("shirt artwork", () => {
  it("keeps the approved back copy", () => {
    expect(SHIRT_BACK_COPY).toBe(
      "Trade one apocalypse for disease eradication at warondisease.org.",
    );
  });

  it("keeps the approved front copy", () => {
    expect(SHIRT_FRONT_COPY).toBe("THIS T-SHIRT ENDED WAR AND DISEASE.");
  });

  async function expectPrintReadyPng(buffer: Buffer) {
    const metadata = await sharp(buffer).metadata();
    const stats = await sharp(buffer).stats();

    expect(metadata.format).toBe("png");
    expect(metadata.width).toBe(SHIRT_PRINT_WIDTH_PX);
    expect(metadata.height).toBe(SHIRT_PRINT_HEIGHT_PX);
    expect(buffer.length).toBeGreaterThan(10_000);
    expect(stats.channels[0]?.min).toBe(0);
    expect(stats.channels[0]?.max).toBe(255);
  }

  it("renders a print-ready front PNG", async () => {
    await expectPrintReadyPng(await generateShirtFrontImage());
  });

  it("renders a print-ready back PNG for a fixed referral handle", async () => {
    const buffer = await generateShirtBackImage({
      qrTarget: "https://warondisease.org/vote/ada",
      visibleTargetUrl: "warondisease.org/vote/ada",
    });

    await expectPrintReadyPng(buffer);
  });

  it("keeps the printed target URL visible for unusually long labels", () => {
    expect(getShirtVisibleTargetFontSize("x".repeat(10_000))).toBe(
      SHIRT_VISIBLE_TARGET_MIN_FONT_SIZE,
    );
  });

  it("rejects malformed QR targets before rendering", async () => {
    await expect(
      generateShirtBackImage({
        qrTarget: "not a url",
        visibleTargetUrl: "warondisease.org/vote/ada",
      }),
    ).rejects.toThrow("absolute URL");
  });

  it("rejects oversized QR targets before rendering", async () => {
    await expect(
      generateShirtBackImage({
        qrTarget: `https://warondisease.org/${"x".repeat(600)}`,
        visibleTargetUrl: "warondisease.org/vote/ada",
      }),
    ).rejects.toThrow("1-512 characters");
  });

  it("rejects visible labels that do not match the QR target", async () => {
    await expect(
      generateShirtBackImage({
        qrTarget: "https://warondisease.org/vote/ada",
        visibleTargetUrl: "warondisease.org/vote/grace",
      }),
    ).rejects.toThrow("without the protocol");
  });
});
