import { describe, expect, it } from "vitest";
import { buildChannelHref, embedShareAttemptId } from "../share-channels";

describe("buildChannelHref", () => {
  const input = {
    message: "Please sign the 1% Treaty.",
    shareText: "Sign the 1% Treaty",
    shareUrl: "https://optimitron.com/r/jane?sa=abc",
    taskUrl: "https://optimitron.com/tasks/1?ref=jane",
    taskTitle: "Sign the 1% Treaty",
  };

  it("builds an X/Twitter intent URL with the message encoded", () => {
    const href = buildChannelHref("x", input);
    expect(href).toBe(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(input.message)}`,
    );
  });

  it("builds a Bluesky compose URL with the message encoded", () => {
    expect(buildChannelHref("bluesky", input)).toBe(
      `https://bsky.app/intent/compose?text=${encodeURIComponent(input.message)}`,
    );
  });

  it("builds a LinkedIn share URL with the attributed shareUrl encoded", () => {
    expect(buildChannelHref("linkedin", input)).toBe(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(input.shareUrl)}`,
    );
  });

  it("builds a Reddit submit URL with url + title", () => {
    const href = buildChannelHref("reddit", input);
    expect(href).toContain(`url=${encodeURIComponent(input.shareUrl)}`);
    expect(href).toContain(`title=${encodeURIComponent(input.shareText)}`);
  });

  it("builds a mailto URL with subject and body", () => {
    const href = buildChannelHref("email", input);
    expect(href).toContain("mailto:");
    expect(href).toContain(`subject=${encodeURIComponent(`Please complete: ${input.taskTitle}`)}`);
    expect(href).toContain(`body=${encodeURIComponent(input.message)}`);
  });
});

describe("embedShareAttemptId", () => {
  it("appends sa= to an owned URL without existing query", () => {
    const msg = "Check out https://optimitron.com/r/jane and take action.";
    const out = embedShareAttemptId(msg, "https://optimitron.com/r/jane", "abc");
    expect(out).toBe("Check out https://optimitron.com/r/jane?sa=abc and take action.");
  });

  it("appends sa= preserving other query params", () => {
    const msg = "Visit https://optimitron.com/r/jane?utm_source=x for context.";
    const out = embedShareAttemptId(msg, "https://optimitron.com/r/jane", "abc");
    expect(out).toContain("utm_source=x");
    expect(out).toContain("sa=abc");
  });

  it("replaces an existing sa= rather than duplicating it", () => {
    const msg = "Here https://optimitron.com/r/jane?sa=OLD&foo=bar end.";
    const out = embedShareAttemptId(msg, "https://optimitron.com/r/jane", "NEW");
    expect(out).toContain("sa=NEW");
    expect(out).not.toContain("sa=OLD");
    expect(out).toContain("foo=bar");
  });

  it("preserves a url fragment", () => {
    const msg = "Go https://optimitron.com/r/jane#vote now.";
    const out = embedShareAttemptId(msg, "https://optimitron.com/r/jane", "abc");
    expect(out).toBe("Go https://optimitron.com/r/jane?sa=abc#vote now.");
  });

  it("leaves non-matching URLs alone", () => {
    const msg = "See https://other.example.com/r/jane for details.";
    const out = embedShareAttemptId(msg, "https://optimitron.com/r/jane", "abc");
    expect(out).toBe(msg);
  });

  it("returns the message unchanged when inputs are missing", () => {
    expect(embedShareAttemptId("text", "", "abc")).toBe("text");
    expect(embedShareAttemptId("text", "https://x", "")).toBe("text");
  });

  it("keeps sentence punctuation outside the attributed URL", () => {
    const msg = "Sign it at https://optimitron.com/r/jane. It takes 30 seconds.";
    const out = embedShareAttemptId(msg, "https://optimitron.com/r/jane", "abc");
    expect(out).toBe("Sign it at https://optimitron.com/r/jane?sa=abc. It takes 30 seconds.");
  });
});
