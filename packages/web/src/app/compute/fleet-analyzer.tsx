"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { GPU_FLEET_CATALOG, type GpuFleetCard } from "@optimitron/data";
import { copyTextToClipboard } from "@/lib/clipboard";
import {
  BENCHMARK_RETURNS,
  benchmarkValue,
  cashValue,
  computeFleetEconomics,
  DEFAULT_FLEET_STATE,
  FLEET_PRESETS,
  type FleetEconomics,
  type FleetPresetId,
  type FleetSimState,
  GLM_MEMORY_GB,
  glmFit,
  type GlmQuant,
  scenariosFor,
  SIM_MONTHS,
} from "@/lib/gpu-fleet-sim";
import { ROUTES } from "@/lib/routes";

export interface FleetAnalyzerInitialState {
  cardId?: string;
  investUsd?: number;
  elecCentsPerKwh?: number;
  utilizationPct?: number;
  marketplaceFeePct?: number;
  taxRatePct?: number;
  cardDriftPctPerYear?: number;
  rateDriftPctPerYear?: number;
  laborHoursPerMonth?: number;
  inflationPctPerYear?: number;
  horizonMonths?: number;
  quant?: string;
  preset?: string;
}

const SECTIONS = [
  { id: "fleet", num: "01", label: "Fleet" },
  { id: "assumptions", num: "02", label: "Assumptions" },
  { id: "marketplaces", num: "03", label: "Marketplaces" },
  { id: "economics", num: "04", label: "Economics" },
  { id: "returns", num: "05", label: "Returns" },
  { id: "compare", num: "06", label: "Compare" },
  { id: "models", num: "07", label: "Open models" },
  { id: "shortage", num: "08", label: "Shortage" },
  { id: "thesis", num: "09", label: "Thesis" },
  { id: "risks", num: "10", label: "Risks" },
] as const;

const HORIZON_OPTIONS = [12, 24, 36, 60] as const;

const MARKETPLACES = [
  {
    name: "Vast.ai",
    model: "Peer marketplace, reliability-scored hosts",
    consumer: "$0.30–0.60/hr host earnings",
    datacenter: "$2.15–4.00+/hr host earnings",
    url: "https://vast.ai",
  },
  {
    name: "RunPod",
    model: "Community Cloud (peer) + Secure Cloud",
    consumer: "~$0.35–0.50/hr renter-paid",
    datacenter: "from $1.99/hr renter-paid",
    url: "https://www.runpod.io",
  },
  {
    name: "TensorDock",
    model: "Bare-metal, on-demand or spot",
    consumer: "~$0.25/hr renter-paid",
    datacenter: "$1.60–2.50/hr renter-paid",
    url: "https://www.tensordock.com",
  },
  {
    name: "Akash Network",
    model: "Decentralized bid market, paid in AKT/USDC",
    consumer: "$0.10–0.20/hr renter-paid",
    datacenter: "$1.50–2.00/hr renter-paid",
    url: "https://akash.network",
  },
  {
    name: "Salad",
    model: "Consumer-only network, inference jobs",
    consumer: "~$0.20–0.50/hr renter-paid",
    datacenter: "Not offered",
    url: "https://www.salad.com",
  },
];

const RISKS = [
  {
    title: "Rental rates float down",
    body: "Rental rates are set by open marketplace supply. New data-center capacity or a dip in AI demand could cut hourly rates 40% or more — the pessimistic scenario models this, but rates have no floor.",
  },
  {
    title: "The taper timing is a judgment call",
    body: "Rising price and rate trends taper down as the §08 supply timeline plays out, instead of compounding at full pace forever — but exactly when and how fast that taper happens is a modeling choice, not a certainty. The price-trend slider still lets you push to a −30%/yr decline by hand if you think relief lands faster or harder than modeled.",
  },
  {
    title: "Residential power limits",
    body: "A 20+ card setup draws more power than most homes are wired for. Setup cost here scales with fleet wattage to approximate dedicated 240V circuits and cooling, but permits, electrician availability, and noise complaints could still push real costs past what's modeled.",
  },
  {
    title: "Cards might sit idle",
    body: "Renters prefer proven, trusted hosts with fast internet connections. New hosts often sit unused more than 30% of the time for their first few months.",
  },
  {
    title: "It all depends on you",
    body: "If your setup goes down, you lose that rental income immediately — and it can hurt your reliability score on the marketplace, making renters less likely to pick your cards afterward.",
  },
  {
    title: "You're betting on one thing, not a mix",
    body: "Unlike a stock index that spreads risk across hundreds of companies, this is all one bet — on GPU rental demand, in one location. To make sense, it should pay meaningfully more than a safer investment, to make up for that added risk.",
  },
  {
    title: "Physical security & insurance",
    body: "A single location holding tens of thousands of dollars or more in hardware is a theft and liability target. Standard homeowner policies typically exclude business equipment and business-use liability without a rider or a separate commercial policy.",
  },
  {
    title: "Tax modeling here is a blunt instrument",
    body: "A single flat rate against monthly profit is the only tax modeled. Real returns would also depend on equipment write-offs and depreciation schedules (which help you), state and self-employment tax (which don't), and capital-gains treatment on resale (not modeled at all here). Talk to a tax professional before relying on any figure on this page.",
  },
  {
    title: "Zoning, HOA & utility terms",
    body: "Many municipalities, HOAs, and residential electric-service agreements restrict commercial-equivalent operations or resale of power from a home. Verify local rules before deploying capital.",
  },
];

const CASE_FOR = [
  "The top AI companies already lock their best models behind apps and paid access, with usage limits and rules — and government pressure is pushing toward more restrictions, not fewer.",
  "Free, downloadable AI models (like GLM, DeepSeek, and the Llama family) trail only months behind the best paid models, not years — and they run on hardware you can own outright.",
  "AI systems are increasingly left running all the time, working on tasks with no one watching. The smarter they get, the more computing power they use — owning your own hardware means not paying a company per request for that.",
  "The memory chip shortage isn't expected to ease before late 2027. Until then, high prices for new cards should keep used-card prices high too, and scarcity should keep rental rates high.",
  "Unlike stocks in a brokerage account, these are physical things you can touch. If the financial system has a bad day — a bank freeze, a brokerage outage, a currency crisis — your Schwab balance is a number on a screen you can't access. Your GPUs are in your basement. They still work. They still have value. They're more like gold than like a stock ticker, except gold can't think.",
  "If the government ever restricts who can own powerful AI chips — through a license or a purchase limit — cards you already own might stay legal even if new sales aren't. This isn't hypothetical: the U.S. already restricts selling the most powerful AI chips to some other countries.",
];

const CASE_AGAINST = [
  "Rental rates depend on how much cloud computing capacity exists worldwide, and that capacity is growing fast. In the past, rental rates have fallen even while card prices rose.",
  "Any future rule that restricts the top AI companies could just as easily restrict home-owned hardware and free AI models too — which would directly hurt demand for this investment.",
  "When the memory shortage clears, card resale values and rental rates could fall together — the double hit the “GPU shortage ends fast” scenario above models.",
  "Building a brand-new, top-tier AI model from scratch costs hundreds of millions of dollars in computing power — completely out of reach at home. Fine-tuning (customizing) an existing large model on this hardware is realistic; building the next one from nothing is not.",
  "There's no guarantee older hardware would stay exempt, either — a future rule could apply to everyone retroactively, not just new buyers. Owning this hardware early is a bet on which direction things go, not a sure thing.",
  "Being a small buyer cuts both ways during a shortage. Hyperscalers get negotiated bulk pricing and guaranteed allocation; retail buyers pay closer to spot price for the same scarce chips — so the shortage that might lift resale value later also made the entry price worse today. Rental listings then compete directly against those same large players' fleets.",
];

const SHORTAGE_SCENARIO_CARDS = [
  {
    name: "Shortage ends fast",
    when: "Q4 2026",
    body: "Relief begins Q3 2026, normalized by Q4 2026 — this needs the big AI/cloud companies to slow their spending faster than currently planned. Worst outcome for this investment.",
    highlight: false,
  },
  {
    name: "Gradual easing",
    when: "Q1–Q2 2027",
    body: "Relief begins Q3 2026, full normalization Q1–Q2 2027, as factory output rises 20%+. The timeline most analyst reports converge on.",
    highlight: true,
  },
  {
    name: "Shortage persists",
    when: "2027–2028",
    body: "AI data centers keep buying up the high-speed memory chips; things don't return to normal until late 2027–2028. Best outcome for this investment.",
    highlight: false,
  },
];

const FORECASTER_CARDS = [
  {
    title: "When AI could match humans at most jobs",
    value: "2029 / 2033",
    body: "About a 1-in-4 chance of a general AI system by the first year, a coin-flip chance by the second.",
    source: "Metaculus — prediction site, 1,759 forecasters · Feb 2026",
    url: "https://www.metaculus.com/questions/5121/",
  },
  {
    title: "Odds of AGI arriving by 2030",
    value: "~28%",
    body: "Their estimated chance of AGI — AI that can do most jobs a human can — arriving within four years.",
    source: "Samotsvety — 8 professional forecasters · Jan 2026",
    url: "https://forum.effectivealtruism.org/posts/ByBBqwRXWqX5m9erL/update-to-samotsvety-agi-timelines",
  },
  {
    title: "When AI could pass as human in conversation",
    value: "2033",
    body: "The average trader's guess for when an AI could fool people into thinking it's human.",
    source: "Manifold — real-money betting market, 1,100+ traders · Apr 2026",
    url: "https://manifold.markets/ai",
  },
  {
    title: "When AI could do a full workday task as well as a person",
    value: "2028–2037",
    body: "2028 per professional forecasters, 2030 per independent experts, 2037 per the general public.",
    source: "Forecasting Research Institute — survey of forecasters, experts & the public · May 2026",
    url: "https://forecastingresearch.substack.com/p/leap-wave-8-ai-timelines",
  },
];

const FORECAST_REVISIONS = [
  { year: "2026", earlyBillions: 551.6, lateBillions: 889.3, lateLabel: "$889.3B" },
  { year: "2027", earlyBillions: 842.7, lateBillions: 1280, lateLabel: "$1.28T" },
];
const FORECAST_MAX_BILLIONS = 1280;

/* ---------------------------------------------------------------- format */

function fmtMoney(x: number): string {
  const sign = x < 0 ? "−" : "";
  return `${sign}$${Math.round(Math.abs(x)).toLocaleString("en-US")}`;
}

function fmtSignedPct(frac: number): string {
  return `${frac >= 0 ? "+" : "−"}${Math.abs(frac * 100).toFixed(1)}%`;
}

function fmtSignedInt(n: number): string {
  return `${n >= 0 ? "+" : "−"}${Math.abs(n)}`;
}

function paybackLabel(e: FleetEconomics): string {
  if (e.units === 0) return "—";
  if (e.paybackMonths === null) return "Never at these assumptions";
  if (e.paybackMonths > 24) {
    const years = e.paybackMonths / 12;
    return `${e.paybackMonths} mo (~${years.toFixed(years >= 10 ? 0 : 1)} yr)`;
  }
  return `${e.paybackMonths} mo`;
}

function clampNum(
  v: number | undefined,
  min: number,
  max: number,
  fallback: number,
): number {
  if (v === undefined || !Number.isFinite(v)) return fallback;
  return Math.min(max, Math.max(min, v));
}

/* ------------------------------------------------------------ component */

export function FleetAnalyzer({
  initial,
}: {
  initial?: FleetAnalyzerInitialState;
}) {
  const d = DEFAULT_FLEET_STATE;
  const initialCard = GPU_FLEET_CATALOG.some((c) => c.id === initial?.cardId)
    ? (initial?.cardId as string)
    : "rtx5090";
  const initialQuant: GlmQuant =
    initial?.quant === "fp8" || initial?.quant === "q3" ? initial.quant : "q4";
  const initialPreset: FleetPresetId | "custom" = FLEET_PRESETS.some(
    (p) => p.id === initial?.preset,
  )
    ? (initial?.preset as FleetPresetId)
    : "custom";

  const [cardId, setCardId] = useState(initialCard);
  const [investUsd, setInvestUsd] = useState(
    clampNum(initial?.investUsd, 2000, 500_000, d.investUsd),
  );
  const [elec, setElec] = useState(
    clampNum(initial?.elecCentsPerKwh, 5, 45, d.elecCentsPerKwh),
  );
  const [util, setUtil] = useState(
    clampNum(initial?.utilizationPct, 30, 95, d.utilizationPct),
  );
  const [fee, setFee] = useState(
    clampNum(initial?.marketplaceFeePct, 0, 40, d.marketplaceFeePct),
  );
  const [taxRate, setTaxRate] = useState(
    clampNum(initial?.taxRatePct, 0, 50, d.taxRatePct),
  );
  const [drift, setDrift] = useState(
    clampNum(initial?.cardDriftPctPerYear, -30, 70, d.cardDriftPctPerYear),
  );
  const [rateDrift, setRateDrift] = useState(
    clampNum(initial?.rateDriftPctPerYear, -40, 60, d.rateDriftPctPerYear),
  );
  const [laborHrs, setLaborHrs] = useState(
    clampNum(initial?.laborHoursPerMonth, 0, 60, 10),
  );
  const [inflation, setInflation] = useState(
    clampNum(initial?.inflationPctPerYear, 0, 10, 4.2),
  );
  const [horizon, setHorizon] = useState<number>(
    HORIZON_OPTIONS.includes(initial?.horizonMonths as 12 | 24 | 36 | 60)
      ? (initial?.horizonMonths as number)
      : d.horizonMonths,
  );
  const [quant, setQuant] = useState<GlmQuant>(initialQuant);
  const [preset, setPreset] = useState<FleetPresetId | "custom">(initialPreset);
  const [activeSection, setActiveSection] = useState<string>("fleet");
  const [copyState, setCopyState] = useState<"copied" | "idle">("idle");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);
  const pillRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  /* scrollspy */
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        let current: string = SECTIONS[0].id;
        for (const s of SECTIONS) {
          const el = document.getElementById(s.id);
          if (!el) continue;
          if (el.getBoundingClientRect().top <= 130) current = s.id;
          else break;
        }
        setActiveSection(current);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* keep the active pill visible */
  useEffect(() => {
    const nav = navRef.current;
    const pill = pillRefs.current[activeSection];
    if (!nav || !pill) return;
    const target = Math.max(0, pill.offsetLeft - (nav.clientWidth - pill.clientWidth) / 2);
    nav.scrollTo({ left: target, behavior: "smooth" });
  }, [activeSection]);

  function scrollToSection(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 118;
    window.scrollTo({ top: y, behavior: "smooth" });
    setActiveSection(id);
  }

  function applyPreset(id: FleetPresetId) {
    const p = FLEET_PRESETS.find((x) => x.id === id);
    if (!p) return;
    setUtil(p.utilizationPct);
    setDrift(p.cardDriftPctPerYear);
    setRateDrift(p.rateDriftPctPerYear);
    setPreset(id);
  }

  /** Manual moves on preset-controlled sliders turn the scenario custom. */
  function manual(setter: (v: number) => void) {
    return (v: number) => {
      setter(v);
      setPreset("custom");
    };
  }

  const simState: FleetSimState = useMemo(
    () => ({
      investUsd,
      elecCentsPerKwh: elec,
      utilizationPct: util,
      marketplaceFeePct: fee,
      taxRatePct: taxRate,
      cardDriftPctPerYear: drift,
      rateDriftPctPerYear: rateDrift,
      horizonMonths: horizon,
    }),
    [investUsd, elec, util, fee, taxRate, drift, rateDrift, horizon],
  );

  const noTaper = preset === "singularity";
  const selCard =
    GPU_FLEET_CATALOG.find((c) => c.id === cardId) ?? GPU_FLEET_CATALOG[0]!;

  const sim = useMemo(() => {
    const sc = scenariosFor(selCard, simState, noTaper);
    return {
      base: computeFleetEconomics(selCard, sc.base, simState),
      lo: computeFleetEconomics(selCard, sc.lo, simState),
      hi: computeFleetEconomics(selCard, sc.hi, simState),
    };
  }, [selCard, simState, noTaper]);

  const allFleets = useMemo(
    () =>
      GPU_FLEET_CATALOG.map((c) => {
        const sc = scenariosFor(c, simState, noTaper);
        return {
          card: c,
          base: computeFleetEconomics(c, sc.base, simState),
          lo: computeFleetEconomics(c, sc.lo, simState),
          hi: computeFleetEconomics(c, sc.hi, simState),
        };
      }),
    [simState, noTaper],
  );

  /** Every preset applied to the selected card, for the asymmetric-risk rows. */
  const riskRows = useMemo(() => {
    const rows = FLEET_PRESETS.map((p) => {
      const e = computeFleetEconomics(
        selCard,
        {
          ratePerHourUsd: selCard.ratePerHourUsd,
          utilizationPct: p.utilizationPct,
          cardDriftPctPerYear: selCard.resaleDriftPctPerYear + p.cardDriftPctPerYear,
          rateDriftPctPerYear: p.rateDriftPctPerYear,
          noTaper: p.noTaper,
        },
        simState,
      );
      return { id: p.id, name: p.name, value: e.valueAt(horizon) };
    }).sort((a, b) => a.value - b.value);
    // Linear scale over the TRUE max, singularity included — compressing the
    // ordinary bars is the honest picture; clamping the outlier was a lie.
    const max =
      Math.max(investUsd, ...rows.map((r) => r.value), 1) * 1.05;
    const scale = (v: number) => Math.max(0.5, (v / max) * 100);
    return {
      rows: rows.map((r) => ({ ...r, pct: scale(r.value) })),
      investPct: scale(investUsd),
    };
  }, [selCard, simState, investUsd, horizon]);

  const glmRows = useMemo(
    () =>
      allFleets.map(({ card, base }) => ({
        card,
        fleetUnits: base.units,
        fit: glmFit(card, quant, base.units),
      })),
    [allFleets, quant],
  );

  const T = horizon;
  const horizonLabel = `${T / 12}-year`;
  const { base, lo, hi } = sim;
  const annB = base.annualizedAt(T);
  const annL = lo.annualizedAt(T);
  const annH = hi.annualizedAt(T);
  const roiHeadline = base.units === 0 ? "—" : fmtSignedPct(annB);
  const roiRange = `${fmtSignedPct(annL)} to ${fmtSignedPct(annH)}`;
  const impliedWage = laborHrs > 0 ? base.monthlyNetUsd / laborHrs : null;

  const spV = (m: number) => benchmarkValue(investUsd, BENCHMARK_RETURNS.sp500, m);
  const tbV = (m: number) => benchmarkValue(investUsd, BENCHMARK_RETURNS.tbill, m);
  const reV = (m: number) => benchmarkValue(investUsd, BENCHMARK_RETURNS.realEstate, m);
  const dcV = (m: number) => benchmarkValue(investUsd, BENCHMARK_RETURNS.dcDeveloper, m);
  const neoV = (m: number) => benchmarkValue(investUsd, BENCHMARK_RETURNS.neocloud, m);
  const cashV = (m: number) => cashValue(investUsd, inflation, m);

  const narrative =
    base.units === 0
      ? `At this budget a single ${selCard.name} unit exceeds available capital after setup costs. Increase the investment or pick a cheaper card.`
      : `${fmtMoney(investUsd)} buys ${base.units}× ${selCard.name} (${fmtMoney(
          base.hwCardsUsd + base.hwOverheadUsd,
        )} of hardware, ${fmtMoney(base.leftoverUsd)} held in cash), producing ${
          base.units * selCard.vramGb
        } GB of memory to rent out, drawing ~${
          Math.round((base.units * selCard.watts * 1.25) / 100) / 10
        } kW at full load.`;

  const benchRows = [
    {
      name: `${selCard.name} fleet`,
      value: base.valueAt(T),
      rate: annB,
      loV: Math.max(0, lo.valueAt(T)),
      hiV: Math.max(0, hi.valueAt(T)),
      hasRange: true,
    },
    { name: "S&P 500", value: spV(T), rate: BENCHMARK_RETURNS.sp500 },
    { name: "Treasuries", value: tbV(T), rate: BENCHMARK_RETURNS.tbill },
    { name: "Rental real estate", value: reV(T), rate: BENCHMARK_RETURNS.realEstate },
    { name: "Cash (inflation-eroded)", value: cashV(T), rate: -inflation / 100 },
    {
      name: "Company that builds AI data centers",
      value: dcV(T),
      rate: BENCHMARK_RETURNS.dcDeveloper,
    },
    {
      name: "Big company renting out GPUs",
      value: neoV(T),
      rate: BENCHMARK_RETURNS.neocloud,
    },
  ];

  function handleCopyLink() {
    const params = new URLSearchParams({
      card: cardId,
      invest: String(investUsd),
      elec: String(elec),
      util: String(util),
      fee: String(fee),
      tax: String(taxRate),
      drift: String(drift),
      rd: String(rateDrift),
      labor: String(laborHrs),
      inf: String(inflation),
      mo: String(horizon),
      quant,
    });
    if (preset !== "custom") params.set("preset", preset);
    const url = `${window.location.origin}${ROUTES.compute}?${params.toString()}`;
    void copyTextToClipboard(url).then(() => {
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1500);
    });
  }

  const presetLabel =
    preset === "custom"
      ? "Custom scenario"
      : FLEET_PRESETS.find((p) => p.id === preset)?.name ?? "Custom scenario";

  return (
    <div className="pb-16">
      {/* sticky pill nav */}
      <nav
        aria-label="Page sections"
        className="sticky top-[58px] z-20 -mx-4 overflow-x-auto whitespace-nowrap border-b-2 border-foreground bg-background px-4 py-2 sm:-mx-6 sm:px-6"
        ref={(el) => {
          navRef.current = el;
        }}
      >
        {SECTIONS.map((s) => (
          <button
            className={`mr-2 border-2 border-foreground px-3 py-1.5 text-xs font-black uppercase ${
              activeSection === s.id
                ? "bg-foreground text-background"
                : "bg-background text-foreground hover:bg-muted"
            }`}
            key={s.id}
            onClick={() => scrollToSection(s.id)}
            ref={(el) => {
              pillRefs.current[s.id] = el;
            }}
            type="button"
          >
            {s.label}
          </button>
        ))}
      </nav>

      {/* ============ 01 FLEET ============ */}
      <section className="scroll-mt-32 pt-12" id="fleet">
        <SectionHeading num="01" title="Choose the fleet" />
        <p className="mt-2 max-w-3xl text-sm font-bold leading-relaxed text-muted-foreground">
          The price shown includes the GPU itself plus its share of the
          computer it plugs into (case, processor, power supply, cables). The
          hourly rate is what a renter — called a &quot;host&quot; — actually
          earns, before the marketplace takes its cut. &quot;Price trend&quot;
          shows whether that card&apos;s resale price has been rising or
          falling lately. Buy links are below each card; rental rates by
          marketplace are compared in §03.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {allFleets.map(({ card, base: e }) => {
            const combinedDrift = card.resaleDriftPctPerYear + drift;
            const selected = card.id === cardId;
            return (
              <div
                aria-pressed={selected}
                className={`flex cursor-pointer flex-col gap-2 border-2 border-foreground p-3 ${
                  selected ? "bg-muted" : "bg-background hover:bg-muted"
                }`}
                key={card.id}
                onClick={() => setCardId(card.id)}
                onKeyDown={(ev) => {
                  if (ev.key === "Enter" || ev.key === " ") {
                    ev.preventDefault();
                    setCardId(card.id);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-black uppercase leading-tight">
                    {card.name}
                  </span>
                  <span className="whitespace-nowrap border border-foreground px-1.5 py-0.5 text-[10px] font-black">
                    {card.vramGb} GB
                  </span>
                </div>
                <dl className="space-y-1 text-xs font-bold">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Per card</dt>
                    <dd>{fmtMoney(card.priceUsd + card.overheadUsd)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Rents for</dt>
                    <dd>${card.ratePerHourUsd.toFixed(2)}/hr</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Power use</dt>
                    <dd>{card.watts} W</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Price trend</dt>
                    <dd>{fmtSignedInt(combinedDrift)}%/yr</dd>
                  </div>
                </dl>
                <p className="border-t border-foreground pt-2 text-xs font-bold">
                  Your budget buys{" "}
                  <span className="font-black">
                    {e.units} {e.units === 1 ? "card" : "cards"}
                  </span>
                </p>
                <a
                  className="text-xs font-black underline underline-offset-4"
                  href={card.buyUrl}
                  onClick={(ev) => ev.stopPropagation()}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {card.buyLabel} ↗
                </a>
                <a
                  className="text-[10px] font-bold text-muted-foreground underline"
                  href={card.priceSourceUrl}
                  onClick={(ev) => ev.stopPropagation()}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  price src: {card.priceSourceLabel} ↗
                </a>
              </div>
            );
          })}
        </div>
        <p className="mt-3 max-w-3xl text-xs font-bold leading-relaxed text-muted-foreground">
          Nvidia stopped making two of these five cards (RTX 3090, RTX 4090) —
          every listing you&apos;ll find is used. Before paying: check the
          seller&apos;s rating, ask for a photo of the card running{" "}
          <a
            className="underline"
            href="https://www.techpowerup.com/gpuz/"
            rel="noopener noreferrer"
            target="_blank"
          >
            GPU-Z
          </a>{" "}
          (confirms it&apos;s genuinely that card and not a relabeled cheaper
          one), and pay through eBay/PayPal rather than a direct wire so
          you&apos;re covered if it arrives dead. No manufacturer warranty
          left is normal for these two; a steep discount paired with a vague
          listing is the sign to walk away.
        </p>
      </section>

      {/* ============ 02 ASSUMPTIONS ============ */}
      <section className="scroll-mt-32 pt-12" id="assumptions">
        <SectionHeading num="02" title="Assumptions" />
        <p className="mt-2 max-w-3xl text-sm font-bold leading-relaxed text-muted-foreground">
          Every number below updates instantly as you move a slider. The
          starting values come from real 2026 GPU-rental earnings, typical US
          home electricity prices, and each card&apos;s own recent resale
          trend. The investment slider runs from a single card (about $2,000)
          up to a $500,000 fleet — this isn&apos;t a $100,000-minimum decision,
          so size it to whatever amount you&apos;re actually weighing.
        </p>

        <p className="mt-6 text-sm font-black uppercase">
          Pick the scenario you think is most likely — it sets the sliders to
          match:
        </p>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {FLEET_PRESETS.map((p) => (
            <button
              className={`border-2 border-foreground p-3 text-left ${
                preset === p.id
                  ? "bg-foreground text-background"
                  : "bg-background text-foreground hover:bg-muted"
              }`}
              key={p.id}
              onClick={() => applyPreset(p.id)}
              type="button"
            >
              <span className="block text-sm font-black uppercase">{p.name}</span>
              <span
                className={`mt-1 block text-xs font-bold leading-snug ${
                  preset === p.id ? "" : "text-muted-foreground"
                }`}
              >
                {p.description}
              </span>
            </button>
          ))}
        </div>
        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-bold text-muted-foreground">
            What do these scenario buttons do?
          </summary>
          <p className="mt-2 max-w-3xl text-xs font-bold leading-relaxed text-muted-foreground">
            The first four options come from the supply-and-demand story in
            §08 below. The fifth is different: it imagines AI improving itself
            — a smarter AI helping build the next, even smarter AI — faster
            than computer-chip factories can keep up with the demand that
            creates (full explanation in §09). Nobody has published real
            numbers for how that would affect GPU prices, so this option
            isn&apos;t a prediction. It just pushes every slider to the
            highest value this page allows, so you can see how extreme things
            could get, not how likely that is.
          </p>
        </details>

        <div className="mt-4 grid grid-cols-1 gap-x-8 border-2 border-foreground p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
          <Slider
            format={(v) => fmtMoney(v)}
            label="Initial investment"
            max={500_000}
            min={2000}
            onChange={manual(setInvestUsd)}
            step={1000}
            value={investUsd}
          />
          <Slider
            format={(v) => `${v}¢/kWh`}
            label="Electricity rate"
            max={45}
            min={5}
            onChange={manual(setElec)}
            step={0.5}
            value={elec}
          />
          <Slider
            format={(v) => `${v}%`}
            label="Utilization (% of hours rented out)"
            max={95}
            min={30}
            onChange={manual(setUtil)}
            step={1}
            value={util}
          />
          <Slider
            format={(v) => `${v}%`}
            label="Marketplace fee (% of revenue)"
            max={40}
            min={0}
            onChange={manual(setFee)}
            step={1}
            value={fee}
          />
          <Slider
            format={(v) => `${v}%`}
            label="Tax rate on profit"
            max={50}
            min={0}
            onChange={setTaxRate}
            step={1}
            value={taxRate}
          />
          <Slider
            format={(v) => `${fmtSignedInt(v)}%/yr`}
            label="Card price trend"
            max={70}
            min={-30}
            onChange={manual(setDrift)}
            step={1}
            value={drift}
          />
          <Slider
            format={(v) => `${fmtSignedInt(v)}%/yr`}
            label="Rental rate trend"
            max={60}
            min={-40}
            onChange={manual(setRateDrift)}
            step={1}
            value={rateDrift}
          />
          <Slider
            format={(v) => `${v} hrs/mo`}
            label="Your time, hrs/month"
            max={60}
            min={0}
            onChange={setLaborHrs}
            step={1}
            value={laborHrs}
          />
          <Slider
            format={(v) => `${v}%`}
            label="Inflation rate (money loses value over time)"
            max={10}
            min={0}
            onChange={setInflation}
            step={0.1}
            value={inflation}
          />
          <div className="py-4">
            <p className="text-sm font-bold uppercase">Holding period</p>
            <div className="mt-2 flex gap-2">
              {HORIZON_OPTIONS.map((m) => (
                <button
                  className={`flex-1 border-2 border-foreground px-2 py-1.5 text-xs font-black ${
                    horizon === m
                      ? "bg-foreground text-background"
                      : "bg-background text-foreground hover:bg-muted"
                  }`}
                  key={m}
                  onClick={() => setHorizon(m)}
                  type="button"
                >
                  {m / 12} yr
                </button>
              ))}
            </div>
          </div>
        </div>

        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-bold text-muted-foreground">
            How the math behind these numbers works
          </summary>
          <p className="mt-2 max-w-3xl text-xs font-bold leading-relaxed text-muted-foreground">
            These trend sliders compound every month for as long as you hold —
            but a rising trend doesn&apos;t run at the same pace forever.
            Price and rate increases driven by the memory shortage run at full
            strength through roughly the next year (the &quot;confirmed
            shortage&quot; window in §08), then taper down toward a small
            residual over the two years after that, as the new factory
            capacity in §08 comes online — instead of compounding at
            today&apos;s pace for years after relief has already arrived. A
            falling trend (plain depreciation, a card losing ground to newer
            hardware) isn&apos;t a shortage artifact, so it isn&apos;t tapered
            — it just compounds as entered. The &quot;AI takes off very
            fast&quot; option is the one exception, on purpose: its whole
            premise is that AI improving itself outpaces chip factories with
            no fixed timeline, so tapering it back down on a normal recovery
            schedule would contradict its own logic. Instead, its size comes
            from a rough idea — what if renting a GPU became worth close to
            what it costs to rent a skilled person&apos;s time (very roughly
            $50–150 an hour) instead of today&apos;s much cheaper wholesale
            rate (about $2.60/hour for an H100 chip)? That jump alone would be
            a 20–60× increase over 5 years. This is a rough,
            back-of-envelope estimate, not a sourced prediction — treat this
            option as &quot;how extreme could this get,&quot; not &quot;how
            likely is this.&quot; You can also drag any slider further by hand
            than any preset uses.
          </p>
          <p className="mt-2 max-w-3xl text-xs font-bold leading-relaxed text-muted-foreground">
            Fixed costs included: setup is modeled from a few hundred dollars
            for a card or two (cables, a shelf, plugging into a spare outlet),
            rising toward $2,500+ once a fleet needs its own dedicated 240V
            circuits and real cooling instead of just shelving. Monthly
            overhead (internet, insurance, a repair reserve) scales the same
            way — a couple hundred dollars a month once you&apos;re clearly
            running a fleet, much less for a card or two — plus extra power
            for cooling and for cards left partly running even when idle, and
            tax on profit at the rate above. A card&apos;s occupancy also
            softens somewhat as it ages and newer hardware enters the
            marketplace. The monthly income and costs below show month 1;
            longer-term numbers follow the trend sliders, the tax rate, and
            that aging curve.
          </p>
        </details>

        {/* live stat tiles */}
        <div className="mt-6 grid grid-cols-1 gap-px border-2 border-foreground bg-foreground sm:grid-cols-3">
          <StatTile
            caption="rental income earned so far + what the cards would sell for today"
            label={`Total value after ${horizonLabel} hold`}
            range={
              base.units === 0
                ? undefined
                : `worst ${fmtMoney(lo.valueAt(T))} — best ${fmtMoney(hi.valueAt(T))}`
            }
            value={base.units === 0 ? "—" : fmtMoney(base.valueAt(T))}
          />
          <StatTile
            caption={`like saying "this would have been a X%/yr investment"`}
            label={`Yearly return (${horizonLabel} hold, after tax)`}
            range={base.units === 0 ? undefined : `worst to best: ${roiRange}`}
            value={roiHeadline}
          />
          <StatTile
            caption="from rental income alone, not counting what the cards are still worth"
            label="Time to earn it back"
            range={
              base.units === 0
                ? undefined
                : `worst ${paybackLabel(lo)} — best ${paybackLabel(hi)}`
            }
            value={paybackLabel(base)}
          />
        </div>
        <p className="mt-2 text-xs font-bold text-muted-foreground">
          These update live as you change anything above. {fmtMoney(investUsd)}{" "}
          invested in {selCard.name} cards, holding for {horizonLabel.replace("-", " ")}
          .
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            className="inline-flex items-center gap-2 border-2 border-foreground bg-background px-4 py-2 text-sm font-black uppercase text-foreground hover:bg-foreground hover:text-background"
            onClick={handleCopyLink}
            type="button"
          >
            {copyState === "copied" ? (
              <Check aria-hidden="true" className="h-4 w-4" />
            ) : (
              <Copy aria-hidden="true" className="h-4 w-4" />
            )}
            {copyState === "copied" ? "Copied" : "Copy link with my assumptions"}
          </button>
          <p className="text-xs font-bold text-muted-foreground">
            Send it to the family member with capital.
          </p>
        </div>
      </section>

      {/* ============ 03 MARKETPLACES ============ */}
      <section className="scroll-mt-32 pt-12" id="marketplaces">
        <SectionHeading num="03" title="Where the revenue comes from" />
        <p className="mt-2 max-w-3xl text-sm font-bold leading-relaxed text-muted-foreground">
          Five websites handle most of this GPU-rental business. This
          page&apos;s numbers (§01, §02) are based on Vast.ai&apos;s published
          host earnings. The other four are shown at their listed renter price
          for comparison — what a host actually keeps elsewhere is usually
          that price minus the site&apos;s own fee.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[700px] border-2 border-foreground text-left">
            <thead>
              <tr>
                <Th>Marketplace</Th>
                <Th>How it works</Th>
                <Th>Consumer card</Th>
                <Th>Datacenter card</Th>
                <Th>Link</Th>
              </tr>
            </thead>
            <tbody>
              {MARKETPLACES.map((m) => (
                <tr key={m.name}>
                  <Td className="font-black">{m.name}</Td>
                  <Td>{m.model}</Td>
                  <Td>{m.consumer}</Td>
                  <Td>{m.datacenter}</Td>
                  <Td>
                    <a
                      className="font-black underline underline-offset-4"
                      href={m.url}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      Visit ↗
                    </a>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 max-w-3xl text-xs font-bold leading-relaxed text-muted-foreground">
          When you&apos;re ready to sell, hardware usually goes through{" "}
          <a
            className="underline"
            href="https://www.ebay.com/sch/i.html?_nkw=rtx+gpu"
            rel="noopener noreferrer"
            target="_blank"
          >
            eBay auctions
          </a>
          , peer groups like{" "}
          <a
            className="underline"
            href="https://www.reddit.com/r/hardwareswap/"
            rel="noopener noreferrer"
            target="_blank"
          >
            r/hardwareswap
          </a>
          , or specialized buyers like{" "}
          <a
            className="underline"
            href="https://www.servermonkey.com"
            rel="noopener noreferrer"
            target="_blank"
          >
            ServerMonkey
          </a>{" "}
          for full server systems. §05 assumes a lower, guaranteed-quick-sale
          price rather than full market value — that discount is already built
          into the numbers.
        </p>
      </section>

      {/* ============ 04 ECONOMICS ============ */}
      <section className="scroll-mt-32 pt-12" id="economics">
        <SectionHeading num="04" title={`The monthly math — ${selCard.name}`} />
        <p className="mt-3 max-w-3xl text-base font-bold leading-relaxed">
          {narrative}
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="border-2 border-foreground p-4 sm:p-6">
            <p className="text-xs font-black uppercase text-muted-foreground">
              Monthly income and costs
            </p>
            <dl className="mt-3">
              <PlRow
                label={`Rental revenue (${base.units} cards × $${selCard.ratePerHourUsd.toFixed(2)}/hr × ${util}%)`}
                value={fmtMoney(base.monthlyGrossUsd)}
              />
              <PlRow
                label={`Marketplace fee (${fee}%)`}
                value={`−${fmtMoney(base.monthlyFeesUsd)}`}
              />
              <PlRow
                label={`Electricity (${Math.round(base.monthlyKwh).toLocaleString("en-US")} kWh @ ${elec}¢)`}
                value={`−${fmtMoney(base.monthlyPowerUsd)}`}
              />
              <PlRow
                label="Internet, insurance, maintenance"
                value={`−${fmtMoney(base.monthlyFixedUsd)}`}
              />
              <PlRow
                label={`Estimated tax on profit (${taxRate}%)`}
                value={`−${fmtMoney(base.monthlyTaxUsd)}`}
              />
              <div className="flex items-baseline justify-between border-t-2 border-foreground py-2 text-sm">
                <dt className="font-black uppercase">Left over each month</dt>
                <dd className="font-black tabular-nums">
                  {fmtMoney(base.monthlyNetUsd)}
                </dd>
              </div>
            </dl>
          </div>
          <div className="grid grid-rows-3 gap-3">
            <div className="flex flex-col justify-center border-2 border-foreground p-4 sm:px-6">
              <p className="text-xs font-black uppercase text-muted-foreground">
                Time to earn it back
              </p>
              <p className="mt-1 text-3xl font-black tabular-nums">
                {paybackLabel(base)}
              </p>
              <p className="mt-1 text-xs font-bold text-muted-foreground">
                how long until after-tax rental income alone earns back what
                you spent
              </p>
            </div>
            <div className="flex flex-col justify-center border-2 border-foreground bg-foreground p-4 text-background sm:px-6">
              <p className="text-xs font-black uppercase">
                Yearly return ({horizonLabel} hold, after tax)
              </p>
              <p className="mt-1 text-3xl font-black tabular-nums">
                {roiHeadline}
              </p>
              <p className="mt-1 text-xs font-bold">
                range {roiRange} · after estimated taxes, includes selling the
                hardware
              </p>
            </div>
            <div className="flex flex-col justify-center border-2 border-foreground p-4 sm:px-6">
              <p className="text-xs font-black uppercase text-muted-foreground">
                What your time is worth
              </p>
              <p className="mt-1 text-3xl font-black tabular-nums">
                {impliedWage === null ? "—" : `${fmtMoney(impliedWage)}/hr`}
              </p>
              <p className="mt-1 text-xs font-bold text-muted-foreground">
                money left over each month ÷ {laborHrs} hrs/mo you spend on it
                — not included in the return numbers above
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ 05 RETURNS ============ */}
      <section className="scroll-mt-32 pt-12" id="returns">
        <SectionHeading num="05" title="How it compares to other investments" />
        <p className="mt-2 max-w-3xl text-sm font-bold leading-relaxed text-muted-foreground">
          This chart tracks total value over 5 years: cash left over, plus
          money earned so far, plus what the hardware would sell for if cashed
          out (cards resell for about 92% of value, full server systems for
          about 30%). That&apos;s why this fleet&apos;s line starts a little
          below {fmtMoney(investUsd)} on day one instead of flat like the
          others — the instant you buy the hardware, reselling it would net
          less than you paid, the same way a new car loses value the moment it
          leaves the lot, and setup costs like wiring and shelving don&apos;t
          resell at all. The shaded area spans the worst-case and best-case
          scenarios. &quot;Cash&quot; assumes it just sits there, losing value
          to inflation ({inflation}% a year, from government data — adjustable
          in §01). &quot;S&amp;P 500&quot; is a common measure of the U.S.
          stock market; &quot;Treasuries&quot; are loans to the U.S.
          government, generally considered very safe. &quot;Rental real
          estate&quot; is a rough stand-in for owning a rental property — rent
          collected plus the property&apos;s value rising over time. These
          comparisons are simplified, adjustable estimates, not live market
          data.
        </p>
        <ValueChart
          cash={cashV}
          fleetHi={(m) => hi.valueAt(m)}
          fleetLo={(m) => lo.valueAt(m)}
          fleetName={selCard.name}
          fleetValue={(m) => base.valueAt(m)}
          horizon={T}
          re={reV}
          sp={spV}
          tb={tbV}
        />

        {/* horizon bar chart */}
        <div className="mt-4 border-2 border-foreground p-4 sm:p-6">
          <p className="text-xs font-black uppercase text-muted-foreground">
            Value after {horizonLabel} hold — side by side
          </p>
          <div className="mt-4 overflow-x-auto">
            <div className="min-w-[480px] space-y-3">
              {(() => {
                const barMax =
                  Math.max(...benchRows.map((b) => Math.max(b.value, b.hiV ?? 0)), 1) *
                  1.03;
                return benchRows.map((b) => (
                  <div className="flex items-center gap-3" key={b.name}>
                    <p className="w-32 shrink-0 text-right text-xs font-bold leading-tight sm:w-40">
                      {b.name}
                    </p>
                    <div className="relative h-6 flex-1 bg-muted">
                      <div
                        className="absolute left-0 top-0 h-full bg-foreground"
                        style={{
                          width: `${Math.max(1, (b.value / barMax) * 100).toFixed(1)}%`,
                        }}
                      />
                      {b.hasRange ? (
                        <>
                          <div
                            className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-muted-foreground"
                            style={{
                              left: `${(((b.loV ?? 0) / barMax) * 100).toFixed(1)}%`,
                              width: `${Math.max(0, (((b.hiV ?? 0) - (b.loV ?? 0)) / barMax) * 100).toFixed(1)}%`,
                            }}
                          />
                          <div
                            className="absolute bottom-1 top-1 w-0.5 bg-muted-foreground"
                            style={{
                              left: `${(((b.loV ?? 0) / barMax) * 100).toFixed(1)}%`,
                            }}
                          />
                          <div
                            className="absolute bottom-1 top-1 w-0.5 bg-muted-foreground"
                            style={{
                              left: `${(((b.hiV ?? 0) / barMax) * 100).toFixed(1)}%`,
                            }}
                          />
                        </>
                      ) : null}
                    </div>
                    <div className="w-28 shrink-0 text-right">
                      <p className="text-xs font-black tabular-nums">
                        {fmtMoney(b.value)}
                      </p>
                      <p className="text-[10px] font-bold tabular-nums text-muted-foreground">
                        {fmtSignedPct(b.rate)}/yr
                      </p>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
          <p className="mt-3 text-xs font-bold leading-relaxed text-muted-foreground">
            Dollar figures are total value after {horizonLabel.replace("-", " ")}{" "}
            hold; the smaller number under each is that same result expressed
            as a yearly rate, so it lines up with how the S&amp;P 500 and
            Treasuries are usually quoted. The bracket shows this fleet&apos;s
            worst-case-to-best-case range ({roiRange} a year). The other bars
            are fixed, adjustable assumptions, not modeled ranges. The last
            two aren&apos;t something {fmtMoney(investUsd)} can replicate
            directly — they show what much bigger, professionally financed
            businesses in this same space typically earn, for scale.
          </p>
        </div>

        {/* stat cards */}
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {benchRows.map((b, i) => (
            <div className="border-2 border-foreground p-3 sm:p-4" key={b.name}>
              <p className="text-xs font-bold text-muted-foreground">
                {b.name} · value at {T / 12} yr
              </p>
              <p className="mt-1 text-xl font-black tabular-nums sm:text-2xl">
                {fmtMoney(b.value)}
              </p>
              <p className="mt-1 text-xs font-bold text-muted-foreground">
                {fmtSignedPct(b.rate)} a year
                {i === 0
                  ? ` · ${fmtSignedPct(annB - BENCHMARK_RETURNS.sp500).replace("%", " percentage points")} vs the stock market`
                  : ""}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ 06 COMPARE ============ */}
      <section className="scroll-mt-32 pt-12" id="compare">
        <SectionHeading num="06" title="All fleets, side by side" />
        <p className="mt-2 max-w-3xl text-sm font-bold leading-relaxed text-muted-foreground">
          Same starting money, same assumptions, applied to each type of card.
          Yearly returns are for the {horizonLabel.replace("-", " ")} holding
          period you picked above, and include selling the hardware at the
          end. Click a row to make it the selected fleet.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] border-2 border-foreground text-left">
            <thead>
              <tr>
                <Th>Fleet</Th>
                <Th className="text-right">Cards</Th>
                <Th className="text-right">Total memory</Th>
                <Th className="text-right">Net / month</Th>
                <Th className="text-right">Payback</Th>
                <Th className="text-right">Yearly return</Th>
                <Th className="text-right">Scenario range</Th>
              </tr>
            </thead>
            <tbody>
              {allFleets.map(({ card, base: b, lo: l, hi: h }) => {
                const none = b.units === 0;
                const selected = card.id === cardId;
                return (
                  <tr
                    className={`cursor-pointer ${selected ? "bg-muted" : "hover:bg-muted"}`}
                    key={card.id}
                    onClick={() => setCardId(card.id)}
                  >
                    <Td className={selected ? "font-black" : "font-bold"}>
                      <a
                        className="underline underline-offset-4"
                        href={card.buyUrl}
                        onClick={(ev) => ev.stopPropagation()}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        {card.name}
                      </a>
                    </Td>
                    <Td className="text-right tabular-nums">
                      {none ? "—" : b.units}
                    </Td>
                    <Td className="text-right tabular-nums">
                      {none
                        ? "—"
                        : `${(b.units * card.vramGb).toLocaleString("en-US")} GB`}
                    </Td>
                    <Td className="text-right tabular-nums">
                      {none ? "—" : fmtMoney(b.monthlyNetUsd)}
                    </Td>
                    <Td className="text-right tabular-nums">
                      {none ? "—" : paybackLabel(b)}
                    </Td>
                    <Td className="text-right font-black tabular-nums">
                      {none ? "—" : fmtSignedPct(b.annualizedAt(T))}
                    </Td>
                    <Td className="text-right tabular-nums text-muted-foreground">
                      {none
                        ? "—"
                        : `${fmtSignedPct(l.annualizedAt(T))} to ${fmtSignedPct(h.annualizedAt(T))}`}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ============ 07 OPEN MODELS ============ */}
      <section className="scroll-mt-32 pt-12" id="models">
        <SectionHeading num="07" title="Can it run the best open-source models?" />
        <p className="mt-2 max-w-3xl text-sm font-bold leading-relaxed text-muted-foreground">
          Besides renting GPUs out for cash, there&apos;s a second use for
          this hardware: running a powerful AI model yourself, for free,
          instead of paying a company per use. The strongest models anyone is
          allowed to download and run at home are enormous — the catch is they
          need a lot of memory. GLM 5.2, one of the largest and strongest
          right now, is used below as the yardstick.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label
            className="text-sm font-black uppercase"
            htmlFor="glm-quant-select"
          >
            Quality setting
          </label>
          <select
            className="border-2 border-foreground bg-background px-3 py-2 text-sm font-bold"
            id="glm-quant-select"
            onChange={(ev) => setQuant(ev.target.value as GlmQuant)}
            value={quant}
          >
            <option value="fp8">Full quality (~800 GB)</option>
            <option value="q4">Compressed, barely noticeable loss (~440 GB)</option>
            <option value="q3">Heavily compressed, lower quality (~340 GB)</option>
          </select>
          <p className="text-sm font-bold text-muted-foreground">
            Needs{" "}
            <span className="font-black text-foreground">
              {GLM_MEMORY_GB[quant]} GB
            </span>{" "}
            of memory
          </p>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[680px] border-2 border-foreground text-left">
            <thead>
              <tr>
                <Th>Card</Th>
                <Th className="text-right">Cards needed</Th>
                <Th className="text-right">Hardware cost</Th>
                <Th className="text-right">Power used</Th>
                <Th className="text-right">Cards your budget buys</Th>
                <Th className="text-right">Verdict</Th>
              </tr>
            </thead>
            <tbody>
              {glmRows.map(({ card, fleetUnits, fit }) => (
                <tr key={card.id}>
                  <Td className="font-bold">
                    <a
                      className="underline underline-offset-4"
                      href={card.buyUrl}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {card.name}
                    </a>
                  </Td>
                  <Td className="text-right tabular-nums">
                    {fit.cardsNeeded}× ({fit.pooledVramGb} GB)
                  </Td>
                  <Td className="text-right tabular-nums">
                    {fmtMoney(fit.hardwareCostUsd)}
                  </Td>
                  <Td className="text-right tabular-nums">
                    {fit.powerKw.toFixed(1)} kW
                  </Td>
                  <Td className="text-right tabular-nums">{fleetUnits} cards</Td>
                  <Td className="text-right font-black">{fit.verdict}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 max-w-3xl text-xs font-bold leading-relaxed text-muted-foreground">
          This uses GLM 5.2 as the stand-in — roughly 700 billion parameters,
          in line with today&apos;s other top open-weight models (DeepSeek,
          Kimi, Llama) — and includes memory for a long AI conversation, not
          just the model itself. Connecting many separate gaming GPUs together
          to run one huge model is slower than using fewer, more powerful
          cards built for this job (like the workstation and datacenter
          options above). Treat these numbers as rough estimates, not exact
          specs.
        </p>
        <p className="mt-4 max-w-3xl text-base font-bold leading-relaxed">
          A node like this can also connect to the Optimitron over MCP, pull
          tasks, work them locally, and report back — which means the task
          tree keeps updating even if every hosted AI on Earth is suddenly
          busy, restricted, or reading your mail.
        </p>
      </section>

      {/* ============ 08 SHORTAGE ============ */}
      <section className="scroll-mt-32 pt-12" id="shortage">
        <SectionHeading
          num="08"
          title="A demand-driven shortage — and how long it lasts"
        />
        <p className="mt-2 max-w-3xl text-sm font-bold leading-relaxed text-muted-foreground">
          Worth being precise about what kind of shortage this is, since
          it&apos;s not the usual kind. Supply hasn&apos;t fallen — factories
          are running flat out and still expanding (see the timeline below).
          Demand is just rising faster, because AI models keep getting more
          capable, and more capable AI is worth more to run. Here&apos;s the
          chain of cause and effect: AI capability keeps improving → that
          makes running AI on longer, harder, always-on tasks economically
          worth it, so usage climbed → that pushed demand for a specific
          high-speed memory chip up over 130% in 2025 alone, and it&apos;s
          still growing 70%+ in 2026 → memory-chip factories shifted
          production toward that high-speed chip because it&apos;s more
          profitable to make → ordinary memory chips, including the kind in
          every graphics card, became scarce too, as a side effect → new
          factories take 18–24 months to reach full production, so relief
          can&apos;t arrive faster than that, no matter what.
        </p>

        <FabTimeline />
        <p className="mt-2 max-w-3xl text-xs font-bold leading-relaxed text-muted-foreground">
          This new factory capacity is real and already being built —
          it&apos;s not a guess. The delay is just physical reality: factories
          take years to build and ramp up, no matter how good anyone&apos;s
          forecasting is. Timeline based on reporting from Digitimes, SemiWiki,
          and Data Center Dynamics.
        </p>

        <h3 className="mt-8 text-lg font-black uppercase">
          The bigger, separate question: computing power overall
        </h3>
        <p className="mt-2 max-w-3xl text-sm font-bold leading-relaxed text-muted-foreground">
          Zoom out from that one memory chip, and ask a bigger question: does
          the world&apos;s ability to manufacture advanced AI chips, period,
          ever catch up with how fast AI&apos;s usable computing power is
          growing? That&apos;s a different clock than the one above.
          Here&apos;s what the gap looks like:
        </p>
        <DemandSupplyChart />

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="border-2 border-foreground p-4">
            <p className="text-xs font-black uppercase text-muted-foreground">
              AI computing demand
            </p>
            <p className="mt-1 text-xl font-black">Doubles every 6–10 months</p>
            <p className="mt-1 text-xs font-bold text-muted-foreground">
              How much computing power it takes to train and run the best AI
              models — tracked since 2010.
            </p>
          </div>
          <div className="border-2 border-foreground p-4">
            <p className="text-xs font-black uppercase text-muted-foreground">
              Chip-finishing capacity (tightest bottleneck)
            </p>
            <p className="mt-1 text-xl font-black">Doubles every ~18 months</p>
            <p className="mt-1 text-xs font-bold text-muted-foreground">
              Even at chip-maker TSMC&apos;s own most aggressive published
              growth plan for the specialized step that turns raw chips into
              finished GPUs.
            </p>
          </div>
          <div className="border-2 border-foreground p-4">
            <p className="text-xs font-black uppercase text-muted-foreground">
              Brand-new chip factories
            </p>
            <p className="mt-1 text-xl font-black">Doubles every ~5 years</p>
            <p className="mt-1 text-xs font-bold text-muted-foreground">
              At the industry&apos;s typical pace of adding about 15% more
              factory capacity a year.
            </p>
          </div>
        </div>
        <p className="mt-3 max-w-3xl text-xs font-bold leading-relaxed text-muted-foreground">
          Demand can double six to ten times over in the time it takes
          brand-new factory capacity to double even once. That gap has held
          for over a decade with no sign of closing — so even once the
          narrower memory-chip squeeze above eases on schedule, this
          longer-running race is why scarcity, and the pricing power that
          comes with it, could persist well beyond it.
        </p>

        {/* forecast revisions */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {FORECAST_REVISIONS.map((f) => (
            <div className="border-2 border-foreground p-4" key={f.year}>
              <p className="text-xs font-black uppercase text-muted-foreground">
                {f.year} global memory market — forecast revised in 4 months
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="w-24 shrink-0 text-xs font-bold text-muted-foreground">
                  Jan 2026 est.
                </span>
                <div className="h-4 flex-1 bg-muted">
                  <div
                    className="h-full bg-muted-foreground"
                    style={{
                      width: `${((f.earlyBillions / FORECAST_MAX_BILLIONS) * 100).toFixed(1)}%`,
                    }}
                  />
                </div>
                <span className="w-16 shrink-0 text-right text-xs font-black tabular-nums">
                  ${f.earlyBillions}B
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="w-24 shrink-0 text-xs font-bold text-muted-foreground">
                  May 2026 est.
                </span>
                <div className="h-4 flex-1 bg-muted">
                  <div
                    className="h-full bg-foreground"
                    style={{
                      width: `${((f.lateBillions / FORECAST_MAX_BILLIONS) * 100).toFixed(1)}%`,
                    }}
                  />
                </div>
                <span className="w-16 shrink-0 text-right text-xs font-black tabular-nums">
                  {f.lateLabel}
                </span>
              </div>
              <p className="mt-2 text-xs font-black">
                Revised up{" "}
                {Math.round((f.lateBillions / f.earlyBillions - 1) * 100)}% in
                four months — demand accelerating, not cooling
              </p>
            </div>
          ))}
        </div>

        {/* scenario cards */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {SHORTAGE_SCENARIO_CARDS.map((c) => (
            <div
              className={`border-2 border-foreground p-4 ${c.highlight ? "bg-muted" : ""}`}
              key={c.name}
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-black uppercase">{c.name}</p>
                <p className="whitespace-nowrap text-xs font-black tabular-nums">
                  {c.when}
                </p>
              </div>
              <p className="mt-2 text-xs font-bold leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>
        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-bold text-muted-foreground">
            Important context about these shortage forecasts
          </summary>
          <p className="mt-2 max-w-3xl text-xs font-bold leading-relaxed text-muted-foreground">
            These three timelines are forecasts for the narrower memory-chip
            squeeze described above only — not the bigger computing-power
            race, which nobody puts a date on. Worth being skeptical of
            &quot;base case&quot; as a safe default even for the narrower
            forecast, though: forecasts for this shortage have been revised
            toward <em>more</em> shortage, not less, more than once in the
            past year (see the forecasts climbing higher every few months,
            above) — so treat it as a working assumption, not a settled
            outcome. Separately: what&apos;s bad news for memory-chip buyers
            generally is good news for this investment. A &quot;worst
            case&quot; for the overall shortage (it drags on longer) means
            higher rental rates and card values here — and a &quot;best
            case&quot; for chip buyers generally means the opposite for this
            investment. Two more options in §01 aren&apos;t from analyst
            forecasts at all: one imagines chip ownership getting restricted,
            and one imagines AI improving itself faster than anyone can
            currently predict — both included so you can see how far the
            upside could stretch, not because either is likely.
          </p>
        </details>
      </section>

      {/* ============ 09 THESIS ============ */}
      <section className="scroll-mt-32 pt-12" id="thesis">
        <SectionHeading num="09" title="The demand thesis, examined" />
        <p className="mt-2 max-w-3xl text-sm font-bold leading-relaxed text-muted-foreground">
          The case for this investment isn&apos;t just rental income —
          it&apos;s a bet on who gets to use the most advanced AI. Both sides
          of that argument are laid out plainly below. The presets in §01 turn
          these stories into slider positions.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="border-2 border-foreground p-4 sm:p-6">
            <p className="text-lg font-black uppercase">
              The case for owning compute
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm font-bold leading-relaxed">
              {CASE_FOR.map((li) => (
                <li key={li.slice(0, 40)}>{li}</li>
              ))}
            </ul>
          </div>
          <div className="border-2 border-foreground p-4 sm:p-6">
            <p className="text-lg font-black uppercase">The case against</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm font-bold leading-relaxed">
              {CASE_AGAINST.map((li) => (
                <li key={li.slice(0, 40)}>{li}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* asymmetric risk */}
        <div className="mt-4 border-2 border-foreground bg-muted p-4 sm:p-6">
          <p className="text-lg font-black uppercase">
            The risk here is lopsided — in your favor
          </p>
          <p className="mt-2 max-w-3xl text-sm font-bold leading-relaxed">
            Most investments have symmetric risk: you can lose as much as you
            can gain. This one doesn&apos;t. Here&apos;s every scenario on
            this page, plotted on the same scale — notice how compressed the
            downside is compared to the upside:
          </p>
          <div className="mt-4 space-y-2">
            {riskRows.rows.map((r) => (
              <div className="flex items-center gap-2" key={r.id}>
                <p className="w-28 shrink-0 text-right text-[11px] font-bold leading-tight sm:w-40 sm:text-xs">
                  {r.name}
                </p>
                <div className="relative h-5 flex-1 overflow-hidden bg-background">
                  <div
                    className={
                      r.value >= investUsd
                        ? "h-full bg-foreground"
                        : "h-full bg-muted-foreground"
                    }
                    style={{ width: `${r.pct.toFixed(1)}%` }}
                  />
                  <div
                    className="absolute bottom-0 top-0 border-l-2 border-dashed border-foreground"
                    style={{ left: `${riskRows.investPct.toFixed(1)}%` }}
                  />
                </div>
                <p className="w-20 shrink-0 text-right text-[11px] font-black tabular-nums sm:w-24 sm:text-xs">
                  {fmtMoney(r.value)}
                </p>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <span className="w-28 shrink-0 sm:w-40" />
              <div className="relative h-4 flex-1">
                <p
                  className="absolute -translate-x-1/2 whitespace-nowrap text-[10px] font-black"
                  style={{ left: `${riskRows.investPct.toFixed(1)}%` }}
                >
                  ↑ {fmtMoney(investUsd)} invested
                </p>
              </div>
              <span className="w-20 shrink-0 sm:w-24" />
            </div>
          </div>
          <p className="mt-1 text-right text-[10px] font-bold text-muted-foreground">
            {horizonLabel} hold · {selCard.name} · all scenarios from §01 ·
            solid bars end above your stake, gray bars below it
          </p>
          <p className="mt-3 max-w-3xl text-sm font-bold leading-relaxed">
            The worst case — chip factories catch up fast and rental rates
            crater — still leaves you holding real hardware that works and has
            resale value. The downside is &quot;I sold a used car at a
            loss.&quot; The upside is unbounded. A stock can go to zero. A
            house can burn down. A GPU in your basement is still a GPU.
          </p>
          <p className="mt-2 max-w-3xl text-xs font-bold text-muted-foreground">
            The scenarios where this investment does worst are the scenarios
            where everything else is fine anyway. The scenarios where it does
            best are the ones where you&apos;re really glad you have it.
          </p>
        </div>

        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-bold text-muted-foreground">
            Academic research behind the &quot;AI takes off&quot; idea
          </summary>
          <p className="mt-2 max-w-3xl text-xs font-bold leading-relaxed text-muted-foreground">
            Serious researchers have modeled what happens if AI keeps driving
            economic growth.{" "}
            <a
              className="underline"
              href="https://www.alignmentforum.org/posts/Gc9FGtdXhK9sCSEYu/what-a-compute-centric-framework-says-about-ai-takeoff"
              rel="noopener noreferrer"
              target="_blank"
            >
              Open Philanthropy&apos;s model of an AI-driven growth explosion
            </a>{" "}
            (built with Epoch AI) and{" "}
            <a
              className="underline"
              href="https://epoch.ai/blog/announcing-gate"
              rel="noopener noreferrer"
              target="_blank"
            >
              Epoch AI&apos;s economic-growth model (GATE)
            </a>{" "}
            both estimate the conditions under which automation could push
            economic growth past 20% a year, and{" "}
            <a
              className="underline"
              href="https://www.nber.org/system/files/working_papers/w35155/w35155.pdf"
              rel="noopener noreferrer"
              target="_blank"
            >
              a 2026 academic paper
            </a>{" "}
            works out the math behind the old idea that a smart-enough AI
            could set off a runaway, self-reinforcing cycle. None of this
            turns into a GPU price, though — these models estimate growth for
            the whole economy, not the price of a single card, and nobody has
            bridged that gap. So the honest tool here is still: pick the story
            you find most believable, see what it implies for the sliders, and
            see how far the range stretches.
          </p>
        </details>

        {/* METR */}
        <div className="mt-4 border-2 border-foreground p-4 sm:p-6">
          <h3 className="text-lg font-black uppercase">
            How fast is AI actually improving?
          </h3>
          <p className="mt-2 max-w-3xl text-sm font-bold leading-relaxed text-muted-foreground">
            The &quot;AI takes off very fast&quot; option in §01 rests on one
            idea: AI could start improving itself faster than chip factories
            can add supply, because software gets better on a timescale of
            months, while new factories take years to build. Nobody can prove
            this will happen — but here&apos;s the best real-world evidence
            that AI capability is already compounding fast.
          </p>
          <p className="mt-3 text-sm font-black uppercase">
            How long an AI can work alone before it needs a human to step in
          </p>
          <MetrChart />
          <details className="mt-2">
            <summary className="cursor-pointer text-xs font-bold text-muted-foreground">
              Source and caveats for this chart
            </summary>
            <p className="mt-2 max-w-3xl text-xs font-bold leading-relaxed text-muted-foreground">
              Tracked by{" "}
              <a
                className="underline"
                href="https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/"
                rel="noopener noreferrer"
                target="_blank"
              >
                METR
              </a>
              , a research group that tests how long a task AI systems can
              complete entirely on their own, reliably (succeeding at least
              half the time). This doubled roughly every 7 months from
              2019–2023, then{" "}
              <a
                className="underline"
                href="https://apiardata.com/statistics/ai-autonomous-task-horizon/"
                rel="noopener noreferrer"
                target="_blank"
              >
                accelerated to every 4 months since late 2023
              </a>
              . Claude Opus 4.6 hit 14.5 hours in February 2026; Claude Mythos
              Preview hit 16 hours in March. At this rate, METR&apos;s own
              data projects week-long autonomous tasks by late 2026 and
              month-long tasks by mid-2027.
            </p>
            <p className="mt-2 max-w-3xl text-xs font-bold leading-relaxed text-muted-foreground">
              That&apos;s a measure of task length, not dollars — nobody has
              published a way to turn &quot;AI is improving&quot; directly
              into a GPU price, which is why this stays outside the model. But
              the direction is clear: every few months, the amount of useful
              work one of these chips can do autonomously roughly doubles.
              That&apos;s what drives demand.
            </p>
          </details>
        </div>

        {/* forecasters */}
        <div className="mt-4 border-2 border-foreground p-4 sm:p-6">
          <h3 className="text-lg font-black uppercase">
            What do forecasters expect?
          </h3>
          <p className="mt-2 max-w-3xl text-sm font-bold leading-relaxed text-muted-foreground">
            Four different groups that try to predict the future were asked
            some version of &quot;when will AI match or beat people at almost
            everything?&quot; Each group defined the question a little
            differently, so these are four independent guesses, not four
            points on one shared curve.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {FORECASTER_CARDS.map((f) => (
              <div className="flex flex-col border-2 border-foreground p-4" key={f.title}>
                <p className="text-sm font-black leading-snug">{f.title}</p>
                <p className="mt-2 text-2xl font-black tabular-nums">{f.value}</p>
                <p className="mt-1 flex-1 text-xs font-bold leading-relaxed">
                  {f.body}
                </p>
                <a
                  className="mt-3 border-t border-foreground pt-2 text-[11px] font-bold text-muted-foreground underline-offset-4 hover:underline"
                  href={f.url}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {f.source} ↗
                </a>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] font-bold text-muted-foreground">
            Metaculus &amp; Samotsvety figures via 80,000 Hours; Manifold
            figure via AIMultiple; Forecasting Research Institute&apos;s own
            LEAP survey report.
          </p>
          <p className="mt-3 max-w-3xl text-sm font-bold leading-relaxed">
            Predictions have moved a lot closer to &quot;soon&quot; over time:
            in 2020, the average guess on Metaculus was about fifty years out;
            by 2026 it had moved to within this decade. But the most recent
            year actually moved the other way — that same average guess got
            about two and a half years later during 2025, as forecasters
            weighed real-world slowdowns against raw progress. The one
            prediction market asking specifically about this page&apos;s core
            idea — AI improving itself — puts the odds at 18% by the middle of
            2026, which is basically now. None of this tells us what a GPU
            will rent for. It&apos;s the best public evidence for whether the
            &quot;AI takes off very fast&quot; option is a reasonable thing to
            imagine, not a substitute for actually modeling one.
          </p>
        </div>
      </section>

      {/* ============ 10 RISKS ============ */}
      <section className="scroll-mt-32 pt-12" id="risks">
        <SectionHeading num="10" title="What could go wrong" />
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {RISKS.map((r) => (
            <div className="border-2 border-foreground p-4" key={r.title}>
              <p className="text-sm font-black uppercase">{r.title}</p>
              <p className="mt-2 text-xs font-bold leading-relaxed">{r.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* sticky results footer — the verdict follows you; settings expand up */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-foreground bg-background">
        {drawerOpen ? (
          <div className="max-h-[70vh] overflow-y-auto border-b-2 border-foreground px-4 py-4 sm:px-6">
            <div className="mx-auto max-w-5xl">
              <p className="text-xs font-black uppercase">Fleet</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {GPU_FLEET_CATALOG.map((c) => (
                  <button
                    className={`border-2 border-foreground px-3 py-1.5 text-xs font-black uppercase ${
                      c.id === cardId
                        ? "bg-foreground text-background"
                        : "bg-background text-foreground hover:bg-muted"
                    }`}
                    key={c.id}
                    onClick={() => setCardId(c.id)}
                    type="button"
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              <p className="mt-4 text-xs font-black uppercase">Scenario</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {FLEET_PRESETS.map((p) => (
                  <button
                    className={`border-2 border-foreground px-3 py-1.5 text-xs font-black uppercase ${
                      preset === p.id
                        ? "bg-foreground text-background"
                        : "bg-background text-foreground hover:bg-muted"
                    }`}
                    key={p.id}
                    onClick={() => applyPreset(p.id)}
                    type="button"
                  >
                    {p.name}
                  </button>
                ))}
              </div>

              <div className="mt-2 grid grid-cols-1 gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
                <Slider
                  format={(v) => fmtMoney(v)}
                  label="Initial investment"
                  max={500_000}
                  min={2000}
                  onChange={manual(setInvestUsd)}
                  step={1000}
                  value={investUsd}
                />
                <Slider
                  format={(v) => `${v}¢/kWh`}
                  label="Electricity rate"
                  max={45}
                  min={5}
                  onChange={manual(setElec)}
                  step={0.5}
                  value={elec}
                />
                <Slider
                  format={(v) => `${v}%`}
                  label="Utilization"
                  max={95}
                  min={30}
                  onChange={manual(setUtil)}
                  step={1}
                  value={util}
                />
                <Slider
                  format={(v) => `${v}%`}
                  label="Marketplace fee"
                  max={40}
                  min={0}
                  onChange={manual(setFee)}
                  step={1}
                  value={fee}
                />
                <Slider
                  format={(v) => `${fmtSignedInt(v)}%/yr`}
                  label="Card price trend"
                  max={70}
                  min={-30}
                  onChange={manual(setDrift)}
                  step={1}
                  value={drift}
                />
                <Slider
                  format={(v) => `${fmtSignedInt(v)}%/yr`}
                  label="Rental rate trend"
                  max={60}
                  min={-40}
                  onChange={manual(setRateDrift)}
                  step={1}
                  value={rateDrift}
                />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <p className="text-xs font-black uppercase">Holding period</p>
                {HORIZON_OPTIONS.map((h) => (
                  <button
                    className={`border-2 border-foreground px-3 py-1 text-xs font-black ${
                      horizon === h
                        ? "bg-foreground text-background"
                        : "bg-background text-foreground hover:bg-muted"
                    }`}
                    key={h}
                    onClick={() => setHorizon(h)}
                    type="button"
                  >
                    {h / 12} yr
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2 sm:px-6">
          <p className="hidden min-w-0 truncate text-xs font-bold text-muted-foreground sm:block">
            {selCard.name} · {presetLabel} · {horizonLabel} hold
          </p>
          <div className="flex flex-1 items-center justify-end gap-x-4 gap-y-1">
            <p className="text-sm font-black tabular-nums sm:text-base">
              {base.units === 0 ? "—" : fmtMoney(base.valueAt(T))}
            </p>
            <p className="text-sm font-black tabular-nums text-muted-foreground sm:text-base">
              {roiHeadline}/yr
            </p>
            <button
              className="border-2 border-foreground bg-foreground px-3 py-1.5 text-xs font-black uppercase text-background hover:bg-background hover:text-foreground"
              onClick={() => setDrawerOpen((v) => !v)}
              type="button"
            >
              {drawerOpen ? "Close ▾" : "Adjust ▴"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ primitives */

function SectionHeading({ num, title }: { num: string; title: string }) {
  return (
    <div className="flex items-baseline gap-3 border-b-2 border-foreground pb-2">
      <span className="text-sm font-black text-muted-foreground">{num}</span>
      <h2 className="text-2xl font-black uppercase leading-tight sm:text-3xl">
        {title}
      </h2>
    </div>
  );
}

function Slider({
  format,
  label,
  max,
  min,
  onChange,
  step,
  value,
}: {
  format: (v: number) => string;
  label: string;
  max: number;
  min: number;
  onChange: (v: number) => void;
  step: number;
  value: number;
}) {
  return (
    <div className="py-4">
      <div className="flex items-center justify-between gap-2 text-sm font-bold">
        <span className="uppercase">{label}</span>
        <span className="tabular-nums">{format(value)}</span>
      </div>
      <input
        aria-label={label}
        className="mt-2 h-2 w-full cursor-pointer appearance-none bg-foreground accent-foreground"
        max={max}
        min={min}
        onChange={(e) => onChange(Number(e.target.value))}
        step={step}
        type="range"
        value={value}
      />
    </div>
  );
}

function StatTile({
  caption,
  label,
  range,
  value,
}: {
  caption: string;
  label: string;
  /** Worst-to-best band across the lo/hi scenarios. */
  range?: string;
  value: string;
}) {
  return (
    <div className="bg-foreground p-4 text-background sm:p-5">
      <p className="text-xs font-black uppercase">{label}</p>
      <p className="mt-1 text-3xl font-black tabular-nums">{value}</p>
      {range ? (
        <p className="mt-0.5 text-xs font-bold tabular-nums">{range}</p>
      ) : null}
      <p className="mt-1 text-[11px] font-bold">{caption}</p>
    </div>
  );
}

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`border border-foreground px-3 py-2 text-xs font-black uppercase ${className}`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={`border border-foreground px-3 py-2 text-sm font-bold ${className}`}>
      {children}
    </td>
  );
}

function PlRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-foreground py-2 text-sm">
      <dt className="font-bold">{label}</dt>
      <dd className="whitespace-nowrap font-bold tabular-nums">{value}</dd>
    </div>
  );
}

/* ---------------------------------------------------------------- charts */

const CHART = { X0: 62, X1: 850, Y0: 14, Y1: 310, W: 1000, H: 348 };

function niceYStep(maxV: number): number {
  const raw = maxV / 5;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const nice = norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10;
  return nice * mag;
}

/**
 * 5-year total-value chart. Series are told apart by stroke width and dash
 * pattern plus direct labels at the line ends — no color.
 */
function ValueChart({
  cash,
  fleetHi,
  fleetLo,
  fleetName,
  fleetValue,
  horizon,
  re,
  sp,
  tb,
}: {
  cash: (m: number) => number;
  fleetHi: (m: number) => number;
  fleetLo: (m: number) => number;
  fleetName: string;
  fleetValue: (m: number) => number;
  horizon: number;
  re: (m: number) => number;
  sp: (m: number) => number;
  tb: (m: number) => number;
}) {
  const { X0, X1, Y0, Y1, W, H } = CHART;
  const maxV = Math.max(fleetHi(SIM_MONTHS), sp(SIM_MONTHS), re(SIM_MONTHS)) * 1.06;
  const px = (m: number) => X0 + ((X1 - X0) * m) / SIM_MONTHS;
  const py = (v: number) => Y1 - ((Y1 - Y0) * Math.max(0, v)) / maxV;
  const linePath = (fn: (m: number) => number) => {
    let path = "";
    for (let m = 0; m <= SIM_MONTHS; m += 2) {
      path += `${m ? " L" : "M"}${px(m).toFixed(1)} ${py(fn(m)).toFixed(1)}`;
    }
    return path;
  };
  let band = linePath(fleetHi);
  for (let m = SIM_MONTHS; m >= 0; m -= 2) {
    band += ` L${px(m).toFixed(1)} ${py(fleetLo(m)).toFixed(1)}`;
  }
  band += " Z";

  const step = niceYStep(maxV);
  const gridlines = [1, 2, 3, 4]
    .map((k) => ({ v: step * k, y: py(step * k) }))
    .filter((g) => g.y > Y0);

  const series = [
    { label: "This fleet", width: 3, dash: undefined as string | undefined, fn: fleetValue, bold: true, mutedStroke: false },
    { label: "S&P 500", width: 1.5, dash: undefined, fn: sp, bold: false, mutedStroke: false },
    { label: "Treasuries", width: 1.5, dash: "8 4", fn: tb, bold: false, mutedStroke: false },
    { label: "Rental real estate", width: 1.5, dash: "2 3", fn: re, bold: false, mutedStroke: false },
    { label: "Cash", width: 1, dash: "1 3", fn: cash, bold: false, mutedStroke: true },
  ];

  // Dodge overlapping end labels: sort by end y, force 14px separation.
  const labeled = series
    .map((s) => ({ ...s, endY: py(s.fn(SIM_MONTHS)) }))
    .sort((a, b) => a.endY - b.endY);
  for (let i = 1; i < labeled.length; i++) {
    const prev = labeled[i - 1]!;
    const cur = labeled[i]!;
    if (cur.endY < prev.endY + 14) cur.endY = prev.endY + 14;
  }

  return (
    <figure className="mt-4 border-2 border-foreground p-3 sm:p-4">
      <div className="overflow-x-auto">
        <svg
          aria-label={`Total value of the ${fleetName} fleet vs benchmarks over 5 years`}
          className="min-w-[680px] text-foreground"
          role="img"
          viewBox={`0 0 ${W} ${H}`}
        >
          {gridlines.map((g) => (
            <g key={g.v}>
              <line
                className="text-muted-foreground"
                stroke="currentColor"
                strokeDasharray="2 4"
                strokeWidth={0.75}
                x1={X0}
                x2={X1}
                y1={g.y}
                y2={g.y}
              />
              <text
                className="text-muted-foreground"
                fill="currentColor"
                fontSize={11}
                textAnchor="end"
                x={X0 - 8}
                y={g.y + 4}
              >
                ${Math.round(g.v / 1000)}k
              </text>
            </g>
          ))}
          <path className="text-muted" d={band} fill="currentColor" />
          {series.map((s) => (
            <path
              className={s.mutedStroke ? "text-muted-foreground" : "text-foreground"}
              d={linePath(s.fn)}
              fill="none"
              key={s.label}
              stroke="currentColor"
              strokeDasharray={s.dash}
              strokeWidth={s.width}
            />
          ))}
          <line
            stroke="currentColor"
            strokeDasharray="3 3"
            strokeWidth={1}
            x1={px(horizon)}
            x2={px(horizon)}
            y1={Y0}
            y2={Y1}
          />
          <text
            fill="currentColor"
            fontSize={10}
            fontWeight={700}
            textAnchor="middle"
            x={px(horizon)}
            y={Y0 - 2}
          >
            your horizon
          </text>
          {labeled.map((s) => (
            <text
              className={s.mutedStroke ? "text-muted-foreground" : "text-foreground"}
              fill="currentColor"
              fontSize={11}
              fontWeight={s.bold ? 800 : 600}
              key={s.label}
              x={X1 + 8}
              y={Math.min(Y1, Math.max(Y0 + 8, s.endY)) + 4}
            >
              {s.label}
            </text>
          ))}
          {[0, 12, 24, 36, 48, 60].map((m) => (
            <text
              className="text-muted-foreground"
              fill="currentColor"
              fontSize={11}
              key={m}
              textAnchor="middle"
              x={px(m)}
              y={H - 8}
            >
              {m === 0 ? "now" : `${m} mo`}
            </text>
          ))}
        </svg>
      </div>
      <figcaption className="mt-2 text-[11px] font-bold text-muted-foreground">
        Thick line = this fleet (most likely case). Shaded band = its
        worst-to-best scenario range. Thin solid = S&amp;P 500; long dashes =
        Treasuries; short dashes = rental real estate; dotted = cash eroded by
        inflation.
      </figcaption>
    </figure>
  );
}

const FAB_EVENTS = [
  { year: 2027, label: "Micron Singapore", when: "2027", tier: 1 },
  { year: 2027.3, label: "SK Hynix Cheongju", when: "2027", tier: 2 },
  { year: 2027.5, label: "SK Hynix M15X", when: "mid-2027", tier: 3 },
  { year: 2028, label: "Samsung Pyeongtaek P5", when: "2028", tier: 1 },
  { year: 2028.8, label: "SK Hynix West Lafayette", when: "end 2028", tier: 2 },
  { year: 2030, label: "Micron Onondaga (full)", when: "2030", tier: 3 },
];

/** New memory-fab capacity timeline, 2026-2030. Static reference data. */
function FabTimeline() {
  const X0 = 70;
  const X1 = 880;
  const YR0 = 2026;
  const YR1 = 2030.3;
  const x = (year: number) => X0 + ((X1 - X0) * (year - YR0)) / (YR1 - YR0);
  const nowX = x(2026.5);
  const reliefX = x(2027);
  const normalX = x(2028.5);
  const tierY = [58, 88, 118];
  return (
    <figure className="mt-4 border-2 border-foreground p-3 sm:p-4">
      <div className="overflow-x-auto">
        <svg
          aria-label="New memory-chip factory capacity arriving 2027 through 2030"
          className="min-w-[640px] text-foreground"
          role="img"
          viewBox="0 0 900 175"
        >
          {/* phase bands */}
          <rect
            className="text-muted"
            fill="currentColor"
            height={145}
            width={reliefX - X0}
            x={X0}
            y={8}
          />
          <line
            stroke="currentColor"
            strokeDasharray="3 3"
            strokeWidth={1}
            x1={reliefX}
            x2={reliefX}
            y1={8}
            y2={153}
          />
          <line
            stroke="currentColor"
            strokeDasharray="3 3"
            strokeWidth={1}
            x1={normalX}
            x2={normalX}
            y1={8}
            y2={153}
          />
          <text fill="currentColor" fontSize={10} fontWeight={800} textAnchor="middle" x={(X0 + reliefX) / 2} y={20}>
            CONFIRMED SHORTAGE
          </text>
          <text fill="currentColor" fontSize={10} fontWeight={800} textAnchor="middle" x={(reliefX + normalX) / 2} y={20}>
            GRADUAL RELIEF — ANALYST CONSENSUS
          </text>
          <text fill="currentColor" fontSize={10} fontWeight={800} textAnchor="middle" x={(normalX + X1) / 2} y={20}>
            BACK TO NORMAL
          </text>
          {/* axis */}
          <line stroke="currentColor" strokeWidth={1.5} x1={X0} x2={X1} y1={45} y2={45} />
          {FAB_EVENTS.map((e) => {
            const ex = x(e.year);
            const y = tierY[e.tier - 1] ?? 58;
            return (
              <g key={e.label}>
                <line stroke="currentColor" strokeWidth={1} x1={ex} x2={ex} y1={45} y2={y - 12} />
                <circle cx={ex} cy={45} fill="currentColor" r={4.5} />
                <text fill="currentColor" fontSize={11.5} fontWeight={700} textAnchor="middle" x={ex} y={y}>
                  {e.label}
                </text>
                <text className="text-muted-foreground" fill="currentColor" fontSize={10.5} textAnchor="middle" x={ex} y={y + 12}>
                  {e.when}
                </text>
              </g>
            );
          })}
          {/* now marker */}
          <line
            stroke="currentColor"
            strokeDasharray="3 3"
            strokeWidth={1.5}
            x1={nowX}
            x2={nowX}
            y1={8}
            y2={153}
          />
          <text fill="currentColor" fontSize={10.5} fontWeight={800} textAnchor="middle" x={nowX} y={166}>
            Now
          </text>
          {[2026, 2027, 2028, 2029, 2030].map((yr) => (
            <text
              className="text-muted-foreground"
              fill="currentColor"
              fontSize={11}
              key={yr}
              textAnchor="middle"
              x={x(yr)}
              y={166}
            >
              {yr}
            </text>
          ))}
        </svg>
      </div>
    </figure>
  );
}

/** Demand vs supply divergence, 2024-2030. Static illustration. */
function DemandSupplyChart() {
  return (
    <figure className="mt-4 border-2 border-foreground p-3 sm:p-4">
      <div className="overflow-x-auto">
        <svg
          aria-label="AI computing demand doubles every 6 to 10 months while supply doubles every 18 or more months"
          className="min-w-[480px] text-foreground"
          role="img"
          viewBox="0 0 760 220"
        >
          <text fill="currentColor" fontSize={11} fontWeight={800} x={50} y={16}>
            DEMAND VS. SUPPLY — BOTH GROWING, AT VERY DIFFERENT SPEEDS
          </text>
          <line stroke="currentColor" strokeWidth={1} x1={50} x2={650} y1={190} y2={190} />
          <line stroke="currentColor" strokeWidth={1} x1={50} x2={50} y1={30} y2={190} />
          <text className="text-muted-foreground" fill="currentColor" fontSize={9} textAnchor="end" x={47} y={38}>
            more
          </text>
          <text className="text-muted-foreground" fill="currentColor" fontSize={9} textAnchor="end" x={47} y={188}>
            less
          </text>
          {(
            [
              ["2024", 50, "start"],
              ["2026", 250, "middle"],
              ["2028", 450, "middle"],
              ["2030", 650, "end"],
            ] as const
          ).map(([label, xPos, anchor]) => (
            <text
              className="text-muted-foreground"
              fill="currentColor"
              fontSize={10}
              key={label}
              textAnchor={anchor}
              x={xPos}
              y={208}
            >
              {label}
            </text>
          ))}
          {/* demand: thick solid */}
          <path
            d="M50,185 Q150,182 250,170 Q350,148 450,105 Q550,40 650,30"
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
          />
          <text fill="currentColor" fontSize={11} fontWeight={800} x={655} y={34}>
            Demand
          </text>
          <text className="text-muted-foreground" fill="currentColor" fontSize={9} x={655} y={47}>
            doubles every
          </text>
          <text className="text-muted-foreground" fill="currentColor" fontSize={9} x={655} y={58}>
            6–10 months
          </text>
          {/* supply: thin dashed */}
          <path
            d="M50,185 Q150,183 250,178 Q350,170 450,158 Q550,142 650,122"
            fill="none"
            stroke="currentColor"
            strokeDasharray="6 4"
            strokeWidth={1.5}
          />
          <text fill="currentColor" fontSize={11} fontWeight={800} x={655} y={120}>
            Supply
          </text>
          <text className="text-muted-foreground" fill="currentColor" fontSize={9} x={655} y={133}>
            doubles every
          </text>
          <text className="text-muted-foreground" fill="currentColor" fontSize={9} x={655} y={144}>
            18+ months
          </text>
          {/* gap callout */}
          <rect
            className="text-background"
            fill="currentColor"
            height={44}
            stroke="none"
            width={190}
            x={260}
            y={140}
          />
          <rect
            fill="none"
            height={44}
            stroke="currentColor"
            strokeWidth={1}
            width={190}
            x={260}
            y={140}
          />
          <text fill="currentColor" fontSize={11} fontWeight={800} textAnchor="middle" x={355} y={157}>
            This gap = your opportunity
          </text>
          <text className="text-muted-foreground" fill="currentColor" fontSize={10} textAnchor="middle" x={355} y={173}>
            Demand grows faster → prices stay high
          </text>
        </svg>
      </div>
    </figure>
  );
}

/** METR autonomous-task-length curve, 2019 to mid-2026. Static data. */
function MetrChart() {
  return (
    <figure className="mt-3 border-2 border-foreground p-3 sm:p-4">
      <div className="overflow-x-auto">
        <svg
          aria-label="Length of task an AI can do alone: about 4 seconds in 2019, about 50 minutes in 2025, about 16 hours by mid-2026"
          className="min-w-[560px] text-foreground"
          role="img"
          viewBox="0 0 900 250"
        >
          <line stroke="currentColor" strokeWidth={1.5} x1={55} x2={860} y1={195} y2={195} />
          <path
            className="text-muted"
            d="M55,195 L170,194.96 L285,194.88 L400,194.65 L515,193.94 L630,191.80 L745,185.36 L773.75,176.23 L802.5,158.44 L831.25,123.75 L860,56.24 L860,195 Z"
            fill="currentColor"
          />
          <path
            d="M55,195 L170,194.96 L285,194.88 L400,194.65 L515,193.94 L630,191.80 L745,185.36 L773.75,176.23 L802.5,158.44 L831.25,123.75 L860,56.24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
          />
          <circle cx={55} cy={195} fill="currentColor" r={5} />
          <circle cx={745} cy={185.36} fill="currentColor" r={5} />
          <circle cx={860} cy={56.24} fill="currentColor" r={5} />
          <text className="text-muted-foreground" fill="currentColor" fontSize={10.5} x={55} y={157}>
            earliest AI agents
          </text>
          <text fill="currentColor" fontSize={15} fontWeight={800} x={55} y={176}>
            ~4 sec
          </text>
          <text className="text-muted-foreground" fill="currentColor" fontSize={10.5} textAnchor="middle" x={745} y={148}>
            Claude 3.7 Sonnet-class
          </text>
          <text fill="currentColor" fontSize={15} fontWeight={800} textAnchor="middle" x={745} y={167}>
            ~50 min
          </text>
          <text className="text-muted-foreground" fill="currentColor" fontSize={10.5} textAnchor="end" x={860} y={20}>
            Frontier models, mid-2026
          </text>
          <text fill="currentColor" fontSize={16} fontWeight={800} textAnchor="end" x={860} y={40}>
            ~16 hours
          </text>
          {["2019", "2020", "2021", "2022", "2023", "2024", "2025"].map((yr, i) => (
            <text
              className="text-muted-foreground"
              fill="currentColor"
              fontSize={10.5}
              key={yr}
              textAnchor="middle"
              x={55 + i * 115}
              y={212}
            >
              {yr}
            </text>
          ))}
          <text fill="currentColor" fontSize={10.5} fontWeight={800} textAnchor="middle" x={860} y={212}>
            2026 (now)
          </text>
        </svg>
      </div>
    </figure>
  );
}
