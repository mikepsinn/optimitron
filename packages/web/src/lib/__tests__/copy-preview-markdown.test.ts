import { describe, expect, it } from "vitest";

import { buildCopyPreviewMarkdown } from "@/lib/copy-preview-markdown";

describe("buildCopyPreviewMarkdown", () => {
  it("includes page metadata before visible copy", () => {
    const markdown = buildCopyPreviewMarkdown({
      bodyMarkdown: "## Headline\n- Vote yes",
      metadata: {
        canonical: "https://warondisease.org/humanity-v-government",
        description: "Render your verdict in Humanity v. Government.",
        openGraphDescription: "You may be owed millions.",
        openGraphImage: "/humanity-v-government/opengraph-image",
        openGraphTitle: "You May Be Owed $2.74 Million",
        title: "Humanity v. Government",
        twitterDescription: "Render your verdict.",
        twitterTitle: "Court of Humanity",
      },
      route: "/humanity-v-government",
    });

    expect(markdown).toContain("# /humanity-v-government");
    expect(markdown).toContain("## Metadata");
    expect(markdown).toContain("- Page title: Humanity v. Government");
    expect(markdown).toContain(
      "- Meta description: Render your verdict in Humanity v. Government.",
    );
    expect(markdown).toContain(
      "- Open Graph title: You May Be Owed $2.74 Million",
    );
    expect(markdown).toContain("## Visible Page Copy");
    expect(markdown).toContain("## Headline\n- Vote yes");
  });

  it("marks missing metadata visibly so copy review catches it", () => {
    const markdown = buildCopyPreviewMarkdown({
      bodyMarkdown: "",
      metadata: {},
      route: "/missing",
    });

    expect(markdown).toContain("- Page title: [missing]");
    expect(markdown).toContain("- Meta description: [missing]");
    expect(markdown).toContain("- Open Graph title: [missing]");
    expect(markdown).toContain("- Open Graph description: [missing]");
    expect(markdown).toContain("- Twitter title: [missing]");
    expect(markdown).toContain("- Twitter description: [missing]");
    expect(markdown).toContain("- [no visible copy captured]");
  });
});
