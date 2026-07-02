"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";

export interface TaskFundingCheckoutFormProps {
  defaultAmountCents?: number;
  taskId: string;
}

function formatDollars(cents: number) {
  return Math.max(1, Math.round(cents / 100)).toString();
}

function parseDollarInput(value: string) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return Math.round(numeric * 100);
}

export function TaskFundingCheckoutForm({
  defaultAmountCents = 2500,
  taskId,
}: TaskFundingCheckoutFormProps) {
  const [amount, setAmount] = useState(formatDollars(defaultAmountCents));
  const [donorEmail, setDonorEmail] = useState("");
  const [donorName, setDonorName] = useState("");
  const [publicDisplay, setPublicDisplay] = useState(false);
  const [publicName, setPublicName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const amountCents = useMemo(() => parseDollarInput(amount), [amount]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (amountCents == null || amountCents < 100) {
      setError("Enter at least $1.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/tasks/${encodeURIComponent(taskId)}/fund/checkout`, {
        body: JSON.stringify({
          amountCents,
          donorEmail: donorEmail.trim() || null,
          donorName: donorName.trim() || null,
          publicDisplay,
          publicName: publicName.trim() || donorName.trim() || null,
          sourceReferrer: document.referrer || null,
          sourceUrl: window.location.href,
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string; url?: string }
        | null;

      if (!response.ok || !payload?.url) {
        throw new Error(payload?.error ?? "Checkout failed.");
      }

      window.location.assign(payload.url);
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "Checkout failed.",
      );
      setSubmitting(false);
    }
  }

  return (
    <form
      className="space-y-4 border border-foreground bg-background p-4 text-foreground"
      onSubmit={handleSubmit}
    >
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <label className="space-y-1 text-sm font-bold">
          <span className="block text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
            Amount
          </span>
          <span className="flex min-h-10 items-center border border-foreground bg-background">
            <span className="px-3 font-black">$</span>
            <input
              className="min-h-10 w-full bg-transparent px-2 font-black outline-none"
              inputMode="decimal"
              min="1"
              onChange={(event) => setAmount(event.target.value)}
              step="1"
              type="number"
              value={amount}
            />
          </span>
        </label>

        <label className="space-y-1 text-sm font-bold">
          <span className="block text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
            Email
          </span>
          <input
            className="min-h-10 w-full border border-foreground bg-background px-3 font-bold outline-none"
            onChange={(event) => setDonorEmail(event.target.value)}
            placeholder="receipt@example.org"
            type="email"
            value={donorEmail}
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <label className="space-y-1 text-sm font-bold">
          <span className="block text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
            Name
          </span>
          <input
            className="min-h-10 w-full border border-foreground bg-background px-3 font-bold outline-none"
            onChange={(event) => setDonorName(event.target.value)}
            placeholder="Optional"
            type="text"
            value={donorName}
          />
        </label>

        <label className="flex min-h-10 items-center gap-3 self-end border border-foreground px-3 text-sm font-black">
          <input
            checked={publicDisplay}
            className="size-4 accent-foreground"
            onChange={(event) => setPublicDisplay(event.target.checked)}
            type="checkbox"
          />
          Show my name publicly
        </label>
      </div>

      {publicDisplay ? (
        <label className="space-y-1 text-sm font-bold">
          <span className="block text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
            Public name
          </span>
          <input
            className="min-h-10 w-full border border-foreground bg-background px-3 font-bold outline-none"
            onChange={(event) => setPublicName(event.target.value)}
            placeholder={donorName || "How your support should appear"}
            type="text"
            value={publicName}
          />
        </label>
      ) : null}

      {error ? <p className="text-sm font-bold text-destructive">{error}</p> : null}

      <button
        className="inline-flex min-h-10 w-full items-center justify-center border border-foreground bg-foreground px-4 py-2 text-sm font-black uppercase text-background hover:bg-background hover:text-foreground disabled:opacity-60 sm:w-auto"
        disabled={submitting}
        type="submit"
      >
        {submitting ? "Opening Checkout..." : "Fund this task"}
      </button>
    </form>
  );
}
