import { describe, expect, it } from "vitest";
import { stripQuotedReply } from "../inbound-reply";

/**
 * Unit tests for the inbound-reply quote stripper. Pure function — covers
 * the email-client conventions that show up in Gmail, Apple Mail, Outlook
 * desktop, and most mobile clients. End-to-end behavior of
 * `processInboundReply` (DB writes, sender auth) is exercised by the
 * production smoke test (assign task → reply → see comment).
 */
describe("stripQuotedReply", () => {
  it("returns the body unchanged when there's nothing to strip", () => {
    expect(stripQuotedReply("Hello, this is a fresh reply.")).toBe(
      "Hello, this is a fresh reply.",
    );
  });

  it("strips Gmail/Apple Mail 'On X, Y wrote:' attribution and below", () => {
    const body = [
      "Sounds good — let's proceed.",
      "",
      "On Mon, May 3, 2026 at 10:23 AM, Wishonia <wishonia@warondisease.org> wrote:",
      "> Original message body",
      "> with multiple lines",
    ].join("\n");
    expect(stripQuotedReply(body)).toBe("Sounds good — let's proceed.");
  });

  it("strips Outlook '-----Original Message-----' divider and below", () => {
    const body = [
      "Confirmed.",
      "",
      "-----Original Message-----",
      "From: someone",
      "Subject: re: thing",
      "",
      "Original body.",
    ].join("\n");
    expect(stripQuotedReply(body)).toBe("Confirmed.");
  });

  it("strips Outlook 'From: ... Sent: ... To:' header block and below", () => {
    const body = [
      "Yes, we'll fund it.",
      "",
      "From: Wishonia <wishonia@warondisease.org>",
      "Sent: Monday, May 3, 2026 10:23 AM",
      "To: foundation@example.org",
      "Subject: Grant ask",
      "",
      "Original body lives here.",
    ].join("\n");
    expect(stripQuotedReply(body)).toBe("Yes, we'll fund it.");
  });

  it("strips '> ' line-prefix quotes regardless of attribution", () => {
    const body = [
      "Reply body.",
      "> previous line 1",
      "> previous line 2",
      "Trailing reply text.",
    ].join("\n");
    expect(stripQuotedReply(body)).toBe(
      ["Reply body.", "Trailing reply text."].join("\n"),
    );
  });

  it("strips signature delimiter '-- '", () => {
    const body = ["Real reply.", "", "-- ", "John Doe", "Foundation Director"].join("\n");
    expect(stripQuotedReply(body)).toBe("Real reply.");
  });

  it("normalizes CRLF line endings before processing", () => {
    const body = "Line one.\r\nLine two.\r\n> quoted\r\n";
    expect(stripQuotedReply(body)).toBe("Line one.\nLine two.");
  });

  it("returns empty string for empty input", () => {
    expect(stripQuotedReply("")).toBe("");
  });

  it("trims trailing whitespace", () => {
    expect(stripQuotedReply("Reply.\n\n\n")).toBe("Reply.");
  });
});
