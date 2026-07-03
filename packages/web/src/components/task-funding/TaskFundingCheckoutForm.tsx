"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  formatCompactCount,
  formatCompactCurrency,
} from "@/lib/tasks/accountability";

export interface TaskFundingCheckoutFormProps {
  /** From task.impact.costPerDalyUsd (selected frame). Null = no frame. */
  costPerDalyUsd?: number | null;
  defaultAmountCents?: number;
  /** From task.impact.expectedValuePerDollar (selected frame). */
  expectedValuePerDollar?: number | null;
  signedIn: boolean;
  signInHref: string;
  taskId: string;
}

type SubmitAction = "pledge" | "checkout";

const PRESET_AMOUNTS_CENTS = [1_000, 2_500, 10_000, 25_000];

// Same suffering-hours conversion the /donate calculator uses:
// 1 DALY = 1 year of suffering and disability = 8,760 hours.
const HOURS_PER_YEAR = 24 * 365;

/**
 * One short impact line per preset, from the task's selected impact frame.
 * DALY math wins (matches /donate's suffering-hours framing); economic
 * expected value is the fallback. No frame, no line — never invent numbers.
 */
function getPresetImpactLine(
  presetCents: number,
  costPerDalyUsd: number | null | undefined,
  expectedValuePerDollar: number | null | undefined,
): string | null {
  const usd = presetCents / 100;
  if (
    costPerDalyUsd != null &&
    Number.isFinite(costPerDalyUsd) &&
    costPerDalyUsd > 0
  ) {
    const sufferingHours = (usd / costPerDalyUsd) * HOURS_PER_YEAR;
    return `prevents ${formatCompactCount(sufferingHours)} hours of suffering`;
  }
  if (
    expectedValuePerDollar != null &&
    Number.isFinite(expectedValuePerDollar) &&
    expectedValuePerDollar > 0
  ) {
    return `returns ${formatCompactCurrency(usd * expectedValuePerDollar)} in expected value`;
  }
  return null;
}

const FAQ_ITEMS = [
  {
    answer:
      "Pledge: only when this task is fully funded — could be next week, could be next year. Pay now: today.",
    question: "When am I charged?",
  },
  {
    answer:
      "Charged money comes back to your card automatically. Uncharged pledges simply never charge.",
    question: "What if the task dies?",
  },
  {
    answer:
      "A verified worker, and only after the work is verified. Until then it sits held for this task.",
    question: "Who gets the money?",
  },
] as const;

/**
 * Outcome notices for the query params that land on #funding: the Stripe
 * setup-session return URL (`pledged=1`) and the email cancel link's
 * redirects (`pledge_cancelled=1`, `pledge_cancel_unavailable=1`). Read once
 * after hydration; each renders as one plain line above the form.
 */
function getPledgeOutcomeNotice(search: string): string | null {
  const params = new URLSearchParams(search);
  if (params.get("pledge_cancelled") === "1") {
    return "Pledge cancelled. Your card will not be charged.";
  }
  if (params.get("pledge_cancel_unavailable") === "1") {
    return "Too late to cancel — charging already started.";
  }
  if (params.get("pledged") === "1") {
    return "Card saved. You will get an email when this task fully funds, and only then are you charged.";
  }
  return null;
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
  costPerDalyUsd = null,
  defaultAmountCents = 2500,
  expectedValuePerDollar = null,
  signedIn,
  signInHref,
  taskId,
}: TaskFundingCheckoutFormProps) {
  const [amount, setAmount] = useState(formatDollars(defaultAmountCents));
  const [donorEmail, setDonorEmail] = useState("");
  const [donorName, setDonorName] = useState("");
  const [publicDisplay, setPublicDisplay] = useState(false);
  const [publicName, setPublicName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<SubmitAction | null>(null);
  const amountCents = useMemo(() => parseDollarInput(amount), [amount]);

  useEffect(() => {
    setNotice(getPledgeOutcomeNotice(window.location.search));
  }, []);

  // #funding links (referrals, /fund cards, Stripe return URLs) land before
  // the async sections above this form finish streaming, so the browser's
  // native anchor jump ends up several screens too high. Re-scroll once after
  // hydration, when layout is real.
  useEffect(() => {
    if (window.location.hash !== "#funding") return;
    document
      .getElementById("funding")
      ?.scrollIntoView({ behavior: "instant", block: "start" });
  }, []);

  async function submit(action: SubmitAction) {
    setError(null);

    if (amountCents == null || amountCents < 100) {
      setError("Enter at least $1.");
      return;
    }

    setSubmitting(action);
    try {
      const path =
        action === "pledge"
          ? `/api/tasks/${encodeURIComponent(taskId)}/fund/pledge-setup`
          : `/api/tasks/${encodeURIComponent(taskId)}/fund/checkout`;
      const body =
        action === "pledge"
          ? {
              amountCents,
              publicDisplay,
              publicName: publicName.trim() || donorName.trim() || null,
            }
          : {
              amountCents,
              donorEmail: donorEmail.trim() || null,
              donorName: donorName.trim() || null,
              publicDisplay,
              publicName: publicName.trim() || donorName.trim() || null,
              sourceReferrer: document.referrer || null,
              sourceUrl: window.location.href,
            };
      const response = await fetch(path, {
        body: JSON.stringify(body),
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
      setSubmitting(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submit("pledge");
  }

  return (
    <form
      className="space-y-4 border border-foreground bg-background p-4 text-foreground"
      onSubmit={handleSubmit}
    >
      {notice ? (
        <p className="border border-foreground px-3 py-2 text-sm font-bold">
          {notice}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {PRESET_AMOUNTS_CENTS.map((presetCents) => {
          const selected = amountCents === presetCents;
          const impactLine = getPresetImpactLine(
            presetCents,
            costPerDalyUsd,
            expectedValuePerDollar,
          );
          return (
            <button
              aria-pressed={selected}
              className={`min-h-10 border border-foreground px-2 py-2 text-left ${
                selected
                  ? "bg-foreground text-background"
                  : "bg-background text-foreground hover:bg-foreground hover:text-background"
              }`}
              key={presetCents}
              onClick={() => setAmount(formatDollars(presetCents))}
              type="button"
            >
              <span className="block text-base font-black">
                ${presetCents / 100}
              </span>
              {impactLine ? (
                <span className="block text-[10px] font-bold leading-tight">
                  {impactLine}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

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

      <p className="text-xs font-bold text-muted-foreground">
        Payments handled by Stripe. Your card number never touches our
        servers.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          {signedIn ? (
            <button
              className="inline-flex min-h-10 w-full items-center justify-center border border-foreground bg-foreground px-4 py-2 text-sm font-black uppercase text-background hover:bg-background hover:text-foreground disabled:opacity-60"
              disabled={submitting !== null}
              type="submit"
            >
              {submitting === "pledge"
                ? "Opening Stripe..."
                : "Pledge — charged only if funded"}
            </button>
          ) : (
            <Link
              className="inline-flex min-h-10 w-full items-center justify-center border border-foreground bg-foreground px-4 py-2 text-sm font-black uppercase text-background hover:bg-background hover:text-foreground"
              href={signInHref}
            >
              Sign in to pledge
            </Link>
          )}
          <p className="text-xs font-bold text-muted-foreground">
            Saves your card, charges nothing today. Stripe charges it only when
            this task is fully funded; if the task dies instead, charged money
            comes back.
          </p>
        </div>
        <div className="space-y-1">
          <button
            className="inline-flex min-h-10 w-full items-center justify-center border border-foreground bg-background px-4 py-2 text-sm font-black uppercase text-foreground hover:bg-foreground hover:text-background disabled:opacity-60"
            disabled={submitting !== null}
            onClick={() => void submit("checkout")}
            type="button"
          >
            {submitting === "checkout" ? "Opening Stripe..." : "Pay now"}
          </button>
          <p className="text-xs font-bold text-muted-foreground">
            Charged today, held for this task, and paid to the worker only
            after the work is verified.
          </p>
        </div>
      </div>

      <div className="divide-y divide-foreground border border-foreground">
        {FAQ_ITEMS.map((item) => (
          <details key={item.question}>
            <summary className="cursor-pointer px-3 py-2 text-xs font-black uppercase tracking-[0.12em]">
              {item.question}
            </summary>
            <p className="px-3 pb-3 text-xs font-bold text-muted-foreground">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </form>
  );
}
