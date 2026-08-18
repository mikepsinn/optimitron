import {
  CommerceFulfillmentProvider,
  CommerceOfferStatus,
  type Prisma,
} from "@optimitron/db";
import { prisma } from "@/lib/prisma";
import type { ShirtColor, ShirtSize } from "@/lib/shirt-commerce.server";

const SHIRT_OFFER_KEY = "shirt";

const shirtVariantInclude = {
  offer: true,
  mappings: {
    where: {
      active: true,
      deletedAt: null,
      provider: CommerceFulfillmentProvider.CUSTOMCAT,
    },
    take: 1,
  },
} satisfies Prisma.CommerceOfferVariantInclude;

type ShirtCatalogVariant = Prisma.CommerceOfferVariantGetPayload<{
  include: typeof shirtVariantInclude;
}>;

const storeOfferInclude = {
  variants: {
    where: {
      active: true,
      deletedAt: null,
    },
    orderBy: {
      sortOrder: "asc",
    },
  },
} satisfies Prisma.CommerceOfferInclude;

export type StoreOfferWithVariants = Prisma.CommerceOfferGetPayload<{
  include: typeof storeOfferInclude;
}>;

export interface EnabledStoreOfferForCheckout {
  offer: StoreOfferWithVariants;
  variant: StoreOfferWithVariants["variants"][number] | null;
}

export interface EnabledShirtVariantForCheckout {
  catalogSku: string;
  offer: ShirtCatalogVariant["offer"];
  variant: ShirtCatalogVariant;
  mapping: ShirtCatalogVariant["mappings"][number];
}

export function buildShirtVariantCatalogKey(input: {
  color: ShirtColor;
  size: ShirtSize;
}) {
  return `${SHIRT_OFFER_KEY}:${input.color}:${input.size}`;
}

export async function getEnabledShirtVariantForCheckout(input: {
  color: ShirtColor;
  size: ShirtSize;
}): Promise<EnabledShirtVariantForCheckout> {
  const variant = await prisma.commerceOfferVariant.findUnique({
    include: shirtVariantInclude,
    where: {
      key: buildShirtVariantCatalogKey(input),
    },
  });

  if (
    !variant ||
    !variant.active ||
    variant.deletedAt ||
    variant.offer.deletedAt ||
    variant.offer.status !== CommerceOfferStatus.ACTIVE
  ) {
    throw new Error(`Shirt variant ${input.color} ${input.size} is not active.`);
  }

  const mapping = variant.mappings[0];
  if (!mapping?.providerCatalogSku) {
    throw new Error(`Missing CustomCat catalog SKU for shirt:${input.color}:${input.size}.`);
  }

  return {
    catalogSku: mapping.providerCatalogSku,
    mapping,
    offer: variant.offer,
    variant,
  };
}

function activeOfferWhere() {
  return {
    deletedAt: null,
    status: CommerceOfferStatus.ACTIVE,
  } satisfies Prisma.CommerceOfferWhereInput;
}

export async function getActiveStoreOffers(): Promise<StoreOfferWithVariants[]> {
  return prisma.commerceOffer.findMany({
    include: storeOfferInclude,
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    where: activeOfferWhere(),
  });
}

export async function getStoreOfferByKey(
  offerKey: string,
): Promise<StoreOfferWithVariants | null> {
  return prisma.commerceOffer.findFirst({
    include: storeOfferInclude,
    where: {
      ...activeOfferWhere(),
      key: offerKey,
    },
  });
}

export async function getEnabledStoreOfferForCheckout(input: {
  offerKey: string;
  variantKey?: string;
}): Promise<EnabledStoreOfferForCheckout> {
  const offer = await getStoreOfferByKey(input.offerKey);
  if (!offer) {
    throw new Error(`Store offer ${input.offerKey} is not active.`);
  }

  if (!input.variantKey) {
    if (offer.variants.length > 1) {
      throw new Error(`Store offer ${input.offerKey} requires a variant.`);
    }

    return {
      offer,
      variant: offer.variants[0] ?? null,
    };
  }

  const variant = offer.variants.find(
    (candidate) => candidate.variantKey === input.variantKey,
  );

  if (!variant) {
    throw new Error(
      `Store offer ${input.offerKey} variant ${input.variantKey} is not active.`,
    );
  }

  return { offer, variant };
}
