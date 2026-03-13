import { describe, expect, it } from "vitest";
import {
  buildAlignmentUrl,
  buildReferralUrl,
  buildUserAlignmentUrl,
  buildUserReferralUrl,
} from "@/lib/url";

describe("url helpers", () => {
  it("builds public referral links for a user identifier", () => {
    expect(
      buildUserReferralUrl({ username: "jane", referralCode: "REF123" }, "https://example.com"),
    ).toBe("https://example.com/wishocracy/jane");
    expect(buildReferralUrl("REF123", "https://example.com")).toBe(
      "https://example.com/wishocracy/REF123",
    );
  });

  it("builds public alignment links for a user identifier", () => {
    expect(
      buildUserAlignmentUrl(
        { username: "jane", referralCode: "REF123" },
        "https://example.com",
      ),
    ).toBe("https://example.com/alignment/jane");
    expect(buildAlignmentUrl("REF123", "https://example.com")).toBe(
      "https://example.com/alignment/REF123",
    );
  });
});
