import { NavItemLink } from "@/components/navigation/NavItemLink";
import { ImplementationPlanSection } from "@/components/landing/ImplementationPlanSection";
import { DecentralizedFDASection } from "@/components/landing/DecentralizedFDASection";
import {
  fmtParam,
  EXISTING_DRUGS_EFFICACY_LAG_DEATHS_TOTAL,
  PRIZE_POOL_HORIZON_MULTIPLE,
  US_FEDERAL_SPENDING_2024,
} from "@optimitron/data/parameters";
import {
  aboutLink,
  alignmentLink,
  communityLinks,
  iabLink,
  dtreasuryLink,
  allPaperLinks,
  prizeLink,
  ROUTES,
  studiesLink,
  trackLink,
  transparencyLink,
  wishocracyLink,
} from "@/lib/routes";
import { getRouteMetadata } from "@/lib/metadata";
import { GameCTA } from "@/components/ui/game-cta";

const productSurfaces = [
  {
    item: wishocracyLink,
    title: "Build an ideal budget",
    desc: `Nobody asked you how to spend ${fmtParam({...US_FEDERAL_SPENDING_2024, unit: "USD"})}. This lets you answer anyway.`,
    cta: "Open Wishocracy",
    tone: "bg-brutal-pink",
    titleColor: "text-brutal-pink-foreground",
    descColor: "text-background",
    ctaColor: "text-brutal-pink-foreground hover:text-brutal-yellow",
  },
  {
    item: alignmentLink,
    title: "Match with politicians",
    desc: "Find out which of your elected officials actually agrees with you. Brace yourself.",
    cta: "Open Alignment",
    tone: "bg-brutal-yellow",
    titleColor: "text-brutal-yellow-foreground",
    descColor: "text-brutal-yellow-foreground",
    ctaColor: "text-brutal-yellow-foreground hover:text-brutal-pink",
  },
  {
    item: studiesLink,
    title: "Inspect the evidence",
    desc: "Every claim, tested against data. No opinions. No vibes. Just receipts.",
    cta: "Browse Studies",
    tone: "bg-brutal-cyan",
    titleColor: "text-brutal-cyan-foreground",
    descColor: "text-brutal-cyan-foreground",
    ctaColor: "text-brutal-cyan-foreground hover:text-brutal-pink",
  },
  {
    item: trackLink,
    title: "Track yourself",
    desc: "Log what you do, eat, and feel. I'll tell you what's actually working. Your intuition won't like it.",
    cta: "Open Tracking",
    tone: "bg-brutal-cyan",
    titleColor: "text-brutal-cyan-foreground",
    descColor: "text-brutal-cyan-foreground",
    ctaColor: "text-brutal-cyan-foreground hover:text-brutal-pink",
  },
];

const openSourceButtons = communityLinks.filter(
  ({ label }) => label === "GitHub" || label === "README",
);

const reasons = [
  {
    icon: "💀",
    title: "Bad decisions kill",
    desc: `${Math.round(EXISTING_DRUGS_EFFICACY_LAG_DEATHS_TOTAL.value / 1e6)} million people died waiting for your FDA to approve treatments that were already proven safe. Budgets are body counts with decimal places.`,
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

export const metadata = getRouteMetadata(aboutLink);

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="mb-16">
        <div className="max-w-3xl space-y-5">
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-foreground">
            About The Evidence-Based Earth Optimization Machine
          </h1>
          <p className="text-lg text-foreground leading-relaxed font-bold">
            I built Optimitron because your species keeps making the same
            mistakes and then acting surprised by the results. It takes your
            outcomes, your spending data, and your policies, runs causal
            inference on all of it, and tells you what actually works. You&apos;re
            welcome.
          </p>
          <p className="text-muted-foreground font-bold leading-relaxed">
            The public side focuses on healthy life years, income, and the
            policies and budgets that shape them. The personal side lets you
            track your own inputs and outcomes. Think of it as a diagnostic
            tool for both your civilisation and your breakfast choices.
          </p>
          <p className="text-muted-foreground font-bold leading-relaxed">
            Your governments are already superintelligences — collective
            intelligence systems controlling the lives of billions. The problem
            isn&apos;t that they&apos;re not smart enough. It&apos;s that
            they&apos;re optimising for the wrong things. Optimitron is
            alignment software for the most powerful AIs on your planet — the
            ones made of people.
          </p>
        </div>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <GameCTA href={ROUTES.wishocracy} variant="primary">Start With Wishocracy</GameCTA>
          <GameCTA href={ROUTES.alignment} variant="yellow">See Alignment Reports</GameCTA>
          <GameCTA href="/studies" variant="outline">Browse Studies</GameCTA>
        </div>
      </section>

      <section className="mb-16">
        <h2 className="section-title">What You Can Do Here</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {productSurfaces.map((surface) => (
            <div
              key={surface.title}
              className={`p-6 border-4 border-primary ${surface.tone} shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] flex flex-col`}
            >
              <h3 className={`text-xl font-black ${surface.titleColor} mb-3`}>{surface.title}</h3>
              <p className={`text-sm ${surface.descColor} leading-relaxed font-bold flex-grow`}>
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
              <h3 className="text-foreground font-black mb-2">{reason.title}</h3>
              <p className="text-sm text-muted-foreground font-bold leading-relaxed">
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
              <div className="text-foreground font-black text-sm uppercase">{step.label}</div>
              <div className="text-xs text-muted-foreground mt-2 font-bold leading-relaxed">
                {step.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-16">
        <h2 className="section-title">The Economic System</h2>
        <p className="text-sm text-muted-foreground mb-6 font-bold max-w-3xl">
          On your planet, nothing happens without small pieces of paper with
          presidents on them. So here are three ways to make the papers flow in
          the right direction. Three mechanisms, three phases. Don&apos;t mix them
          up — your species has a habit of confusing different piles of money.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="card bg-brutal-pink text-brutal-pink-foreground border-primary">
            <div className="text-2xl mb-2">🏆</div>
            <h3 className="font-black text-brutal-pink-foreground mb-2">Prize (Phase 1)</h3>
            <p className="text-sm text-background font-bold leading-relaxed">
              Deposit USDC. Recruit voters for the 1% Treaty referendum. If it
              works, you share the prize. If it doesn&apos;t, you get ~{fmtParam(PRIZE_POOL_HORIZON_MULTIPLE)} your
              deposit back from the Earth Optimization Prize fund after 15 years. Zero downside.
            </p>
            <NavItemLink
              item={prizeLink}
              variant="custom"
              className="mt-4 inline-flex items-center text-sm font-black uppercase text-brutal-pink-foreground hover:text-brutal-yellow transition-colors"
            >
              Play the Game &rarr;
            </NavItemLink>
          </div>
          <div className="card bg-brutal-cyan text-brutal-cyan-foreground border-primary">
            <div className="text-2xl mb-2">🤝</div>
            <h3 className="font-black mb-2">IABs (Phase 2)</h3>
            <p className="text-sm font-bold leading-relaxed">
              After the referendum proves demand, raise ~$1B to lobby for the
              treaty. Revenue splits 80/10/10: clinical trials, investors,
              superpacs for aligned politicians.
            </p>
            <NavItemLink
              item={iabLink}
              variant="custom"
              className="mt-4 inline-flex items-center text-sm font-black uppercase hover:text-brutal-pink transition-colors"
            >
              Learn About IABs &rarr;
            </NavItemLink>
          </div>
          <div className="card bg-brutal-yellow text-brutal-yellow-foreground border-primary">
            <div className="text-2xl mb-2">💸</div>
            <h3 className="font-black mb-2">$WISH</h3>
            <p className="text-sm font-bold leading-relaxed">
              Programmable currency with 0.5% transaction tax. Replaces the IRS,
              welfare bureaucracy, and lobbying with automatic UBI and
              Wishocratic public goods allocation.
            </p>
            <NavItemLink
              item={dtreasuryLink}
              variant="custom"
              className="mt-4 inline-flex items-center text-sm font-black uppercase hover:text-brutal-pink transition-colors"
            >
              How $WISH Works &rarr;
            </NavItemLink>
          </div>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row">
          <NavItemLink
            item={prizeLink}
            variant="custom"
            className="inline-flex items-center text-sm font-black uppercase text-foreground hover:text-brutal-pink transition-colors"
          >
            Play the Game &rarr;
          </NavItemLink>
          <NavItemLink
            item={transparencyLink}
            variant="custom"
            className="inline-flex items-center text-sm font-black uppercase text-foreground hover:text-brutal-pink transition-colors"
          >
            See The Full Pipeline &rarr;
          </NavItemLink>
        </div>
      </section>

      <ImplementationPlanSection />
      <DecentralizedFDASection />

      <section className="mb-16">
        <h2 className="section-title">Research</h2>
        <p className="text-sm text-muted-foreground mb-6 font-bold">
          I showed my working. All of it. In public. Your species finds this unusual for some reason.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allPaperLinks.map((paper) => (
            <NavItemLink
              key={paper.href}
              item={paper}
              variant="custom"
              external
              className="card group hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              <h3 className="text-foreground font-black group-hover:text-brutal-pink transition-colors">
                {paper.label}
              </h3>
              <p className="text-sm text-muted-foreground mt-2 font-bold leading-relaxed">
                {paper.description}
              </p>
              <span className="text-xs text-brutal-pink mt-3 inline-block font-black uppercase">
                Read paper &rarr;
              </span>
            </NavItemLink>
          ))}
        </div>
      </section>

      <section className="card bg-brutal-cyan text-brutal-cyan-foreground border-primary text-center">
        <h2 className="text-2xl font-black mb-3 uppercase">
          Open By Design
        </h2>
        <p className="mb-6 font-bold max-w-2xl mx-auto leading-relaxed">
          The code is public. The papers are public. The data is public. On my
          planet this is called &ldquo;the bare minimum.&rdquo; Here it seems
          to be called &ldquo;radical transparency.&rdquo;
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          {openSourceButtons.map((link) => (
            <GameCTA
              key={link.href}
              href={link.href}
              variant={link.label === "GitHub" ? "secondary" : "outline"}
              external
            >
              {link.label === "GitHub" ? "View GitHub" : "Read The README"}
            </GameCTA>
          ))}
        </div>
      </section>
    </div>
  );
}
