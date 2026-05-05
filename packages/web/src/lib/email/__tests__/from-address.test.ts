import { describe, expect, it } from "vitest";
import {
  formatEmailFromHeader,
  parseEmailFromHeader,
  sanitizeDisplayName,
} from "../from-address";

describe("parseEmailFromHeader", () => {
  it("parses Display Name <email> form", () => {
    expect(parseEmailFromHeader("Wishonia <hello@example.com>")).toEqual({
      address: "hello@example.com",
      displayName: "Wishonia",
    });
  });

  it("parses bare email without brackets", () => {
    expect(parseEmailFromHeader("hello@example.com")).toEqual({
      address: "hello@example.com",
      displayName: null,
    });
  });

  it("strips RFC 5322 quoted display names", () => {
    expect(parseEmailFromHeader('"Wishonia, PMO" <hello@example.com>')).toEqual(
      {
        address: "hello@example.com",
        displayName: "Wishonia, PMO",
      },
    );
  });

  it("trims whitespace around address and display name", () => {
    expect(
      parseEmailFromHeader("  Wishonia   <  hello@example.com  >  "),
    ).toEqual({
      address: "hello@example.com",
      displayName: "Wishonia",
    });
  });

  it("returns null for empty or whitespace input", () => {
    expect(parseEmailFromHeader("")).toBeNull();
    expect(parseEmailFromHeader("   ")).toBeNull();
    expect(parseEmailFromHeader(null)).toBeNull();
    expect(parseEmailFromHeader(undefined)).toBeNull();
  });

  it("returns null when neither bracketed nor bare form has an @", () => {
    expect(parseEmailFromHeader("Wishonia <not-an-email>")).toBeNull();
    expect(parseEmailFromHeader("not-an-email")).toBeNull();
  });

  it("returns null for malformed bare header-like input", () => {
    expect(
      parseEmailFromHeader('"Wishonia" <hello@example.com> extra'),
    ).toBeNull();
    expect(
      parseEmailFromHeader("hello@example.com\r\nBcc: bad@example.com"),
    ).toBeNull();
  });

  it("returns null display name when only an angle-bracketed address is given", () => {
    expect(parseEmailFromHeader("<hello@example.com>")).toEqual({
      address: "hello@example.com",
      displayName: null,
    });
  });
});

describe("sanitizeDisplayName", () => {
  it("strips angle brackets, CRLF, and double quotes", () => {
    expect(sanitizeDisplayName("Wishonia\r\n", "fallback")).toBe("Wishonia");
    expect(sanitizeDisplayName('"Wishonia"', "fallback")).toBe("Wishonia");
    expect(sanitizeDisplayName("<Wishonia>", "fallback")).toBe("Wishonia");
  });

  it("falls back when result is empty after stripping", () => {
    expect(sanitizeDisplayName('<>"', "A voter")).toBe("A voter");
    expect(sanitizeDisplayName("   ", "A voter")).toBe("A voter");
  });

  it("preserves a clean name", () => {
    expect(sanitizeDisplayName("Wishonia", "fallback")).toBe("Wishonia");
  });
});

describe("formatEmailFromHeader", () => {
  it("adds the fallback display name for bare email addresses", () => {
    expect(formatEmailFromHeader("hello@example.com", "Wishonia")).toBe(
      "Wishonia <hello@example.com>",
    );
  });

  it("sanitizes parsed display names before formatting", () => {
    expect(
      formatEmailFromHeader(
        '"Wishonia\r\nTeam" <hello@example.com>',
        "Wishonia",
      ),
    ).toBe("WishoniaTeam <hello@example.com>");
  });

  it("falls back when the parsed display name is empty after sanitizing", () => {
    expect(formatEmailFromHeader('"<>" <hello@example.com>', "Wishonia")).toBe(
      "Wishonia <hello@example.com>",
    );
  });

  it("falls back to the system sender for malformed input", () => {
    expect(formatEmailFromHeader("not-an-email", "Wishonia")).toBe(
      "Earth Optimization Services <hello@updates.warondisease.org>",
    );
  });
});
