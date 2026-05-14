import { describe, expect, it } from "vitest";
import { buildShareMessage } from "../share-message";

const SAMPLE_URL = "https://warondisease.org/r/ABCD1234";

describe("buildShareMessage", () => {
  it("embeds the referral URL verbatim", () => {
    expect(buildShareMessage(SAMPLE_URL)).toContain(SAMPLE_URL);
  });

  it("keeps the load-bearing frame: love + threat + 30 seconds", () => {
    const message = buildShareMessage(SAMPLE_URL);
    expect(message).toContain("I love you");
    expect(message).toContain("suffer and die of horrible diseases");
    expect(message).toContain("30 seconds");
  });

  it("does not regress to earlier weaker wording", () => {
    const message = buildShareMessage(SAMPLE_URL);
    expect(message).not.toContain("click this button");
    expect(message).not.toContain("chance you will suffer");
  });
});
