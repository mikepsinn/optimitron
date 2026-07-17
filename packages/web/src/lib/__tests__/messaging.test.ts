import { describe, expect, it } from "vitest";
import {
  REFERRAL,
  PRIZE_CTA_COPY,
  getUserFramingVocabulary,
  type UserFramingVocabulary,
} from "@/lib/messaging";

describe("getUserFramingVocabulary", () => {
  it("returns the manager-frame block when asked", () => {
    const vocab = getUserFramingVocabulary("manager");
    expect(vocab.recruit.verb).toBe("hire");
    expect(vocab.recruit.noun).toBe("humanity manager");
    expect(vocab.recruit.nounPlural).toBe("humanity managers");
    expect(vocab.recruitedActivityVerb).toBe("hired a humanity manager");
    expect(vocab.org.longName).toBe("Earth Optimization Services Inc.");
  });

  it("returns the voter-frame block when asked", () => {
    const vocab = getUserFramingVocabulary("voter");
    expect(vocab.recruit.verb).toBe("recruit");
    expect(vocab.recruit.noun).toBe("voter");
    expect(vocab.recruit.nounPlural).toBe("voters");
    expect(vocab.recruitedActivityVerb).toBe("recruited a voter");
    expect(vocab.org.longName).toBe("Earth Optimization Services Inc.");
  });

  it("returns the same legal-entity org name for both framings", () => {
    // The recruitment vocabulary varies; the legal entity does not.
    expect(getUserFramingVocabulary("manager").org.longName).toBe(
      getUserFramingVocabulary("voter").org.longName,
    );
  });

  it("conforms to the UserFramingVocabulary interface", () => {
    // Compile-time + runtime sanity: every documented field is non-empty.
    const fields: (keyof UserFramingVocabulary)[] = [
      "recruit",
      "org",
      "recruitCtaShort",
      "shareLinkPrompt",
      "earnPerRecruit",
      "earnPerRecruitShort",
      "verifyAndEarn",
      "depositAndRecruit",
      "recruitedActivityVerb",
    ];
    for (const framing of ["manager", "voter"] as const) {
      const vocab = getUserFramingVocabulary(framing);
      for (const field of fields) {
        expect(vocab[field], `${framing}.${field}`).toBeTruthy();
      }
    }
  });
});

describe("legacy aggregate constants", () => {
  it("REFERRAL mirrors the voter-frame defaults so unmigrated call sites keep working", () => {
    const voter = getUserFramingVocabulary("voter");
    expect(REFERRAL.earnOne).toBe(voter.earnPerRecruit);
    expect(REFERRAL.earnOneShort).toBe(voter.earnPerRecruitShort);
    expect(REFERRAL.verifyAndEarn).toBe(voter.verifyAndEarn);
  });

  it("PRIZE_CTA_COPY.depositAndRecruit mirrors the voter-frame default", () => {
    expect(PRIZE_CTA_COPY.depositAndRecruit).toBe(
      getUserFramingVocabulary("voter").depositAndRecruit,
    );
  });
});
