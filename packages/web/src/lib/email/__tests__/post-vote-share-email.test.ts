import { describe, expect, it } from "vitest";
import {
  buildPostVoteShareHtml,
  buildPostVoteShareText,
} from "../post-vote-share-email";

const SAMPLE_URL = "https://warondisease.org/r/ABCD1234";

describe("post-vote share email builders", () => {
  it("renders forward-friendly HTML with the message body and a button", () => {
    const html = buildPostVoteShareHtml(SAMPLE_URL);
    expect(html).toContain(SAMPLE_URL);
    expect(html).toContain("End war and disease");
    expect(html).toContain("forward this to two humans");
  });

  it("escapes the URL so a hostile referral code cannot inject HTML", () => {
    const hostile = "https://warondisease.org/r/<script>alert(1)</script>";
    const html = buildPostVoteShareHtml(hostile);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("plaintext fallback embeds the URL and forward math", () => {
    const text = buildPostVoteShareText(SAMPLE_URL);
    expect(text).toContain(SAMPLE_URL);
    expect(text).toContain("4,300,000,000");
  });
});
