import Link from "next/link";
import type { ReactNode } from "react";
import {
  Banknote,
  BookOpen,
  DollarSign,
  ExternalLink,
  Handshake,
  Megaphone,
} from "lucide-react";
import { Button } from "@optimitron/neobrutalist-ui/ui/button";
import { BrutalCard } from "@optimitron/neobrutalist-ui/ui/brutal-card";
import { Container } from "@optimitron/neobrutalist-ui/ui/container";
import { SectionContainer } from "@optimitron/neobrutalist-ui/ui/section-container";
import { SectionHeader } from "@optimitron/neobrutalist-ui/ui/section-header";
import {
  DFDA_TRIAL_CAPACITY_MULTIPLIER,
  GLOBAL_POPULATION_ACTIVISM_THRESHOLD_PCT,
  STATUS_QUO_QUEUE_CLEARANCE_YEARS,
  THREE_POINT_FIVE_PERCENT_OF_GLOBAL_POPULATION,
} from "@optimitron/impact-params/parameters";
import { formatParameter } from "@optimitron/impact-params/format";
import Layout from "./layout";
import { ParameterValue } from "./shared/ParameterValue";
import { MAJORITY_OF_HUMANS_ON_EARTH } from "../lib/majority-humanity-target";
import { MANUAL_URLS, withUtm } from "../lib/manual-links";
import { ROUTES } from "../lib/routes";
import { getVoteSectionUrl } from "../lib/voting";

type ChapterBg = "background" | "yellow" | "cyan" | "pink";

interface ChapterCardProps {
  title: string;
  description: string;
  path: string;
  bgColor?: ChapterBg;
}

interface PlanStep {
  number: string;
  title: string;
  description: ReactNode;
  bgColor: ChapterBg;
}

interface TrackHeaderProps {
  icon: ReactNode;
  label: string;
  blurb: string;
}

const bgClasses: Record<ChapterBg, string> = {
  background: "bg-background",
  yellow: "bg-brutal-yellow",
  cyan: "bg-brutal-cyan",
  pink: "bg-brutal-pink",
};

const planSteps: PlanStep[] = [
  {
    number: "1",
    title: `Start With The People Who Know What Waiting ${formatParameter(STATUS_QUO_QUEUE_CLEARANCE_YEARS)} Years Costs`,
    description: `Patient organizations share the vote with the humans who have already done the math on waiting ${formatParameter(STATUS_QUO_QUEUE_CLEARANCE_YEARS)} years.`,
    bgColor: "yellow",
  },
  {
    number: "2",
    title: "Help Members Tell Two Friends",
    description:
      "You are not creating support for fewer horrible diseases. Nearly everyone already supports that. You are making it visible.",
    bgColor: "cyan",
  },
  {
    number: "3",
    title: `Reach The Number Where “I'll Look Into It” Stops Working`,
    description: (
      <>
        The public coordination target is{" "}
        <ParameterValue param={MAJORITY_OF_HUMANS_ON_EARTH} />.
      </>
    ),
    bgColor: "pink",
  },
  {
    number: "4",
    title: "Trade 1% of Military Spending for Trials",
    description:
      "Every country gains when every other country complies. The treaty turns mutual suspicion into mutual benefit.",
    bgColor: "background",
  },
  {
    number: "5",
    title: `Run ${formatParameter(DFDA_TRIAL_CAPACITY_MULTIPLIER)} More Trials`,
    description:
      "Test treatments with real patients in real hospitals, where the diseases already are.",
    bgColor: "yellow",
  },
  {
    number: "6",
    title: `Collect Cures That Were Otherwise ${formatParameter(STATUS_QUO_QUEUE_CLEARANCE_YEARS)} Years Away`,
    description:
      "Those are individual humans who currently have plans for next Tuesday.",
    bgColor: "cyan",
  },
];

const propagationScenarios = [
  { newVotes: 1.1, roundDays: 7 },
  { newVotes: 1.3, roundDays: 7 },
  { newVotes: 1.6, roundDays: 3 },
  { newVotes: 2, roundDays: 3 },
].map(({ newVotes, roundDays }) => {
  const seedVotes = 1_000_000;
  const targetVotes = THREE_POINT_FIVE_PERCENT_OF_GLOBAL_POPULATION.value;
  const rounds =
    Math.log(1 + ((newVotes - 1) * targetVotes) / seedVotes) /
    Math.log(newVotes);

  return {
    newVotes,
    roundDays,
    days: Math.round(rounds * roundDays),
  };
});

function ChapterCard({
  title,
  description,
  path,
  bgColor = "background",
}: ChapterCardProps) {
  return (
    <a
      href={withUtm(`${MANUAL_URLS.readOnline}${path}`, "the_plan")}
      target="_blank"
      rel="noopener noreferrer"
      className={`group flex h-full flex-col border-4 border-primary p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${bgClasses[bgColor]}`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="text-lg font-black uppercase leading-tight sm:text-xl">
          {title}
        </h3>
        <ExternalLink className="mt-1 h-5 w-5 shrink-0 stroke-[3px]" />
      </div>
      <p className="text-sm font-bold leading-relaxed">{description}</p>
    </a>
  );
}

function TrackHeader({ icon, label, blurb }: TrackHeaderProps) {
  return (
    <div className="mb-8">
      <div className="mb-3 flex items-center gap-4">
        <div className="shrink-0 border-4 border-primary bg-foreground p-3 text-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          {icon}
        </div>
        <h2 className="text-2xl font-black uppercase sm:text-3xl md:text-4xl">
          {label}
        </h2>
      </div>
      <p className="max-w-3xl text-base font-bold sm:text-lg">{blurb}</p>
    </div>
  );
}

export default function CampaignPlanPage() {
  const voteHref = getVoteSectionUrl();
  const ctaButtonClassName =
    "w-full min-w-[260px] justify-center border-4 border-background px-10 py-6 text-xl font-black uppercase shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]";

  return (
    <Layout>
      <SectionContainer bgColor="foreground" borderPosition="bottom">
        <Container className="text-center">
          <h1 className="mb-6 text-4xl font-black uppercase sm:text-5xl md:text-6xl lg:text-7xl">
            THE <span className="text-brutal-pink">PLAN</span>
          </h1>
          <p className="mx-auto mb-4 max-w-3xl text-lg font-bold sm:text-xl md:text-2xl">
            Vote. Help two friends vote. Turn one percent of military spending
            into hundreds of times more pragmatic clinical trials.
          </p>
          <p className="mx-auto max-w-2xl text-base font-bold text-muted-foreground sm:text-lg">
            This is the short version. The field manual has the receipts.
          </p>
        </Container>
      </SectionContainer>

      <SectionContainer bgColor="background" padding="md">
        <Container>
          <SectionHeader
            title={
              <>
                THE PLAN IN <span className="text-brutal-pink">6 STEPS</span>
              </>
            }
            subtitle="THE SHORT VERSION OF HOW THIS WORKS"
            size="md"
          />
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {planSteps.map((step) => (
              <BrutalCard
                key={step.number}
                bgColor={step.bgColor}
                padding="lg"
                className="h-full"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center border-4 border-primary bg-foreground text-xl font-black text-background">
                  {step.number}
                </div>
                <h3 className="mb-3 text-xl font-black uppercase leading-tight">
                  {step.title}
                </h3>
                <div className="text-sm font-bold leading-relaxed sm:text-base">
                  {step.description}
                </div>
              </BrutalCard>
            ))}
          </div>
        </Container>
      </SectionContainer>

      <SectionContainer bgColor="pink" padding="md">
        <Container>
          <SectionHeader
            title={
              <>
                WHAT <span className="text-background">3.5%</span> MEANS
              </>
            }
            subtitle="A USEFUL BENCHMARK IS NOT A MAGIC SPELL"
            size="md"
          />
          <div className="grid items-start gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <BrutalCard bgColor="background" padding="lg">
              <p className="mb-5 text-lg font-black uppercase sm:text-xl">
                Political scientist Erica Chenoweth found that the nonviolent
                national campaigns in the study which reached sustained active
                participation of{" "}
                <ParameterValue
                  param={GLOBAL_POPULATION_ACTIVISM_THRESHOLD_PCT}
                  format={{ precision: 1 }}
                />{" "}
                did not fail. Chenoweth later stressed that this is a tendency
                from a specific class of campaigns, not a law.
              </p>
              <p className="mb-5 font-bold">
                Applied to today&apos;s world population, that is about{" "}
                <ParameterValue
                  param={THREE_POINT_FIVE_PERCENT_OF_GLOBAL_POPULATION}
                />{" "}
                people. But an online global treaty vote is not sustained
                national participation. Treat 280 million as a historical
                benchmark, not a promise or finish line.
              </p>
              <p className="font-bold">
                The public coordination target remains{" "}
                <ParameterValue param={MAJORITY_OF_HUMANS_ON_EARTH} />.
              </p>
              <a
                href="https://www.hks.harvard.edu/sites/default/files/2024-05/Erica%20Chenoweth_2020-005.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 font-black underline decoration-4 underline-offset-4"
              >
                Read Chenoweth&apos;s cautionary update
                <ExternalLink className="h-4 w-4 stroke-[3px]" />
              </a>
            </BrutalCard>

            <div>
              <h3 className="mb-4 text-xl font-black uppercase sm:text-2xl">
                If one million people start
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {propagationScenarios.map((scenario) => (
                  <BrutalCard
                    key={`${scenario.newVotes}-${scenario.roundDays}`}
                    bgColor="yellow"
                    padding="md"
                  >
                    <p className="text-3xl font-black">~{scenario.days} DAYS</p>
                    <p className="font-bold">
                      If each new voter brings {scenario.newVotes} more voters
                      in the next {scenario.roundDays}-day round
                    </p>
                  </BrutalCard>
                ))}
              </div>
              <p className="mt-4 text-sm font-bold">
                These are geometric illustrations, not forecasts. Real
                propagation loses people to overlap, verification, language,
                access, and ordinary human failure to click links.
              </p>
            </div>
          </div>
        </Container>
      </SectionContainer>

      <SectionContainer bgColor="foreground" padding="md" borderPosition="top">
        <Container>
          <SectionHeader
            title={
              <>
                START <span className="text-brutal-pink">HERE</span>
              </>
            }
            subtitle="THE THREE CHAPTERS THAT EXPLAIN THE CORE MECHANISM"
            size="md"
          />
          <div className="grid gap-6 md:grid-cols-3">
            <ChapterCard
              bgColor="yellow"
              title="The 1% Treaty"
              description="Redirect 1% of global military spending into pragmatic clinical trials."
              path="/knowledge/solution/1-percent-treaty.html"
            />
            <ChapterCard
              bgColor="cyan"
              title="Does the Math Work?"
              description="The canonical impact paper. Trial capacity, timelines, benefits, costs, and sources."
              path="/knowledge/economics/1-pct-treaty-impact.html"
            />
            <ChapterCard
              bgColor="pink"
              title="Global Referendum Strategy"
              description="The evidence, limits, targets, and path from a public vote to treaty adoption."
              path="/knowledge/strategy/global-referendum.html"
            />
          </div>
        </Container>
      </SectionContainer>

      <SectionContainer bgColor="yellow" padding="md">
        <Container>
          <TrackHeader
            icon={<Megaphone className="h-8 w-8 stroke-[3px]" />}
            label="Vote & Share"
            blurb="Patient groups start the chain. Every human who votes and tells two friends continues it. These are the field guides."
          />
          <div className="grid gap-6 md:grid-cols-3">
            <ChapterCard
              title="The Call Script"
              description="A 22-question sequence that helps a loved one examine the case and vote in one call."
              path="/knowledge/strategy/call-script.html"
            />
            <ChapterCard
              title="Referral & Communications Plan"
              description="Who needs the message, what to say, and what a helpful advocate can do today."
              path="/knowledge/appendix/recruitment-and-propaganda-plan.html"
            />
            <ChapterCard
              title="Treaty FAQ & Objections"
              description="Common objections with sourced answers for the moment a conversation goes sideways."
              path="/knowledge/appendix/faq.html"
            />
          </div>
        </Container>
      </SectionContainer>

      <SectionContainer bgColor="cyan" padding="md">
        <Container>
          <TrackHeader
            icon={<Handshake className="h-8 w-8 stroke-[3px]" />}
            label="Build the Coalition"
            blurb="Organizations whose members need faster cures can endorse the treaty and invite their people to vote."
          />
          <div className="grid gap-6 md:grid-cols-3">
            <ChapterCard
              title="Nonprofit Coalition Strategy"
              description="Why disease organizations gain by working together, and how to invite another organization."
              path="/knowledge/strategy/nonprofit-coalition-strategy.html"
            />
            <ChapterCard
              title="Legislation Package"
              description="The treaty text, model legislation, and implementation language for advocates and legal staff."
              path="/knowledge/strategy/legislation-package.html"
            />
            <ChapterCard
              title="Declaration of Optimization"
              description="The declaration organizations can sign to endorse the treaty publicly."
              path="/knowledge/strategy/declaration-of-optimization.html"
            />
          </div>
        </Container>
      </SectionContainer>

      <SectionContainer bgColor="pink" padding="md">
        <Container>
          <TrackHeader
            icon={<Banknote className="h-8 w-8 stroke-[3px]" />}
            label="Fund the Plan"
            blurb="The budget, prize, and 90-day pilot show what money buys and how anyone can check the result."
          />
          <div className="grid gap-6 md:grid-cols-3">
            <ChapterCard
              title="Earth Optimization Prize"
              description="The prize mechanism and the rules for paying verified contributions when targets are met."
              path="/knowledge/strategy/earth-optimization-prize.html"
            />
            <ChapterCard
              title="Campaign Budget"
              description="The line-item campaign cost across several propagation scenarios."
              path="/knowledge/economics/campaign-budget.html"
            />
            <ChapterCard
              title="90-Day Pilot Grant Proposal"
              description="A concrete pilot with its budget, deliverables, and success measures."
              path="/knowledge/grant-proposal/earth-optimization-prize-90-day-pilot.html"
            />
          </div>
        </Container>
      </SectionContainer>

      <SectionContainer bgColor="foreground" borderPosition="none">
        <Container size="md" className="text-center">
          <h2 className="mb-4 text-3xl font-black uppercase sm:text-4xl md:text-5xl">
            YOUR <span className="text-brutal-yellow">NEXT MOVE</span>
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-lg font-bold sm:text-xl">
            Vote, then help two friends vote. That is enough to move the treaty
            forward.
          </p>
          <div className="mb-10 flex flex-col items-stretch justify-center gap-5 sm:flex-row">
            <Link href={voteHref} className="block w-full sm:w-auto">
              <Button
                className={`bg-brutal-pink text-brutal-pink-foreground hover:bg-background hover:text-foreground ${ctaButtonClassName}`}
              >
                VOTE NOW
              </Button>
            </Link>
            <Link href={ROUTES.donate} className="block w-full sm:w-auto">
              <Button
                className={`inline-flex items-center gap-2 bg-brutal-pink text-brutal-pink-foreground hover:bg-background hover:text-foreground ${ctaButtonClassName}`}
              >
                <DollarSign className="h-6 w-6 stroke-[3px]" />
                DONATE
              </Button>
            </Link>
          </div>
          <a
            href={withUtm(MANUAL_URLS.readOnline, "the_plan_footer")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-base font-black uppercase underline decoration-4 decoration-brutal-yellow underline-offset-4 transition-colors hover:text-brutal-yellow sm:text-lg"
          >
            <BookOpen className="h-5 w-5 stroke-[3px]" />
            Browse the field manual
            <ExternalLink className="h-4 w-4 stroke-[3px]" />
          </a>
        </Container>
      </SectionContainer>
    </Layout>
  );
}
