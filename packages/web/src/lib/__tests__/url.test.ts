import { describe, expect, it } from "vitest";
import {
  buildAlignmentUrl,
  buildReferralUrl,
  buildUserAlignmentUrl,
  buildUserReferralUrl,
  buildReferendumReferralUrl,
} from "@/lib/url";
import { ROUTES } from "@/lib/routes";

describe("url helpers", () => {
  it("builds clean referral links at /r/identifier", () => {
    expect(
      buildUserReferralUrl({ username: "jane", referralCode: "REF123" }, "https://example.com"),
    ).toBe("https://example.com/r/jane");
    expect(buildReferralUrl("REF123", "https://example.com")).toBe(
      "https://example.com/r/REF123",
    );
    expect(buildReferralUrl(null, "https://example.com")).toBe(
      "https://example.com",
    );
  });

  it("builds alignment sharing links with path segment", () => {
    expect(
      buildUserAlignmentUrl(
        { username: "jane", referralCode: "REF123" },
        "https://example.com",
      ),
    ).toBe(`https://example.com${ROUTES.alignment}/jane`);
    expect(buildAlignmentUrl("REF123", "https://example.com")).toBe(
      `https://example.com${ROUTES.alignment}/REF123`,
    );
  });

  it("builds referendum referral links with ?ref=", () => {
    expect(
      buildReferendumReferralUrl("one-percent-treaty", "friend-123", "https://example.com"),
    ).toBe(`https://example.com${ROUTES.referendum}/one-percent-treaty?ref=friend-123`);
  });
});
