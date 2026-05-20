import crypto from "node:crypto";
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
    const hash = crypto.createHash("sha256").update(buffer).digest("hex");

    expect({
      format: metadata.format,
      hash,
      height: metadata.height,
      width: metadata.width,
    }).toMatchInlineSnapshot(`
      {
        "format": "png",
        "hash": "658120ae2cd0a2828196d4085058853ea5a5e0308f92bcf769d8eab0c45b0cdb",
        "height": 3600,
        "width": 3000,
      }
    `);
    expect(metadata.width).toBe(SHIRT_PRINT_WIDTH_PX);
    expect(metadata.height).toBe(SHIRT_PRINT_HEIGHT_PX);
  });
});
