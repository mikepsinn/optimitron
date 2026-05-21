import { z } from "zod";

export const SHIRT_FMV_CENTS = 1500;
export const SHIRT_TAX_CODE = "txcd_99999999";
export const DONATION_TAX_CODE = "txcd_00000000";

export const SHIRT_SIZES = ["S", "M", "L", "XL", "XXL"] as const;
export const SHIRT_COLORS = ["black", "white"] as const;
export const SHIRT_DONATION_TIERS = ["25", "35", "50", "100", "custom"] as const;

export type ShirtSize = (typeof SHIRT_SIZES)[number];
export type ShirtColor = (typeof SHIRT_COLORS)[number];
export type ShirtDonationTier = (typeof SHIRT_DONATION_TIERS)[number];

export interface ParsedShirtCheckoutRequest {
  customAmountDollars?: number;
  donationAmountCents: number;
  donationTier: ShirtDonationTier;
  handle: string;
  shirtColor: ShirtColor;
  shirtSize: ShirtSize;
  sourceReferrer: string;
  sourceUrl: string;
  totalAmountCents: number;
}

const shirtCheckoutSchema = z.object({
  custom_amount: z.number().finite().positive().optional(),
  customAmount: z.number().finite().positive().optional(),
  donation_tier: z.enum(SHIRT_DONATION_TIERS),
  handle: z.string().trim().min(1).max(64),
  order_type: z.literal("shirt").optional(),
  orderType: z.literal("shirt").optional(),
  shirt_color: z.enum(SHIRT_COLORS).optional(),
  shirt_size: z.enum(SHIRT_SIZES),
  sourceReferrer: z.string().optional(),
  sourceUrl: z.string().optional(),
});

function cleanCheckoutUrl(value: unknown): string {
  return typeof value === "string" ? value.split(/[?#]/)[0].slice(0, 512) : "";
}

function getTierAmountCents(tier: ShirtDonationTier, customAmountDollars?: number) {
  if (tier !== "custom") {
    return Number(tier) * 100;
  }

  if (typeof customAmountDollars !== "number" || customAmountDollars < 25) {
    throw new Error("Custom shirt contribution must be at least $25.");
  }

  return Math.round(customAmountDollars * 100);
}

export function isShirtCheckoutRequest(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const record = body as Record<string, unknown>;
  return record.order_type === "shirt" || record.orderType === "shirt";
}

export function parseShirtCheckoutRequest(body: unknown): ParsedShirtCheckoutRequest {
  const parsed = shirtCheckoutSchema.safeParse(body);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid shirt order.");
  }

  const customAmountDollars = parsed.data.custom_amount ?? parsed.data.customAmount;
  const totalAmountCents = getTierAmountCents(parsed.data.donation_tier, customAmountDollars);
  const donationAmountCents = totalAmountCents - SHIRT_FMV_CENTS;

  if (donationAmountCents < 0) {
    throw new Error("Shirt contribution must cover the $15 fair market value.");
  }

  return {
    customAmountDollars,
    donationAmountCents,
    donationTier: parsed.data.donation_tier,
    handle: parsed.data.handle.trim(),
    shirtColor: parsed.data.shirt_color ?? "black",
    shirtSize: parsed.data.shirt_size,
    sourceReferrer: cleanCheckoutUrl(parsed.data.sourceReferrer),
    sourceUrl: cleanCheckoutUrl(parsed.data.sourceUrl),
    totalAmountCents,
  };
}
