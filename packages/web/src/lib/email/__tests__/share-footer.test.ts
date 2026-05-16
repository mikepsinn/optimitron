import { describe, expect, it } from "vitest";
import { SHARING_TIME_MINUTES } from "@optimitron/data/parameters";
import { FLOW_MAJORITY_OF_HUMANS_ON_EARTH } from "@/lib/treaty-share-flow-parameters";
import {
  buildEmailShareTemplateText,
  buildShareFooterHtml,
  buildShareFooterText,
} from "@/lib/email/share-footer";

const SAMPLE_URL = "https://warondisease.org/vote/SAMPLE";

describe("share footer", () => {
  it("links parameter-backed numbers to manual pages in HTML", async () => {
    const html = await buildShareFooterHtml(SAMPLE_URL);
    const normalized = html.replaceAll("<!-- -->", "");
    expect(html).toContain(`href="${SHARING_TIME_MINUTES.manualPageUrl}"`);
    expect(html).toContain(
      `href="${FLOW_MAJORITY_OF_HUMANS_ON_EARTH.manualPageUrl}"`,
    );
    expect(normalized).toContain(">two</a> more humans");
    expect(normalized).toContain(">4 billion</a> humans reached");
    expect(html).not.toContain("4,300,000,000");
  });

  it("keeps plaintext readable without markdown or HTML", () => {
    const text = buildShareFooterText(SAMPLE_URL);
    expect(text).toContain("30 seconds");
    expect(text).toContain("vote on this stupid treaty");
    expect(text).toContain("4 billion humans reached");
    expect(text).not.toContain("<a ");
    expect(text).not.toContain("[4 billion]");
  });

  it("renders the existing one-human template for email share-kit migrations", () => {
    const text = buildEmailShareTemplateText({ referralUrl: SAMPLE_URL });
    expect(text).toContain("Hi there");
    expect(text).toContain("I love you very much");
    expect(text).toContain("respond to this stupid survey");
    expect(text).toContain(SAMPLE_URL);
    expect(text).not.toContain("{target_name}");
    expect(text).not.toContain("{treaty_url}");
  });
});
