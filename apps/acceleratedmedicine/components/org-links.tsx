import { ArrowRight, FileText, type LucideIcon } from "lucide-react"
import Link from "next/link"

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

// The papers behind care-integrated clinical trials. The book, the podcast and the other papers cover the
// wider program, so this site, which physicians and legislators read, leaves them out.
export const RESEARCH_LINKS: OrgLink[] = [
  {
    icon: FileText,
    label: "Paper",
    title: "Patient's Right to Trial Act",
    text: "Models how much sooner treatments arrive if every state adopts the act.",
    href: RIGHT_TO_TRIAL_IMPACT_PAPER_URL,
    action: "Read the paper",
  },
  {
    icon: FileText,
    label: "Paper",
    title: "Continuous Evidence Generation Protocol",
    text: "Finds treatment effects in real-world data, then confirms them with pragmatic trials.",
    href: "https://dfda-spec.warondisease.org",
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
