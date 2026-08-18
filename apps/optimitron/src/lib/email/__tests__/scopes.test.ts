import { describe, expect, it } from "vitest";
import { isEmailScope, NON_TRANSACTIONAL_SCOPES } from "@/lib/email/scopes";

describe("email scopes", () => {
  it("does not recognize the retired referral-sequence scope", () => {
    expect(isEmailScope("referral_sequence")).toBe(false);
    expect(NON_TRANSACTIONAL_SCOPES).not.toContain("referral_sequence");
  });
});
