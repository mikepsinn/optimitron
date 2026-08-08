import Layout from "../../components/layout"
import Link from "next/link"
import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { ExternalLink, Megaphone, Handshake, Banknote, BookOpen, DollarSign } from "lucide-react"
import { ROUTES } from "@/lib/routes"
import { MANUAL_URLS, withUtm } from "@/lib/manual-links"
import { getVoteSectionUrl } from "@/lib/voting"
import { Container } from "@/components/ui/container"
import { SectionContainer } from "@/components/ui/section-container"
import { SectionHeader } from "@/components/ui/section-header"
import { BrutalCard } from "@/components/ui/brutal-card"
import { MAJORITY_OF_HUMANS_ON_EARTH } from "@/lib/majority-humanity-target"
import { ParameterValue } from "@/components/shared/ParameterValue"
import { formatParameter } from "@/lib/format-parameter"
import { DFDA_TRIAL_CAPACITY_MULTIPLIER, STATUS_QUO_QUEUE_CLEARANCE_YEARS } from "@/lib/parameters-calculations-citations"

type ChapterBg = "background" | "yellow" | "cyan" | "pink"

interface ChapterCardProps {
  title: string
  description: string
  path: string
  bgColor?: ChapterBg
}

const bgClasses: Record<ChapterBg, string> = {
  background: "bg-background",
  yellow: "bg-brutal-yellow",
  cyan: "bg-brutal-cyan",
  pink: "bg-brutal-pink",
}

function ChapterCard({ title, description, path, bgColor = "background" }: ChapterCardProps) {
  const href = withUtm(`${MANUAL_URLS.readOnline}${path}`, "the_plan")

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`group flex flex-col h-full border-4 border-primary p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all ${bgClasses[bgColor]}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-lg sm:text-xl font-black uppercase leading-tight">{title}</h3>
        <ExternalLink className="w-5 h-5 shrink-0 stroke-[3px] mt-1" />
      </div>
      <p className="font-bold text-sm leading-relaxed">{description}</p>
    </a>
  )
}

interface TrackHeaderProps {
  icon: ReactNode
  label: string
  blurb: string
}

interface PlanStep {
  number: string
  title: string
  description: ReactNode
  bgColor: ChapterBg
}

function TrackHeader({ icon, label, blurb }: TrackHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-4 mb-3">
        <div className="bg-foreground text-background border-4 border-primary p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] shrink-0">
          {icon}
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase">{label}</h2>
      </div>
      <p className="font-bold text-base sm:text-lg max-w-3xl">{blurb}</p>
    </div>
  )
}

const planSteps: PlanStep[] = [
  {
    number: "1",
    title: `Start With The People Who Already Know What Waiting ${formatParameter(STATUS_QUO_QUEUE_CLEARANCE_YEARS)} Years Costs`,
    description: `Patient organizations share the vote with their members — the specific humans who have already done the math on what it costs to wait ${formatParameter(STATUS_QUO_QUEUE_CLEARANCE_YEARS)} years.`,
    bgColor: "yellow",
  },
  {
    number: "2",
    title: "Turn Members Into Recruiters",
    description: "You are not creating support for not dying of horrible diseases. Nearly everyone already supports that. You are proving it.",
    bgColor: "cyan",
  },
  {
    number: "3",
    title: `Reach The Number Where "I'll Look Into It" Stops Working`,
    description: (
      <>
        The vote is the moment every human who assumed they were the weird one finds out they are everyone. The target is <ParameterValue param={MAJORITY_OF_HUMANS_ON_EARTH} />.
      </>
    ),
    bgColor: "pink",
  },
  {
    number: "4",
    title: "Trade 1% of Military Spending for Trials",
    description: "Every country gains from every other country complying. That is not how arms treaties usually work. The math happened to work out that way.",
    bgColor: "background",
  },
  {
    number: "5",
    title: `Run ${formatParameter(DFDA_TRIAL_CAPACITY_MULTIPLIER)} More Trials`,
    description: "Instead of testing on 200 humans in clinical terrariums, test on real patients in real hospitals. Where the diseases are.",
    bgColor: "yellow",
  },
  {
    number: "6",
    title: `Collect Cures That Were Otherwise ${formatParameter(STATUS_QUO_QUEUE_CLEARANCE_YEARS)} Years Away`,
    description: "Those are individual humans who currently have plans for next Tuesday.",
    bgColor: "cyan",
  },
]

export default function ThePlanPage() {
  const voteHref = getVoteSectionUrl()
  const ctaButtonClassName = "border-4 border-background font-black uppercase text-xl px-10 py-6 shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] w-full min-w-[260px] justify-center"

  return (
    <Layout>
      {/* Hero */}
      <SectionContainer bgColor="foreground" borderPosition="bottom">
        <Container className="text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase mb-6">
            THE <span className="text-brutal-pink">PLAN</span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl font-bold max-w-3xl mx-auto mb-4">
            The steps below are the machinery. You do not need to build the machinery. You need to turn it on. Here is the switch.
          </p>
          <p className="text-base sm:text-lg font-bold max-w-2xl mx-auto text-muted-foreground">
            This page is the short version. The manual has the details.
          </p>
        </Container>
      </SectionContainer>

      {/* The Plan In 6 Steps */}
      <SectionContainer bgColor="background" padding="md">
        <Container>
          <SectionHeader
            title={<>THE PLAN IN <span className="text-brutal-pink">6 STEPS</span></>}
            subtitle="THE SHORT VERSION OF HOW THIS IS SUPPOSED TO WORK"
            size="md"
          />
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {planSteps.map((step) => (
              <BrutalCard key={step.number} bgColor={step.bgColor} padding="lg" className="h-full">
                <div className="bg-foreground text-background border-4 border-primary w-12 h-12 flex items-center justify-center font-black text-xl mb-4">
                  {step.number}
                </div>
                <h3 className="text-xl font-black uppercase leading-tight mb-3">{step.title}</h3>
                <p className="font-bold text-sm sm:text-base leading-relaxed">{step.description}</p>
              </BrutalCard>
            ))}
          </div>
        </Container>
      </SectionContainer>

      {/* Start Here */}
      <SectionContainer bgColor="foreground" padding="md" borderPosition="top">
        <Container>
          <SectionHeader
            title={<>START <span className="text-brutal-pink">HERE</span></>}
            subtitle="THE THREE CHAPTERS THAT EXPLAIN THE CORE MECHANISM"
            size="md"
          />
          <div className="grid md:grid-cols-3 gap-6">
            <ChapterCard
              bgColor="yellow"
              title="The 1% Treaty"
              description="What the treaty actually proposes: redirect 1% of global military spending into pragmatic clinical trials."
              path="/knowledge/solution/1-percent-treaty.html"
            />
            <ChapterCard
              bgColor="cyan"
              title="Does the Math Work?"
              description="The canonical impact paper. 12.3× trial capacity, cures in 36 years instead of 443. Every number sourced."
              path="/knowledge/economics/1-pct-treaty-impact.html"
            />
            <ChapterCard
              bgColor="pink"
              title="Earth Optimization Protocol"
              description="The full how-we-win strategy: constitutional convention, referendum, treaty passage, expansion."
              path="/knowledge/strategy/earth-optimization-protocol-v1.html"
            />
          </div>
        </Container>
      </SectionContainer>

      {/* VOTE & SHARE */}
      <SectionContainer bgColor="yellow" padding="md">
        <Container>
          <TrackHeader
            icon={<Megaphone className="w-8 h-8 stroke-[3px]" />}
            label="Vote & Share"
            blurb="Patient groups start the chain. Every human who gets the message and passes it on continues it. Two people per person is enough. The math handles the rest. These are the field guides."
          />
          <div className="grid md:grid-cols-3 gap-6">
            <ChapterCard
              title="The Call Script"
              description="The 22-question Socratic sequence to walk a loved one through the argument and on to voting — in one phone call."
              path="/knowledge/strategy/call-script.html"
            />
            <ChapterCard
              title="Recruitment & Propaganda Plan"
              description="How the wave spreads. Messaging, targeting, and what a good recruiter actually does day to day."
              path="/knowledge/appendix/recruitment-and-propaganda-plan.html"
            />
            <ChapterCard
              title="Treaty FAQ & Objections"
              description="Every common objection with a sourced answer. Useful when a call goes sideways."
              path="/knowledge/appendix/faq.html"
            />
          </div>
        </Container>
      </SectionContainer>

      {/* BUILD THE COALITION */}
      <SectionContainer bgColor="cyan" padding="md">
        <Container>
          <TrackHeader
            icon={<Handshake className="w-8 h-8 stroke-[3px]" />}
            label="Build the Coalition"
            blurb="These chapters are for organizations whose members are already affected by the diseases we are trying to cure faster. If that describes you, here is how you formally say so."
          />
          <div className="grid md:grid-cols-3 gap-6">
            <ChapterCard
              bgColor="background"
              title="Nonprofit Coalition Strategy"
              description="Why nonprofits competing for scarce grants should unite around treaty advocacy — and how to recruit endorsing orgs."
              path="/knowledge/strategy/nonprofit-coalition-strategy.html"
            />
            <ChapterCard
              bgColor="background"
              title="Legislation Package"
              description="The treaty text, model legislation, and implementation language for advocates and legal staff."
              path="/knowledge/strategy/legislation-package.html"
            />
            <ChapterCard
              bgColor="background"
              title="Declaration of Optimization"
              description="The rallying document organizations can sign to publicly endorse the movement."
              path="/knowledge/strategy/declaration-of-optimization.html"
            />
          </div>
        </Container>
      </SectionContainer>

      {/* FUND THE PLAN */}
      <SectionContainer bgColor="pink" padding="md">
        <Container>
          <TrackHeader
            icon={<Banknote className="w-8 h-8 stroke-[3px]" />}
            label="Fund the Plan"
            blurb="The prize mechanism, the budget, and the 90-day pilot. If you have money and want to know where it goes, these are the answers."
          />
          <div className="grid md:grid-cols-3 gap-6">
            <ChapterCard
              bgColor="background"
              title="Earth Optimization Prize"
              description="The prize mechanism and recruitment engine — deposits compound, VOTE points distribute the pool if targets are hit."
              path="/knowledge/strategy/earth-optimization-prize.html"
            />
            <ChapterCard
              bgColor="background"
              title="Campaign Budget"
              description="Where the money goes. Line-item breakdown of the campaign cost across virality scenarios."
              path="/knowledge/economics/campaign-budget.html"
            />
            <ChapterCard
              bgColor="background"
              title="90-Day Pilot Grant Proposal"
              description="The concrete ask: a 90-day pilot of the prize mechanism, budget and deliverables laid out."
              path="/knowledge/grant-proposal/earth-optimization-prize-90-day-pilot.html"
            />
          </div>
        </Container>
      </SectionContainer>

      {/* CTA */}
      <SectionContainer bgColor="foreground" borderPosition="none">
        <Container size="md" className="text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase mb-4">
            YOUR <span className="text-brutal-yellow">NEXT MOVE</span>
          </h2>
          <p className="text-lg sm:text-xl font-bold mb-10 max-w-2xl mx-auto">
            Your job was never to understand all of this. Your job is to vote and get two friends to vote.
          </p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center items-stretch mb-10">
            <Link href={voteHref} className="block w-full sm:w-auto">
              <Button className={`bg-brutal-pink text-brutal-pink-foreground hover:bg-background hover:text-foreground ${ctaButtonClassName}`}>
                VOTE NOW
              </Button>
            </Link>
            <Link href={ROUTES.donate} className="block w-full sm:w-auto">
              <Button className={`bg-brutal-pink text-brutal-pink-foreground hover:bg-background hover:text-foreground ${ctaButtonClassName} inline-flex items-center gap-2`}>
                <DollarSign className="h-6 w-6 stroke-[3px]" />
                DONATE
              </Button>
            </Link>
          </div>
          <a
            href={withUtm(MANUAL_URLS.readOnline, "the_plan_footer")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-black uppercase text-base sm:text-lg underline decoration-4 underline-offset-4 decoration-brutal-yellow hover:text-brutal-yellow transition-colors"
          >
            <BookOpen className="w-5 h-5 stroke-[3px]" />
            Browse all chapters in the field manual
            <ExternalLink className="w-4 h-4 stroke-[3px]" />
          </a>
        </Container>
      </SectionContainer>
    </Layout>
  )
}
