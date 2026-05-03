"use client";

import { useState } from "react";
import { Button } from "@/components/retroui/Button";
import { Dialog } from "@/components/retroui/Dialog";
import { EarthOptimizationTaxCalculator } from "./EarthOptimizationTaxCalculator";

const MIKE_EMAIL = "m@warondisease.org";

interface GivingPath {
  title: string;
  body: string;
  subject: string;
  who: string;
}

const PATHS: GivingPath[] = [
  {
    title: "Appreciated stock or mutual funds",
    body: "Donate shares held more than a year directly. You may deduct the full market value and avoid capital gains tax on the sale.",
    subject: "Stock donation",
    who: "Best for vested RSUs, long-held index funds, or any position sitting on a fat unrealized gain.",
  },
  {
    title: "Crypto (BTC, ETH, anything ≥1 year)",
    body: "Crypto held more than a year can often be donated as property, avoiding capital gains while preserving the charitable deduction.",
    subject: "Crypto donation",
    who: "Best for early holders staring at a cost basis that looks like a typo.",
  },
  {
    title: "Donor-Advised Fund (DAF) grant",
    body: "Recommend a grant from Fidelity Charitable, Schwab Charitable, Vanguard Charitable, or another DAF sponsor.",
    subject: "DAF grant",
    who: "Best if you parked a windfall in a DAF and have been meaning to deploy it.",
  },
  {
    title: "Employer matching",
    body: "Many employers match charitable gifts. Donate first, then submit the receipt through your benefits portal.",
    subject: "Employer matching",
    who: "Best for anyone with a W-2 from a large company and 90 seconds to fill out a portal form.",
  },
  {
    title: "Qualified Charitable Distribution (QCD)",
    body: "Age 70½+: direct a distribution from your IRA to the charity. It may satisfy RMDs without increasing taxable income.",
    subject: "Qualified charitable distribution",
    who: "Best for retirees taking required minimum distributions.",
  },
  {
    title: "Bequest in your will",
    body: "Add the Institute for Accelerated Medicine to your estate plan as a beneficiary.",
    subject: "Bequest",
    who: "Best for absolutely everyone with a will, which should be absolutely everyone.",
  },
];

export function WaysToGiveCard() {
  const [calcOpen, setCalcOpen] = useState(false);

  return (
    <section className="border-t border-black pt-8">
      <details>
        <summary className="cursor-pointer text-2xl font-semibold">
          Other ways to give
        </summary>
        <div className="mt-4 space-y-4">
          <p className="max-w-3xl text-sm leading-6 text-neutral-700">
            For larger gifts, these routes can reduce taxes or processing fees.
            Not tax advice. Talk to your CPA. The math here is U.S.-specific.
          </p>

        <Button
          type="button"
          onClick={() => setCalcOpen(true)}
          className="w-full border border-black bg-white text-black shadow-none hover:translate-x-0 hover:translate-y-0 active:translate-x-0 active:translate-y-0"
        >
          Open tax calculator
        </Button>

        <div className="grid gap-3 sm:grid-cols-2">
          {PATHS.map((path) => (
            <div
              key={path.title}
              className="space-y-3 border border-black p-4"
            >
              <p className="text-sm font-semibold">{path.title}</p>
              <p className="text-sm leading-6 text-neutral-700">{path.body}</p>
              <p className="text-xs leading-5 text-neutral-500">
                {path.who}
              </p>
              <a
                className="inline-block border border-black px-3 py-2 text-xs font-semibold hover:bg-black hover:text-white"
                href={buildMailto(path)}
              >
                Ask about this
              </a>
            </div>
          ))}
        </div>

        <p className="text-sm leading-6 text-neutral-700">
          Wire transfer, stock transfer, crypto, DAF grant instructions, or
          anything unusual? Email{" "}
          <a
            href={`mailto:${MIKE_EMAIL}?subject=${encodeURIComponent(
              "Donation transfer instructions",
            )}`}
            className="underline"
          >
            {MIKE_EMAIL}
          </a>
          .
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
            <EarthOptimizationTaxCalculator onClose={() => setCalcOpen(false)} />
          </div>
        </Dialog.Content>
      </Dialog>
    </section>
  );
}

function buildMailto(path: GivingPath) {
  const subject = `Donation interest: ${path.subject}`;
  const body = [
    `I'm interested in making a donation through: ${path.title}.`,
    "",
    "Estimated amount:",
    "Timing:",
    "Anything else I should know:",
  ].join("\n");

  return `mailto:${MIKE_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
