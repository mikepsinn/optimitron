import { describe, expect, it } from "vitest";
import {
  SHIRT_FMV_CENTS,
  parseShirtCheckoutRequest,
} from "../shirt-commerce.server";

describe("shirt checkout validator", () => {
  it("rejects invalid sizes", () => {
    expect(() =>
      parseShirtCheckoutRequest({
        donation_tier: "25",
        handle: "ada",
        order_type: "shirt",
        shirt_size: "XS",
      }),
    ).toThrow();
  });

  it("defaults to black and computes the fair-market-value split", () => {
    const parsed = parseShirtCheckoutRequest({
      donation_tier: "35",
      handle: "ada",
      order_type: "shirt",
      shirt_size: "M",
      sourceReferrer: "https://example.org/?secret=1",
      sourceUrl: "https://warondisease.org/shirt?token=secret#hash",
    });

    expect(parsed).toEqual({
      donationAmountCents: 2000,
      donationTier: "35",
      handle: "ada",
      shirtColor: "black",
      shirtSize: "M",
      sourceReferrer: "https://example.org/",
      sourceUrl: "https://warondisease.org/shirt",
      totalAmountCents: 3500,
    });
    expect(SHIRT_FMV_CENTS).toBe(1500);
  });

  it("requires custom totals to cover at least the first public tier", () => {
    expect(() =>
      parseShirtCheckoutRequest({
        custom_amount: 20,
        donation_tier: "custom",
        handle: "ada",
        order_type: "shirt",
        shirt_size: "L",
      }),
    ).toThrow("at least $25");
  });
});
