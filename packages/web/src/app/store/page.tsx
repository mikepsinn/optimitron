import Link from "next/link";
import { CommerceOfferKind } from "@optimitron/db";
import { getRouteMetadata } from "@/lib/metadata";
import { ROUTES, storeLink } from "@/lib/routes";
import {
  getActiveStoreOffers,
  type StoreOfferWithVariants,
} from "@/lib/commerce-catalog.server";

export const metadata = getRouteMetadata(storeLink);

function formatDollars(cents: number | null | undefined) {
  if (!cents) return null;
  return `$${Math.round(cents / 100).toLocaleString("en-US")}`;
}

function getOfferPriceLabel(offer: StoreOfferWithVariants) {
  const firstVariant = offer.variants[0];
  const amount = firstVariant?.unitAmountCents ?? offer.defaultUnitAmountCents;
  const minimum = firstVariant?.minUnitAmountCents ?? offer.minUnitAmountCents;
  const formatted = formatDollars(amount ?? minimum);

  if (!formatted) return "Choose amount";
  return offer.allowCustomAmount || firstVariant?.allowCustomAmount
    ? `${formatted}+`
    : formatted;
}

function getOfferKindLabel(kind: CommerceOfferKind) {
  switch (kind) {
    case CommerceOfferKind.PHYSICAL_GOOD:
      return "Thing";
    case CommerceOfferKind.SPONSORSHIP:
      return "Sponsorship";
    case CommerceOfferKind.SUBSCRIPTION:
      return "Subscription";
    case CommerceOfferKind.DIGITAL_ACCESS:
      return "Access";
    case CommerceOfferKind.SERVICE:
      return "Service";
    case CommerceOfferKind.DONATION:
      return "Donation";
  }
}

async function loadOffers() {
  try {
    return {
      offers: await getActiveStoreOffers(),
      ready: true,
    };
  } catch {
    return {
      offers: [],
      ready: false,
    };
  }
}

export default async function StorePage() {
  const { offers, ready } = await loadOffers();

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground [font-family:var(--v0-font-libre-baskerville)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-black uppercase leading-none sm:text-5xl">
            Store
          </h1>
          <p className="mt-4 text-lg font-bold leading-relaxed text-muted-foreground">
            Buy useful campaign things. Shirts turn bodies into billboards.
            Sponsorships turn money into posters, flyers, and votes.
          </p>
        </div>

        {!ready ? (
          <div className="mt-8 border-2 border-foreground bg-background p-5">
            <h2 className="text-lg font-black uppercase">
              Store not ready yet
            </h2>
            <p className="mt-2 text-sm font-bold leading-relaxed text-muted-foreground">
              The shelves are empty for the moment. The shirt artwork still
              works.
            </p>
          </div>
        ) : null}

        {offers.length > 0 ? (
          <div className="mt-8 grid gap-4">
            {offers.map((offer) => (
              <Link
                className="grid gap-4 border-2 border-foreground bg-background p-5 text-foreground transition-colors hover:bg-foreground hover:text-background sm:grid-cols-[1fr_auto] sm:items-center"
                href={`${ROUTES.store}/${offer.key}`}
                key={offer.id}
              >
                <span>
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
                    {getOfferKindLabel(offer.kind)}
                  </span>
                  <span className="mt-2 block text-2xl font-black uppercase leading-tight">
                    {offer.title}
                  </span>
                  {offer.description ? (
                    <span className="mt-2 block max-w-2xl text-sm font-bold leading-relaxed text-muted-foreground">
                      {offer.description}
                    </span>
                  ) : null}
                </span>
                <span className="text-left font-mono text-xl font-black sm:text-right">
                  {getOfferPriceLabel(offer)}
                </span>
              </Link>
            ))}
          </div>
        ) : ready ? (
          <div className="mt-8 border-2 border-foreground bg-background p-5">
            <h2 className="text-lg font-black uppercase">Nothing for sale</h2>
            <p className="mt-2 text-sm font-bold leading-relaxed text-muted-foreground">
              Useful campaign commerce will appear here after the first store
              records are synced.
            </p>
          </div>
        ) : null}
      </div>
    </main>
  );
}
