import { CommerceFulfillmentKind } from "@optimitron/db";
import { z } from "zod";
import type { EnabledStoreOfferForCheckout } from "@/lib/commerce-catalog.server";

export const STORE_ORDER_TYPE = "store_offer";

export interface ParsedStoreOfferCheckoutRequest {
  donationAmountCents: number;
  fmvCents: number;
  fulfillmentKind: CommerceFulfillmentKind;
  offerKey: string;
  sourceReferrer: string;
  sourceUrl: string;
  taxCode: string | null;
  title: string;
  totalAmountCents: number;
  variantKey?: string;
}
const storeOfferCheckoutSchema = z.object({
  amount: z.number().finite().positive().optional(),
  custom_amount: z.number().finite().positive().optional(),
  customAmount: z.number().finite().positive().optional(),
  offer_key: z.string().trim().min(1).max(120),
  offerKey: z.string().trim().min(1).max(120).optional(),
  order_type: z.literal(STORE_ORDER_TYPE).optional(),
  orderType: z.literal(STORE_ORDER_TYPE).optional(),
  sourceReferrer: z.string().optional(),
  sourceUrl: z.string().optional(),
  variant_key: z.string().trim().min(1).max(120).optional(),
  variantKey: z.string().trim().min(1).max(120).optional(),
});

function cleanCheckoutUrl(value: unknown): string {
  return typeof value === "string" ? value.split(/[?#]/)[0].slice(0, 512) : "";
}

function dollarsToCents(amount: number) {
  return Math.round(amount * 100);
}

function getMinAmountCents(catalog: EnabledStoreOfferForCheckout) {
  return (
    catalog.variant?.minUnitAmountCents ??
    catalog.offer.minUnitAmountCents ??
    catalog.variant?.unitAmountCents ??
    catalog.offer.defaultUnitAmountCents ??
    100
  );
}

function getMaxAmountCents(catalog: EnabledStoreOfferForCheckout) {
  return catalog.variant?.maxUnitAmountCents ?? catalog.offer.maxUnitAmountCents;
}

function getDefaultAmountCents(catalog: EnabledStoreOfferForCheckout) {
  return (
    catalog.variant?.unitAmountCents ??
    catalog.offer.defaultUnitAmountCents ??
    getMinAmountCents(catalog)
  );
}

function getAllowCustomAmount(catalog: EnabledStoreOfferForCheckout) {
  return catalog.variant?.allowCustomAmount ?? catalog.offer.allowCustomAmount;
}

function getFulfillmentKind(catalog: EnabledStoreOfferForCheckout) {
  return (
    catalog.variant?.fulfillmentKind ??
    catalog.offer.fulfillmentKind ??
    CommerceFulfillmentKind.NONE
  );
}

export function isStoreOfferCheckoutRequest(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const record = body as Record<string, unknown>;
  return record.order_type === STORE_ORDER_TYPE || record.orderType === STORE_ORDER_TYPE;
}

export function parseStoreOfferCheckoutRequest(
  body: unknown,
  catalog: EnabledStoreOfferForCheckout,
): ParsedStoreOfferCheckoutRequest {
  const parsed = storeOfferCheckoutSchema.safeParse(body);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid store order.");
  }

  const customAmountDollars =
    parsed.data.custom_amount ?? parsed.data.customAmount ?? parsed.data.amount;
  const totalAmountCents =
    typeof customAmountDollars === "number"
      ? dollarsToCents(customAmountDollars)
      : getDefaultAmountCents(catalog);
  const minAmountCents = getMinAmountCents(catalog);
  const maxAmountCents = getMaxAmountCents(catalog);
  const usesCustomAmount = typeof customAmountDollars === "number";

  if (usesCustomAmount && !getAllowCustomAmount(catalog)) {
    throw new Error("This store offer does not accept custom amounts.");
  }
  if (totalAmountCents < minAmountCents) {
    throw new Error(`Store offer contribution must be at least $${minAmountCents / 100}.`);
  }
  if (typeof maxAmountCents === "number" && totalAmountCents > maxAmountCents) {
    throw new Error(`Store offer contribution must be at most $${maxAmountCents / 100}.`);
  }

  const fmvCents = catalog.variant?.fmvCents ?? catalog.offer.defaultFmvCents;
  const donationAmountCents = catalog.offer.isTaxDeductible
    ? Math.max(0, totalAmountCents - fmvCents)
    : 0;
  const title = catalog.variant
    ? `${catalog.offer.title} - ${catalog.variant.label}`
    : catalog.offer.title;

  return {
    donationAmountCents,
    fmvCents,
    fulfillmentKind: getFulfillmentKind(catalog),
    offerKey: parsed.data.offerKey ?? parsed.data.offer_key,
    sourceReferrer: cleanCheckoutUrl(parsed.data.sourceReferrer),
    sourceUrl: cleanCheckoutUrl(parsed.data.sourceUrl),
    taxCode: catalog.variant?.taxCode ?? catalog.offer.taxCode,
    title,
    totalAmountCents,
    variantKey: parsed.data.variantKey ?? parsed.data.variant_key,
  };
}
