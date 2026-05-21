import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { CommerceOfferKind } from "@optimitron/db";
import { ShirtOrderForm } from "@/app/shirt/shirt-client";
import { StoreOfferCheckoutForm } from "@/app/store/store-client";
import { authOptions } from "@/lib/auth";
import {
  getStoreOfferByKey,
  type StoreOfferWithVariants,
} from "@/lib/commerce-catalog.server";
import { serverEnv } from "@/lib/env";
import { getHandleOrReferralCode } from "@/lib/referral.client";
import { ROUTES } from "@/lib/routes";

interface StoreOfferPageProps {
  params: Promise<{ offerKey: string }>;
}

function formatDollars(cents: number | null | undefined) {
  if (!cents) return null;
  return `$${Math.round(cents / 100).toLocaleString("en-US")}`;
}

function getDefaultAmountCents(offer: StoreOfferWithVariants) {
  return (
    offer.variants[0]?.unitAmountCents ??
    offer.defaultUnitAmountCents ??
    offer.variants[0]?.minUnitAmountCents ??
    offer.minUnitAmountCents ??
    100
  );
}

function getMinimumAmountCents(offer: StoreOfferWithVariants) {
  return offer.variants[0]?.minUnitAmountCents ?? offer.minUnitAmountCents ?? 100;
}

function getMaximumAmountCents(offer: StoreOfferWithVariants) {
  return offer.variants[0]?.maxUnitAmountCents ?? offer.maxUnitAmountCents;
}

function isShirtOffer(offer: StoreOfferWithVariants) {
  return offer.key === "shirt" || offer.kind === CommerceOfferKind.PHYSICAL_GOOD;
}

async function loadOffer(offerKey: string) {
  try {
    return {
      offer: await getStoreOfferByKey(offerKey),
      ready: true,
    };
  } catch {
    return {
      offer: null,
      ready: false,
    };
  }
}

export default async function StoreOfferPage({ params }: StoreOfferPageProps) {
  const { offerKey } = await params;
  const { offer, ready } = await loadOffer(offerKey);
  const session = await getServerSession(authOptions);
  const referralHandle = getHandleOrReferralCode(session?.user) ?? "warondisease";
  const shirtCommerceEnabled =
    serverEnv.SHIRT_COMMERCE_ENABLED === "1" ||
    serverEnv.SHIRT_COMMERCE_ENABLED === "true";

  if (ready && !offer) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground [font-family:var(--v0-font-libre-baskerville)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          className="text-sm font-black uppercase underline underline-offset-4"
          href={ROUTES.store}
        >
          Back to store
        </Link>

        {!ready ? (
          <div className="mt-8 border-2 border-foreground bg-background p-5">
            <h1 className="text-3xl font-black uppercase leading-tight">
              Store not ready yet
            </h1>
            <p className="mt-3 text-sm font-bold leading-relaxed text-muted-foreground">
              The shelves are empty for the moment.
            </p>
          </div>
        ) : null}

        {offer ? (
          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)] lg:items-start">
            <section>
              <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
                {offer.kind.replace(/_/g, " ").toLowerCase()}
              </p>
              <h1 className="text-4xl font-black uppercase leading-none sm:text-5xl">
                {offer.title}
              </h1>
              {offer.description ? (
                <p className="mt-4 max-w-2xl text-lg font-bold leading-relaxed text-muted-foreground">
                  {offer.description}
                </p>
              ) : null}

              {offer.variants.length > 0 ? (
                <div className="mt-8 border-t-2 border-foreground pt-5">
                  <h2 className="text-lg font-black uppercase">Options</h2>
                  <div className="mt-4 grid gap-3">
                    {offer.variants.map((variant) => (
                      <div
                        className="grid gap-2 border-2 border-foreground p-4 sm:grid-cols-[1fr_auto]"
                        key={variant.id}
                      >
                        <span>
                          <span className="block font-black uppercase">
                            {variant.label}
                          </span>
                          {variant.fulfillmentMetadata &&
                          typeof variant.fulfillmentMetadata === "object" &&
                          "description" in variant.fulfillmentMetadata &&
                          typeof variant.fulfillmentMetadata.description === "string" ? (
                            <span className="mt-1 block text-sm font-bold leading-relaxed text-muted-foreground">
                              {variant.fulfillmentMetadata.description}
                            </span>
                          ) : null}
                        </span>
                        <span className="font-mono text-lg font-black">
                          {formatDollars(variant.unitAmountCents) ??
                            "Choose amount"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>

            <aside className="lg:sticky lg:top-6">
              {isShirtOffer(offer) ? (
                <div className="grid gap-4">
                  {shirtCommerceEnabled ? (
                    <ShirtOrderForm handle={referralHandle} />
                  ) : (
                    <div className="border-2 border-foreground bg-background p-5">
                      <h2 className="text-lg font-black uppercase">
                        Shirt checkout is closed
                      </h2>
                      <p className="mt-2 text-sm font-bold leading-relaxed text-muted-foreground">
                        You can still download the artwork and use another
                        printer.
                      </p>
                    </div>
                  )}
                  <Link
                    className="inline-flex items-center justify-center border-2 border-foreground bg-background px-4 py-3 text-sm font-black uppercase text-foreground transition-colors hover:bg-foreground hover:text-background"
                    href={ROUTES.shirt}
                  >
                    Open shirt artwork
                  </Link>
                </div>
              ) : (
                <StoreOfferCheckoutForm
                  defaultAmountCents={getDefaultAmountCents(offer)}
                  maxAmountCents={getMaximumAmountCents(offer)}
                  minAmountCents={getMinimumAmountCents(offer)}
                  offerKey={offer.key}
                  variants={offer.variants.map((variant) => ({
                    key: variant.variantKey,
                    label: variant.label,
                    unitAmountCents: variant.unitAmountCents,
                  }))}
                />
              )}
            </aside>
          </div>
        ) : null}
      </div>
    </main>
  );
}
