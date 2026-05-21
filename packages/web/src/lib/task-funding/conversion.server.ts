import {
  CommerceOfferStatus,
  Prisma,
  type PrismaClient,
} from "@optimitron/db";
import { prisma } from "@/lib/prisma";

export const TASK_FUNDING_CONVERSION_VERSION = "2026-05-21:v1";

export type TaskFundingConversionInput =
  | {
      unitKind: "USD";
      amountCents?: string;
    }
  | {
      unitKind: "COMMERCE_OFFER";
      amountCents?: string;
      offerKey?: string;
      quantity?: string;
      variantKey?: string;
    };

export interface TaskFundingConversionResult {
  committedAmountCents: bigint;
  unitKey: string;
  unitQuantity: Prisma.Decimal;
  unitAmountCentsSnapshot: bigint | null;
  conversionVersion: string;
  conversionSource: string | null;
}

export interface ResolvedTaskFundingConversion
  extends TaskFundingConversionResult {
  commerceOfferId: string | null;
  commerceOfferVariantId: string | null;
}

type ConversionDb = Pick<PrismaClient, "commerceOffer">;

function parsePositiveCents(value: string | undefined, fieldName: string): bigint {
  if (!value || !/^[1-9][0-9]*$/.test(value)) {
    throw new Error(`${fieldName} must be a positive integer cents string.`);
  }
  return BigInt(value);
}

function parsePositiveQuantity(
  value: string | undefined,
  fieldName: string,
): Prisma.Decimal {
  if (!value || !/^[0-9]+(\.[0-9]{1,3})?$/.test(value)) {
    throw new Error(`${fieldName} must be a positive decimal string.`);
  }

  const quantity = new Prisma.Decimal(value);
  if (quantity.lessThanOrEqualTo(0)) {
    throw new Error(`${fieldName} must be greater than zero.`);
  }
  return quantity;
}

function decimalCentsToBigInt(value: Prisma.Decimal): bigint {
  if (!value.isInteger()) {
    throw new Error("Converted pledge amount must resolve to whole cents.");
  }
  return BigInt(value.toFixed(0));
}

export async function resolvePledgeConversion(
  input: TaskFundingConversionInput,
  db: ConversionDb = prisma,
): Promise<ResolvedTaskFundingConversion> {
  if (input.unitKind === "USD") {
    const amountCents = parsePositiveCents(input.amountCents, "amountCents");
    return {
      committedAmountCents: amountCents,
      unitKey: "usd",
      unitQuantity: new Prisma.Decimal(amountCents.toString()).div(100),
      unitAmountCentsSnapshot: null,
      conversionVersion: TASK_FUNDING_CONVERSION_VERSION,
      conversionSource: null,
      commerceOfferId: null,
      commerceOfferVariantId: null,
    };
  }

  if (!input.offerKey?.trim()) {
    throw new Error("offerKey is required for commerce-offer pledges.");
  }

  const offer = await db.commerceOffer.findFirst({
    where: {
      key: input.offerKey,
      deletedAt: null,
      status: CommerceOfferStatus.ACTIVE,
    },
    include: {
      variants: {
        where: {
          active: true,
          deletedAt: null,
          ...(input.variantKey ? { variantKey: input.variantKey } : {}),
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!offer) {
    throw new Error(`Commerce offer ${input.offerKey} is not active.`);
  }

  let variant = null;
  if (input.variantKey) {
    variant = offer.variants[0] ?? null;
    if (!variant) {
      throw new Error(
        `Commerce offer ${input.offerKey} variant ${input.variantKey} is not active.`,
      );
    }
  } else {
    if (offer.variants.length > 1) {
      throw new Error(`Commerce offer ${input.offerKey} requires a variant.`);
    }
    variant = offer.variants[0] ?? null;
  }

  const unitAmountCents = variant?.unitAmountCents ?? offer.defaultUnitAmountCents;
  if (unitAmountCents === null || unitAmountCents === undefined) {
    throw new Error(`Commerce offer ${input.offerKey} is missing a current price.`);
  }

  const quantity = parsePositiveQuantity(input.quantity, "quantity");
  const committedAmountCents = decimalCentsToBigInt(
    quantity.mul(unitAmountCents),
  );
  const conversionSource = variant
    ? `commerce-offer:${offer.key}:${variant.variantKey}`
    : `commerce-offer:${offer.key}`;

  return {
    committedAmountCents,
    unitKey: `commerce-offer:${offer.key}`,
    unitQuantity: quantity,
    unitAmountCentsSnapshot: BigInt(unitAmountCents),
    conversionVersion: TASK_FUNDING_CONVERSION_VERSION,
    conversionSource,
    commerceOfferId: offer.id,
    commerceOfferVariantId: variant?.id ?? null,
  };
}

export async function convertPledgeToCommittedCents(
  input: TaskFundingConversionInput,
): Promise<TaskFundingConversionResult> {
  const {
    commerceOfferId: _commerceOfferId,
    commerceOfferVariantId: _commerceOfferVariantId,
    ...result
  } = await resolvePledgeConversion(input);
  return result;
}
