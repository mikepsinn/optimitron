import { EARTH_OPTIMIZATION_SERVICES } from "@/lib/corporate-identity";
import { getRouteMetadata } from "@/lib/metadata";
import { computeLink } from "@/lib/routes";
import {
  FleetAnalyzer,
  type FleetAnalyzerInitialState,
} from "./fleet-analyzer";

export const metadata = getRouteMetadata(computeLink);

const CONSULT_MAILTO = `mailto:${EARTH_OPTIMIZATION_SERVICES.publicContactEmail}?subject=${encodeURIComponent(
  "On-premises rig install",
)}`;

function num(value: string | string[] | undefined): number | undefined {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isFinite(n) ? n : undefined;
}

function str(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

const SOURCES: { label: string; url: string; note: string }[] = [
  {
    label:
      "Host earnings: Vast.ai's guide for people renting out their own GPUs",
    url: "https://vast.ai/article/how-much-money-can-you-earn-renting-out-your-gpu-on-vast-ai",
    note: "May 2026 — RTX 5090-class cards earn $0.30–0.60/hour; H100/H200 cards earn $2.15–4.00+/hour.",
  },
  {
    label: "Cloud rate index: AIMultiple's GPU Price Index",
    url: "https://aimultiple.com/gpu-index",
    note: "June 2026 — newest-generation rental rates roughly doubled over the past year; RTX 5090 median $0.66/hr across 63 sites.",
  },
  {
    label: "Card prices: eBay resale prices via GPUPoet's market report",
    url: "https://gpupoet.com/blogs/news/gpu-market-report-february-2026",
    note: "April 2026 — RTX 50-series cards selling 44–82% above list price; datacenter cards up 23–29% in a single month.",
  },
  {
    label: "Supply outlook: PowerColor via TechPowerUp",
    url: "https://www.techpowerup.com/343073/gpu-price-hikes-coming-in-2026-warns-powercolor",
    note: "analysts expect memory-chip relief in late 2027–2028; AI is expected to use about 20% of the world's memory-chip production in 2026.",
  },
  {
    label: "Memory market size & high-speed-memory demand growth: TrendForce",
    url: "https://www.trendforce.com/presscenter/news/20260529-13068.html",
    note: "May 2026 — 2026/2027 global memory-market forecasts revised up to $889.3B / $1.28T; demand for that memory up 70%+ in 2026 alone.",
  },
  {
    label: "Recovery-timeline scenarios: SoftwareSeni analysis",
    url: "https://www.softwareseni.com/when-will-dram-prices-normalise-analysing-the-timeline-for-memory-market-recovery/",
    note: "citing TrendForce, Sourceability & IDC reporting — best/base/worst-case timing for the shortage to end.",
  },
  {
    label: "New factory timelines: Digitimes & SemiWiki",
    url: "https://www.digitimes.com/news/a20260514PD220/samsung-sk-hynix-dram-hbm-capacity-demand.html",
    note: "Micron Singapore & SK Hynix Cheongju (2027), Samsung Pyeongtaek P5 (2028), Micron Onondaga (2030).",
  },
  {
    label:
      'AI computing-power growth: Epoch AI, "Compute Trends Across Three Eras of Machine Learning"',
    url: "https://arxiv.org/abs/2202.05924",
    note: "the computing power used to train AI models has doubled roughly every 6–10 months since 2010.",
  },
  {
    label: "Chip production forecast: the AI 2027 research team",
    url: "https://ai-2027.com/research/compute-forecast",
    note: "citing TSMC's own published plans, advanced chip-finishing capacity is set to grow about 60% a year (doubling roughly every 18 months); brand-new factory capacity overall grows around 15% a year (doubling roughly every 5 years).",
  },
  {
    label: "Institutional data-center returns: Accordant Investments",
    url: "https://www.accordantinvestments.com/blog/the-numbers-supporting-30-irr-returns-in-hyperscale-data-center-development",
    note: "2025 — ground-up hyperscale data-center projects tracking 25–40% annual returns over 3–4 year hold periods.",
  },
  {
    label: "GPU-rental company returns: SemiAnalysis",
    url: "https://newsletter.semianalysis.com/p/the-great-gpu-shortage-rental-capacity",
    note: '2026 — long-term contracted GPU-rental deals typically lock in "teens" (roughly 15–20%) annual returns.',
  },
  {
    label: "RTX 3090 / RTX 4090 pricing: BestValueGPU",
    url: "https://bestvaluegpu.com/history/new-and-used-rtx-3090-price-history-and-specs/",
    note: "Jul 2026 — used median prices on eBay.",
  },
  {
    label: "RTX 5090 pricing: GPUPoet market report",
    url: "https://gpupoet.com/blogs/news/gpu-market-report-february-2026",
    note: "Apr 2026 — median buyer price $3,634.",
  },
  {
    label: "RTX PRO 6000 Blackwell price hike: Tom's Hardware",
    url: "https://mlq.ai/news/nvidia-raises-rtx-pro-6000-blackwell-msrp-to-13250-a-55-hike-in-one-year/",
    note: "Jun 2026 — Nvidia raised its list price to $13,250, up 55% in a year.",
  },
  {
    label: "H100 80GB pricing: IntuitionLabs",
    url: "https://intuitionlabs.ai/",
    note: "2026 — $27K–$40K per chip depending on where you buy it.",
  },
  {
    label: "Inflation rate: U.S. Bureau of Labor Statistics",
    url: "https://www.bls.gov/news.release/cpi.nr0.htm",
    note: "May 2026 release — 4.2% a year, used as the default rate for cash losing value.",
  },
  {
    label: "AI takeoff-speed modeling: Tom Davidson / Open Philanthropy",
    url: "https://www.alignmentforum.org/posts/Gc9FGtdXhK9sCSEYu/what-a-compute-centric-framework-says-about-ai-takeoff",
    note: "2023 — a detailed model of AI-driven economic growth, built with Epoch AI.",
  },
  {
    label: "AI-driven economic growth modeling: Epoch AI's GATE model",
    url: "https://epoch.ai/blog/announcing-gate",
    note: "2025 — a model estimating how automation could affect economic growth.",
  },
  {
    label: "Intelligence-explosion math: NBER working paper 35155",
    url: "https://www.nber.org/system/files/working_papers/w35155/w35155.pdf",
    note: "2026 — an economics paper working out the conditions under which AI improving itself could cause runaway growth.",
  },
  {
    label:
      'AI capability benchmark: METR, "Measuring AI Ability to Complete Long Tasks"',
    url: "https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/",
    note: "Mar 2025 — the length of task an AI can reliably do has doubled roughly every 7 months since 2019, and every 4 months since 2024.",
  },
  {
    label:
      "AGI timeline forecast: Metaculus community prediction (via 80,000 Hours)",
    url: "https://www.metaculus.com/questions/5121/",
    note: "Feb 2026 — 25% chance by 2029, 50% chance by 2033.",
  },
  {
    label: "Samotsvety Forecasting: professional forecasters' AGI timeline",
    url: "https://forum.effectivealtruism.org/posts/ByBBqwRXWqX5m9erL/update-to-samotsvety-agi-timelines",
    note: "update reported Jan 2026 — about a 28% chance of AGI by 2030.",
  },
  {
    label:
      'Manifold betting-market consensus: via AIMultiple, "AGI/Singularity: Predictions Analyzed"',
    url: "https://aimultiple.com/artificial-general-intelligence-singularity-timing",
    note: "Apr 2026 — 1,100+ traders, average guess of 2033 for an AI that can fool people in conversation.",
  },
  {
    label:
      "Survey of forecasters & experts: Forecasting Research Institute, LEAP Wave 8",
    url: "https://forecastingresearch.substack.com/p/leap-wave-8-ai-timelines",
    note: "May 2026 — average guess of 2028 (professional forecasters) / 2030 (independent experts) for an AI that can reliably do an 8-hour work task.",
  },
  {
    label: "Recursive self-improvement betting market: Manifold",
    url: "https://manifold.markets/MaxHarms/will-ai-be-recursively-self-improvi",
    note: "read Jul 2026 — 18% chance AI is already improving itself by mid-2026.",
  },
];

export default async function ComputePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const initial: FleetAnalyzerInitialState = {
    cardId: str(params.card),
    investUsd: num(params.invest),
    elecCentsPerKwh: num(params.elec),
    utilizationPct: num(params.util),
    marketplaceFeePct: num(params.fee),
    taxRatePct: num(params.tax),
    cardDriftPctPerYear: num(params.drift),
    rateDriftPctPerYear: num(params.rd),
    laborHoursPerMonth: num(params.labor),
    inflationPctPerYear: num(params.inf),
    horizonMonths: num(params.mo),
    quant: str(params.quant),
    preset: str(params.preset),
  };

  return (
    <section className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="border-b-2 border-foreground pb-8">
          <p className="text-right text-xs font-black uppercase tracking-widest text-muted-foreground">
            July 2026 snapshot
          </p>
          <h1 className="mt-2 text-4xl font-black uppercase leading-none sm:text-5xl md:text-6xl">
            The Basement Professor
          </h1>
          <p className="mt-4 max-w-3xl text-base font-bold leading-relaxed sm:text-lg">
            A simple, interactive look at buying computer chips called GPUs and
            renting them out for income — what they cost to run, what
            they&apos;re worth over time, and how the returns compare to normal
            investments like stocks.
          </p>
        </header>

        <div className="mt-8 space-y-4">
          <div className="border-2 border-foreground p-4 sm:p-6">
            <h2 className="text-xl font-black uppercase sm:text-2xl">
              Why this works, in 30 seconds
            </h2>
            <p className="mt-3 text-base font-bold leading-relaxed">
              AI is getting smarter fast — the computing power it needs doubles
              roughly every 6–10 months. But chip factories can&apos;t keep up:
              new ones take years to build, and even the fastest expansion only
              doubles production every 18 months. That gap means there
              aren&apos;t enough of these chips to go around, which is why
              they&apos;re expensive — and why people will pay <em>you</em> to
              rent yours. This page lets you play with the numbers and see for
              yourself.
            </p>
          </div>

          <div className="border-2 border-foreground p-4 sm:p-6">
            <h2 className="text-xl font-black uppercase sm:text-2xl">
              The other reason: the Professor
            </h2>
            <div className="mt-3 space-y-3 text-base font-bold leading-relaxed">
              <p>
                Remember Gilligan&apos;s Island? Seven people stranded on an
                island with no help coming. The only reason they didn&apos;t all
                starve to death in the first week was the Professor — the one
                guy who could build a radio out of coconuts, purify water,
                diagnose Gilligan&apos;s mysterious rash, figure out which
                berries would kill you, and generally keep six helpless people
                alive through sheer competence. Take the Professor off that
                island and it&apos;s just a very short, very sad show about
                people who can&apos;t open a coconut.
              </p>
              <p>
                That&apos;s what these chips give you. A Professor who lives in
                your basement, works 24 hours a day, knows basically everything,
                never asks for a raise, and — this is the important part —{" "}
                <em>doesn&apos;t answer to anybody but you.</em> Not Google. Not
                the government. Not some company that decided your question
                violates their content policy. Your Professor. Your basement.
                Your rules.
              </p>
              <p>
                And it&apos;s not theoretical. Right now, today, there&apos;s a
                free program called{" "}
                <a
                  className="underline underline-offset-4"
                  href="https://hermes-agent.nousresearch.com/"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Hermes Agent
                </a>{" "}
                that you install on your own hardware and tell it what to do —
                research a business idea, write code, manage files, schedule
                tasks, talk to you on your phone. It learns from what it does
                and gets better the longer it runs. You just need the chips to
                run it on.
              </p>
              <p>
                &quot;OK,&quot; you might say, &quot;but is any of the scary
                stuff actually going to happen? The grid going down, the
                government going nuts?&quot; Probably not. Your house will
                probably not burn down either, but you still buy insurance.
                Here&apos;s a fun thing to think about, though: Mark Zuckerberg
                is spending{" "}
                <a
                  className="underline underline-offset-4"
                  href="https://www.insidehook.com/culture/doomsday-bunkers-billionaires"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  $270+ million on a compound in Hawaii
                </a>{" "}
                with a 5,000-square-foot underground bunker, its own food
                supply, and an escape hatch. Bill Gates reportedly has bunkers
                under multiple homes. Peter Thiel tried to build a compound in
                New Zealand. Sam Altman — the CEO of OpenAI,{" "}
                <em>the guy building the AI</em> —{" "}
                <a
                  className="underline underline-offset-4"
                  href="https://futurism.com/the-byte/openai-ceo-survivalist-prepper"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  told The New Yorker
                </a>{" "}
                he keeps &quot;guns, gold, potassium iodide, antibiotics,
                batteries, water, gas masks from the Israeli Defense Force, and
                a big patch of land in Big Sur I can fly to.&quot; The two
                things he said he&apos;s most afraid of? A lab-made virus and
                &quot;AI that attacks us.&quot; This is the man{" "}
                <em>in charge of the AI.</em>
              </p>
              <p>
                Their insurance costs hundreds of millions of dollars and
                doesn&apos;t make them a dime. Yours costs about as much as a
                used car — and{" "}
                <em>
                  it pays you rent while you wait for nothing bad to happen.
                </em>{" "}
                And if absolutely none of it happens — if the world stays
                perfectly normal and boring forever? You still made money
                renting out the computing power the whole time. That&apos;s the
                punchline of this whole thing: the downside is &quot;I guess I
                just made a bunch of money for nothing,&quot; and the upside is
                &quot;I also have a Professor.&quot;
              </p>
            </div>
          </div>
        </div>

        <FleetAnalyzer initial={initial} />

        <footer className="mt-12 border-t-2 border-foreground pt-6">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            Sources &amp; data provenance — snapshot of July 2026
          </p>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-xs font-bold leading-relaxed text-muted-foreground">
            {SOURCES.map((src) => (
              <li key={src.url + src.label}>
                <a
                  className="underline"
                  href={src.url}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {src.label}
                </a>
                , {src.note}
              </li>
            ))}
          </ol>
          <p className="mt-4 max-w-3xl text-xs font-bold leading-relaxed text-muted-foreground">
            These marketplaces don&apos;t publish live, reliable price feeds
            this page could safely pull from automatically, so the numbers here
            are a dated snapshot — and every one is something you can adjust
            above. Rental rates move with demand and can fall as well as rise.
            Wishonia has been allocating capital for 4,237 years and is still
            not a licensed financial advisor. Nothing on this page is investment
            advice; it is arithmetic with sources.
          </p>
        </footer>

        <div className="mt-10 border-2 border-foreground p-4 text-center sm:p-6">
          <h2 className="text-xl font-black uppercase sm:text-2xl">
            Want it installed?
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-base font-bold leading-relaxed">
            Earth Optimization Services sets up on-premises rigs for lawyers,
            funds, and families whose questions should never leave the building.
            Attorney-client privilege works better when the intelligence is
            inside the privilege.
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
