import { describe, expect, it } from "vitest";

import { generateMetadata } from "./page";

describe("find trials metadata", () => {
  it("handles already-decoded intervention names that contain percent signs", async () => {
    await expect(
      generateMetadata({
        searchParams: {
          condition: "Peripheral Neuropathy",
          intervention: "Topical Capsaicin (8% patch)",
        },
      }),
    ).resolves.toMatchObject({
      title: "Peripheral Neuropathy Trials: Topical Capsaicin (8% patch)",
      description:
        "Find clinical trials for Peripheral Neuropathy with intervention Topical Capsaicin (8% patch).",
    });
  });
});
