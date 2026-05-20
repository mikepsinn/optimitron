import sharp from "sharp";
import { describe, expect, it } from "vitest";
import {
  SHIRT_BACK_COPY,
  SHIRT_FRONT_COPY,
  SHIRT_PRINT_HEIGHT_PX,
  SHIRT_PRINT_WIDTH_PX,
  SHIRT_VISIBLE_TARGET_MIN_FONT_SIZE,
  generateShirtBackImage,
  getShirtVisibleTargetFontSize,
} from "../shirt-back-image.server";

describe("generateShirtBackImage", () => {
  it("keeps the approved back copy", () => {
    expect(SHIRT_BACK_COPY).toBe(
      "trade one apocalypse for disease eradication at warondisease.org",
    );
  });

  it("keeps the approved front copy", () => {
    expect(SHIRT_FRONT_COPY).toBe(
      "please take 30 seconds to end war and disease at warondisease.org",
    );
  });

  it("renders a print-ready PNG for a fixed referral handle", async () => {
    const buffer = await generateShirtBackImage({
      qrTarget: "https://warondisease.org/vote/ada",
      visibleTargetUrl: "warondisease.org/vote/ada",
    });
    const metadata = await sharp(buffer).metadata();
    const stats = await sharp(buffer).stats();

    expect(metadata.format).toBe("png");
    expect(metadata.width).toBe(SHIRT_PRINT_WIDTH_PX);
    expect(metadata.height).toBe(SHIRT_PRINT_HEIGHT_PX);
    expect(buffer.length).toBeGreaterThan(10_000);
    expect(stats.channels[0]?.min).toBe(0);
    expect(stats.channels[0]?.max).toBe(255);
  });

  it("keeps the printed target URL visible for unusually long labels", () => {
    expect(getShirtVisibleTargetFontSize("x".repeat(10_000))).toBe(
      SHIRT_VISIBLE_TARGET_MIN_FONT_SIZE,
    );
  });
});
