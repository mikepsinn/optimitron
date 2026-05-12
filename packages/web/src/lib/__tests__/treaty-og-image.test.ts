import { describe, expect, it } from "vitest";
import {
  TREATY_OG_SERIF_FONT_FAMILY,
  TREATY_OG_IMAGE_PRESETS,
  buildTreatyOgAltText,
} from "@/lib/treaty-og-image";

describe("treaty OG image helpers", () => {
  it("keeps the image dimensions we use for social previews", () => {
    expect(TREATY_OG_SERIF_FONT_FAMILY).toBe("Libre Baskerville");
    expect(TREATY_OG_IMAGE_PRESETS.openGraph).toEqual({
      width: 1200,
      height: 630,
    });
    expect(TREATY_OG_IMAGE_PRESETS.socialStory).toEqual({
      width: 1080,
      height: 1920,
    });
  });

  it("builds readable alt text from the same lines used in the image", () => {
    expect(
      buildTreatyOgAltText({
        eyebrow: "Humanity v. Government",
        primaryLines: ["You may be owed", "$2.74 million"],
        secondaryLines: ["Render your verdict"],
        footer: "WarOnDisease.org",
      }),
    ).toBe(
      "Humanity v. Government. You may be owed $2.74 million. Render your verdict. WarOnDisease.org.",
    );
  });
});
