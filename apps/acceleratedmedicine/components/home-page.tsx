import { ArrowRight, Lightbulb, Vote } from "lucide-react"
import Link from "next/link"

import { GLOBAL_SURVEY_NAME } from "@optimitron/data/campaign"
import { TREATY_REDUCTION_PCT } from "@optimitron/data/parameters"
import { Button } from "@optimitron/neobrutalist-ui/ui/button"
import { Container } from "@optimitron/neobrutalist-ui/ui/container"
import { SectionContainer } from "@optimitron/neobrutalist-ui/ui/section-container"

import Layout from "@/components/layout"
import { LegacyHomeHashRedirect } from "@/components/legacy-home-hash-redirect"
import { ParameterValue } from "@/components/shared/ParameterValue"
import {
  COURT_OF_HUMANITY_LINK,
  DECENTRALIZED_FDA_LINK,
  ONE_PERCENT_TREATY_LINK,
  OrgLinkCard,
  RESEARCH_LINKS,
  RIGHT_TO_TRIAL_LINK,
  WISHOCRACY_LINK,
  buttonShadow,
  type OrgLink,
} from "@/components/org-links"

// warondisease.org opens with the Global Survey.
const GLOBAL_SURVEY_URL = ONE_PERCENT_TREATY_LINK.href

/** One plan in three parts: evidence, access, and funding. */
const PLAN: OrgLink[] = [
  {
    ...DECENTRALIZED_FDA_LINK,
    label: "1 · Evidence",
    text: "We are building an open treatment evidence network. It ranks treatments by what happened to real patients and gives each one an Outcome Label, like a Nutrition Facts label for drugs.",
  },
  {
    ...RIGHT_TO_TRIAL_LINK,
    label: "2 · Access",
    text: "A model state law based on Montana's enacted framework. It would let every patient join a pragmatic trial of a promising treatment with a clinician at a licensed treatment center.",
    href: "/right-to-trial",
    action: "See Right to Trial",
    color: "bg-background",
  },
  {
    ...ONE_PERCENT_TREATY_LINK,
    label: "3 · Funding",
    href: `${ONE_PERCENT_TREATY_LINK.href}/treaty`,
    action: "Read the treaty",
  },
]

const HELP: OrgLink[] = [
  {
    icon: Vote,
    label: "Take the survey",
    title: GLOBAL_SURVEY_NAME,
    text: "Show how you would split public money between weapons and clinical trials. Then send the survey to two friends.",
    href: GLOBAL_SURVEY_URL,
    action: "Take the survey",
    color: "bg-brutal-pink",
  },
  {
    icon: Lightbulb,
    label: "Share an idea",
    title: "Help us find the fastest path",
    text: "What would get more patients into trials or find cures sooner? Tell us.",
    href: "mailto:hello@acceleratedmedicine.org?subject=Idea%20to%20accelerate%20clinical%20discovery",
    action: "Email your idea",
    color: "bg-brutal-yellow",
  },
]

const MORE_INITIATIVES = [WISHOCRACY_LINK, COURT_OF_HUMANITY_LINK]

export function HomePage() {
  return (
    <Layout>
      <LegacyHomeHashRedirect />
      <SectionContainer bgColor="background" borderPosition="bottom" padding="lg">
        <Container>
          <p className="mb-5 inline-block rotate-[-1deg] border-4 border-primary bg-brutal-yellow px-4 py-2 text-sm font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            Institute for Accelerated Medicine
          </p>
          <h1 className="text-4xl font-black uppercase leading-[0.9] tracking-tighter sm:text-6xl md:text-7xl">
            Find out which treatments work, and get them to patients faster.
          </h1>
          <p className="mt-7 max-w-4xl text-lg font-bold sm:text-xl md:text-2xl">
            We are a nonprofit. Our plan: rank treatments by what happened to
            real patients, let every patient join a trial, and redirect{" "}
            <ParameterValue param={TREATY_REDUCTION_PCT} format={{ precision: 0 }} /> of
            military spending to pragmatic clinical trials.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Button asChild className={`${buttonShadow} bg-brutal-pink`} size="lg">
              <a href={GLOBAL_SURVEY_URL}>
                Take the global survey <ArrowRight aria-hidden="true" className="h-5 w-5" />
              </a>
            </Button>
            <Button
              asChild
              className={`${buttonShadow} bg-background text-foreground`}
              size="lg"
            >
              <Link href="#initiatives">See the plan</Link>
            </Button>
          </div>
        </Container>
      </SectionContainer>

      <SectionContainer
        bgColor="cyan"
        borderPosition="bottom"
        id="initiatives"
        padding="lg"
      >
        <Container>
          <h2 className="text-3xl font-black uppercase tracking-tighter sm:text-5xl">
            One plan, three parts
          </h2>
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {PLAN.map((item) => (
              <OrgLinkCard item={item} key={item.title} size="large" />
            ))}
          </div>
          <p className="mt-8 max-w-4xl text-lg font-bold sm:text-xl">
            Access puts more patients in trials. Trials create evidence.
            Evidence shows what to fund.
          </p>
        </Container>
      </SectionContainer>

      <SectionContainer bgColor="background" borderPosition="bottom" id="help" padding="lg">
        <Container>
          <h2 className="text-3xl font-black uppercase tracking-tighter sm:text-5xl">
            How you can help
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {HELP.map((item) => (
              <OrgLinkCard item={item} key={item.title} size="large" />
            ))}
          </div>
        </Container>
      </SectionContainer>

      <SectionContainer bgColor="yellow" borderPosition="bottom" padding="lg">
        <Container>
          <h2 className="text-3xl font-black uppercase tracking-tighter sm:text-5xl">
            More initiatives
          </h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {MORE_INITIATIVES.map((item) => (
              <OrgLinkCard item={item} key={item.title} size="small" />
            ))}
          </div>
        </Container>
      </SectionContainer>

      <SectionContainer bgColor="background" borderPosition="none" id="research" padding="lg">
        <Container>
          <h2 className="text-3xl font-black uppercase tracking-tighter sm:text-5xl">
            Our research
          </h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {RESEARCH_LINKS.map((item) => (
              <OrgLinkCard item={item} key={item.href} size="small" />
            ))}
          </div>
        </Container>
      </SectionContainer>
    </Layout>
  )
}
