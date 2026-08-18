import React from "react";
import { describe, expect, it } from "vitest";
import { PostVoteShareReactEmail } from "../post-vote-share-react-email";
import { renderReactEmailBody } from "../render-react-email";

const SAMPLE_URL = "https://warondisease.org/r/ABCD1234";

async function renderPostVoteShareEmail(referralUrl = SAMPLE_URL) {
  return renderReactEmailBody(
    React.createElement(PostVoteShareReactEmail, { referralUrl }),
  );
}

describe("post-vote share email template", () => {
  it("renders forward-friendly HTML with the message body and a button", async () => {
    const { html } = await renderPostVoteShareEmail();
    expect(html).toContain(SAMPLE_URL);
    expect(html).not.toContain("{treaty_url}");
  });

  it("escapes the URL so a hostile referral code cannot inject HTML", async () => {
    const hostile = "https://warondisease.org/r/<script>alert(1)</script>";
    const { html } = await renderPostVoteShareEmail(hostile);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("plaintext fallback embeds the URL and forward prompt", async () => {
    const { text } = await renderPostVoteShareEmail();
    expect(text).toContain(SAMPLE_URL);
    expect(text).not.toContain("{target_name}");
  });
});
