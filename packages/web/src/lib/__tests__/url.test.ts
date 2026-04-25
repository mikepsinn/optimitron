import { describe, expect, it } from "vitest";
import {
  buildAlignmentUrl,
  buildInviteReferralUrl,
  buildReferralUrl,
  buildUserAlignmentUrl,
  buildUserInviteReferralUrl,
  buildUserReferralUrl,
  buildReferendumReferralUrl,
} from "@/lib/url";
import { ROUTES } from "@/lib/routes";

describe("url helpers", () => {
  it("builds clean referral links at /vote/identifier", () => {
    expect(
      buildUserReferralUrl({ username: "jane", referralCode: "REF123" }, "https://example.com"),
    ).toBe("https://example.com/vote/jane");
    expect(buildReferralUrl("REF123", "https://example.com")).toBe(
      "https://example.com/vote/REF123",
    );
    expect(buildReferralUrl(null, "https://example.com")).toBe(
      "https://example.com",
    );
  });

  it("builds invite referral links without changing the canonical /vote path", () => {
    expect(
      buildUserInviteReferralUrl(
        { username: "jane", referralCode: "REF123" },
        "invite_123",
        "https://example.com",
      ),
    ).toBe("https://example.com/vote/jane?invite=invite_123");
    expect(
      buildInviteReferralUrl("REF123", "invite value", "https://example.com"),
    ).toBe("https://example.com/vote/REF123?invite=invite%20value");
    expect(buildInviteReferralUrl(null, "invite_123", "https://example.com")).toBe(
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
