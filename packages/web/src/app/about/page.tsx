import type { Metadata } from "next";
import { NavItemLink } from "@/components/navigation/NavItemLink";
import {
  alignmentLink,
  communityLinks,
  paperLinks,
  prizeLink,
  studiesLink,
  trackLink,
  transparencyLink,
  wishocracyLink,
} from "@/lib/routes";

const productSurfaces = [
  {
    item: wishocracyLink,
    title: "Build an ideal budget",
    desc: "Nobody asked you how to spend $6.75 trillion. This lets you answer anyway.",
    cta: "Open Wishocracy",
    tone: "bg-brutal-pink",
    titleColor: "text-white",
    descColor: "text-white/80",
    ctaColor: "text-white hover:text-brutal-yellow",
  },
  {
    item: alignmentLink,
    title: "Match with politicians",
    desc: "Find out which of your elected officials actually agrees with you. Brace yourself.",
    cta: "Open Alignment",
    tone: "bg-brutal-yellow",
    titleColor: "text-black",
    descColor: "text-black/70",
    ctaColor: "text-black hover:text-brutal-pink",
  },
  {
    item: studiesLink,
    title: "Inspect the evidence",
    desc: "Every claim, tested against data. No opinions. No vibes. Just receipts.",
    cta: "Browse Studies",
    tone: "bg-brutal-cyan",
    titleColor: "text-black",
    descColor: "text-black/70",
    ctaColor: "text-black hover:text-brutal-pink",
  },
  {
    item: trackLink,
    title: "Track yourself",
    desc: "Log what you do, eat, and feel. I'll tell you what's actually working. Your intuition won't like it.",
    cta: "Open Tracking",
    tone: "bg-brutal-cyan",
    titleColor: "text-black",
    descColor: "text-black/70",
    ctaColor: "text-black hover:text-brutal-pink",
  },
];

const openSourceButtons = communityLinks.filter(
  ({ label }) => label === "GitHub" || label === "README",
);

const reasons = [
  {
    icon: "💀",
    title: "Bad decisions kill",
    desc: "102 million people died waiting for your FDA to approve treatments that were already proven safe. Budgets are body counts with decimal places.",
  },
  {
    icon: "🏛️",
    title: "Politics hides tradeoffs",
    desc: "Your species spends more time arguing about policies than measuring whether they work. On my planet we call this 'performative governance.' You call it 'Tuesday.'",
  },
  {
    icon: "🔁",
    title: "Good ideas spread too slowly",
    desc: "Portugal decriminalised drugs in 2001. Deaths dropped 80%. Twenty-five years later, most countries are still pretending they haven't noticed.",
  },
  {
    icon: "🧠",
    title: "Governments are misaligned superintelligences",
    desc: "A government is a collective intelligence system controlling billions of lives. Yours are optimising for re-election, not welfare. Same problem as any misaligned AI, except these ones have nuclear weapons.",
  },
];

const steps = [
  {
    label: "Collect",
    desc: "Hoover up every outcome, spending, and policy dataset your species has bothered to publish.",
  },
  {
    label: "Align",
    desc: "Line up what changed with what happened next. Your species finds this step surprisingly difficult.",
  },
  {
    label: "Score",
    desc: "Grade each claim using actual causal inference. Not vibes. Not committee votes. Maths.",
  },
  {
    label: "Optimize",
    desc: "Calculate what you should actually be doing. Spoiler: it's not what you're doing.",
  },
  {
    label: "Apply",
    desc: "Turn the maths into budget votes, politician report cards, and awkward conversations.",
  },
];

export const metadata: Metadata = {
  title: "About The Evidence-Based Earth Optimization Machine | Optomitron",
  description:
    "What Optomitron is, how the Earth Optimization Machine works, and why planetary debugging software might be useful on this planet.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="mb-16">
        <div className="max-w-3xl space-y-5">
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-black">
            About The Evidence-Based Earth Optimization Machine
          </h1>
          <p className="text-lg text-black/80 leading-relaxed font-medium">
            I built Optomitron because your species keeps making the same
            mistakes and then acting surprised by the results. It takes your
            outcomes, your spending data, and your policies, runs causal
            inference on all of it, and tells you what actually works. You&apos;re
            welcome.
          </p>
          <p className="text-black/60 font-medium leading-relaxed">
            The public side focuses on healthy life years, income, and the
            policies and budgets that shape them. The personal side lets you
            track your own inputs and outcomes. Think of it as a diagnostic
            tool for both your civilisation and your breakfast choices.
          </p>
          <p className="text-black/60 font-medium leading-relaxed">
            Your governments are already superintelligences — collective
            intelligence systems controlling the lives of billions. The problem
            isn&apos;t that they&apos;re not smart enough. It&apos;s that
            they&apos;re optimising for the wrong things. Optomitron is
            alignment software for the most powerful AIs on your planet — the
            ones made of people.
          </p>
        </div>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <NavItemLink
            item={wishocracyLink}
            variant="custom"
            className="inline-flex items-center justify-center border-4 border-black bg-brutal-pink px-8 py-3 text-sm font-black uppercase text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            Start With Wishocracy
          </NavItemLink>
          <NavItemLink
            item={alignmentLink}
            variant="custom"
            className="inline-flex items-center justify-center border-4 border-black bg-brutal-yellow px-8 py-3 text-sm font-black uppercase text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            See Alignment Reports
          </NavItemLink>
          <NavItemLink
            item={studiesLink}
            variant="custom"
            className="inline-flex items-center justify-center border-4 border-black bg-white px-8 py-3 text-sm font-black uppercase text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            Browse Studies
          </NavItemLink>
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
              <h3 className={`text-xl font-black ${surface.titleColor} mb-3`}>{surface.title}</h3>
              <p className={`text-sm ${surface.descColor} leading-relaxed font-medium flex-grow`}>
                {surface.desc}
              </p>
              <NavItemLink
                item={surface.item}
                variant="custom"
                className={`mt-5 inline-flex items-center text-sm font-black uppercase ${surface.ctaColor} transition-colors`}
              >
                {surface.cta} &rarr;
              </NavItemLink>
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
              <div className="text-brutal-pink font-black text-lg">{index + 1}</div>
              <div className="text-black font-black text-sm uppercase">{step.label}</div>
              <div className="text-xs text-black/50 mt-2 font-medium leading-relaxed">
                {step.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-16">
        <h2 className="section-title">The Economic System</h2>
        <p className="text-sm text-black/60 mb-6 font-medium max-w-3xl">
          Diagnosing the problem is step one. Funding the solution is step two.
          Your species has historically struggled with step two because you keep
          inventing middlemen. Here&apos;s how it works without them.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="card bg-brutal-cyan border-black">
            <div className="text-2xl mb-2">🏦</div>
            <h3 className="font-black text-black mb-2">FairTax</h3>
            <p className="text-sm text-black/60 font-medium leading-relaxed">
              $WISH is an ERC-20 token with a 0.5% transaction tax built into
              every transfer. This replaces your income tax system entirely — no
              filing, no audits, no IRS. Revenue collection as a one-line
              protocol feature instead of a 74,000-page tax code.
            </p>
          </div>
          <div className="card bg-brutal-cyan border-black">
            <div className="text-2xl mb-2">🍞</div>
            <h3 className="font-black text-black mb-2">Universal Basic Income</h3>
            <p className="text-sm text-black/60 font-medium leading-relaxed">
              The transaction tax funds a treasury that distributes UBI to every
              verified citizen via World ID. No means testing. No case workers.
              No $1.1 trillion spent administering who deserves help. Everyone
              eats. The bureaucracy doesn&apos;t.
            </p>
          </div>
          <div className="card bg-brutal-pink border-black">
            <div className="text-2xl mb-2">🎯</div>
            <h3 className="font-black text-white mb-2">Prize Pool</h3>
            <p className="text-sm text-white/80 font-medium leading-relaxed">
              Want to fund specific governance reforms? Deposit into the
              outcome-based escrow. Money stays locked until health and income
              measurably improve. Then you vote on which implementers deserve
              payment. Results, not promises.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row">
          <NavItemLink
            item={prizeLink}
            variant="custom"
            className="inline-flex items-center text-sm font-black uppercase text-black hover:text-brutal-pink transition-colors"
          >
            Donate to the Prize Pool &rarr;
          </NavItemLink>
          <NavItemLink
            item={transparencyLink}
            variant="custom"
            className="inline-flex items-center text-sm font-black uppercase text-black hover:text-brutal-pink transition-colors"
          >
            See The Full Pipeline &rarr;
          </NavItemLink>
        </div>
      </section>

      <section className="mb-16">
        <h2 className="section-title">Research</h2>
        <p className="text-sm text-black/60 mb-6 font-medium">
          I showed my working. All of it. In public. Your species finds this unusual for some reason.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paperLinks.map((paper) => (
            <NavItemLink
              key={paper.href}
              item={paper}
              variant="custom"
              external
              className="card group hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              <h3 className="text-black font-black group-hover:text-brutal-pink transition-colors">
                {paper.label}
              </h3>
              <p className="text-sm text-black/60 mt-2 font-medium leading-relaxed">
                {paper.description}
              </p>
              <span className="text-xs text-brutal-pink mt-3 inline-block font-black uppercase">
                Read paper &rarr;
              </span>
            </NavItemLink>
          ))}
        </div>
      </section>

      <section className="card bg-brutal-cyan border-black text-center">
        <h2 className="text-2xl font-black text-black mb-3 uppercase">
          Open By Design
        </h2>
        <p className="text-black/60 mb-6 font-medium max-w-2xl mx-auto leading-relaxed">
          The code is public. The papers are public. The data is public. On my
          planet this is called &ldquo;the bare minimum.&rdquo; Here it seems
          to be called &ldquo;radical transparency.&rdquo;
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          {openSourceButtons.map((link) => (
            <NavItemLink
              key={link.href}
              item={link}
              variant="custom"
              external
              className={
                link.label === "GitHub"
                  ? "inline-flex items-center justify-center gap-2 bg-black px-6 py-3 text-sm font-black text-white uppercase border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                  : "inline-flex items-center justify-center gap-2 bg-white px-6 py-3 text-sm font-black text-black uppercase border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              }
            >
              {link.label === "GitHub" ? "View GitHub" : "Read The README"}
            </NavItemLink>
          ))}
        </div>
      </section>
    </div>
  );
}
