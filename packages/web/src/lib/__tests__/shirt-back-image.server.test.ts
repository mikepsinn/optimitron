import sharp from "sharp";
import { describe, expect, it } from "vitest";
import {
  SHIRT_PRINT_HEIGHT_PX,
  SHIRT_PRINT_WIDTH_PX,
  generateShirtBackImage,
} from "../shirt-back-image.server";

describe("generateShirtBackImage", () => {
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
});
