import { describe, expect, it } from "vitest";
import {
  HUMANITY_V_GOVERNMENT_METADATA,
  HUMANITY_V_GOVERNMENT_OG_ALT,
  HUMANITY_V_GOVERNMENT_OG_IMAGE_PATH,
} from "./page-metadata";

describe("Humanity v. Government metadata", () => {
  it("frames the page as a damages verdict with a large preview image", () => {
    expect(HUMANITY_V_GOVERNMENT_METADATA.title).toBe(
      "You May Be Owed $2.74 Million | Humanity v. Government",
    );
    expect(HUMANITY_V_GOVERNMENT_METADATA.description).toContain(
      "Render your verdict",
    );
    expect(HUMANITY_V_GOVERNMENT_METADATA.openGraph?.images).toEqual([
      {
        url: HUMANITY_V_GOVERNMENT_OG_IMAGE_PATH,
        width: 1200,
        height: 630,
        alt: HUMANITY_V_GOVERNMENT_OG_ALT,
      },
    ]);
    expect(HUMANITY_V_GOVERNMENT_METADATA.twitter?.images).toEqual([
      HUMANITY_V_GOVERNMENT_OG_IMAGE_PATH,
    ]);
  });
});
