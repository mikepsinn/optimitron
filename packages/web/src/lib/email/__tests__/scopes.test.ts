import { describe, expect, it } from "vitest";
import { isEmailScope, NON_TRANSACTIONAL_SCOPES } from "@/lib/email/scopes";

describe("email scopes", () => {
  it("keeps retired referral-sequence scope valid but hidden from active preferences", () => {
    expect(isEmailScope("referral_sequence")).toBe(true);
    expect(NON_TRANSACTIONAL_SCOPES).not.toContain("referral_sequence");
  });
});
