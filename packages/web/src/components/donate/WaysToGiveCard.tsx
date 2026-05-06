"use client";

import { useState, type ReactNode } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/retroui/Button";
import { Dialog } from "@/components/retroui/Dialog";
import { DafDirectWidget } from "./DafDirectWidget";
import { EarthOptimizationTaxCalculator } from "./EarthOptimizationTaxCalculator";
import { copyTextToClipboard } from "@/lib/clipboard";
import {
  NONPROFIT,
  NONPROFIT_FULL_LEGAL_NAME,
  formatNonprofitAddressMultiLine,
} from "@/lib/nonprofit-identity";

interface GivingMethod {
  title: string;
  who: string;
  body: ReactNode;
  /** Hide the card if this returns false (e.g. brokerage not yet configured). */
  isReady?: () => boolean;
}

const ADDRESS_LINES = formatNonprofitAddressMultiLine();
const ADDRESS_COPY = ADDRESS_LINES.join(", ");
const BEQUEST_LANGUAGE = `I give [percentage / specific dollar amount / residue of my estate] to ${NONPROFIT.legalName}, EIN ${NONPROFIT.ein}, located at ${ADDRESS_COPY}, for its general charitable purposes.`;

const METHODS: GivingMethod[] = [
  {
    title: "Donor-Advised Fund (DAF) grant",
    who: "Best if you parked a windfall in a DAF.",
    body: (
      <>
        <p>
          Recommend a grant from Fidelity Charitable, DAFgiving360 (formerly
          Schwab Charitable), BNY Mellon Charitable, Vanguard Charitable, or
          your DAF sponsor.
        </p>
        <Block label="Recipient legal name">{NONPROFIT.legalName}</Block>
        <Block label="EIN">{NONPROFIT.ein}</Block>
        <Block label="Mailing address" copyValue={ADDRESS_COPY}>
          {ADDRESS_LINES.join(" · ")}
        </Block>
        {NONPROFIT.dafDirectOrgId ? (
          <>
            <p className="pt-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              One-click via DAF Direct
            </p>
            <DafDirectWidget settings={NONPROFIT.dafDirectOrgId} />
            <p className="text-xs font-bold leading-5 text-muted-foreground">
              DAF Direct charges no transaction fee to {NONPROFIT.legalName} or
              to you. Because DAF contributions are tax-deductible at the time
              the donor funded the DAF, we do not issue a separate tax-deduction
              receipt for DAF grants — your DAF sponsor will provide grant
              confirmation.
            </p>
            {NONPROFIT.endaomentOrgUrl ? (
              <ExternalActionButton href={NONPROFIT.endaomentOrgUrl}>
                Give through Endaoment
              </ExternalActionButton>
            ) : null}
          </>
        ) : null}
      </>
    ),
  },
  {
    title: "Bequest in your will",
    who: "Best for estate gifts.",
    body: (
      <>
        <p>Add the following language to your will or trust:</p>
        <Block label="Suggested bequest language" copyValue={BEQUEST_LANGUAGE}>
          &ldquo;{BEQUEST_LANGUAGE}&rdquo;
        </Block>
        <Block label="Legal name">{NONPROFIT.legalName}</Block>
        <Block label="EIN">{NONPROFIT.ein}</Block>
      </>
    ),
  },
  {
    title: "Qualified Charitable Distribution (QCD)",
    who: "Best for retirees aged 70½+ taking required minimum distributions.",
    body: (
      <>
        <p>
          Direct your IRA custodian to send a distribution to the address below.
          May satisfy your RMD without increasing taxable income.
        </p>
        <Block label="Recipient legal name">{NONPROFIT.legalName}</Block>
        <Block label="EIN">{NONPROFIT.ein}</Block>
        <Block label="Mailing address" copyValue={ADDRESS_COPY}>
          {ADDRESS_LINES.join(" · ")}
        </Block>
      </>
    ),
  },
  {
    title: "Employer matching",
    who: "Best if your employer matches charitable gifts.",
    body: (
      <>
        <p>
          Donate first via the calculator above, then submit the receipt to your
          employer&apos;s matching portal (Benevity, Bright Funds, YourCause,
          etc.) using:
        </p>
        <Block label="Charity legal name">{NONPROFIT.legalName}</Block>
        <Block label="EIN">{NONPROFIT.ein}</Block>
      </>
    ),
  },
  {
    title: "Appreciated stock or mutual funds",
    isReady: () =>
      Boolean(NONPROFIT.brokerage.firmName) ||
      Boolean(NONPROFIT.endaomentOrgUrl),
    who: "Best for vested RSUs, long-held index funds, or highly appreciated positions.",
    body: (
      <>
        <p>
          Donate shares held more than a year directly. You may deduct the full
          market value and avoid capital gains.
        </p>
        {NONPROFIT.brokerage.firmName ? (
          <>
            <p>Have your broker initiate a DTC transfer to:</p>
            <Block label="Brokerage">{NONPROFIT.brokerage.firmName}</Block>
            <Block label="DTC #">{NONPROFIT.brokerage.dtcNumber}</Block>
            <Block label="Account #">{NONPROFIT.brokerage.accountNumber}</Block>
            <Block label="Account name">
              {NONPROFIT.brokerage.accountName}
            </Block>
            <Block label="Broker contact">
              {NONPROFIT.brokerage.contactPhone}
            </Block>
            {NONPROFIT.endaomentOrgUrl ? (
              <>
                <ExternalActionButton href={NONPROFIT.endaomentOrgUrl}>
                  Donate stock through Endaoment
                </ExternalActionButton>
                <p className="text-xs font-bold text-muted-foreground">
                  They auto-sell, wire USD to {NONPROFIT.legalName}, and provide
                  an IRS Form 8283 covering your fair-market-value deduction.
                </p>
              </>
            ) : null}
          </>
        ) : (
          <>
            <p>
              Donate via Endaoment — a 501(c)(3) that handles all the asset
              mechanics for you. They auto-sell, wire USD to{" "}
              {NONPROFIT.legalName}, and provide an IRS Form 8283 covering your
              fair-market-value deduction.
            </p>
            <ExternalActionButton href={NONPROFIT.endaomentOrgUrl}>
              Donate stock through Endaoment
            </ExternalActionButton>
          </>
        )}
      </>
    ),
  },
  {
    title: "Crypto (BTC, ETH, USDC, 50+ coins)",
    isReady: () => Boolean(NONPROFIT.endaomentOrgUrl),
    who: "Best for crypto with long-term unrealized gains.",
    body: (
      <>
        <p>
          Donate crypto held more than a year direct as property — preserves
          your deduction at fair market value, avoids capital gains.
          Auto-converts to USD on receipt; you receive an IRS Form 8283 receipt
          covering 50+ supported coins.
        </p>
        <ExternalActionButton href={NONPROFIT.endaomentOrgUrl}>
          Donate crypto through Endaoment
        </ExternalActionButton>
        <p className="text-xs font-bold text-muted-foreground">
          Powered by Endaoment (a 501(c)(3); custodial; auto-receipt).
        </p>
      </>
    ),
  },
];

export function WaysToGiveCard() {
  const [calcOpen, setCalcOpen] = useState(false);
  const visibleMethods = METHODS.filter((m) =>
    m.isReady ? m.isReady() : true,
  );
  const hiddenCount = METHODS.length - visibleMethods.length;

  return (
    <section className="border-t border-foreground pt-8">
      <details>
        <summary className="cursor-pointer text-2xl font-bold">
          Other ways to give
        </summary>
        <div className="mt-4 space-y-4">
          <p className="max-w-3xl text-sm font-bold leading-6 text-muted-foreground">
            Major-gift routes that can reduce your taxes or processing fees. Not
            tax advice — talk to your CPA. U.S.-specific.{" "}
            {NONPROFIT_FULL_LEGAL_NAME} is a 501(c)(3) public charity
            incorporated in {NONPROFIT.incorporatedIn}.
          </p>

          <Button
            type="button"
            onClick={() => setCalcOpen(true)}
            className="w-full border border-foreground bg-background text-foreground shadow-none hover:translate-x-0 hover:translate-y-0 active:translate-x-0 active:translate-y-0"
          >
            Open tax calculator
          </Button>

          <div className="grid gap-3 sm:grid-cols-2">
            {visibleMethods.map((method) => (
              <div
                key={method.title}
                className="space-y-2 border border-foreground p-4 text-sm leading-6"
              >
                <p className="text-base font-bold">{method.title}</p>
                <p className="text-xs font-bold text-muted-foreground">
                  {method.who}
                </p>
                <div className="space-y-2 pt-1">{method.body}</div>
              </div>
            ))}
          </div>

          <p className="text-sm font-bold leading-6 text-muted-foreground">
            Anything unusual (wire transfer, in-kind goods, complex assets)?
            Email{" "}
            <a
              className="underline"
              href={`mailto:${NONPROFIT.donationsEmail}`}
            >
              {NONPROFIT.donationsEmail}
            </a>
            .
            {hiddenCount > 0
              ? ` Stock and crypto routes are coming online soon — email if you want to give that way today.`
              : null}
          </p>
        </div>
      </details>

      <Dialog open={calcOpen} onOpenChange={setCalcOpen}>
        <Dialog.Content
          size="screen"
          title="Earth Optimization Tax Calculator"
          className="!w-[95vw] !max-w-[1100px] max-h-[92vh] !grid-cols-[minmax(0,1fr)] overflow-hidden"
        >
          <div className="max-h-[calc(92vh-56px)] overflow-auto p-4 sm:p-6">
            <EarthOptimizationTaxCalculator
              onClose={() => setCalcOpen(false)}
            />
          </div>
        </Dialog.Content>
      </Dialog>
    </section>
  );
}

function ExternalActionButton({
  children,
  href,
}: {
  children: ReactNode;
  href?: string | null;
}) {
  if (!href) return null;

  return (
    <a
      className="inline-flex w-full items-center justify-center gap-2 border border-foreground bg-background px-3 py-2 text-center text-sm font-black uppercase text-foreground no-underline shadow-none hover:bg-muted"
      href={href}
      target="_blank"
      rel="noreferrer"
    >
      {children}
      <ExternalLink className="h-4 w-4" aria-hidden="true" />
    </a>
  );
}

function Block({
  label,
  children,
  copyValue,
}: {
  label: string;
  children: ReactNode;
  copyValue?: string;
}) {
  const [copied, setCopied] = useState(false);
  const resolvedCopyValue =
    copyValue ??
    (typeof children === "string" || typeof children === "number"
      ? String(children)
      : null);

  async function handleCopy() {
    if (!resolvedCopyValue) return;

    await copyTextToClipboard(resolvedCopyValue);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="border-l-2 border-foreground pl-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        {resolvedCopyValue ? (
          <button
            type="button"
            onClick={() => {
              void handleCopy();
            }}
            className="inline-flex shrink-0 items-center gap-1 border border-foreground bg-background px-2 py-1 text-[10px] font-black uppercase leading-none text-foreground hover:bg-muted"
            aria-label={`Copy ${label}`}
          >
            {copied ? (
              <Check className="h-3 w-3" aria-hidden="true" />
            ) : (
              <Copy className="h-3 w-3" aria-hidden="true" />
            )}
            {copied ? "Copied" : "Copy"}
          </button>
        ) : null}
      </div>
      <p className="break-words font-mono text-sm font-bold text-foreground">
        {children}
      </p>
    </div>
  );
}
