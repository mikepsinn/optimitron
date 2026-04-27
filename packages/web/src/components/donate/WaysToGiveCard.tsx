"use client";

import { useState } from "react";
import { BrutalCard } from "@/components/ui/brutal-card";
import { Button } from "@/components/retroui/Button";
import { Dialog } from "@/components/retroui/Dialog";
import { EarthOptimizationTaxCalculator } from "./EarthOptimizationTaxCalculator";

const MIKE_EMAIL = "m@warondisease.org";

interface GivingPath {
  title: string;
  body: string;
  who: string;
}

const PATHS: GivingPath[] = [
  {
    title: "Appreciated stock or mutual funds",
    body:
      "Donate shares held more than a year directly. You deduct the full market value AND skip the capital gains tax you'd pay on a sale. Net cost roughly 15–20% lower than donating cash.",
    who: "Best for vested RSUs, long-held index funds, or any position sitting on a fat unrealized gain.",
  },
  {
    title: "Crypto (BTC, ETH, anything ≥1 year)",
    body:
      "Same treatment as stock. Deduct fair market value, skip capital gains. The IRS treats it as property; the dying children do not particularly care which property.",
    who: "Best for early holders staring at a cost basis that looks like a typo.",
  },
  {
    title: "Donor-Advised Fund (DAF) grant",
    body:
      "Already deducted in the year you funded the DAF. Recommend a grant from Fidelity Charitable, Schwab Charitable, Vanguard Charitable, etc. to the Institute for Accelerated Medicine. No new tax form, no new deduction — the dollars just leave the holding pen.",
    who: "Best if you parked a windfall in a DAF and have been meaning to deploy it.",
  },
  {
    title: "Employer matching",
    body:
      "Microsoft, Google, Salesforce, Goldman, Chevron and ~65% of Fortune 500 employers match $5–$15K/yr per employee. Submit through your benefits portal after donating. Doubling is free; you have to ask.",
    who: "Best for anyone with a W-2 from a large company and 90 seconds to fill out a portal form.",
  },
  {
    title: "Qualified Charitable Distribution (QCD)",
    body:
      "Age 70½+: direct up to $108K/yr from your IRA to the charity. The distribution doesn't count as taxable income, which can also lower your Medicare premium. Bypasses both the income tax AND the standard-deduction-vs-itemize math.",
    who: "Best for retirees taking required minimum distributions.",
  },
  {
    title: "Bequest in your will",
    body:
      "You can't take it with you. The cells dying right now also can't. A bequest costs nothing today, requires one paragraph in your estate plan, and may be the single highest-leverage gift you ever make if it's large.",
    who: "Best for absolutely everyone with a will, which should be absolutely everyone.",
  },
];

export function WaysToGiveCard() {
  const [calcOpen, setCalcOpen] = useState(false);

  return (
    <BrutalCard bgColor="background" shadowSize={8} className="mt-6">
      <div className="space-y-4">
        <div className="space-y-1">
          <p className="font-black uppercase text-xl">
            How to maximally not fund missiles
          </p>
          <p className="font-bold text-sm text-muted-foreground">
            For donors above $1K, these routes redirect more dollars to the treaty and
            fewer to the IRS, the broker, or your future self&apos;s capital-gains bill.
            Not tax advice. Talk to your CPA. The math here is U.S.-specific.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => setCalcOpen(true)}
          className="w-full bg-brutal-pink text-brutal-pink-foreground"
        >
          Open the Earth Optimization Tax Calculator →
        </Button>

        <div className="grid gap-3 sm:grid-cols-2">
          {PATHS.map((path) => (
            <div
              key={path.title}
              className="border-4 border-primary p-3 space-y-1 bg-muted/30"
            >
              <p className="font-black uppercase text-sm">{path.title}</p>
              <p className="text-sm font-bold leading-snug">{path.body}</p>
              <p className="text-xs font-bold text-muted-foreground leading-snug">
                {path.who}
              </p>
            </div>
          ))}
        </div>

        <p className="text-sm font-bold">
          Wire transfer, stock transfer, crypto, DAF grant instructions, or anything
          weird? Email{" "}
          <a
            href={`mailto:${MIKE_EMAIL}?subject=${encodeURIComponent(
              "Ways to give — tax-optimized routing",
            )}`}
            className="underline"
          >
            {MIKE_EMAIL}
          </a>{" "}
          and we&apos;ll route it. Reply within a day. The cells aren&apos;t waiting.
        </p>
      </div>

      <Dialog open={calcOpen} onOpenChange={setCalcOpen}>
        <Dialog.Content
          size="screen"
          title="Earth Optimization Tax Calculator"
          className="!w-[95vw] !max-w-[1100px] max-h-[92vh] !grid-cols-[minmax(0,1fr)] overflow-hidden"
        >
          <div className="max-h-[calc(92vh-56px)] overflow-auto p-4 sm:p-6">
            <EarthOptimizationTaxCalculator onClose={() => setCalcOpen(false)} />
          </div>
        </Dialog.Content>
      </Dialog>
    </BrutalCard>
  );
}
