import { describe, expect, it } from "vitest";
import { insertGeneratedReferralInviteUrl } from "@/lib/referral-invitation-message-url";

describe("referral invitation message URLs", () => {
  const inviteUrl = "https://example.com/vote/ada?invite=invite_token";
  const draftReferralUrl = "https://example.com/vote/ada";

  it("replaces the user's draft referral URL with the generated invite URL", () => {
    const message = ["Please vote on the 1% Treaty:", draftReferralUrl].join("\n");

    expect(
      insertGeneratedReferralInviteUrl(message, inviteUrl, { draftReferralUrl }),
    ).toBe(
      ["Please vote on the 1% Treaty:", inviteUrl].join("\n"),
    );
  });

  it("keeps legacy draft URL messages working without preserving the fake URL", () => {
    expect(insertGeneratedReferralInviteUrl("Please vote: warondisease.org", inviteUrl)).toBe(
      `Please vote: ${inviteUrl}`,
    );
    expect(
      insertGeneratedReferralInviteUrl(
        "Please vote: https://warondisease.org/vote/ada",
        inviteUrl,
      ),
    ).toBe(`Please vote: ${inviteUrl}`);
  });

  it("appends the generated invite URL when the draft has no placeholder", () => {
    expect(insertGeneratedReferralInviteUrl("Please vote.", inviteUrl)).toBe(
      `Please vote.\n\n${inviteUrl}`,
    );
  });
});
