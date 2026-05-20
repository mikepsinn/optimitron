import {
  CommerceFulfillmentKind,
  CommerceFulfillmentProvider,
  CommerceOfferKind,
  CommerceOfferStatus,
  type Prisma,
  type PrismaClient,
} from "../generated/prisma/client.js";

export const WAR_ON_DISEASE_SHIRT_OFFER_KEY = "shirt";
export const WAR_ON_DISEASE_SHIRT_OFFER_ID = "commerce-offer-war-on-disease-shirt";
export const WAR_ON_DISEASE_FLYER_SPONSORSHIP_OFFER_KEY = "flyer-run-sponsorship";
export const WAR_ON_DISEASE_FLYER_SPONSORSHIP_OFFER_ID =
  "commerce-offer-war-on-disease-flyer-run-sponsorship";

const SHIRT_PRODUCT_ID = "952";
const SHIRT_TAX_CODE = "txcd_99999999";
const SHIRT_FMV_CENTS = 1500;
const DONATION_TAX_CODE = "txcd_00000000";

type ManagedShirtVariant = {
  color: "black" | "white";
  size: "S" | "M" | "L" | "XL" | "XXL";
  catalogSku: string;
  fullSku: string;
};

type ManagedSponsorshipVariant = {
  key: string;
  label: string;
  unitAmountCents: number;
  description: string;
};

// CustomCat product 952 = Bella+Canvas 3001C. The catalog_sku values are the
// final segment of public CustomCat-generated Shopify SKUs seen for 3001C.
// Source examples: CustomCat product page + indexed 3:16 Threads 3001C SKUs.
export const WAR_ON_DISEASE_SHIRT_VARIANTS: ManagedShirtVariant[] = [
  {
    color: "black",
    size: "S",
    catalogSku: "45475",
    fullSku: "952-9390-96695910-45475",
  },
  {
    color: "black",
    size: "M",
    catalogSku: "45476",
    fullSku: "952-9390-96695910-45476",
  },
  {
    color: "black",
    size: "L",
    catalogSku: "45478",
    fullSku: "952-9390-96695910-45478",
  },
  {
    color: "black",
    size: "XL",
    catalogSku: "45479",
    fullSku: "952-9390-96695910-45479",
  },
  {
    color: "black",
    size: "XXL",
    catalogSku: "45480",
    fullSku: "952-9390-96695910-45480",
  },
  {
    color: "white",
    size: "S",
    catalogSku: "45604",
    fullSku: "952-9405-96695909-45604",
  },
  {
    color: "white",
    size: "M",
    catalogSku: "45605",
    fullSku: "952-9405-96695909-45605",
  },
  {
    color: "white",
    size: "L",
    catalogSku: "45606",
    fullSku: "952-9405-96695909-45606",
  },
  {
    color: "white",
    size: "XL",
    catalogSku: "45607",
    fullSku: "952-9405-96695909-45607",
  },
  {
    color: "white",
    size: "XXL",
    catalogSku: "45608",
    fullSku: "952-9405-96695909-45608",
  },
];

export const WAR_ON_DISEASE_FLYER_SPONSORSHIP_VARIANTS: ManagedSponsorshipVariant[] = [
  {
    key: "flyers",
    label: "Flyers",
    unitAmountCents: 10000,
    description: "Fund one small batch of QR flyers for local campaign outreach.",
  },
  {
    key: "posters",
    label: "Posters",
    unitAmountCents: 25000,
    description: "Fund a larger print run of campaign posters and QR handouts.",
  },
  {
    key: "singles-meetup",
    label: "Singles meetup",
    unitAmountCents: 50000,
    description: "Help a local group turn an awkward social event into votes.",
  },
];

export interface SyncManagedCommerceCatalogOptions {
  apply: boolean;
}

export interface SyncManagedCommerceCatalogResult {
  dryRun: boolean;
  offers: number;
  variants: number;
  fulfillmentMappings: number;
}

function shirtVariantId(variant: ManagedShirtVariant) {
  return `commerce-variant-shirt-${variant.color}-${variant.size.toLowerCase()}`;
}

function shirtMappingId(variant: ManagedShirtVariant) {
  return `commerce-fulfillment-customcat-shirt-${variant.color}-${variant.size.toLowerCase()}`;
}

function shirtVariantKey(variant: ManagedShirtVariant) {
  return `${variant.color}:${variant.size}`;
}

function shirtGlobalVariantKey(variant: ManagedShirtVariant) {
  return `${WAR_ON_DISEASE_SHIRT_OFFER_KEY}:${shirtVariantKey(variant)}`;
}

function shirtVariantLabel(variant: ManagedShirtVariant) {
  return `${variant.color === "black" ? "Black" : "White"} / ${variant.size}`;
}

function flyerSponsorshipVariantId(variant: ManagedSponsorshipVariant) {
  return `commerce-variant-flyer-run-sponsorship-${variant.key}`;
}

function flyerSponsorshipGlobalVariantKey(variant: ManagedSponsorshipVariant) {
  return `${WAR_ON_DISEASE_FLYER_SPONSORSHIP_OFFER_KEY}:${variant.key}`;
}

export async function syncManagedCommerceCatalog(
  prisma: PrismaClient,
  options: SyncManagedCommerceCatalogOptions,
): Promise<SyncManagedCommerceCatalogResult> {
  const result = {
    dryRun: !options.apply,
    offers: 2,
    variants:
      WAR_ON_DISEASE_SHIRT_VARIANTS.length +
      WAR_ON_DISEASE_FLYER_SPONSORSHIP_VARIANTS.length,
    fulfillmentMappings: WAR_ON_DISEASE_SHIRT_VARIANTS.length,
  };

  if (!options.apply) return result;

  await prisma.commerceOffer.upsert({
    where: { key: WAR_ON_DISEASE_SHIRT_OFFER_KEY },
    update: {
      allowCustomAmount: true,
      currency: "usd",
      defaultFmvCents: SHIRT_FMV_CENTS,
      defaultUnitAmountCents: 3500,
      description:
        "Personalized War on Disease shirt with campaign copy and a referral QR code.",
      fulfillmentKind: CommerceFulfillmentKind.PHYSICAL_GOOD,
      isTaxDeductible: true,
      kind: CommerceOfferKind.PHYSICAL_GOOD,
      managed: true,
      maxUnitAmountCents: null,
      metadata: {
        campaign: "war-on-disease",
        productModel: "Bella+Canvas 3001C",
      } satisfies Prisma.InputJsonValue,
      minUnitAmountCents: 2500,
      sortOrder: 10,
      status: CommerceOfferStatus.ACTIVE,
      taxCode: SHIRT_TAX_CODE,
      title: "War on Disease shirt",
    },
    create: {
      id: WAR_ON_DISEASE_SHIRT_OFFER_ID,
      key: WAR_ON_DISEASE_SHIRT_OFFER_KEY,
      allowCustomAmount: true,
      currency: "usd",
      defaultFmvCents: SHIRT_FMV_CENTS,
      defaultUnitAmountCents: 3500,
      description:
        "Personalized War on Disease shirt with campaign copy and a referral QR code.",
      fulfillmentKind: CommerceFulfillmentKind.PHYSICAL_GOOD,
      isTaxDeductible: true,
      kind: CommerceOfferKind.PHYSICAL_GOOD,
      managed: true,
      metadata: {
        campaign: "war-on-disease",
        productModel: "Bella+Canvas 3001C",
      } satisfies Prisma.InputJsonValue,
      minUnitAmountCents: 2500,
      sortOrder: 10,
      status: CommerceOfferStatus.ACTIVE,
      taxCode: SHIRT_TAX_CODE,
      title: "War on Disease shirt",
    },
  });

  await prisma.commerceOffer.upsert({
    where: { key: WAR_ON_DISEASE_FLYER_SPONSORSHIP_OFFER_KEY },
    update: {
      allowCustomAmount: true,
      currency: "usd",
      defaultFmvCents: 0,
      defaultUnitAmountCents: 10000,
      description:
        "Pay for posters, flyers, and local outreach that asks humans to vote.",
      fulfillmentKind: CommerceFulfillmentKind.MANUAL_SPONSORSHIP,
      isTaxDeductible: true,
      kind: CommerceOfferKind.SPONSORSHIP,
      managed: true,
      maxUnitAmountCents: null,
      metadata: {
        campaign: "war-on-disease",
        purpose: "distribution",
      } satisfies Prisma.InputJsonValue,
      minUnitAmountCents: 2500,
      sortOrder: 20,
      status: CommerceOfferStatus.ACTIVE,
      taxCode: DONATION_TAX_CODE,
      title: "Sponsor a flyer run",
    },
    create: {
      id: WAR_ON_DISEASE_FLYER_SPONSORSHIP_OFFER_ID,
      key: WAR_ON_DISEASE_FLYER_SPONSORSHIP_OFFER_KEY,
      allowCustomAmount: true,
      currency: "usd",
      defaultFmvCents: 0,
      defaultUnitAmountCents: 10000,
      description:
        "Pay for posters, flyers, and local outreach that asks humans to vote.",
      fulfillmentKind: CommerceFulfillmentKind.MANUAL_SPONSORSHIP,
      isTaxDeductible: true,
      kind: CommerceOfferKind.SPONSORSHIP,
      managed: true,
      metadata: {
        campaign: "war-on-disease",
        purpose: "distribution",
      } satisfies Prisma.InputJsonValue,
      minUnitAmountCents: 2500,
      sortOrder: 20,
      status: CommerceOfferStatus.ACTIVE,
      taxCode: DONATION_TAX_CODE,
      title: "Sponsor a flyer run",
    },
  });

  for (const variant of WAR_ON_DISEASE_SHIRT_VARIANTS) {
    const variantId = shirtVariantId(variant);
    await prisma.commerceOfferVariant.upsert({
      where: { key: shirtGlobalVariantKey(variant) },
      update: {
        active: true,
        allowCustomAmount: true,
        attributes: {
          color: variant.color,
          size: variant.size,
        } satisfies Prisma.InputJsonValue,
        currency: "usd",
        fulfillmentKind: CommerceFulfillmentKind.PHYSICAL_GOOD,
        fulfillmentMetadata: {
          printPlacements: ["front", "back"],
          requiresPersonalizedQr: true,
        } satisfies Prisma.InputJsonValue,
        fmvCents: SHIRT_FMV_CENTS,
        label: shirtVariantLabel(variant),
        maxUnitAmountCents: null,
        minUnitAmountCents: 2500,
        sortOrder: WAR_ON_DISEASE_SHIRT_VARIANTS.indexOf(variant),
        taxCode: SHIRT_TAX_CODE,
        unitAmountCents: 3500,
        variantKey: shirtVariantKey(variant),
      },
      create: {
        id: variantId,
        offerId: WAR_ON_DISEASE_SHIRT_OFFER_ID,
        key: shirtGlobalVariantKey(variant),
        active: true,
        allowCustomAmount: true,
        attributes: {
          color: variant.color,
          size: variant.size,
        } satisfies Prisma.InputJsonValue,
        currency: "usd",
        fulfillmentKind: CommerceFulfillmentKind.PHYSICAL_GOOD,
        fulfillmentMetadata: {
          printPlacements: ["front", "back"],
          requiresPersonalizedQr: true,
        } satisfies Prisma.InputJsonValue,
        fmvCents: SHIRT_FMV_CENTS,
        label: shirtVariantLabel(variant),
        minUnitAmountCents: 2500,
        sortOrder: WAR_ON_DISEASE_SHIRT_VARIANTS.indexOf(variant),
        taxCode: SHIRT_TAX_CODE,
        unitAmountCents: 3500,
        variantKey: shirtVariantKey(variant),
      },
    });

    await prisma.commerceFulfillmentMapping.upsert({
      where: {
        offerVariantId_provider: {
          offerVariantId: variantId,
          provider: CommerceFulfillmentProvider.CUSTOMCAT,
        },
      },
      update: {
        active: true,
        providerCatalogSku: variant.catalogSku,
        providerMetadata: {
          fullSku: variant.fullSku,
          source: "CustomCat 3001C public generated SKU",
        } satisfies Prisma.InputJsonValue,
        providerProductId: SHIRT_PRODUCT_ID,
        providerVariantId: variant.fullSku,
      },
      create: {
        id: shirtMappingId(variant),
        offerVariantId: variantId,
        provider: CommerceFulfillmentProvider.CUSTOMCAT,
        active: true,
        providerCatalogSku: variant.catalogSku,
        providerMetadata: {
          fullSku: variant.fullSku,
          source: "CustomCat 3001C public generated SKU",
        } satisfies Prisma.InputJsonValue,
        providerProductId: SHIRT_PRODUCT_ID,
        providerVariantId: variant.fullSku,
      },
    });
  }

  for (const variant of WAR_ON_DISEASE_FLYER_SPONSORSHIP_VARIANTS) {
    await prisma.commerceOfferVariant.upsert({
      where: { key: flyerSponsorshipGlobalVariantKey(variant) },
      update: {
        active: true,
        allowCustomAmount: true,
        attributes: {
          sponsorshipType: variant.key,
        } satisfies Prisma.InputJsonValue,
        currency: "usd",
        fulfillmentKind: CommerceFulfillmentKind.MANUAL_SPONSORSHIP,
        fulfillmentMetadata: {
          description: variant.description,
        } satisfies Prisma.InputJsonValue,
        fmvCents: 0,
        label: variant.label,
        maxUnitAmountCents: null,
        minUnitAmountCents: 2500,
        sortOrder: WAR_ON_DISEASE_FLYER_SPONSORSHIP_VARIANTS.indexOf(variant),
        taxCode: DONATION_TAX_CODE,
        unitAmountCents: variant.unitAmountCents,
        variantKey: variant.key,
      },
      create: {
        id: flyerSponsorshipVariantId(variant),
        offerId: WAR_ON_DISEASE_FLYER_SPONSORSHIP_OFFER_ID,
        key: flyerSponsorshipGlobalVariantKey(variant),
        active: true,
        allowCustomAmount: true,
        attributes: {
          sponsorshipType: variant.key,
        } satisfies Prisma.InputJsonValue,
        currency: "usd",
        fulfillmentKind: CommerceFulfillmentKind.MANUAL_SPONSORSHIP,
        fulfillmentMetadata: {
          description: variant.description,
        } satisfies Prisma.InputJsonValue,
        fmvCents: 0,
        label: variant.label,
        minUnitAmountCents: 2500,
        sortOrder: WAR_ON_DISEASE_FLYER_SPONSORSHIP_VARIANTS.indexOf(variant),
        taxCode: DONATION_TAX_CODE,
        unitAmountCents: variant.unitAmountCents,
        variantKey: variant.key,
      },
    });
  }

  return result;
}

export function formatManagedCommerceCatalogResult(
  result: SyncManagedCommerceCatalogResult,
) {
  const prefix = result.dryRun ? "would sync" : "synced";
  return `Commerce catalog: ${prefix} ${result.offers} offer, ${result.variants} variants, ${result.fulfillmentMappings} fulfillment mappings`;
}
