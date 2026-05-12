import { describe, expect, it } from "vitest";
import {
  BLACK_WHITE_TEXT_OG_IMAGE_PRESETS,
  BLACK_WHITE_TEXT_OG_SERIF_FONT_FAMILY,
  buildBlackWhiteTextOgAltText,
  getBlackWhiteTextOgImageCopyForNavItem,
} from "@/lib/black-white-text-og-image";

describe("black-and-white text OG image helpers", () => {
  it("keeps the image dimensions we use for social previews", () => {
    expect(BLACK_WHITE_TEXT_OG_SERIF_FONT_FAMILY).toBe("Libre Baskerville");
    expect(BLACK_WHITE_TEXT_OG_IMAGE_PRESETS.openGraph).toEqual({
      width: 1200,
      height: 630,
    });
    expect(BLACK_WHITE_TEXT_OG_IMAGE_PRESETS.socialStory).toEqual({
      width: 1080,
      height: 1920,
    });
  });

  it("builds readable alt text from the same lines used in the image", () => {
    expect(
      buildBlackWhiteTextOgAltText({
        eyebrow: "Humanity v. Government",
        primaryLines: ["You may be owed", "$2.74 million"],
        secondaryLines: ["Render your verdict"],
        footer: "WarOnDisease.org",
      }),
    ).toBe(
      "Humanity v. Government. You may be owed $2.74 million. Render your verdict. WarOnDisease.org.",
    );
  });

  it("derives fallback image copy from route title and description", () => {
    expect(
      getBlackWhiteTextOgImageCopyForNavItem({
        label: "Humanity v. Government",
        socialPreview: {
          title: "You May Be Owed $2.74 Million",
          description: "Render your verdict in the Court of Humanity.",
        },
      }),
    ).toEqual({
      footer: "WarOnDisease.org",
      primaryLines: ["You May Be Owed $2.74", "Million"],
      secondaryLines: [
        "Render your verdict in the Court of",
        "Humanity.",
      ],
    });
  });
});
