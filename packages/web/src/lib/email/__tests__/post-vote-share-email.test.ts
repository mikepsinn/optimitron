import { describe, expect, it } from "vitest";
import {
  POST_VOTE_SHARE_SUBJECT,
  POST_VOTE_SHARE_TEMPLATE_ID,
  buildPostVoteShareHtml,
  buildPostVoteShareMessageText,
  buildPostVoteShareText,
} from "../post-vote-share-email";

const SAMPLE_URL = "https://warondisease.org/r/ABCD1234";

describe("post-vote share email builders", () => {
  it("embeds the referral URL verbatim in the share message", () => {
    const message = buildPostVoteShareMessageText(SAMPLE_URL);
    expect(message).toContain(SAMPLE_URL);
  });

  it("uses the canonical love + threat + 30 seconds frame", () => {
    const message = buildPostVoteShareMessageText(SAMPLE_URL);
    expect(message).toContain("I love you");
    expect(message).toContain("suffer and die of horrible diseases");
    expect(message).toContain("30 seconds");
  });

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

  it("plaintext fallback contains the same canonical message + URL", () => {
    const text = buildPostVoteShareText(SAMPLE_URL);
    expect(text).toContain("I love you");
    expect(text).toContain(SAMPLE_URL);
    expect(text).toContain("4,300,000,000");
  });

  it("exposes a stable template id + subject (used for dedupe and logging)", () => {
    expect(POST_VOTE_SHARE_TEMPLATE_ID).toBe("post-vote-share");
    expect(POST_VOTE_SHARE_SUBJECT).toBe("End war and disease");
  });
});
