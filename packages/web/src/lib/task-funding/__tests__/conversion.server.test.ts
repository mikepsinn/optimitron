import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  CommerceOfferKind,
  CommerceOfferStatus,
  Prisma,
} from "@optimitron/db";
import { prisma } from "@/lib/prisma";
import {
  convertPledgeToCommittedCents,
  TASK_FUNDING_CONVERSION_VERSION,
} from "../conversion.server";

const TEST_PREFIX = "tf_conversion_";

async function cleanup() {
  await prisma.commerceOfferVariant.deleteMany({
    where: { id: { startsWith: TEST_PREFIX } },
  });
  await prisma.commerceOffer.deleteMany({
    where: { id: { startsWith: TEST_PREFIX } },
  });
}

async function createOffer(input: {
  defaultUnitAmountCents?: number | null;
  key: string;
  status?: CommerceOfferStatus;
  variantUnitAmountCents?: number | null;
}) {
  const offer = await prisma.commerceOffer.create({
    data: {
      id: `${TEST_PREFIX}offer_${input.key}`,
      key: `${TEST_PREFIX}${input.key}`,
      kind: CommerceOfferKind.PHYSICAL_GOOD,
      status: input.status ?? CommerceOfferStatus.ACTIVE,
      title: `Test ${input.key}`,
      defaultUnitAmountCents: input.defaultUnitAmountCents ?? null,
    },
  });

  const variant = await prisma.commerceOfferVariant.create({
    data: {
      id: `${TEST_PREFIX}variant_${input.key}`,
      offerId: offer.id,
      key: `${offer.key}:black-m`,
      variantKey: "black-m",
      label: "Black / M",
      unitAmountCents: input.variantUnitAmountCents ?? null,
      active: true,
    },
  });

  return { offer, variant };
}

beforeEach(cleanup);
afterAll(cleanup);

describe("convertPledgeToCommittedCents", () => {
  it("converts USD pledges without changing cents", async () => {
    const result = await convertPledgeToCommittedCents({
      unitKind: "USD",
      amountCents: "2500",
    });

    expect(result.committedAmountCents).toBe(2500n);
    expect(result.unitKey).toBe("usd");
    expect(result.unitQuantity).toBeInstanceOf(Prisma.Decimal);
    expect(result.unitQuantity.toString()).toBe("25");
    expect(result.unitAmountCentsSnapshot).toBeNull();
    expect(result.conversionVersion).toBe(TASK_FUNDING_CONVERSION_VERSION);
    expect(result.conversionSource).toBeNull();
  });

  it("snapshots the active shirt-offer variant price", async () => {
    const { offer } = await createOffer({
      key: "shirt",
      variantUnitAmountCents: 2500,
    });

    const result = await convertPledgeToCommittedCents({
      unitKind: "COMMERCE_OFFER",
      offerKey: offer.key,
      variantKey: "black-m",
      quantity: "3",
    });

    expect(result.committedAmountCents).toBe(7500n);
    expect(result.unitKey).toBe(`commerce-offer:${offer.key}`);
    expect(result.unitQuantity.toString()).toBe("3");
    expect(result.unitAmountCentsSnapshot).toBe(2500n);
    expect(result.conversionVersion).toBe(TASK_FUNDING_CONVERSION_VERSION);
    expect(result.conversionSource).toBe(
      `commerce-offer:${offer.key}:black-m`,
    );
  });

  it("rejects inactive commerce offers", async () => {
    const { offer } = await createOffer({
      key: "retired-shirt",
      status: CommerceOfferStatus.RETIRED,
      variantUnitAmountCents: 2500,
    });

    await expect(
      convertPledgeToCommittedCents({
        unitKind: "COMMERCE_OFFER",
        offerKey: offer.key,
        variantKey: "black-m",
        quantity: "1",
      }),
    ).rejects.toThrow(/not active/i);
  });

  it("rejects commerce offers without a current price", async () => {
    const { offer } = await createOffer({
      key: "unpriced-shirt",
      variantUnitAmountCents: null,
    });

    await expect(
      convertPledgeToCommittedCents({
        unitKind: "COMMERCE_OFFER",
        offerKey: offer.key,
        variantKey: "black-m",
        quantity: "1",
      }),
    ).rejects.toThrow(/missing.*price/i);
  });
});
