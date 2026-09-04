import { COURT_OF_HUMANITY_TEXT } from "@optimitron/data/referendums";
import { describe, expect, it } from "vitest";
import { findUnsupportedCourtMarkdown } from "./court-case-text";

/**
 * The /court page renders the canonical case body with a minimal renderer
 * that supports paragraphs, `**bold**`, `[text](url)`, and `\$` escapes.
 * This guard fails loudly if the canonical body in `@optimitron/data` ever
 * adds markdown syntax the renderer would print as literal text.
 */
describe("Court of Humanity case body", () => {
  it("uses only the markdown constructs the /court renderer supports", () => {
    expect(findUnsupportedCourtMarkdown(COURT_OF_HUMANITY_TEXT.markdown)).toEqual(
      [],
    );
  });

  it("keeps the membership declaration and its safeguards intact", () => {
    expect(COURT_OF_HUMANITY_TEXT.markdown).toContain("**Article I**");
    expect(COURT_OF_HUMANITY_TEXT.markdown).toContain("**Article IV**");
    expect(COURT_OF_HUMANITY_TEXT.markdown).toContain(
      "I join the Court of Humanity",
    );
    expect(COURT_OF_HUMANITY_TEXT.markdown).toContain(
      "operates independently of governments",
    );
  });
});
