import Image from "next/image";
import { GameCTA } from "@/components/ui/game-cta";
import { ROUTES, wishoniaWorldLink } from "@/lib/routes";
import { getRouteMetadata } from "@/lib/metadata";
import { PersonalIncomeChart } from "@/components/landing/PersonalIncomeChart";
import { GdpTrajectoryChart } from "@/components/animations/GdpTrajectoryChart";

export const metadata = getRouteMetadata(wishoniaWorldLink);

const supers = [
  {
    image: "/images/wishonia/super-longevity-1.jpg",
    title: "Super-Longevity",
    description:
      "Death is optional. Aging reverses. Every citizen has access to treatments your species won't approve for another eight point two years — if they approve them at all.",
  },
  {
    image: "/images/wishonia/super-wellbeing-1.jpg",
    title: "Super-Wellbeing",
    description:
      "Suffering engineered out at the neurochemical level. The emotional range runs from 'deeply good' to 'transcendently good.' Your species calls this impossible. We call it Tuesday.",
  },
  {
    image: "/images/wishonia/super-intelligence-1.jpg",
    title: "Super-Intelligence",
    description:
      "AI optimisation solving previously intractable problems. Not replacing humans — amplifying them. Every citizen has access to the combined knowledge of 847 civilisations.",
  },
];

const timeline = [
  { year: "Year 0", event: "1% Treaty signed. Military spending redirected to clinical trials." },
  { year: "Year 12", event: "Last war ended. Turned out nobody wanted to fight once the incentives changed." },
  { year: "Year 47", event: "Wishocracy replaced representative government. Four minutes a week, eight billion participants." },
  { year: "Year 103", event: "Federal Reserve equivalent deprecated. Algorithmic monetary policy achieved 0% inflation." },
  { year: "Year 340", event: "Last disease eradicated. 95% of the work was removing bureaucratic obstacles." },
  { year: "Year 4,297", event: "Present day. Sent this manual to your planet. You're welcome." },
];

export default function WishoniaWorldPage() {
  return (
    <div className="bg-[#0a0a1a] text-white min-h-screen">
      {/* Hero — full bleed with planet image */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/wishonia/hero-planet-1.jpg"
            alt="The planet Wishonia"
            fill
            className="object-cover opacity-60"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a1a]/50 to-[#0a0a1a]" />
        </div>
        <div className="relative z-10 mx-auto max-w-5xl px-4 pt-24 pb-32 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-black uppercase tracking-[0.3em] text-amber-300/80 mb-6">
            Proof of Concept
          </p>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight text-white drop-shadow-[0_0_30px_rgba(255,200,50,0.3)]">
            Wishonia
          </h1>
          <p className="mt-6 text-xl sm:text-2xl font-bold text-white/90 max-w-3xl mx-auto leading-relaxed">
            A planet that ended war in year 12 and disease in year 340. Same
            atoms. Same physics. Better spreadsheet.
          </p>
          <p className="mt-4 text-lg font-bold text-white/60 max-w-2xl mx-auto">
            Your species has the technology. You invented the maths. You built the
            computers. You just refuse to use them on the thing that matters most:
            not dying.
          </p>
        </div>
      </section>

      {/* The Three Supers */}
      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-black uppercase text-center text-white mb-4">
          What 4,297 Years Gets You
        </h2>
        <p className="text-center text-white/50 font-bold mb-16 max-w-2xl mx-auto">
          Three achievements your species is capable of but actively choosing not to pursue.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {supers.map((s) => (
            <div
              key={s.title}
              className="group relative overflow-hidden rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm transition-all hover:border-amber-300/30 hover:bg-white/10"
            >
              <div className="aspect-square relative overflow-hidden">
                <Image
                  src={s.image}
                  alt={s.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a1a] via-transparent to-transparent" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-black uppercase text-amber-300">
                  {s.title}
                </h3>
                <p className="mt-3 text-sm font-bold text-white/70 leading-relaxed">
                  {s.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How Governance Works */}
      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0">
          <Image
            src="/images/wishonia/governance-1.jpg"
            alt="Wishonia governance"
            fill
            className="object-cover opacity-20"
          />
        </div>
        <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-black uppercase text-center text-white mb-16">
            How a Planet Actually Runs
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {[
              {
                title: "No Politicians",
                color: "text-pink-400",
                text: "The governance niche was filled by algorithmic decision-making. Eight billion people do pairwise comparisons. The eigenvector produces stable budget allocations. Four minutes a week.",
              },
              {
                title: "No Lobbying",
                color: "text-cyan-400",
                text: "Without elected officials to lobby, the industry collapsed. Smart contracts route funds to public goods based on citizen preferences. Bribery became structurally impossible.",
              },
              {
                title: "$WISH Currency",
                color: "text-amber-300",
                text: "0.5% transaction tax replaces the entire tax code. UBI keeps everyone above the poverty line. Algorithmic 0% inflation stops the purchasing-power theft that funds your wars.",
              },
              {
                title: "The Optimitron",
                color: "text-emerald-400",
                text: "An AI comparing outcomes across 10,000 jurisdictions to identify what policies actually work. Domain-agnostic causal inference. Your scientists take twelve years. This takes seconds.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="border border-white/10 bg-black/40 backdrop-blur-sm p-6 rounded-lg"
              >
                <h3 className={`text-lg font-black uppercase ${item.color} mb-3`}>
                  {item.title}
                </h3>
                <p className="text-sm font-bold text-white/70 leading-relaxed">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-black uppercase text-center text-white mb-16">
          How Long It Actually Takes
        </h2>
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[5.5rem] top-0 bottom-0 w-px bg-gradient-to-b from-amber-300/50 via-cyan-400/50 to-pink-400/50 hidden sm:block" />
          <div className="space-y-6">
            {timeline.map((t, i) => (
              <div key={t.year} className="flex gap-6 items-start group">
                <div className="shrink-0 w-24 text-right pt-1">
                  <span className="text-lg font-black text-amber-300 group-hover:text-white transition-colors">
                    {t.year}
                  </span>
                </div>
                <div className="hidden sm:block shrink-0 w-3 h-3 rounded-full bg-amber-300/50 mt-2 group-hover:bg-amber-300 transition-colors ring-4 ring-[#0a0a1a]" />
                <div className="flex-grow border border-white/10 bg-white/5 backdrop-blur-sm p-4 rounded-lg group-hover:border-amber-300/30 transition-colors">
                  <p className="text-sm font-bold text-white/80">
                    {t.event}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Gap */}
      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0">
          <Image
            src="/images/wishonia/timeline-treaty-1.jpg"
            alt="The moment everything changed"
            fill
            className="object-cover opacity-15"
          />
        </div>
        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-black uppercase text-white mb-8">
            The Gap Is Institutional, Not Technological
          </h2>
          <p className="text-xl font-bold text-white/70 leading-relaxed max-w-3xl mx-auto">
            Your planet has the same atoms. The same physics. Better computers
            than we had when we started. The only difference is that your
            resources flow through institutions designed in the 18th century by
            people who thought bloodletting was medicine. The technology exists.
            The maths exists. The only missing variable is the decision to use
            them.
          </p>
        </div>
      </section>

      {/* Income Projections */}
      <section className="mx-auto max-w-5xl px-4 py-24 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-black uppercase text-center text-white mb-4">
          What It Means For You, Personally
        </h2>
        <p className="text-center text-white/50 font-bold mb-12 max-w-2xl mx-auto">
          Median household income under three scenarios. Same species. Same
          starting point. Different governance.
        </p>
        <div className="border border-white/10 bg-white/5 backdrop-blur-sm p-6 rounded-lg mb-12">
          <PersonalIncomeChart />
        </div>
        <div className="border border-white/10 bg-white/5 backdrop-blur-sm p-6 rounded-lg">
          <GdpTrajectoryChart />
        </div>
      </section>

      {/* CTAs */}
      <section className="mx-auto max-w-5xl px-4 py-24 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-black uppercase text-white mb-4">
          Start Building It
        </h2>
        <p className="text-lg font-bold text-white/50 mb-10 max-w-xl mx-auto">
          The blueprint is open source. The tools are free. The only cost is
          giving a damn.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <GameCTA href={ROUTES.agencies} variant="primary" size="lg">
            Optimized Governance
          </GameCTA>
          <GameCTA href={ROUTES.transmit} variant="yellow" size="lg">
            Transmit to Wishonia
          </GameCTA>
          <GameCTA href={ROUTES.prize} variant="secondary" size="lg">
            Play the Game
          </GameCTA>
        </div>
      </section>
    </div>
  );
}
