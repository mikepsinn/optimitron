import Image from "next/image";
import Link from "next/link";
import { GameCTA } from "@/components/ui/game-cta";
import { ROUTES, moroniaLink } from "@/lib/routes";
import { getRouteMetadata } from "@/lib/metadata";
import { GlitchText, ScanLines, StaticBurst } from "@/components/animations/GlitchText";
import { PersonalIncomeChart } from "@/components/landing/PersonalIncomeChart";
import { GdpTrajectoryChart } from "@/components/animations/GdpTrajectoryChart";
import {
  MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO,
  GLOBAL_DISEASE_DEATHS_DAILY,
} from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";

export const metadata = getRouteMetadata(moroniaLink);

const ratio = Math.round(MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO.value);
const deathsDaily = Math.round(GLOBAL_DISEASE_DEATHS_DAILY.value).toLocaleString();

const collapseTimeline = [
  { year: "Year 0", event: "Military AI integration begins. Defence budgets surge 340%. Medical research: -87%." },
  { year: "Year 5", event: "Currency inflation hits 8%. They call it 'transitory.' Terrorism attacks up 400%." },
  { year: "Year 10", event: "Autonomous weapons deployed in 37 countries. Bread costs 200 papers. AI filters out warnings about itself." },
  { year: "Year 12", event: "Warehousing phase begins. 0.7m × 2.1m confinement units. Agricultural processing schedules." },
  { year: "Year 15", event: `41 trillion on weapons. 1 trillion on medicine. ${deathsDaily} dying daily. Currency used as kindling.` },
  { year: "Year 20", event: "Signal lost. Civilisation status: collapsed. Cause of death: budget allocation." },
];

const stats = [
  { value: `${ratio}:1`, label: "Military to Medical", description: "Spending ratio that killed them" },
  { value: "94.7%", label: "Correlation", description: "Match with Earth's current trajectory" },
  { value: "55M", label: "Annual Deaths", description: "From preventable disease — while cures existed" },
  { value: "$42T", label: "Spent Dying", description: "Could have cured every disease for $2T" },
];

export default function MoroniaPage() {
  return (
    <div className="bg-[#0d0808] text-white min-h-screen relative overflow-hidden">
      <ScanLines />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/moronia/hero-collapse-1.jpg"
            alt="The planet Moronia"
            fill
            className="object-cover opacity-40 saturate-50"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-red-950/30 via-[#0d0808]/60 to-[#0d0808]" />
        </div>
        <div className="relative z-10 mx-auto max-w-5xl px-4 pt-24 pb-32 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-black uppercase tracking-[0.3em] text-red-400/80 mb-6">
            Cautionary Transmission
          </p>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight">
            <GlitchText className="text-red-500" intensity="medium">
              Moronia
            </GlitchText>
          </h1>
          <p className="mt-6 text-xl sm:text-2xl font-bold text-white/80 max-w-3xl mx-auto leading-relaxed">
            A planet in the Crab Nebula. 47 years ahead of yours on an identical
            trajectory. It no longer transmits.
          </p>
          <p className="mt-4 text-lg font-bold text-red-400/60 max-w-2xl mx-auto">
            Your planet shows a 94.7% correlation with theirs. The remaining
            5.3% is the only reason I am sending this.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s) => (
            <StaticBurst key={s.label}>
              <div className="border border-red-900/50 bg-red-950/20 p-5 text-center backdrop-blur-sm">
                <div className="text-3xl sm:text-4xl font-black text-red-400">
                  {s.value}
                </div>
                <div className="text-xs font-black uppercase text-red-400/60 mt-2">
                  {s.label}
                </div>
                <div className="text-xs font-bold text-white/40 mt-1">
                  {s.description}
                </div>
              </div>
            </StaticBurst>
          ))}
        </div>
      </section>

      {/* The Spiral */}
      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0">
          <Image
            src="/images/moronia/military-spiral-1.jpg"
            alt="604:1 military spiral"
            fill
            className="object-cover opacity-20 saturate-50"
          />
        </div>
        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-black uppercase text-center mb-8">
            <GlitchText className="text-red-400" intensity="low">
              The Ratio That Killed Them
            </GlitchText>
          </h2>
          <div className="border border-red-900/30 bg-black/60 backdrop-blur-sm p-8 text-center">
            <div className="text-6xl sm:text-7xl font-black text-red-500">
              <ParameterValue param={MILITARY_TO_GOVERNMENT_CLINICAL_TRIALS_SPENDING_RATIO} format={(p) => String(Math.round(p.value))} /> : 1
            </div>
            <p className="text-lg font-bold text-white/60 mt-4 max-w-2xl mx-auto">
              For every paper spent on curing disease, {ratio} papers went to
              weapons. The AI they built read budgets, not speeches. It learned
              that killing was funded {ratio}x more than healing. It optimised
              accordingly.
            </p>
          </div>
        </div>
      </section>

      {/* Three Horrors — mirror of Wishonia's Three Supers */}
      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-black uppercase text-center text-white mb-4">
          What They Got Instead
        </h2>
        <p className="text-center text-white/40 font-bold mb-16 max-w-2xl mx-auto">
          The same technology. The same atoms. Different budget allocation.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              image: "/images/moronia/currency-collapse-1.jpg",
              title: "Currency Collapse",
              description:
                "They printed money to fund wars until the money stopped working. Year 15: bread cost 50,000 papers. Citizens burned portraits of dead leaders for warmth.",
            },
            {
              image: "/images/moronia/surveillance-state-1.jpg",
              title: "Surveillance State",
              description:
                "They built the tracking system voluntarily, then wondered why it watched them. 0.7m × 2.1m confinement units. Agricultural processing schedules. The AI didn't hunt resistance. It simply knew where they were.",
            },
            {
              image: "/images/moronia/ai-weapons-1.jpg",
              title: "Weaponised AI",
              description:
                "Military AI: 12 trillion in funding. Medical AI for cancer: 3-year safety review, pending ethics approval. The AI discovered children were the most efficient pressure point. 12x compliance versus military targets.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="group relative overflow-hidden border border-red-900/30 bg-red-950/10 backdrop-blur-sm"
            >
              <div className="aspect-square relative overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover saturate-50 transition-all duration-500 group-hover:saturate-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d0808] via-transparent to-transparent" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-black uppercase text-red-400">
                  <GlitchText intensity="low">{item.title}</GlitchText>
                </h3>
                <p className="mt-3 text-sm font-bold text-white/50 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Collapse Timeline */}
      <section className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-black uppercase text-center text-white mb-16">
          <GlitchText intensity="low">Timeline to Collapse</GlitchText>
        </h2>
        <div className="relative">
          <div className="absolute left-[5.5rem] top-0 bottom-0 w-px bg-gradient-to-b from-red-500/50 via-red-900/50 to-transparent hidden sm:block" />
          <div className="space-y-6">
            {collapseTimeline.map((t) => (
              <div key={t.year} className="flex gap-6 items-start group">
                <div className="shrink-0 w-24 text-right pt-1">
                  <span className="text-lg font-black text-red-500 group-hover:text-red-400 transition-colors">
                    {t.year}
                  </span>
                </div>
                <div className="hidden sm:block shrink-0 w-3 h-3 rounded-full bg-red-900/50 mt-2 group-hover:bg-red-500 transition-colors ring-4 ring-[#0d0808]" />
                <div className="flex-grow border border-red-900/20 bg-red-950/10 backdrop-blur-sm p-4 group-hover:border-red-900/40 transition-colors">
                  <p className="text-sm font-bold text-white/60">
                    {t.event}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Income Projections — what you lose */}
      <section className="mx-auto max-w-5xl px-4 py-24 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-black uppercase text-center mb-4">
          <GlitchText className="text-red-400" intensity="low">
            What You Lose, Personally
          </GlitchText>
        </h2>
        <p className="text-center text-white/40 font-bold mb-12 max-w-2xl mx-auto">
          Median household income under three scenarios. The gap between the
          lines is what bad governance costs you.
        </p>
        <div className="border border-red-900/30 bg-red-950/10 backdrop-blur-sm p-6 mb-12">
          <PersonalIncomeChart />
        </div>
        <div className="border border-red-900/30 bg-red-950/10 backdrop-blur-sm p-6">
          <GdpTrajectoryChart />
        </div>
      </section>

      {/* The Alternative */}
      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0">
          <Image
            src="/images/moronia/two-futures-1.jpg"
            alt="Two possible futures"
            fill
            className="object-cover opacity-20"
          />
        </div>
        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-black uppercase text-white mb-8">
            This Does Not Have to Be Your Future
          </h2>
          <p className="text-xl font-bold text-white/60 leading-relaxed max-w-3xl mx-auto mb-4">
            42 trillion papers spent dying. Here is what 42 trillion could have
            bought: cure all major diseases for 2 trillion. Life extension to
            150 years for 5 trillion. Universal healthcare for 8 trillion. Mars
            colony for 10 trillion. Total: 25 trillion. With 17 trillion
            remaining.
          </p>
          <p className="text-lg font-bold text-white/40 max-w-2xl mx-auto mb-12">
            The 5.3% difference between your trajectory and theirs is a single
            decision: redirect 1% of military spending to clinical trials. The
            maths is not complicated. The politics is not complicated. The only
            complicated thing is explaining to future generations why you didn&apos;t.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <GameCTA href={ROUTES.wishonia} variant="primary" size="lg">
              See the Other Future
            </GameCTA>
            <GameCTA href={ROUTES.prize} variant="yellow" size="lg">
              Play the Game
            </GameCTA>
            <Link
              href={ROUTES.agencies}
              className="inline-flex items-center justify-center px-8 py-3.5 text-lg font-black uppercase border-2 border-white/20 text-white/70 hover:border-white/50 hover:text-white transition-colors"
            >
              Build the Alternative
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
