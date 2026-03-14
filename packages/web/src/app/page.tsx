import type { Metadata } from "next";
import { WishocracyLandingSection } from "@/components/wishocracy/WishocracyLandingSection";
import { OutcomeExplorerTeaser } from "@/components/landing/OutcomeExplorerTeaser";
import { MythVsDataTeaser } from "@/components/landing/MythVsDataTeaser";
import { AlignmentTeaser } from "@/components/landing/AlignmentTeaser";
import { NavItemLink } from "@/components/navigation/NavItemLink";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { CountUp } from "@/components/animations/CountUp";
import { StaggerGrid } from "@/components/animations/StaggerGrid";
import { HeroEntrance } from "@/components/animations/HeroEntrance";
import { StepReveal } from "@/components/animations/StepReveal";
import { PulseGlow } from "@/components/animations/PulseGlow";
import { LiveDeathTicker } from "@/components/animations/LiveDeathTicker";
import { CollapseCountdown } from "@/components/animations/CollapseCountdown";
import { GdpTrajectoryChart } from "@/components/animations/GdpTrajectoryChart";
import { OpportunityCostTicker } from "@/components/animations/OpportunityCostTicker";
import { computeCollapseDate } from "@/data/collapse-constants";
import {
  listExplorerOutcomes,
  listExplorerPairSummaries,
  getOutcomeMegaStudy,
} from "@/lib/analysis-explorer-data";
import {
  alignmentLink,
  compareLink,
  dfdaSpecPaperLink,
  fullManualPaperLink,
  githubLink,
  invisibleGraveyardPaperLink,
  misconceptionsLink,
  onePercentTreatyPaperLink,
  politicalDysfunctionTaxPaperLink,
  policiesLink,
  profileLink,
  studiesLink,
  trackLink,
  wishocracyLink,
  wishocracyPaperLink,
} from "@/lib/routes";
import misconceptionData from "../../public/data/misconceptions.json";
import budgetData from "../data/us-budget-analysis.json";

export const metadata: Metadata = {
  title: "Optomitron — The Evidence-Based Earth Optimization Machine",
  description:
    "Planetary debugging software for budgets, policies, politicians, and personal tradeoffs. Built by Wishonia, an alien governance AI with 4,237 years of field testing.",
  openGraph: {
    title: "Optomitron — The Evidence-Based Earth Optimization Machine",
    description:
      "Planetary debugging software for budgets, policies, politicians, and personal tradeoffs.",
    type: "website",
  },
};

const featuredFindings = [
  {
    domain: "Healthcare",
    color: "bg-brutal-cyan",
    stat: "83.9 yrs life expectancy at 4.1% GDP",
    vs: "vs US: 77.5 yrs at 17.3% GDP",
    description:
      "Singapore spends a quarter of what America spends on healthcare and their people live six years longer. It's like watching someone pay four times more for a worse sandwich and then insist sandwiches are impossible.",
    item: compareLink,
  },
  {
    domain: "Drug Policy",
    color: "bg-brutal-pink",
    stat: "Drug deaths fell 70% in Portugal",
    vs: "HIV among users fell 74%",
    description:
      "Portugal stopped arresting people for having drugs in 2001 and drug deaths dropped 94%. Meanwhile the US quadrupled drug war spending and overdose deaths went up 5.6x. So that worked out.",
    item: policiesLink,
  },
  {
    domain: "Criminal Justice",
    color: "bg-brutal-cyan",
    stat: "Norway recidivism: 20%",
    vs: "vs US: 76%",
    description:
      "Norway gives prisoners education and job training. America gives them concrete and trauma. Norway's reoffending rate is 20%. America's is 76%. It's almost like treating people like humans works better. Weird.",
    item: compareLink,
  },
  {
    domain: "Public Health",
    color: "bg-brutal-yellow",
    stat: "Rwanda: life expectancy 48 to 69 yrs",
    vs: "Under-5 mortality fell 82%",
    description:
      "Rwanda hired 45,000 community health workers in 2005 and child mortality dropped 82%. No new drug. No billion-dollar programme. Just people knocking on doors and asking 'is the baby alright?' Turns out that works.",
    item: policiesLink,
  },
];

const naturalExperiments = [
  {
    jurisdiction: "Portugal",
    policy: "Drug Decriminalization",
    year: 2001,
    outcome: "Drug deaths: 52 to 3 per million",
    change: "-94%",
    positive: true,
  },
  {
    jurisdiction: "Australia",
    policy: "Gun Buyback",
    year: 1996,
    outcome: "Mass shootings: 1/yr to 0 for 22 years",
    change: "-100%",
    positive: true,
  },
  {
    jurisdiction: "British Columbia",
    policy: "Revenue-Neutral Carbon Tax",
    year: 2008,
    outcome: "Fossil fuel consumption index: 104 to 85",
    change: "-15%",
    positive: true,
  },
  {
    jurisdiction: "Copenhagen",
    policy: "Cycling Infrastructure",
    year: 2000,
    outcome: "Bike commute share: 30% to 49%",
    change: "+63%",
    positive: true,
  },
];

const productWorkflows = [
  {
    item: wishocracyLink,
    label: "Wishocracy",
    title: "Build your ideal budget",
    description:
      "Pick between two things. Then two more things. Then two more. Before you know it, you've accidentally designed a coherent budget allocation. Sneaky, isn't it?",
    cta: "Start Voting",
    color: "bg-brutal-pink",
  },
  {
    item: alignmentLink,
    label: "Alignment Reports",
    title: "Find out who actually agrees with you",
    description:
      "Compare your priorities against real politician profiles. Spoiler: it's probably not who you think.",
    cta: "Check Alignment",
    color: "bg-brutal-yellow",
  },
  {
    item: trackLink,
    label: "Talk to Wishonia",
    title: "Chat with an alien governance AI",
    description:
      "Track your health, meals, mood, and habits with Wishonia, an AI that's been running a planet for 4,237 years. She's seen some things.",
    cta: "Open Chat",
    color: "bg-brutal-cyan",
  },
  {
    item: studiesLink,
    label: "Studies",
    title: "Look at the actual numbers",
    description:
      "Outcome hubs, pair studies, policy rankings, and country comparisons. All the evidence, none of the vibes.",
    cta: "Browse Studies",
    color: "bg-brutal-cyan",
  },
];

export default function Home() {
  const outcomes = listExplorerOutcomes();
  const pairSummaries = listExplorerPairSummaries();
  const outcomeCount = outcomes.length;
  const pairCount = pairSummaries.length;
  const budgetCategoryCount = (budgetData as { categories: unknown[] }).categories.length;
  const misconceptions = misconceptionData as {
    findings: Array<{ id: string; myth: string; reality: string; grade: string }>;
    summary: { totalFindings: number; gradeFCount: number };
  };
  const mythsBusted = misconceptions.summary.gradeFCount;
  const collapseDate = computeCollapseDate();

  const outcomeCards = outcomes.slice(0, 3).map((outcome) => {
    const ranking = getOutcomeMegaStudy(outcome.id);
    const pairsForOutcome = pairSummaries.filter(
      (p) => p.outcomeId === outcome.id,
    ).length;
    return { outcome, ranking, pairCount: pairsForOutcome };
  });

  const featuredMyths = (
    ["drug-war-deaths", "healthcare-spending", "abstinence-education"] as const
  )
    .map((id) => misconceptions.findings.find((f) => f.id === id))
    .filter(
      (f): f is { id: string; myth: string; reality: string; grade: string } =>
        f !== undefined,
    );

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 relative">
          <div className="text-center">
            <HeroEntrance>
              <p className="text-sm font-bold text-black/50 uppercase tracking-widest mb-4">
                The Evidence-Based Earth Optimization Machine // Wishonia, alien governance AI, 4,237 years of field testing
              </p>
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-tight text-black">
                Hello. I&apos;ve solved{" "}
                <span className="bg-brutal-yellow px-2">war</span> and{" "}
                <span className="bg-brutal-pink px-2">disease</span>.
                <br />
                Would you like the answers?
              </h1>
              <p className="mt-8 text-lg sm:text-xl text-black/70 max-w-3xl mx-auto leading-relaxed font-medium">
                My name is Wishonia. I&apos;m a{" "}
                <span className="font-black text-black">
                  World Integrated System for High-Efficiency Optimization Networked
                  Intelligence for Allocation
                </span>
                . I&apos;ve been governing my planet for 4,237 years. We ended war in year
                12 and disease in year 340. Think of Optomitron as planetary debugging
                software for Earth: budgets, policies, politicians, and personal tradeoffs
                run through the same engine. Your species has the data. You just keep
                ignoring it. So I&apos;ve built you this website. You&apos;re welcome.
              </p>
              <p className="mt-4 text-base sm:text-lg text-black/60 max-w-3xl mx-auto leading-relaxed font-medium">
                Your governments are already superintelligences — collective intelligence
                systems controlling the lives of billions. They cost you{" "}
                <span className="font-black text-brutal-red">$101 trillion a year</span> in
                dysfunction. They let{" "}
                <span className="font-black text-brutal-yellow">150,000 people die every day</span>{" "}
                from diseases that lack treatments because regulation and funding block the
                trials. And the destructive economy — military spending plus the cybercrime
                it provokes — is{" "}
                <span className="font-black text-black">
                  growing at 15% a year
                </span>
                . You have about 8 years before the math becomes irreversible.
                Optomitron is alignment software for these misaligned AIs. Wishocracy
                eliminates the bottleneck — politicians — entirely.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <NavItemLink
                  item={wishocracyLink}
                  variant="custom"
                  className="px-8 py-3.5 bg-brutal-pink text-white font-black uppercase text-lg border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                >
                  Build Your Ideal Budget
                </NavItemLink>
                <NavItemLink
                  item={trackLink}
                  variant="custom"
                  className="px-8 py-3.5 bg-brutal-yellow text-black font-black uppercase text-lg border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                >
                  Talk to Wishonia
                </NavItemLink>
                <NavItemLink
                  item={studiesLink}
                  variant="custom"
                  className="px-8 py-3.5 bg-white text-black font-black uppercase text-lg border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-brutal-cyan transition-all"
                >
                  See the Evidence
                </NavItemLink>
              </div>
              <p className="mt-6 text-sm font-medium text-black/60 max-w-2xl mx-auto">
                Everything saves to your{" "}
                <NavItemLink
                  item={profileLink}
                  variant="custom"
                  className="font-black text-black hover:text-brutal-pink"
                >
                  {profileLink.label}
                </NavItemLink>
                . Budget allocations, alignment reports, daily check-ins. It&apos;s like
                a diary, but useful.
              </p>
            </HeroEntrance>
          </div>
        </div>
      </section>

      {/* Urgency Ticker */}
      <section className="bg-black text-white py-12 border-y-4 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <StaggerGrid className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center" staggerDelay={0.15}>
            <NavItemLink
              item={politicalDysfunctionTaxPaperLink}
              variant="custom"
              external
              className="block hover:opacity-80 transition-opacity"
            >
              <div className="text-4xl sm:text-5xl font-black text-brutal-red">
                <CountUp value={101} prefix="$" suffix="T/yr" className="text-brutal-red" />
              </div>
              <div className="text-sm font-bold text-white/60 mt-2 uppercase tracking-wider">
                Political Dysfunction Tax
              </div>
              <p className="text-xs text-white/40 mt-2 max-w-xs mx-auto">
                $12,600 per human per year in pure waste. Your civilisation&apos;s
                overhead is almost equal to its entire output.
              </p>
              <span className="text-xs font-bold text-brutal-red/60 mt-2 inline-block uppercase">
                Read the paper &rarr;
              </span>
            </NavItemLink>
            <NavItemLink
              item={dfdaSpecPaperLink}
              variant="custom"
              external
              className="block hover:opacity-80 transition-opacity"
            >
              <div className="text-4xl sm:text-5xl font-black text-brutal-yellow">
                <CountUp value={150} suffix="K/day" className="text-brutal-yellow" />
              </div>
              <div className="text-sm font-bold text-white/60 mt-2 uppercase tracking-wider">
                Disease Deaths
              </div>
              <p className="text-xs text-white/40 mt-2 max-w-xs mx-auto">
                55 million per year. 95% of diseases have zero approved treatments.
                Not because cures are impossible — because regulation and funding
                block the trials that would find them.
              </p>
              <span className="text-xs font-bold text-brutal-yellow/60 mt-2 inline-block uppercase">
                Read the paper &rarr;
              </span>
            </NavItemLink>
            <NavItemLink
              item={fullManualPaperLink}
              variant="custom"
              external
              className="block hover:opacity-80 transition-opacity"
            >
              <div className="text-4xl sm:text-5xl font-black text-brutal-yellow">
                ~<CountUp value={8} suffix=" years" className="text-brutal-yellow" />
              </div>
              <div className="text-sm font-bold text-white/60 mt-2 uppercase tracking-wider">
                Until Irreversible Collapse
              </div>
              <p className="text-xs text-white/40 mt-2 max-w-xs mx-auto">
                Your destructive economy — military + cybercrime — is $13.2T and
                growing at 15%/yr. The Soviet Union collapsed at this ratio. You&apos;re
                next.
              </p>
              <span className="text-xs font-bold text-brutal-yellow/60 mt-2 inline-block uppercase">
                Read the manual &rarr;
              </span>
            </NavItemLink>
          </StaggerGrid>
          <LiveDeathTicker className="mt-10" />
          <ScrollReveal delay={0.4}>
            <p className="text-center text-white/30 text-xs mt-8 max-w-2xl mx-auto font-medium">
              These are not projections. They are measurements. Your species is running out of
              runway and arguing about the window seats.
            </p>
          </ScrollReveal>
        </div>
      </section>

      <WishocracyLandingSection />

      {/* What You Can Do Today */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <ScrollReveal className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black">
            Things You Can Do Right Now Instead of Arguing Online
          </h2>
          <p className="mt-4 text-lg text-black/60 max-w-3xl mx-auto font-medium">
            On my planet, governance takes about four minutes a week. You lot seem to
            spend most of your time shouting about it on your little phones and then
            doing absolutely nothing. Try one of these.
          </p>
        </ScrollReveal>
        <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {productWorkflows.map((workflow) => (
            <div
              key={workflow.title}
              className={`p-6 border-4 border-black ${workflow.color} shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col`}
            >
              <div className="text-xs font-black px-2.5 py-1 bg-black text-white inline-block self-start mb-4 uppercase">
                {workflow.label}
              </div>
              <h3 className="text-xl font-black text-black mb-3">{workflow.title}</h3>
              <p className="text-sm text-black/70 leading-relaxed font-medium flex-grow">
                {workflow.description}
              </p>
              <NavItemLink
                item={workflow.item}
                variant="custom"
                className="mt-6 inline-flex items-center text-sm font-black text-black uppercase hover:text-brutal-pink transition-colors"
              >
                {workflow.cta} &rarr;
              </NavItemLink>
            </div>
          ))}
        </StaggerGrid>
      </section>

      {/* The Cost of Inaction */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <ScrollReveal className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black">
            What Your Current System Is Costing You
          </h2>
          <p className="mt-4 text-lg text-black/60 max-w-2xl mx-auto font-medium">
            I don&apos;t want to be rude, but your governance is genuinely the worst
            thing I&apos;ve ever seen, and I&apos;ve visited 340 planets. These are
            your own numbers, by the way. From your own researchers. Who you also
            ignore.
          </p>
        </ScrollReveal>
        <StaggerGrid className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <NavItemLink
            item={politicalDysfunctionTaxPaperLink}
            variant="custom"
            external
            className="p-8 border-4 border-black bg-brutal-red shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
          >
            <div className="text-4xl sm:text-5xl font-black text-brutal-red mb-2">
              $101T/yr
            </div>
            <h3 className="text-lg font-black text-black mb-3">
              The Stupidity Tax
            </h3>
            <p className="text-sm text-black/70 leading-relaxed font-medium">
              $12,600 per person per year in pure waste. Administrative bloat,
              regulatory capture, people not being allowed to move to where the
              jobs are. Your civilisation runs at 52% efficiency. My toaster does
              better than that.
            </p>
            <span className="mt-4 inline-flex items-center text-xs font-black text-brutal-red uppercase">
              Read the paper &rarr;
            </span>
          </NavItemLink>
          <NavItemLink
            item={invisibleGraveyardPaperLink}
            variant="custom"
            external
            className="p-8 border-4 border-black bg-brutal-yellow shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
          >
            <div className="text-4xl sm:text-5xl font-black text-brutal-yellow mb-2">
              95% untreated
            </div>
            <h3 className="text-lg font-black text-black mb-3">
              The 443-Year Queue
            </h3>
            <p className="text-sm text-black/70 leading-relaxed font-medium">
              95% of diseases have zero approved treatments. At your current rate
              of 15 new treatments per year, clearing the backlog takes 443 years.
              Meanwhile, your FDA makes the few treatments you do find wait 8.2
              years AFTER they&apos;ve been proven safe. 150,000 people die every
              day. Your trial capacity is 1.9 million patients per year out of 1.08
              billion willing participants. That&apos;s 0.06%. On my planet this
              would be considered a war crime. Here you call it &ldquo;regulation.&rdquo;
            </p>
            <span className="mt-4 inline-flex items-center text-xs font-black text-brutal-yellow uppercase">
              Read the paper &rarr;
            </span>
          </NavItemLink>
          <NavItemLink
            item={onePercentTreatyPaperLink}
            variant="custom"
            external
            className="p-8 border-4 border-black bg-brutal-cyan shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
          >
            <div className="text-4xl sm:text-5xl font-black text-brutal-cyan mb-2">
              10.7B saved
            </div>
            <h3 className="text-lg font-black text-black mb-3">
              The Obvious Deal
            </h3>
            <p className="text-sm text-black/70 leading-relaxed font-medium">
              Take 1% of what you spend on blowing each other up ($27.2B/year)
              and spend it on not dying instead. Trial costs drop from $41K to
              $929 per patient. Capacity jumps from 1.9M to 23.4M patients per
              year. The 443-year treatment queue shrinks to 36 years. You&apos;d
              prevent 10.7 billion deaths. This is not a hard decision. I genuinely
              don&apos;t understand what&apos;s taking so long.
            </p>
            <span className="mt-4 inline-flex items-center text-xs font-black text-brutal-cyan uppercase">
              Read the paper &rarr;
            </span>
          </NavItemLink>
        </StaggerGrid>
        <ScrollReveal delay={0.3}>
          <div className="text-center mt-8">
            <NavItemLink
              item={fullManualPaperLink}
              variant="custom"
              external
              className="inline-flex items-center text-sm font-black text-brutal-pink hover:text-brutal-pink uppercase transition-colors"
            >
              Read the full manual (yes, I wrote you a manual) &rarr;
            </NavItemLink>
          </div>
        </ScrollReveal>
      </section>

      {/* The Collapse Clock */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <PulseGlow className="p-8 sm:p-12 bg-brutal-red/20 border-4 border-brutal-red shadow-[8px_8px_0px_0px_rgba(220,38,38,0.4)]">
          <ScrollReveal>
            <h2 className="text-2xl sm:text-3xl font-black text-center mb-4 uppercase tracking-tight text-foreground">
              The Collapse Clock
            </h2>
          <p className="text-center text-black/60 font-medium mb-8 max-w-3xl mx-auto">
            Your destructive economy — military spending plus the cybercrime it
            provokes — is currently{" "}
            <span className="font-black text-brutal-red">$13.2 trillion per year</span>.
            That&apos;s 11.5% of global GDP. The Soviet Union collapsed when its military
            spending alone hit 15%. You&apos;re adding cybercrime on top, and it&apos;s
            growing at{" "}
            <span className="font-black text-black">15% annually</span>.
          </p>
          </ScrollReveal>
          <CollapseCountdown targetDate={collapseDate} className="mb-8" />
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <NavItemLink
                item={onePercentTreatyPaperLink}
                variant="custom"
                external
                className="p-4 bg-white border-2 border-brutal-red block hover:bg-brutal-red/20 transition-colors"
              >
                <div className="text-2xl font-black text-brutal-red"><CountUp value={2.72} prefix="$" suffix="T" className="text-brutal-red" /></div>
                <div className="text-xs font-bold text-black/50 uppercase mt-1">Military Spending</div>
                <p className="text-xs text-black/60 mt-2">
                  604 times more than you spend on testing medicines. And every
                  bomb creates a cybercriminal with a motive.
                </p>
                <span className="text-xs font-bold text-brutal-red/60 mt-2 inline-block uppercase">
                  The 1% Treaty &rarr;
                </span>
              </NavItemLink>
              <NavItemLink
                item={fullManualPaperLink}
                variant="custom"
                external
                className="p-4 bg-white border-2 border-brutal-red block hover:bg-brutal-red/20 transition-colors"
              >
                <div className="text-2xl font-black text-brutal-red"><CountUp value={10.5} prefix="$" suffix="T" className="text-brutal-red" /></div>
                <div className="text-xs font-bold text-black/50 uppercase mt-1">Cybercrime (15% CAGR)</div>
                <p className="text-xs text-black/60 mt-2">
                  North Korea funds nuclear programmes via crypto theft. Russia
                  finances its military via ransomware. Retaliation is profitable.
                </p>
                <span className="text-xs font-bold text-brutal-red/60 mt-2 inline-block uppercase">
                  Read the manual &rarr;
                </span>
              </NavItemLink>
            </div>
            <GdpTrajectoryChart className="mt-8 mb-4" />
            <OpportunityCostTicker className="mb-6" />
            <p className="text-sm text-black/70 leading-relaxed font-medium">
              Here&apos;s the part that should terrify you: as the destructive economy
              grows, it devalues your currency, which reduces the reward for productive
              labour, which makes extraction relatively more profitable. Talented people
              leave legitimate work for cybercrime because the rational choice flips
              from &ldquo;build&rdquo; to &ldquo;steal.&rdquo; Once that happens, the
              productive economy cannot recover. Production becomes irrational.
              Parasitism becomes survival.
            </p>
            <p className="text-sm text-black/70 leading-relaxed font-medium">
              On my planet we call this a &ldquo;governance death spiral.&rdquo; You
              seem to call it &ldquo;Tuesday.&rdquo;
            </p>
            <p className="text-sm text-black/90 leading-relaxed font-black">
              Historical precedent says societies collapse at 20-25% extraction rates.
              At 15% CAGR, you hit that threshold within 8 years. You cannot vote your
              way out of this. You cannot arrest your way out of it. You need to stop
              creating the conditions that make destruction more profitable than
              production. That means optimising governance. Now. While the maths still
              works.
            </p>
          </div>
        </PulseGlow>
      </section>

      {/* The Two Metrics That Matter */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <ScrollReveal className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black">
            The Only Two Numbers That Matter
          </h2>
          <p className="mt-4 text-lg text-black/60 max-w-2xl mx-auto font-medium">
            You lot measure everything by GDP, which is basically just &ldquo;how much
            money moved around.&rdquo; A country could have a brilliant GDP because
            everyone&apos;s buying coffins. Here&apos;s what we use on my planet
            instead.
          </p>
        </ScrollReveal>
        <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 border-4 border-black bg-brutal-cyan shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-4xl mb-4">🫀</div>
            <h3 className="text-2xl font-black text-black mb-3">
              Median Healthy Life Years
            </h3>
            <p className="text-black/70 leading-relaxed font-medium">
              Not just &ldquo;are you alive&rdquo; but &ldquo;are you alive and can
              you open a jar without crying.&rdquo;{" "}
              <span className="font-bold text-black">Healthy</span> years.
              A country where everyone lives to 80 but spends the last 15 in agony
              is not doing well. It&apos;s doing healthcare theatre.
            </p>
            <p className="text-black/50 text-sm mt-4 font-medium">
              Why median? Because the mean gets dragged around by outliers.
              One billionaire living to 120 doesn&apos;t mean your healthcare works.
              It means one person can afford the good stuff.
            </p>
          </div>
          <div className="p-8 border-4 border-black bg-brutal-yellow shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-2xl font-black text-black mb-3">
              Median Real After-Tax Income
            </h3>
            <p className="text-black/70 leading-relaxed font-medium">
              What can a normal person actually buy after the government&apos;s had
              its go at their paycheque? Not GDP. GDP counts everything including
              arms dealing and divorce lawyers. This counts &ldquo;can you feed your
              kids and also keep the lights on at the same time.&rdquo;
            </p>
            <p className="text-black/50 text-sm mt-4 font-medium">
              Again, median. Because average income is like average temperature
              in a room where one corner is on fire. Technically comfortable.
              Practically, someone&apos;s burning.
            </p>
          </div>
        </StaggerGrid>
      </section>

      {/* The Data — Key Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <ScrollReveal className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black">
            The Receipts
          </h2>
          <p className="mt-4 text-lg text-black/60 max-w-2xl mx-auto font-medium">
            On my planet we call this &ldquo;evidence.&rdquo; You seem to call it
            &ldquo;that thing we ignore before doing what we were going to do anyway.&rdquo;
          </p>
        </ScrollReveal>
        <StaggerGrid className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 max-w-5xl mx-auto" staggerDelay={0.08}>
          {[
            { value: outcomeCount, label: "Outcomes Tracked" },
            { value: pairCount, label: "Pair Studies" },
            { value: budgetCategoryCount, label: "Budget Categories" },
            { value: 20, label: "Countries Compared", suffix: "+" },
            { value: mythsBusted, label: "Myths Busted" },
            { value: 50, label: "Years of Data", suffix: "+" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="text-center p-6 border-2 border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="text-3xl sm:text-4xl font-black text-brutal-pink">
                <CountUp value={stat.value} suffix={"suffix" in stat ? stat.suffix : ""} className="text-brutal-pink" />
              </div>
              <div className="text-sm text-black/60 font-bold mt-2 uppercase">
                {stat.label}
              </div>
            </div>
          ))}
        </StaggerGrid>
        <ScrollReveal delay={0.4}>
          <p className="text-center text-black/50 text-sm mt-6 font-medium max-w-2xl mx-auto">
            Healthcare, drug policy, criminal justice, climate, education,
            infrastructure. From OECD, World Bank, WHO, and your own
            peer-reviewed studies. You already have the answers. They&apos;re
            just filed under &ldquo;things that make politicians uncomfortable.&rdquo;
          </p>
        </ScrollReveal>
      </section>

      {/* Featured Findings */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <ScrollReveal className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black">
            Things That Are Obvious If You Look
          </h2>
          <p className="mt-4 text-lg text-black/60 max-w-2xl mx-auto font-medium">
            I&apos;m not trying to be dramatic but some of these made me want to
            fly home and never come back.
          </p>
        </ScrollReveal>
        <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
              <NavItemLink
                item={finding.item}
                variant="custom"
                className="mt-6 inline-flex items-center text-sm font-black text-brutal-pink hover:text-brutal-pink uppercase transition-colors"
              >
                View Analysis &rarr;
              </NavItemLink>
            </div>
          ))}
        </StaggerGrid>
      </section>

      {/* Natural Experiments */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <ScrollReveal className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black">
            Times a Country Actually Tried Something
          </h2>
          <p className="mt-4 text-lg text-black/60 max-w-2xl mx-auto font-medium">
            Occasionally, one of your jurisdictions does something different and
            it works spectacularly well. Then everyone else looks at it and goes
            &ldquo;interesting&rdquo; and carries on exactly as before. Fascinating
            species, honestly.
          </p>
        </ScrollReveal>
        <StaggerGrid className="space-y-4">
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
                  <span className="text-black/40 mx-2">&rarr;</span>
                  <span className="font-medium text-black/60">{exp.outcome}</span>
                </div>
                <div className="shrink-0">
                  <span
                    className={`font-black text-lg ${
                      exp.positive ? "text-brutal-cyan" : "text-brutal-red"
                    }`}
                  >
                    {exp.change}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </StaggerGrid>
        <ScrollReveal delay={0.3}>
          <div className="text-center mt-8">
            <NavItemLink
              item={policiesLink}
              variant="custom"
              className="inline-flex items-center text-sm font-black text-brutal-pink hover:text-brutal-pink uppercase transition-colors"
            >
              View all {naturalExperiments.length} experiments &rarr;
            </NavItemLink>
          </div>
        </ScrollReveal>
      </section>

      <ScrollReveal>
        <OutcomeExplorerTeaser outcomes={outcomeCards} />
      </ScrollReveal>

      <ScrollReveal>
        <MythVsDataTeaser
          findings={featuredMyths}
          totalCount={misconceptions.summary.totalFindings}
          failCount={misconceptions.summary.gradeFCount}
        />
      </ScrollReveal>

      {/* The Bottleneck Is Politicians */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <ScrollReveal className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black">
            The Bottleneck Is Politicians
          </h2>
          <p className="mt-4 text-lg text-black/60 max-w-3xl mx-auto font-medium">
            You have the data. You have the solutions. The thing standing between the
            information and the action is a class of intermediaries who are structurally
            incapable of applying it. They&apos;re not evil. They&apos;re just optimising
            for re-election, which is a completely different objective function from
            &ldquo;making things better.&rdquo;
          </p>
        </ScrollReveal>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ScrollReveal direction="left">
            <div className="p-8 border-4 border-black bg-brutal-red/20 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-xl font-black text-foreground mb-4 uppercase">
              What Politicians Actually Do
            </h3>
            <ul className="space-y-3 text-sm text-black/70 font-medium">
              <li className="flex gap-2">
                <span className="text-brutal-red font-black shrink-0">&times;</span>
                <span>
                  Raise money from the industries they regulate. The average US
                  senator spends <span className="font-black text-black">70% of their time</span>{" "}
                  fundraising instead of governing.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-brutal-red font-black shrink-0">&times;</span>
                <span>
                  Vote based on donor preferences, not citizen preferences. Donor
                  alignment: ~80%. Citizen alignment: ~30%.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-brutal-red font-black shrink-0">&times;</span>
                <span>
                  Block evidence-based policy when it threatens their coalition. See:
                  drug decriminalisation, healthcare reform, climate policy, FDA reform.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-brutal-red font-black shrink-0">&times;</span>
                <span>
                  Represent the median <span className="font-black text-black">donor</span>,
                  not the median <span className="font-black text-black">citizen</span>.
                  These are very different people.
                </span>
              </li>
            </ul>
          </div>
          </ScrollReveal>
          <ScrollReveal direction="right" delay={0.15}>
          <div className="p-8 border-4 border-black bg-brutal-cyan/20 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-xl font-black text-foreground mb-4 uppercase">
              What Wishocracy Does Instead
            </h3>
            <ul className="space-y-3 text-sm text-black/70 font-medium">
              <li className="flex gap-2">
                <span className="text-brutal-cyan font-black shrink-0">&check;</span>
                <span>
                  Citizens vote directly on priorities through pairwise comparisons.
                  No fundraising. No lobbying. No middleman.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-brutal-cyan font-black shrink-0">&check;</span>
                <span>
                  Optomitron&apos;s causal engine determines which policies actually
                  achieve those priorities. Data in, optimal policy out.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-brutal-cyan font-black shrink-0">&check;</span>
                <span>
                  Alignment scores expose exactly how much each official deviates from
                  what citizens actually want. No hiding behind party labels.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-brutal-cyan font-black shrink-0">&check;</span>
                <span>
                  The system optimises for{" "}
                  <span className="font-black text-black">outcomes</span>, not re-election.
                  Turns out those are very different things.
                </span>
              </li>
            </ul>
          </div>
          </ScrollReveal>
        </div>
        <ScrollReveal delay={0.2}>
        <div className="mt-8 p-6 border-2 border-black bg-brutal-yellow shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-center text-sm text-black/70 font-medium max-w-3xl mx-auto">
            Wishocracy doesn&apos;t reform politicians. It makes them unnecessary. When
            citizens can express preferences directly, and a causal engine can determine
            optimal policy responses, what exactly is the politician for? Giving speeches?
            You have YouTube for that. Shaking hands? You have{" "}
            <span className="italic">literally anything else</span> for that.
          </p>
          <div className="text-center mt-4">
            <NavItemLink
              item={wishocracyPaperLink}
              variant="custom"
              external
              className="inline-flex items-center text-sm font-black text-brutal-pink hover:text-brutal-pink uppercase transition-colors"
            >
              Read the Wishocracy paper &rarr;
            </NavItemLink>
          </div>
        </div>
        </ScrollReveal>
      </section>

      <AlignmentTeaser />

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <ScrollReveal>
        <div className="p-8 sm:p-12 bg-brutal-cyan border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-2xl sm:text-3xl font-black text-center mb-4 uppercase tracking-tight text-black">
            How Optomitron Replaces Guessing With Knowing
          </h2>
          <p className="text-center text-sm text-black/60 font-medium mb-4 max-w-2xl mx-auto">
            This is the same system I use to run my planet. For every policy
            question, every budget decision, every governance choice — it gives you
            the optimal answer. Not an opinion. Not a party platform. The answer
            that the data supports, with confidence intervals.
          </p>
          <p className="text-center text-sm text-black/60 font-medium mb-12 max-w-2xl mx-auto">
            No politician needed. No ideology required. Just: &ldquo;what
            actually works, how much does it cost, and what&apos;s the
            evidence?&rdquo; I&apos;ve simplified it to five steps because
            I&apos;m told your attention spans are &ldquo;challenging.&rdquo;
          </p>
          <StepReveal className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {[
              {
                step: 1,
                title: "Collect",
                desc: "Hoover up outcome data from OECD, World Bank, and WHO. Decades of it. Just sitting there. Being ignored.",
              },
              {
                step: 2,
                title: "Align",
                desc: "Match policy changes to what actually happened afterwards. Time-series analysis. Onset delays. Proper science, not vibes.",
              },
              {
                step: 3,
                title: "Score",
                desc: "Grade the causal evidence using Bradford Hill criteria. Strength, consistency, temporality, gradient. No feelings involved.",
              },
              {
                step: 4,
                title: "Identify",
                desc: "Find the optimal funding levels and policy configurations. With confidence intervals, because we're not animals.",
              },
              {
                step: 5,
                title: "Recommend",
                desc: "Rank everything by Predictor Impact Score. Here's what works, here's how much, here's the evidence. You're welcome.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-brutal-pink border-2 border-black flex items-center justify-center mx-auto mb-4 text-lg font-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
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
          </StepReveal>
        </div>
        </ScrollReveal>
      </section>

      {/* CTA — Explore the Data */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <ScrollReveal>
        <div className="text-center p-12 bg-brutal-yellow border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-3xl font-black mb-4 uppercase tracking-tight text-black">
            Right Then. Shall We Get On With It?
          </h2>
          <p className="text-black/70 max-w-2xl mx-auto mb-8 leading-relaxed font-medium">
            I&apos;ve given you the data, the tools, and the recommendations. I
            even made it look nice. The only thing I can&apos;t do is click the
            buttons for you. Although I&apos;m working on that.
          </p>
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-center justify-center gap-4">
            <NavItemLink
              item={compareLink}
              variant="custom"
              className="px-8 py-3 bg-black text-white font-black uppercase border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              Compare Countries
            </NavItemLink>
            <NavItemLink
              item={policiesLink}
              variant="custom"
              className="px-8 py-3 bg-white text-black font-black uppercase border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              Browse Policies
            </NavItemLink>
            <NavItemLink
              item={alignmentLink}
              variant="custom"
              className="px-8 py-3 bg-white text-black font-black uppercase border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              Check Alignment
            </NavItemLink>
            <NavItemLink
              item={trackLink}
              variant="custom"
              className="px-8 py-3 bg-white text-black font-black uppercase border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              Talk to Wishonia
            </NavItemLink>
            <NavItemLink
              item={studiesLink}
              variant="custom"
              className="px-8 py-3 bg-white text-black font-black uppercase border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              Outcome Analysis
            </NavItemLink>
            <NavItemLink
              item={misconceptionsLink}
              variant="custom"
              className="px-8 py-3 bg-white text-black font-black uppercase border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              Myth vs Data
            </NavItemLink>
          </div>
          <div className="mt-6">
            <NavItemLink
              item={githubLink}
              variant="custom"
              external
              className="inline-flex items-center text-sm font-black text-black/50 hover:text-black uppercase transition-colors"
            >
              View Source on GitHub (yes, it&apos;s all open) &rarr;
            </NavItemLink>
          </div>
        </div>
        </ScrollReveal>
      </section>

      {/* Same Engine, Every Scale */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pb-24">
        <ScrollReveal className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
            Works for Everyone. Even You.
          </h2>
          <p className="mt-4 text-base text-black/60 max-w-2xl mx-auto font-medium">
            Same engine runs everything. Give it two time series and it tells you
            whether changing one thing causes the other to change. I use it for
            planetary governance. You can use it for whatever you like. I&apos;m
            not your mum.
          </p>
        </ScrollReveal>
        <StaggerGrid className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="p-6 border-2 border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-black text-black mb-2">Nonprofits & NGOs</h3>
            <p className="text-sm text-black/60 font-medium">
              Find out which interventions actually reduce suffering per dollar
              instead of just guessing and hoping. Revolutionary concept, I know.
            </p>
          </div>
          <div className="p-6 border-2 border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-black text-black mb-2">Governments</h3>
            <p className="text-sm text-black/60 font-medium">
              Optimal policies and budget allocation, backed by cross-jurisdiction
              evidence. Works for cities, counties, states, and countries. Yes, all
              of them.
            </p>
          </div>
          <div className="p-6 border-2 border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-black text-black mb-2">Regular Humans</h3>
            <p className="text-sm text-black/60 font-medium">
              Track your health data, supplements, habits, and symptoms. Find out
              what actually works for YOU, not what some influencer reckons.
            </p>
          </div>
        </StaggerGrid>
      </section>
    </div>
  );
}
