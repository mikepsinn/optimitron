"use client";

import { useMemo, useState } from "react";
import { Check, ShoppingCart } from "lucide-react";

interface StoreVariantOption {
  key: string;
  label: string;
  unitAmountCents: number | null;
}
type CheckoutState = "idle" | "loading" | "opened";

function formatDollars(cents: number) {
  return `$${Math.round(cents / 100).toLocaleString("en-US")}`;
}

export function StoreOfferCheckoutForm({
  defaultAmountCents,
  maxAmountCents,
  minAmountCents,
  offerKey,
  variants,
}: {
  defaultAmountCents: number;
  maxAmountCents: number | null;
  minAmountCents: number;
  offerKey: string;
  variants: StoreVariantOption[];
}) {
  const [selectedVariantKey, setSelectedVariantKey] = useState(
    variants[0]?.key ?? "",
  );
  const selectedVariant = useMemo(
    () => variants.find((variant) => variant.key === selectedVariantKey),
    [selectedVariantKey, variants],
  );
  const [amount, setAmount] = useState(
    String((selectedVariant?.unitAmountCents ?? defaultAmountCents) / 100),
  );
  const [state, setState] = useState<CheckoutState>("idle");
  const [error, setError] = useState<string | null>(null);

  function updateVariant(nextVariantKey: string) {
    setSelectedVariantKey(nextVariantKey);
    const nextVariant = variants.find((variant) => variant.key === nextVariantKey);
    if (nextVariant?.unitAmountCents) {
      setAmount(String(nextVariant.unitAmountCents / 100));
    }
  }

  async function handleCheckout() {
    setError(null);
    setState("loading");

    try {
      const response = await fetch("/api/stripe/create-checkout", {
        body: JSON.stringify({
          custom_amount: Number.parseFloat(amount),
          offer_key: offerKey,
          order_type: "store_offer",
          sourceReferrer: document.referrer,
          sourceUrl: window.location.href,
          variant_key: selectedVariantKey || undefined,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = (await response.json()) as { error?: string; url?: string };

      if (!response.ok || !result.url) {
        throw new Error(result.error ?? "Could not start checkout.");
      }

      setState("opened");
      window.location.href = result.url;
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "Could not start checkout.",
      );
      setState("idle");
    }
  }

  return (
    <div className="border-2 border-foreground bg-background p-5">
      <h2 className="text-lg font-black uppercase leading-tight">Checkout</h2>
      <div className="mt-4 grid gap-4">
        {variants.length > 0 ? (
          <label className="grid gap-2 text-sm font-black uppercase">
            Item
            <select
              className="w-full border-2 border-foreground bg-background px-3 py-2 text-base font-black text-foreground"
              value={selectedVariantKey}
              onChange={(event) => updateVariant(event.target.value)}
            >
              {variants.map((variant) => (
                <option key={variant.key} value={variant.key}>
                  {variant.label}
                  {variant.unitAmountCents
                    ? ` - ${formatDollars(variant.unitAmountCents)}`
                    : ""}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="grid gap-2 text-sm font-black uppercase">
          Contribution
          <input
            className="w-full border-2 border-foreground bg-background px-3 py-2 text-base font-black text-foreground"
            max={maxAmountCents ? maxAmountCents / 100 : undefined}
            min={minAmountCents / 100}
            step="1"
            type="number"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </label>
      </div>
      {error ? (
        <p className="mt-3 text-sm font-black uppercase text-foreground">
          {error}
        </p>
      ) : null}
      <button
        className="mt-4 inline-flex w-full items-center justify-center gap-2 border-2 border-foreground bg-foreground px-4 py-3 text-sm font-black uppercase text-background transition-colors hover:bg-background hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
        disabled={state === "loading"}
        type="button"
        onClick={() => {
          void handleCheckout();
        }}
      >
        {state === "opened" ? (
          <Check className="h-4 w-4" aria-hidden="true" />
        ) : (
          <ShoppingCart className="h-4 w-4" aria-hidden="true" />
        )}
        {state === "loading" ? "Opening checkout" : "Checkout"}
      </button>
    </div>
  );
}
