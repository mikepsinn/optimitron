import type { Metadata } from "next";
import { NavItemLink } from "@/components/navigation/NavItemLink";
import {
  prizeLink,
  wishocracyLink,
  alignmentLink,
  studiesLink,
  referendumLink,
  iabLink,
  moneyLink,
  scoreboardLink,
  trackLink,
  budgetLink,
  policiesLink,
} from "@/lib/routes";

export const metadata: Metadata = {
  title: "Tools | The Earth Optimization Game",
  description:
    "Every tool available to help win the Earth Optimization Game — figure out what works, express what you want, fund the solutions, and prove what happened.",
};

interface Tool {
  title: string;
  description: string;
  link?: { item: typeof prizeLink; label: string };
  externalLink?: { href: string; label: string };
  color: string;
}

interface ToolGroup {
  heading: string;
  subtitle: string;
  color: string;
  tools: Tool[];
}

const toolGroups: ToolGroup[] = [
  {
    heading: "Figure Out What Works",
    subtitle: "Data in. Optimal policy out. No opinions. No committees. Just maths.",
    color: "bg-brutal-cyan",
    tools: [
      {
        title: "The Optimizer",
        description:
          "Domain-agnostic causal inference engine. Give it any two time series and it tells you: does changing X cause Y to change? By how much? What's the optimal value?",
        link: { item: studiesLink, label: "See Results" },
        color: "bg-brutal-cyan",
      },
      {
        title: "Optimal Policy Generator",
        description:
          "Ranks every policy by causal impact on median health and income. Not by who proposed it. Not by how it sounds. By what actually happened when someone tried it.",
        link: { item: policiesLink, label: "Browse Policies" },
        color: "bg-brutal-cyan",
      },
      {
        title: "Optimal Budget Generator",
        description:
          "Finds the spending level where each additional dollar stops helping. Diminishing returns modelling across every budget category. Your government has never done this.",
        link: { item: budgetLink, label: "See Budget Analysis" },
        color: "bg-brutal-cyan",
      },
      {
        title: "Cross-Jurisdiction Analysis",
        description:
          "Every country is a natural experiment. Compare spending, policies, and outcomes across 100+ jurisdictions to find what actually works. No need to guess when you can just look.",
        link: { item: studiesLink, label: "Compare Countries" },
        color: "bg-brutal-cyan",
      },
      {
        title: "Decentralized FDA (dFDA)",
        description:
          "Competing trial infrastructure platforms that conduct pragmatic clinical trials at 2% of the cost and 44x the speed. Real patients, real conditions, real data.",
        externalLink: { href: "https://dfda.earth", label: "dfda.earth" },
        color: "bg-brutal-cyan",
      },
      {
        title: "Decentralized Institutes of Health (DIH)",
        description:
          "Thin coordination layer allocating $27.2B/yr from the 1% Treaty via democratic voting. Trial infrastructure providers like dFDA compete for DIH funding. You decide where the money goes.",
        externalLink: { href: "https://dih.earth", label: "dih.earth" },
        color: "bg-brutal-cyan",
      },
    ],
  },
  {
    heading: "Express What You Want",
    subtitle:
      "Nobody asked 8 billion people what they actually want. These tools fix that.",
    color: "bg-brutal-yellow",
    tools: [
      {
        title: "Wishocracy",
        description:
          "Citizen budget preferences via pairwise comparison. Pick between two things, ten times. Eigenvector decomposition produces a stable budget allocation from as few as 10 comparisons. Two minutes. Done.",
        link: { item: wishocracyLink, label: "Start Voting" },
        color: "bg-brutal-yellow",
      },
      {
        title: "Alignment Scoring",
        description:
          "Compare politician voting records against citizen preferences. Publish scores as verifiable Hypercerts. Make alignment visible and undeniable. Most people are surprised. Not pleasantly.",
        link: { item: alignmentLink, label: "Check Alignment" },
        color: "bg-brutal-yellow",
      },
      {
        title: "1% Treaty Referendum",
        description:
          "The specific policy demand: redirect 1% of military spending to pragmatic clinical trials. Verified via World ID. Every verified vote earns the recruiter a VOTE point.",
        link: { item: referendumLink, label: "Vote Now" },
        color: "bg-brutal-yellow",
      },
    ],
  },
  {
    heading: "Fund the Solutions",
    subtitle:
      "Diagnosing the problem is step one. These mechanisms make fixing it positive-EV.",
    color: "bg-brutal-pink",
    tools: [
      {
        title: "The Earth Optimization Game",
        description:
          "Dominant assurance contract. Deposit USDC, recruit verified voters, earn VOTE points. Metrics hit targets in 15 years? VOTE holders split the pool. Metrics miss? Depositors get ~11x back. Nobody loses.",
        link: { item: prizeLink, label: "Join the Game" },
        color: "bg-brutal-pink",
      },
      {
        title: "Wishocratic Fund",
        description:
          "The prize pool investment vehicle. Venture-grade returns (17.4% annually) without the 2-and-20 fees. Crowd-allocated via wishocratic preference aggregation. Beats conventional retirement by 3x.",
        link: { item: scoreboardLink, label: "View Scoreboard" },
        color: "bg-brutal-pink",
      },
      {
        title: "Incentive Alignment Bonds (IABs)",
        description:
          "Phase 2: after the referendum proves demand. Raise ~$1B to lobby for the treaty. Revenue splits 80/10/10: clinical trials, investors, aligned politicians. Smart contract enforced.",
        link: { item: iabLink, label: "Learn About IABs" },
        color: "bg-brutal-pink",
      },
      {
        title: "$WISH Token",
        description:
          "Programmable currency replacing the Federal Reserve. 0.5% transaction tax replaces the IRS. UBI eliminates poverty and the welfare bureaucracy. Algorithmic 0% inflation stops the inflationary theft funding war.",
        link: { item: moneyLink, label: "How $WISH Works" },
        color: "bg-brutal-pink",
      },
      {
        title: "Campaign Automation",
        description:
          "Smart contracts route funds to politicians based on alignment scores. Vote with citizens? Get funded. Vote against them? Don't. No lobbying required to lobby.",
        color: "bg-brutal-pink",
      },
    ],
  },
  {
    heading: "Prove What Happened",
    subtitle: "Accountability that can't be argued with because it's on-chain.",
    color: "bg-background",
    tools: [
      {
        title: "Hypercerts",
        description:
          "Verifiable impact attestations published on IPFS and AT Protocol. Every claim, every score, every alignment report — cryptographically signed and permanently stored.",
        color: "bg-background",
      },
      {
        title: "Autonomous Policy Analyst",
        description:
          "AI agent that continuously generates and publishes impact analyses. Scores policies, compares jurisdictions, and updates Hypercerts. Works while you sleep.",
        color: "bg-background",
      },
    ],
  },
  {
    heading: "Personal Tools",
    subtitle:
      "Track yourself. The same causal inference that works on countries works on you.",
    color: "bg-brutal-cyan",
    tools: [
      {
        title: "Talk to Wishonia",
        description:
          "Conversational health, mood, and diet tracking with an alien AI who's been running a planet for 4,237 years. She'll tell you what's actually working. Your intuition won't like it.",
        link: { item: trackLink, label: "Open Chat" },
        color: "bg-brutal-cyan",
      },
      {
        title: "Digital Twin Safe",
        description:
          "Chrome extension for personal data sovereignty. Your health data, your meals, your sleep — stored in your own encrypted vault. Share what you want, keep the rest.",
        color: "bg-brutal-cyan",
      },
    ],
  },
];

export default function ToolsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero */}
      <section className="mb-16 space-y-3">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-brutal-pink">
          The Earth Optimization Game
        </p>
        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-foreground">
          Your Toolkit
        </h1>
        <p className="max-w-3xl text-lg font-bold text-muted-foreground">
          Every tool available to help redirect Earth&apos;s resources from the
          things making you poorest and deadest to the things that make you
          healthiest and wealthiest. Use whichever ones you want. The game
          doesn&apos;t care how you move the metrics — just that they move.
        </p>
      </section>

      {/* Tool Groups */}
      {toolGroups.map((group) => (
        <section key={group.heading} className="mb-16">
          <h2 className="text-2xl font-black uppercase tracking-tight text-foreground mb-2">
            {group.heading}
          </h2>
          <p className="text-sm font-bold text-muted-foreground mb-6">
            {group.subtitle}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {group.tools.map((tool) => (
              <div
                key={tool.title}
                className={`border-4 border-primary ${tool.color} p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col`}
              >
                <h3 className="font-black uppercase text-foreground mb-2">
                  {tool.title}
                </h3>
                <p className="text-sm font-bold text-muted-foreground leading-relaxed flex-grow">
                  {tool.description}
                </p>
                {tool.link && (
                  <NavItemLink
                    item={tool.link.item}
                    variant="custom"
                    className="mt-4 inline-flex items-center text-sm font-black text-brutal-pink uppercase hover:text-foreground transition-colors"
                  >
                    {tool.link.label} &rarr;
                  </NavItemLink>
                )}
                {tool.externalLink && (
                  <a
                    href={tool.externalLink.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center text-sm font-black text-brutal-pink uppercase hover:text-foreground transition-colors"
                  >
                    {tool.externalLink.label} &rarr;
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Final CTA */}
      <section className="border-4 border-primary bg-brutal-pink p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
        <h2 className="text-2xl font-black text-brutal-pink-foreground mb-3 uppercase">
          The Only Way to Lose Is to Not Play
        </h2>
        <p className="text-background mb-6 font-bold max-w-2xl mx-auto">
          Pick a tool. Any tool. The game is designed so that self-interest
          and collective interest point in the same direction. Do whatever
          you think moves the metrics.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <NavItemLink
            item={prizeLink}
            variant="custom"
            className="inline-flex items-center justify-center gap-2 bg-foreground px-6 py-3 text-sm font-black text-background uppercase border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
          >
            Join the Game
          </NavItemLink>
          <NavItemLink
            item={scoreboardLink}
            variant="custom"
            className="inline-flex items-center justify-center gap-2 bg-background px-6 py-3 text-sm font-black text-foreground uppercase border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
          >
            View Scoreboard
          </NavItemLink>
        </div>
      </section>
    </div>
  );
}
