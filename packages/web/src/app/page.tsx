import Link from "next/link";
import { WishocracyLandingSection } from "@/components/wishocracy/WishocracyLandingSection";

const featuredFindings = [
  {
    domain: "Healthcare",
    color: "bg-emerald-200",
    stat: "83.9 yrs life expectancy at 4.1% GDP",
    vs: "vs US: 77.5 yrs at 17.3% GDP",
    description:
      "Singapore's 3M system (Medisave, MediShield, Medifund) achieves world-leading health outcomes at a fraction of US spending through universal coverage with market competition.",
    href: "/compare",
  },
  {
    domain: "Drug Policy",
    color: "bg-purple-200",
    stat: "Drug deaths fell 70% in Portugal",
    vs: "HIV among users fell 74%",
    description:
      "Portugal decriminalized personal possession of all drugs in 2001 and shifted resources to treatment. Drug-induced deaths dropped from 52 to 3 per million population.",
    href: "/policies",
  },
  {
    domain: "Criminal Justice",
    color: "bg-cyan-200",
    stat: "Norway recidivism: 20%",
    vs: "vs US: 76%",
    description:
      "Norway's rehabilitative prison system — education, vocational training, max 21-year sentences — cut re-offending from 35% to 20% while keeping incarceration rates low.",
    href: "/compare",
  },
  {
    domain: "Public Health",
    color: "bg-yellow-200",
    stat: "Rwanda: life expectancy 48 → 69 yrs",
    vs: "Under-5 mortality fell 82%",
    description:
      "Rwanda deployed 45,000 community health workers in 2005. Under-5 mortality dropped from 196 to 35 per 1,000 live births over 15 years.",
    href: "/policies",
  },
];

const naturalExperiments = [
  {
    jurisdiction: "Portugal",
    policy: "Drug Decriminalization",
    year: 2001,
    outcome: "Drug deaths: 52 → 3 per million",
    change: "-94%",
    positive: true,
  },
  {
    jurisdiction: "Australia",
    policy: "Gun Buyback",
    year: 1996,
    outcome: "Mass shootings: 1/yr → 0 for 22 years",
    change: "-100%",
    positive: true,
  },
  {
    jurisdiction: "British Columbia",
    policy: "Revenue-Neutral Carbon Tax",
    year: 2008,
    outcome: "Fossil fuel consumption index: 104 → 85",
    change: "-15%",
    positive: true,
  },
  {
    jurisdiction: "Copenhagen",
    policy: "Cycling Infrastructure",
    year: 2000,
    outcome: "Bike commute share: 30% → 49%",
    change: "+63%",
    positive: true,
  },
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 relative">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-tight text-black">
              Which interventions actually{" "}
              <span className="bg-yellow-300 px-2">save lives</span> and{" "}
              <span className="bg-pink-300 px-2">reduce suffering</span>?
            </h1>
            <p className="mt-8 text-lg sm:text-xl text-black/70 max-w-3xl mx-auto leading-relaxed font-medium">
              Causal inference on thousands of country-years of policy, budget, and
              outcome data to identify what maximizes{" "}
              <span className="font-bold text-black">healthy life years</span> and minimizes{" "}
              <span className="font-bold text-black">preventable death and disease</span>.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/vote"
                className="px-8 py-3.5 bg-pink-500 text-white font-black uppercase text-lg border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                🗳️ Allocate Your Budget
              </Link>
              <Link
                href="/policies"
                className="px-8 py-3.5 bg-white text-black font-black uppercase text-lg border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-cyan-300 transition-all"
              >
                Explore Policies
              </Link>
            </div>
          </div>
        </div>
      </section>

      <WishocracyLandingSection />

      {/* The Cost of Inaction */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black">
            The Cost of Inaction
          </h2>
          <p className="mt-4 text-lg text-black/60 max-w-2xl mx-auto font-medium">
            Governance dysfunction isn&apos;t just inefficient — it&apos;s the
            deadliest force on earth. These numbers are from peer-reviewed
            research and official data.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <a
            href="https://political-dysfunction-tax.warondisease.org"
            target="_blank"
            rel="noopener noreferrer"
            className="p-8 border-4 border-black bg-red-100 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
          >
            <div className="text-4xl sm:text-5xl font-black text-red-600 mb-2">
              $101T/yr
            </div>
            <h3 className="text-lg font-black text-black mb-3">
              Political Dysfunction Tax
            </h3>
            <p className="text-sm text-black/70 leading-relaxed font-medium">
              $12,600 per person per year in waste and suppressed innovation —
              from administrative bloat, regulatory capture, migration
              restrictions, and underfunded science. Civilization operates at
              ~52% of its technological potential.
            </p>
            <span className="mt-4 inline-flex items-center text-xs font-black text-red-600 uppercase">
              Read the paper &rarr;
            </span>
          </a>
          <a
            href="https://invisible-graveyard.warondisease.org"
            target="_blank"
            rel="noopener noreferrer"
            className="p-8 border-4 border-black bg-orange-100 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
          >
            <div className="text-4xl sm:text-5xl font-black text-orange-600 mb-2">
              102M deaths
            </div>
            <h3 className="text-lg font-black text-black mb-3">
              The Invisible Graveyard
            </h3>
            <p className="text-sm text-black/70 leading-relaxed font-medium">
              Since 1962, the FDA&apos;s 8.2-year post-safety efficacy delays
              have caused an estimated 102 million preventable deaths and $1.19
              quadrillion in deadweight loss. Treatments that passed safety
              review sat waiting while people died.
            </p>
            <span className="mt-4 inline-flex items-center text-xs font-black text-orange-600 uppercase">
              Read the paper &rarr;
            </span>
          </a>
          <a
            href="https://impact.warondisease.org"
            target="_blank"
            rel="noopener noreferrer"
            className="p-8 border-4 border-black bg-sky-100 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
          >
            <div className="text-4xl sm:text-5xl font-black text-sky-600 mb-2">
              10.7B saved
            </div>
            <h3 className="text-lg font-black text-black mb-3">
              The 1% Treaty
            </h3>
            <p className="text-sm text-black/70 leading-relaxed font-medium">
              Redirecting just 1% of global military spending ($27.2B/year) to
              pragmatic clinical trials could prevent 10.7 billion deaths and
              accelerate treatment access by 212 years. Trial costs drop from
              $41K to $929 per patient.
            </p>
            <span className="mt-4 inline-flex items-center text-xs font-black text-sky-600 uppercase">
              Read the paper &rarr;
            </span>
          </a>
        </div>
        <div className="text-center mt-8">
          <a
            href="https://manual.warondisease.org"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm font-black text-pink-600 hover:text-pink-800 uppercase transition-colors"
          >
            Read the full manual: How to End War and Disease &rarr;
          </a>
        </div>
      </section>

      {/* The Two Metrics That Matter */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black">
            The Two Metrics That Matter
          </h2>
          <p className="mt-4 text-lg text-black/60 max-w-2xl mx-auto font-medium">
            Every policy, budget, and intervention is scored against two
            measures of human wellbeing — not GDP, not stock prices, not
            averages that hide suffering.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 border-4 border-black bg-emerald-100 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-4xl mb-4">🫀</div>
            <h3 className="text-2xl font-black text-black mb-3">
              Median Healthy Life Years (HALE)
            </h3>
            <p className="text-black/70 leading-relaxed font-medium">
              Not just life expectancy — <span className="font-bold text-black">healthy</span>{" "}
              years free of disability and disease. A country where people live to 80
              but spend the last 15 years suffering scores lower than one where people
              live to 78 in good health.
            </p>
            <p className="text-black/50 text-sm mt-4 font-medium">
              Why median? Because mean life expectancy is dragged down by infant
              mortality, masking how well a society actually prevents suffering
              across the lifespan.
            </p>
          </div>
          <div className="p-8 border-4 border-black bg-yellow-100 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-2xl font-black text-black mb-3">
              Median Real After-Tax Income
            </h3>
            <p className="text-black/70 leading-relaxed font-medium">
              Poverty kills. This measures what a typical person can actually
              afford after taxes and inflation — not GDP, which hides inequality.
              A country with 10 billionaires and mass poverty looks great on GDP
              but fails its people.
            </p>
            <p className="text-black/50 text-sm mt-4 font-medium">
              Why median? Because mean income is skewed by billionaires. The
              median tells you whether ordinary people can afford healthcare,
              nutrition, and shelter.
            </p>
          </div>
        </div>
      </section>

      {/* The Data — Key Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black">
            The Data
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {[
            { value: "20+", label: "Countries Compared" },
            { value: "11", label: "Natural Experiments" },
            { value: "14", label: "Policy Analyses" },
            { value: "50+", label: "Years of Data" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="text-center p-6 border-2 border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="text-3xl sm:text-4xl font-black text-pink-500">
                {stat.value}
              </div>
              <div className="text-sm text-black/60 font-bold mt-2 uppercase">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-black/50 text-sm mt-6 font-medium max-w-2xl mx-auto">
          Across healthcare, drug policy, criminal justice, climate, education,
          and infrastructure — sourced from OECD, World Bank, WHO, and
          peer-reviewed studies.
        </p>
      </section>

      {/* Featured Findings */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black">
            What the Data Reveals
          </h2>
          <p className="mt-4 text-lg text-black/60 max-w-2xl mx-auto font-medium">
            Striking findings from real outcome data across jurisdictions.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {featuredFindings.map((finding) => (
            <div
              key={finding.domain}
              className={`p-8 border-2 border-black ${finding.color} shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex flex-col`}
            >
              <div className="text-xs font-black px-2.5 py-1 bg-black text-white inline-block self-start mb-4 uppercase">
                {finding.domain}
              </div>
              <h3 className="text-xl font-black text-black mb-1">
                {finding.stat}
              </h3>
              <p className="text-sm font-bold text-black/60 mb-3">
                {finding.vs}
              </p>
              <p className="text-black/70 text-sm leading-relaxed flex-grow font-medium">
                {finding.description}
              </p>
              <Link
                href={finding.href}
                className="mt-6 inline-flex items-center text-sm font-black text-pink-600 hover:text-pink-800 uppercase transition-colors"
              >
                View Analysis &rarr;
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Natural Experiments */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black">
            Natural Experiments
          </h2>
          <p className="mt-4 text-lg text-black/60 max-w-2xl mx-auto font-medium">
            When a jurisdiction changes a policy, it creates a natural experiment.
            We track outcome metrics before and after the intervention with
            interrupted time-series analysis. This is not theory — it&apos;s
            observed data.
          </p>
        </div>
        <div className="space-y-4">
          {naturalExperiments.map((exp) => (
            <div
              key={`${exp.jurisdiction}-${exp.year}`}
              className="p-6 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-black px-2.5 py-1 bg-black text-white">
                    {exp.year}
                  </span>
                  <span className="font-black text-black">
                    {exp.jurisdiction}
                  </span>
                </div>
                <div className="flex-grow">
                  <span className="font-bold text-black/70">{exp.policy}</span>
                  <span className="text-black/40 mx-2">→</span>
                  <span className="font-medium text-black/60">{exp.outcome}</span>
                </div>
                <div className="shrink-0">
                  <span
                    className={`font-black text-lg ${
                      exp.positive ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {exp.change}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link
            href="/policies"
            className="inline-flex items-center text-sm font-black text-pink-600 hover:text-pink-800 uppercase transition-colors"
          >
            View all 11 natural experiments &rarr;
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="p-8 sm:p-12 bg-cyan-100 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-2xl sm:text-3xl font-black text-center mb-12 uppercase tracking-tight text-black">
            How It Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {[
              {
                step: 1,
                title: "Collect",
                desc: "Outcome data from OECD, World Bank, and WHO across jurisdictions and decades",
              },
              {
                step: 2,
                title: "Align",
                desc: "Policy changes paired with outcome trajectories using temporal analysis and onset delays",
              },
              {
                step: 3,
                title: "Score",
                desc: "Causal strength via Bradford Hill criteria — strength, consistency, temporality, gradient",
              },
              {
                step: 4,
                title: "Identify",
                desc: "Optimal funding levels and policy configurations with confidence intervals",
              },
              {
                step: 5,
                title: "Recommend",
                desc: "Evidence-based policies ranked by Predictor Impact Score with effect size estimates",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-pink-500 border-2 border-black flex items-center justify-center mx-auto mb-4 text-lg font-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  {item.step}
                </div>
                <h3 className="font-black text-black mb-2 uppercase">
                  {item.title}
                </h3>
                <p className="text-xs text-black/60 leading-relaxed font-medium">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — Explore the Data */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center p-12 bg-yellow-300 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-3xl font-black mb-4 uppercase tracking-tight text-black">
            Stop Guessing. Start Saving Lives.
          </h2>
          <p className="text-black/70 max-w-2xl mx-auto mb-8 leading-relaxed font-medium">
            Every analysis is backed by real outcome data from official sources.
            Whether you&apos;re a nonprofit allocating grants, a government
            setting policy, or a researcher studying what works — the data is
            open and the methodology is transparent.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/compare"
              className="px-8 py-3 bg-black text-white font-black uppercase border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              Compare Countries
            </Link>
            <Link
              href="/policies"
              className="px-8 py-3 bg-white text-black font-black uppercase border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              Browse Policies
            </Link>
            <Link
              href="/budget"
              className="px-8 py-3 bg-white text-black font-black uppercase border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              View Budget Analysis
            </Link>
          </div>
          <div className="mt-6">
            <a
              href="https://github.com/mikepsinn/optomitron"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm font-black text-black/50 hover:text-black uppercase transition-colors"
            >
              View Source on GitHub &rarr;
            </a>
          </div>
        </div>
      </section>

      {/* Same Engine, Every Scale */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pb-24">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
            Same Engine, Every Scale
          </h2>
          <p className="mt-4 text-base text-black/60 max-w-2xl mx-auto font-medium">
            The causal inference engine is domain-agnostic. Feed any two time series
            and it answers: does changing X cause Y to change? By how much?
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="p-6 border-2 border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-black text-black mb-2">Nonprofits & NGOs</h3>
            <p className="text-sm text-black/60 font-medium">
              Find which interventions reduce the most suffering per dollar.
              Compare approaches across countries and decades of outcome data.
            </p>
          </div>
          <div className="p-6 border-2 border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-black text-black mb-2">Governments</h3>
            <p className="text-sm text-black/60 font-medium">
              Optimal policies and budget allocation across jurisdictions. Any
              city, county, state, or country.
            </p>
          </div>
          <div className="p-6 border-2 border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-black text-black mb-2">Individuals</h3>
            <p className="text-sm text-black/60 font-medium">
              Import your health data from wearables, supplements, and habits.
              Find what works for you via local causal analysis.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
