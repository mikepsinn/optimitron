import Link from "next/link";
import {
  alignmentLink,
  studiesLink,
  trackLink,
  wishocracyLink,
} from "@/lib/routes";

const papers = [
  {
    title: "dFDA Specification",
    desc: "Causal scoring, temporal alignment, Bradford Hill, and effect sizes.",
    href: "https://dfda-spec.warondisease.org",
  },
  {
    title: "Wishocracy",
    desc: "Pairwise preference aggregation for turning tradeoffs into ranked priorities.",
    href: "https://wishocracy.warondisease.org",
  },
  {
    title: "Optimal Policy Generator",
    desc: "Policy ranking by expected effect on healthy life years and income.",
    href: "https://opg.warondisease.org",
  },
  {
    title: "Optimal Budget Generator",
    desc: "Budget allocation under diminishing returns and constrained tradeoffs.",
    href: "https://obg.warondisease.org",
  },
  {
    title: "Optimocracy",
    desc: "The welfare function behind the public-policy side of the project.",
    href: "https://optimocracy.warondisease.org",
  },
];

const productSurfaces = [
  {
    title: "Build an ideal budget",
    desc: "Use pairwise comparisons to turn values into a ranked public budget.",
    href: wishocracyLink.href,
    cta: "Open Wishocracy",
    tone: "bg-pink-100",
  },
  {
    title: "Match with politicians",
    desc: "Compare your priorities with benchmark politicians and inspect the score.",
    href: alignmentLink.href,
    cta: "Open Alignment",
    tone: "bg-yellow-100",
  },
  {
    title: "Inspect the evidence",
    desc: "Browse outcome hubs, pair studies, policy rankings, and budget analysis.",
    href: studiesLink.href,
    cta: "Browse Studies",
    tone: "bg-emerald-100",
  },
  {
    title: "Track yourself",
    desc: "Log habits, symptoms, meals, and daily wellbeing in one place.",
    href: trackLink.href,
    cta: "Open Tracking",
    tone: "bg-cyan-100",
  },
];

const reasons = [
  {
    icon: "💀",
    title: "Bad decisions kill",
    desc: "Budgets, policies, and delays shape whether people get treatment, safety, housing, and time.",
  },
  {
    icon: "🏛️",
    title: "Politics hides tradeoffs",
    desc: "Most public debates are slogans plus coalition bargaining, not measured outcome comparisons.",
  },
  {
    icon: "🔁",
    title: "Good ideas spread too slowly",
    desc: "When something works in one place, most systems still lack a clean way to copy it elsewhere.",
  },
];

const steps = [
  {
    label: "Collect",
    desc: "Pull outcome, spending, and policy data across jurisdictions and time.",
  },
  {
    label: "Align",
    desc: "Match changes in predictors with delayed changes in outcomes.",
  },
  {
    label: "Score",
    desc: "Combine effect sizes, temporal direction, and Bradford Hill evidence.",
  },
  {
    label: "Optimize",
    desc: "Estimate better policy choices, budget mixes, and target levels.",
  },
  {
    label: "Apply",
    desc: "Turn the results into budget votes, politician matching, and decision support.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="mb-16">
        <div className="max-w-3xl space-y-5">
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-black">
            About Optomitron
          </h1>
          <p className="text-lg text-black/80 leading-relaxed font-medium">
            Optomitron helps people and institutions decide what to fund, what to
            change, and what to stop by tying decisions back to outcomes that
            matter.
          </p>
          <p className="text-black/60 font-medium leading-relaxed">
            The public side of the project focuses on healthy life years,
            income, and the policies and budgets that shape them. The personal
            side lets you track your own inputs and outcomes in one place.
          </p>
          <p className="text-black/60 font-medium leading-relaxed">
            The goal is simple: make tradeoffs visible, make evidence easier to
            inspect, and make better decisions easier to act on.
          </p>
        </div>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <Link
            href={wishocracyLink.href}
            className="inline-flex items-center justify-center border-4 border-black bg-pink-500 px-8 py-3 text-sm font-black uppercase text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            Start With Wishocracy
          </Link>
          <Link
            href={alignmentLink.href}
            className="inline-flex items-center justify-center border-4 border-black bg-yellow-300 px-8 py-3 text-sm font-black uppercase text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            See Alignment Reports
          </Link>
          <Link
            href={studiesLink.href}
            className="inline-flex items-center justify-center border-4 border-black bg-white px-8 py-3 text-sm font-black uppercase text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            Browse Studies
          </Link>
        </div>
      </section>

      <section className="mb-16">
        <h2 className="section-title">What You Can Do Here</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {productSurfaces.map((surface) => (
            <div
              key={surface.title}
              className={`p-6 border-4 border-black ${surface.tone} shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] flex flex-col`}
            >
              <h3 className="text-xl font-black text-black mb-3">{surface.title}</h3>
              <p className="text-sm text-black/70 leading-relaxed font-medium flex-grow">
                {surface.desc}
              </p>
              <Link
                href={surface.href}
                className="mt-5 inline-flex items-center text-sm font-black uppercase text-black hover:text-pink-600 transition-colors"
              >
                {surface.cta} &rarr;
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-16">
        <h2 className="section-title">Why It Exists</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reasons.map((reason) => (
            <div key={reason.title} className="card">
              <div className="text-3xl mb-3">{reason.icon}</div>
              <h3 className="text-black font-black mb-2">{reason.title}</h3>
              <p className="text-sm text-black/60 font-medium leading-relaxed">
                {reason.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-16">
        <h2 className="section-title">How It Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {steps.map((step, index) => (
            <div key={step.label} className="card text-center py-5">
              <div className="text-pink-500 font-black text-lg">{index + 1}</div>
              <div className="text-black font-black text-sm uppercase">{step.label}</div>
              <div className="text-xs text-black/50 mt-2 font-medium leading-relaxed">
                {step.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-16">
        <h2 className="section-title">Research</h2>
        <p className="text-sm text-black/60 mb-6 font-medium">
          The scoring and optimization logic is documented in public papers.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {papers.map((paper) => (
            <a
              key={paper.href}
              href={paper.href}
              target="_blank"
              rel="noopener noreferrer"
              className="card group hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              <h3 className="text-black font-black group-hover:text-pink-500 transition-colors">
                {paper.title}
              </h3>
              <p className="text-sm text-black/60 mt-2 font-medium leading-relaxed">
                {paper.desc}
              </p>
              <span className="text-xs text-pink-500 mt-3 inline-block font-black uppercase">
                Read paper &rarr;
              </span>
            </a>
          ))}
        </div>
      </section>

      <section className="card bg-cyan-100 border-cyan-500 text-center">
        <h2 className="text-2xl font-black text-black mb-3 uppercase">
          Open By Design
        </h2>
        <p className="text-black/60 mb-6 font-medium max-w-2xl mx-auto leading-relaxed">
          The code is public, the papers are public, and the product is meant to
          be inspectable by anyone who wants to audit the logic or reuse the
          ideas.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <a
            href="https://github.com/mikepsinn/optomitron"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-black px-6 py-3 text-sm font-black text-white uppercase border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            View GitHub
          </a>
          <a
            href="https://github.com/mikepsinn/optomitron#readme"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-white px-6 py-3 text-sm font-black text-black uppercase border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            Read The README
          </a>
        </div>
      </section>
    </div>
  );
}
