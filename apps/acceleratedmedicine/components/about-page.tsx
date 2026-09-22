import {
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  ClipboardList,
  FileText,
  Landmark,
  Microscope,
  Podcast,
  Scale,
  Workflow,
  type LucideIcon,
} from "lucide-react"
import Link from "next/link"

import { Button } from "@optimitron/neobrutalist-ui/ui/button"
import { Card } from "@optimitron/neobrutalist-ui/ui/card"
import { Container } from "@optimitron/neobrutalist-ui/ui/container"
import { SectionContainer } from "@optimitron/neobrutalist-ui/ui/section-container"
import { MANUAL_URLS, PODCAST_URLS } from "@optimitron/site-kit/lib/manual-links"
import {
  NONPROFIT,
  formatNonprofitAddress,
} from "@optimitron/site-kit/lib/nonprofit-identity"

import { BOARD_MEMBERS } from "@/lib/board-members"
import { RIGHT_TO_TRIAL_IMPACT_PAPER_URL } from "@/lib/right-to-trial-impact"
import Layout from "@/components/layout"

const buttonShadow =
  "rounded-none border-4 border-primary px-7 py-6 text-base font-black uppercase shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]"

const cardLinkClass =
  "flex flex-col border-4 border-primary p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"

type AboutLink = {
  icon: LucideIcon
  label: string
  title: string
  text: string
  href: string
  action: string
  color?: string
}

const INITIATIVES: AboutLink[] = [
  {
    icon: ClipboardCheck,
    label: "acceleratedmedicine.org",
    title: "Right to Trial",
    text: "A model state law that starts from Montana's enacted framework and lets every patient join a pragmatic trial through their clinician.",
    href: "/montana",
    action: "See the Montana model",
    color: "bg-brutal-cyan",
  },
  {
    icon: Landmark,
    label: "warondisease.org",
    title: "1% Treaty",
    text: "A global referendum on a proposed treaty. Each signing nation redirects 1% of its military budget, mostly to pragmatic clinical trials.",
    href: "https://warondisease.org",
    action: "Vote on the treaty",
    color: "bg-brutal-yellow",
  },
  {
    icon: Microscope,
    label: "dfda.earth",
    title: "Decentralized FDA",
    text: "We are building an open protocol that ranks treatments by real-world patient outcomes and publishes an Outcome Label for each drug.",
    href: "https://dfda.earth",
    action: "Visit dfda.earth",
    color: "bg-brutal-pink",
  },
  {
    icon: Workflow,
    label: "wishocracy.org",
    title: "Wishocracy",
    text: "People split $100 between two spending priorities at a time. The answers combine into public budget priorities.",
    href: "https://wishocracy.org",
    action: "Visit wishocracy.org",
    color: "bg-background",
  },
  {
    icon: Scale,
    label: "courtofhumanity.org",
    title: "Court of Humanity",
    text: "A public case, Humanity v. Government. Read the claim and the cited evidence, register affected people as plaintiffs, and render a verdict.",
    href: "https://courtofhumanity.org",
    action: "Visit the court",
    color: "bg-background",
  },
  {
    icon: ClipboardList,
    label: "trialabundancesurvey.org",
    title: "Trial Abundance Survey",
    text: "Measures public support for faster medical progress through pragmatic clinical trials.",
    href: "https://trialabundancesurvey.org",
    action: "Take the survey",
    color: "bg-background",
  },
]

const RESEARCH: AboutLink[] = [
  {
    icon: BookOpen,
    label: "Book",
    title: "How to End War and Disease",
    text: "The full plan: economics, legal framework, financing, and roadmap. Free to read online.",
    href: MANUAL_URLS.readOnline,
    action: "Read online",
  },
  {
    icon: Podcast,
    label: "Podcast",
    title: "How to End War and Disease",
    text: "The book as a free podcast.",
    href: PODCAST_URLS.spotify,
    action: "Listen on Spotify",
  },
  {
    icon: FileText,
    label: "Paper",
    title: "Patient's Right to Trial Act",
    text: "Models the potential impact if all 50 states adopt Right to Trial.",
    href: RIGHT_TO_TRIAL_IMPACT_PAPER_URL,
    action: "Read the paper",
  },
  {
    icon: FileText,
    label: "Paper",
    title: "Continuous Evidence Generation Protocol",
    text: "The dFDA method: find treatment effects in real-world data, then confirm them with pragmatic trials.",
    href: "https://dfda-spec.warondisease.org",
    action: "Read the paper",
  },
  {
    icon: FileText,
    label: "Paper",
    title: "Wishocracy",
    text: "Pairwise comparisons that turn citizen preferences into budget priorities and score how well officials follow them.",
    href: "https://wishocracy.warondisease.org",
    action: "Read the paper",
  },
  {
    icon: FileText,
    label: "Paper",
    title: "Incentive Alignment Bonds",
    text: "A proposed capital pool that rewards politicians for funding programs with high returns to society.",
    href: "https://iab.warondisease.org",
    action: "Read the paper",
  },
  {
    icon: FileText,
    label: "Paper",
    title: "Optimal Policy Generator",
    text: "Uses policy experiments to recommend which policies to enact, replace, repeal, or keep.",
    href: "https://opg.warondisease.org",
    action: "Read the paper",
  },
  {
    icon: FileText,
    label: "Paper",
    title: "Optimal Budget Generator",
    text: "Estimates the best funding level for each budget category and shows where budgets are over- or underfunded.",
    href: "https://obg.warondisease.org",
    action: "Read the paper",
  },
]

function AboutLinkCard({
  item,
  size,
}: {
  item: AboutLink
  size: "large" | "small"
}) {
  const { icon: Icon, label, title, text, href, action, color = "bg-background" } = item
  const content = (
    <>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-black uppercase">{label}</p>
        <Icon
          aria-hidden="true"
          className={size === "large" ? "h-10 w-10" : "h-7 w-7"}
          strokeWidth={3}
        />
      </div>
      <h3
        className={
          size === "large"
            ? "mt-4 text-3xl font-black uppercase leading-none tracking-tighter"
            : "mt-3 text-xl font-black uppercase leading-tight tracking-tight"
        }
      >
        {title}
      </h3>
      <p className="mt-3 font-bold">{text}</p>
      <span className="mt-auto flex items-center gap-2 pt-5 font-black uppercase">
        {action} <ArrowRight aria-hidden="true" className="h-5 w-5" />
      </span>
    </>
  )
  const className = `${cardLinkClass} ${color} ${size === "large" ? "min-h-64" : ""}`

  return href.startsWith("/") ? (
    <Link className={className} href={href}>
      {content}
    </Link>
  ) : (
    <a className={className} href={href}>
      {content}
    </a>
  )
}

export function AboutPage() {
  const address = formatNonprofitAddress()

  return (
    <Layout>
      <SectionContainer bgColor="background" borderPosition="bottom" padding="lg">
        <Container>
          <p className="mb-5 inline-block rotate-[-1deg] border-4 border-primary bg-brutal-yellow px-4 py-2 text-sm font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            About us
          </p>
          <h1 className="text-4xl font-black uppercase leading-[0.9] tracking-tighter sm:text-6xl md:text-7xl">
            Institute for Accelerated Medicine
          </h1>
          <p className="mt-7 max-w-4xl text-lg font-bold sm:text-xl md:text-2xl">
            We are a {NONPROFIT.incorporatedIn} 501(c)(3) nonprofit. We work so
            every patient can join a pragmatic clinical trial for a promising
            treatment, with a clinician, at a licensed center, and so every
            result is published.
          </p>
        </Container>
      </SectionContainer>

      <SectionContainer bgColor="cyan" borderPosition="bottom" padding="lg">
        <Container>
          <h2 className="text-3xl font-black uppercase tracking-tighter sm:text-5xl">
            Our initiatives
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {INITIATIVES.map((item) => (
              <AboutLinkCard item={item} key={item.title} size="large" />
            ))}
          </div>
        </Container>
      </SectionContainer>

      <SectionContainer bgColor="background" borderPosition="bottom" padding="lg">
        <Container>
          <h2 className="text-3xl font-black uppercase tracking-tighter sm:text-5xl">
            Our research
          </h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {RESEARCH.map((item) => (
              <AboutLinkCard item={item} key={item.href} size="small" />
            ))}
          </div>
        </Container>
      </SectionContainer>

      <SectionContainer bgColor="yellow" borderPosition="bottom" padding="lg">
        <Container>
          <h2 className="text-3xl font-black uppercase tracking-tighter sm:text-5xl">
            Legal facts
          </h2>
          <Card className="mt-8 rounded-none border-4 border-primary bg-background p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:p-8">
            <dl className="grid gap-5 text-base font-bold sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="uppercase">Legal name</dt>
                <dd>{NONPROFIT.legalName}</dd>
              </div>
              <div>
                <dt className="uppercase">EIN</dt>
                <dd>{NONPROFIT.ein}</dd>
              </div>
              <div>
                <dt className="uppercase">Status</dt>
                <dd>501(c)(3) public charity, incorporated in {NONPROFIT.incorporatedIn}</dd>
              </div>
              {address ? (
                <div>
                  <dt className="uppercase">Mailing address</dt>
                  <dd>{address}</dd>
                </div>
              ) : null}
              <div>
                <dt className="uppercase">Contact</dt>
                <dd>
                  <a
                    className="underline decoration-2 underline-offset-4"
                    href="mailto:hello@acceleratedmedicine.org"
                  >
                    hello@acceleratedmedicine.org
                  </a>
                </dd>
              </div>
            </dl>
          </Card>
        </Container>
      </SectionContainer>

      <SectionContainer bgColor="background" borderPosition="bottom" padding="lg">
        <Container>
          <h2 className="text-3xl font-black uppercase tracking-tighter sm:text-5xl">
            Board of directors
          </h2>
          <div className="mt-8 grid max-w-3xl grid-cols-3 gap-3 sm:gap-5">
            {BOARD_MEMBERS.map((member) => (
              <Card
                key={member.name}
                className="overflow-hidden rounded-none border-4 border-primary bg-background py-0 gap-0 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
              >
                <div
                  className={`relative aspect-square w-full overflow-hidden border-b-4 border-primary ${member.photoClassName}`}
                >
                  <img
                    alt={member.photoAlt}
                    className="h-full w-full object-cover"
                    src={member.photoSrc}
                  />
                </div>
                <div className="p-2 sm:p-4">
                  <p className="text-[10px] font-black uppercase sm:text-xs">{member.role}</p>
                  <h3 className="mt-1 text-sm font-black uppercase leading-tight tracking-tight sm:text-lg">
                    {member.name}
                  </h3>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </SectionContainer>

      <SectionContainer bgColor="yellow" borderPosition="none" padding="lg">
        <Container className="text-center">
          <h2 className="text-4xl font-black uppercase tracking-tighter sm:text-5xl">
            Help bring Right to Trial to your state
          </h2>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Button asChild className={`${buttonShadow} bg-brutal-pink`} size="lg">
              <Link href="/#state-support">Take the survey</Link>
            </Button>
            <Button
              asChild
              className={`${buttonShadow} bg-background text-foreground`}
              size="lg"
            >
              <Link href="/model-act">Read the proposed law</Link>
            </Button>
          </div>
        </Container>
      </SectionContainer>
    </Layout>
  )
}
