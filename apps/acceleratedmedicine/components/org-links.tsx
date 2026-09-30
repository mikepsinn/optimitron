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

import { MANUAL_URLS, PODCAST_URLS } from "@optimitron/site-kit/lib/manual-links"

import { RIGHT_TO_TRIAL_IMPACT_PAPER_URL } from "@/lib/right-to-trial-impact"

export const buttonShadow =
  "rounded-none border-4 border-primary px-7 py-6 text-base font-black uppercase shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]"

const cardLinkClass =
  "flex flex-col border-4 border-primary p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"

export type OrgLink = {
  icon: LucideIcon
  label: string
  title: string
  text: string
  href: string
  action: string
  color?: string
}

export const RIGHT_TO_TRIAL_LINK: OrgLink = {
  icon: ClipboardCheck,
  label: "acceleratedmedicine.org",
  title: "Right to Trial",
  text: "A model state law that starts from Montana's enacted framework and lets every patient join a pragmatic trial through their clinician.",
  href: "/montana",
  action: "See the Montana model",
  color: "bg-brutal-cyan",
}

export const ONE_PERCENT_TREATY_LINK: OrgLink = {
  icon: Landmark,
  label: "warondisease.org",
  title: "1% Treaty",
  text: "A proposed treaty. Each nation that signs would redirect 1% of its military budget, mostly to pragmatic clinical trials.",
  href: "https://warondisease.org",
  action: "Take the Global Survey",
  color: "bg-brutal-yellow",
}

export const DECENTRALIZED_FDA_LINK: OrgLink = {
  icon: Microscope,
  label: "dfda.earth",
  title: "Decentralized Framework for Drug Assessment",
  text: "We are building an open protocol that ranks treatments by real-world patient outcomes and publishes an Outcome Label for each drug.",
  href: "https://dfda.earth",
  action: "Visit dfda.earth",
  color: "bg-brutal-pink",
}

export const WISHOCRACY_LINK: OrgLink = {
  icon: Workflow,
  label: "wishocracy.org",
  title: "Wishocracy",
  text: "People split $100 between two spending priorities at a time. The answers combine into public budget priorities.",
  href: "https://wishocracy.org",
  action: "Visit wishocracy.org",
  color: "bg-background",
}

export const COURT_OF_HUMANITY_LINK: OrgLink = {
  icon: Scale,
  label: "courtofhumanity.org",
  title: "Court of Humanity",
  text: "A public case, Humanity v. Government. Read the claim and the cited evidence, register affected people as plaintiffs, and render a verdict.",
  href: "https://courtofhumanity.org",
  action: "Visit the court",
  color: "bg-background",
}

export const TRIAL_ABUNDANCE_SURVEY_LINK: OrgLink = {
  icon: ClipboardList,
  label: "trialabundancesurvey.org",
  title: "Trial Abundance Survey",
  text: "Measures public support for faster medical progress through pragmatic clinical trials.",
  href: "https://trialabundancesurvey.org",
  action: "Take the survey",
  color: "bg-background",
}

export const RESEARCH_LINKS: OrgLink[] = [
  {
    icon: BookOpen,
    label: "Book",
    title: "How to End War and Disease",
    text: "The full plan: economics, legal framework, financing, and roadmap.",
    href: MANUAL_URLS.readOnline,
    action: "Read online",
  },
  {
    icon: Podcast,
    label: "Podcast",
    title: "How to End War and Disease",
    text: "The book as a podcast.",
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

export function OrgLinkCard({
  item,
  size,
}: {
  item: OrgLink
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
