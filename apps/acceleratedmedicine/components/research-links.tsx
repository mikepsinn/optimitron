import { FileText, type LucideIcon } from "lucide-react"

import { RIGHT_TO_TRIAL_IMPACT_PAPER_URL } from "@/lib/right-to-trial-impact"

export type ResearchLink = {
  icon: LucideIcon
  label: string
  title: string
  text: string
  href: string
  action: string
}

// The papers behind care-integrated clinical trials. The book, the podcast and the other papers cover the
// wider program, so this site, which physicians and legislators read, leaves them out.
export const RESEARCH_LINKS: ResearchLink[] = [
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
