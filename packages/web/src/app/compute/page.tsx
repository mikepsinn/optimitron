import {
  GPU_COMPUTE_MACRO,
  GPU_RIG_TIERS,
} from "@optimitron/data";
import { getRouteMetadata } from "@/lib/metadata";
import { NONPROFIT } from "@/lib/nonprofit-identity";
import { computeLink } from "@/lib/routes";
import {
  ComputeCalculator,
  type CalculatorInitialState,
} from "./compute-calculator";

export const metadata = getRouteMetadata(computeLink);

const CONSULT_MAILTO = `mailto:${NONPROFIT.publicContactEmail}?subject=${encodeURIComponent(
  "On-premises rig install",
)}`;

function num(value: string | string[] | undefined): number | undefined {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isFinite(n) ? n : undefined;
}

function str(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ComputePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const initial: CalculatorInitialState = {
    cardId: str(params.card),
    cardCount: num(params.n),
    pricePerCard: num(params.price),
    utilizationPct: num(params.util),
    rentalPerHour: num(params.rate),
    electricityPerKwh: num(params.kwh),
    residualGrowthPct: num(params.growth),
    horizonMonths: num(params.mo),
    marketplaceFeePct: num(params.fee),
  };

  const macro = GPU_COMPUTE_MACRO;

  return (
    <section className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-black uppercase leading-none sm:text-5xl md:text-6xl">
          The Basement Professor
        </h1>
        <p className="mt-4 max-w-3xl text-base font-bold leading-relaxed sm:text-lg">
          On my planet, every household keeps its own intelligence, the way
          yours keep fire extinguishers. Not because the grid fails often.
          Because the one time it does, the difference between a household
          with a professor in the basement and a household without one is the
          difference between the castaways who had one and the castaways who
          did not.
        </p>

        <div className="mt-8 border-2 border-foreground p-4 sm:p-6">
          <h2 className="text-xl font-black uppercase sm:text-2xl">
            The arithmetic of the shortage
          </h2>
          <ul className="mt-3 space-y-2 text-base font-bold leading-relaxed">
            <li>
              The length of work an AI can do on its own doubles every{" "}
              <a
                className="underline underline-offset-4"
                href={macro.aiTaskDoublingDays.sourceUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                {macro.aiTaskDoublingDays.value} days
              </a>{" "}
              measured since 2024 (every{" "}
              {macro.aiTaskDoublingDaysSince2023.value} days measured since
              2023 — the rate itself is speeding up).
            </li>
            <li>
              The factories that package the chips double capacity roughly
              every{" "}
              <a
                className="underline underline-offset-4"
                href={macro.gpuSupplyDoublingMonths.sourceUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                {macro.gpuSupplyDoublingMonths.low}–
                {macro.gpuSupplyDoublingMonths.high} months
              </a>
              , and the industry still projects a supply gap at the end of
              2026.
            </li>
            <li>
              Demand for intelligence doubles four times while supply doubles
              once. That is why a discontinued RTX 4090 sells above its 2022
              launch price, and why NVIDIA raised a shipping card&apos;s list
              price 55% in sixteen months.
            </li>
          </ul>
          <p className="mt-3 text-sm font-bold text-muted-foreground">
            That is the case for owning the hardware. It is a market regime,
            not a law of physics — the risks section below is part of the
            argument, not a footnote.
          </p>
        </div>

        <h2 className="mt-10 text-xl font-black uppercase sm:text-2xl">
          Price a rig
        </h2>
        <p className="mb-4 mt-2 text-sm font-bold text-muted-foreground">
          Market snapshots dated; every price links to where you can re-check
          it. Adjust anything. The math updates.
        </p>
        <ComputeCalculator initial={initial} />

        <h2 className="mt-10 text-xl font-black uppercase sm:text-2xl">
          What it runs when the internet is off
        </h2>
        <p className="mt-2 text-base font-bold leading-relaxed">
          Rental income is the day job. The reason the rig lives in your
          basement instead of a datacenter is what it can do connected to
          nothing but your solar panel:
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-2 border-foreground text-left">
            <thead>
              <tr>
                <th className="border border-foreground px-3 py-2 text-xs font-black uppercase">
                  Rig
                </th>
                <th className="border border-foreground px-3 py-2 text-xs font-black uppercase">
                  Pooled VRAM
                </th>
                <th className="border border-foreground px-3 py-2 text-xs font-black uppercase">
                  Runs (4-bit, mid-2026 open models)
                </th>
              </tr>
            </thead>
            <tbody>
              {GPU_RIG_TIERS.map((tier) => (
                <tr key={tier.label}>
                  <td className="border border-foreground px-3 py-2 font-black">
                    {tier.label}
                  </td>
                  <td className="border border-foreground px-3 py-2 font-bold">
                    {tier.pooledVramGb} GB
                  </td>
                  <td className="border border-foreground px-3 py-2 font-bold">
                    {tier.runs}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-base font-bold leading-relaxed">
          A node like this can also connect to the Optimitron over MCP, pull
          tasks, work them locally, and report back — which means the task
          tree keeps updating even if every hosted AI on Earth is suddenly
          busy, restricted, or reading your mail.
        </p>

        <div className="mt-10 border-2 border-foreground p-4 sm:p-6">
          <h2 className="text-xl font-black uppercase sm:text-2xl">
            How this bet loses
          </h2>
          <ul className="mt-3 space-y-2 text-base font-bold leading-relaxed">
            <li>
              Every previous GPU generation made the old cards cheaper, not
              dearer. The current appreciation is a shortage regime; a supply
              glut or demand shock restores the old rule and your resale drift
              goes negative.
            </li>
            <li>
              Marketplace rental rates per card-hour have been drifting down
              even while card prices rose. The Bust preset exists for a
              reason.
            </li>
            <li>
              Model efficiency keeps improving — the intelligence that needs
              96 GB today may need 24 GB in two years, moving demand to
              cheaper cards.
            </li>
            <li>
              One export-control or antitrust ruling can move this market 40%
              in either direction, and you will not be consulted.
            </li>
          </ul>
          <p className="mt-3 text-sm font-bold text-muted-foreground">
            Wishonia has been allocating capital for 4,237 years and is still
            not a licensed financial advisor. Nothing on this page is
            investment advice; it is arithmetic with sources.
          </p>
        </div>

        <div className="mt-10 border-2 border-foreground p-4 text-center sm:p-6">
          <h2 className="text-xl font-black uppercase sm:text-2xl">
            Want it installed?
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-base font-bold leading-relaxed">
            Earth Optimization Services sets up on-premises rigs for lawyers,
            funds, and families whose questions should never leave the
            building. Attorney-client privilege works better when the
            intelligence is inside the privilege.
          </p>
          <a
            className="mt-4 inline-block border-2 border-foreground bg-foreground px-6 py-3 text-sm font-black uppercase text-background transition-colors hover:bg-background hover:text-foreground"
            href={CONSULT_MAILTO}
          >
            Ask about an install.
          </a>
        </div>
      </div>
    </section>
  );
}
