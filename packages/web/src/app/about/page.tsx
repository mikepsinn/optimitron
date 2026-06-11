import { NavItemLink } from "@/components/navigation/NavItemLink";
import {
  fmtParam,
  EXISTING_DRUGS_EFFICACY_LAG_DEATHS_TOTAL,
  PRIZE_POOL_HORIZON_MULTIPLE,
} from "@optimitron/data/parameters";
import {
  aboutLink,
  communityLinks,
  dfdaSpecPaperLink,
  fullManualPaperLink,
  iabLink,
  dtreasuryLink,
  incentiveAlignmentBondsPaperLink,
  onePercentTreatyPaperLink,
  parametersPaperLink,
  prizeLink,
  ROUTES,
} from "@/lib/routes";
import { getRouteMetadata } from "@/lib/metadata";
import { GameCTA } from "@/components/ui/game-cta";

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

const machineFunctions = [
  {
    label: "Measure",
    desc: "Hoover up every outcome, spending, and policy dataset your species has bothered to publish.",
  },
  {
    label: "Score",
    desc: "Grade each claim using actual causal inference. Not vibes. Not committee votes. Maths.",
  },
  {
    label: "Act",
    desc: "Turn the maths into treaty votes, referral links, prize deposits, and awkward conversations.",
  },
];

const researchHighlights = [
  dfdaSpecPaperLink,
  onePercentTreatyPaperLink,
  incentiveAlignmentBondsPaperLink,
  parametersPaperLink,
];

export const metadata = getRouteMetadata(aboutLink);

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="mb-16">
        <div className="max-w-3xl space-y-5">
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-foreground">
            The Earth Optimization Machine
          </h1>
          <p className="text-lg text-foreground leading-relaxed font-bold">
            Earth Optimization Services is the regional branch of Universe
            Optimization Services assigned to this planet. Wishonia is the alien
            CEO. You are the president of the Earth branch. Congratulations.
            This is somehow your job now.
          </p>
          <p className="text-muted-foreground font-bold leading-relaxed">
            Assignment one: get humanity to sign the 1% Treaty, redirect 1% of
            military spending to pragmatic clinical trials, and compress the
            disease-eradication timeline from 443 years to 36.
          </p>
          <p className="text-muted-foreground font-bold leading-relaxed">
            Optimitron is the console on your desk: treaty vote, referral chain,
            prize pool, alignment scores, policy math, budget math, and every
            calculation someone will ask you to defend.
          </p>
        </div>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <GameCTA href={ROUTES.vote} variant="primary">Vote on the Treaty</GameCTA>
          <GameCTA href={ROUTES.prize} variant="secondary">Play the Game</GameCTA>
          <GameCTA href={fullManualPaperLink.href} variant="outline" external>
            Inspect the Blueprint
          </GameCTA>
        </div>
      </section>

      <section className="mb-16">
        <h2 className="section-title">Why It Exists</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <h2 className="section-title">What The Machine Does</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {machineFunctions.map((step, index) => (
            <div key={step.label} className="card py-5">
              <h3 className="text-foreground font-black text-sm uppercase">
                {index + 1}. {step.label}
              </h3>
              <p className="text-sm text-muted-foreground mt-2 font-bold leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-16">
        <h2 className="section-title">Your First Assignment</h2>
        <p className="text-sm text-muted-foreground mb-6 font-bold max-w-3xl">
          On your planet, nothing happens without small pieces of paper with
          presidents on them. The Earth Optimization Game is Phase 1: prove
          demand, move the papers, then make governments explain why they are
          still buying the disease-and-war package.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="card bg-background text-foreground border-foreground">
            <div className="text-2xl mb-2">🏆</div>
            <h3 className="font-black text-foreground mb-2">Prize (Phase 1)</h3>
            <p className="text-sm text-foreground font-bold leading-relaxed">
              Deposit into the prize pool. Recruit voters for the 1% Treaty referendum. If it
              works, you share the prize. If it doesn&apos;t, you get ~{fmtParam(PRIZE_POOL_HORIZON_MULTIPLE)} your
              deposit back from the Earth Optimization Prize fund after 15 years. Zero downside.
            </p>
            <NavItemLink
              item={prizeLink}
              variant="custom"
              className="mt-4 inline-flex items-center text-sm font-black uppercase text-foreground hover:text-foreground transition-colors"
            >
              Play the Game &rarr;
            </NavItemLink>
          </div>
          <div className="card bg-background text-foreground border-primary">
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
              className="mt-4 inline-flex items-center text-sm font-black uppercase hover:text-foreground transition-colors"
            >
              Learn About IABs &rarr;
            </NavItemLink>
          </div>
          <div className="card bg-background text-foreground border-primary">
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
              className="mt-4 inline-flex items-center text-sm font-black uppercase hover:text-foreground transition-colors"
            >
              How $WISH Works &rarr;
            </NavItemLink>
          </div>
        </div>
      </section>

      <section className="mb-16">
        <h2 className="section-title">Research</h2>
        <p className="text-sm text-muted-foreground mb-6 font-bold">
          Every number is public, linked, and checkable. Pull the panel off the
          machine and inspect the wiring.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {researchHighlights.map((paper) => (
            <NavItemLink
              key={paper.href}
              item={paper}
              variant="custom"
              external
              className="card group transition-colors hover:bg-muted"
            >
              <h3 className="text-foreground font-black group-hover:text-foreground transition-colors">
                {paper.label}
              </h3>
              <p className="text-sm text-muted-foreground mt-2 font-bold leading-relaxed">
                {paper.description}
              </p>
              <span className="text-xs text-foreground mt-3 inline-block font-black uppercase">
                Read paper &rarr;
              </span>
            </NavItemLink>
          ))}
        </div>
      </section>

      <section className="card bg-background text-foreground border-primary text-center">
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
