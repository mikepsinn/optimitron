import { ArrowRight } from "lucide-react"
import Link from "next/link"

import { Button } from "@optimitron/neobrutalist-ui/ui/button"

import { AcceleratedMedicinePage } from "@/components/accelerated-medicine-chrome"
import { SectionHeading } from "@/components/section-heading"
import type { StateCampaign } from "@/lib/right-to-try"
import {
  estimatedRareDiseasePatients,
  estimateStateShare,
  formatPeopleApprox,
  NATIONAL_CONDITION_COUNTS,
  RARE_DISEASES_COUNT,
  STATE_FACT_SOURCES,
  STATE_POPULATIONS,
  UNTREATED_RARE_DISEASE_SHARE_PCT,
} from "@/lib/state-facts"

const card = "rounded-lg border bg-card p-6 shadow-sm"
const sourceLink = "font-medium text-primary hover:underline"
const FDA_RIGHT_TO_TRY_SUMMARY = "https://www.factcheck.org/2026/06/no-evidence-for-trumps-right-to-try-claim/"

/**
 * One state's page: the people there living with conditions better treatments could help, what the
 * state has today, and what the act would add. It describes the act and asks nobody to contact a
 * legislator, because the Institute is a 501(c)(3).
 */
export function StateCampaignPage({ campaign }: { campaign: StateCampaign }) {
  const { name } = campaign
  const rarePatients = formatPeopleApprox(estimatedRareDiseasePatients(name))
  const population = formatPeopleApprox(STATE_POPULATIONS[name])
  const conditions = NATIONAL_CONDITION_COUNTS
    .map(condition => ({ ...condition, stateCount: estimateStateShare(name, condition.usCount) }))
    .sort((a, b) => b.stateCount - a.stateCount)
  const largestCount = conditions[0]?.stateCount ?? 1

  const today = [
    {
      title: "Federal Right to Try",
      text: `Since 2018, a patient with a life-threatening illness who has used up approved options can ask a maker for a drug still in development. The maker may charge only its costs, and sends the FDA only a yearly count of patients treated and serious side effects, not whether patients improved. Most states also passed their own Right to Try laws, with similar limits.`,
      source: { href: STATE_FACT_SOURCES.federalRightToTryAct, label: "Right to Try Act (2018)" },
    },
    {
      title: "Few patients helped",
      text: "The FDA reports only 21 investigational drugs used under the federal law from May 2018 to December 2024. It does not cover existing drugs approved for other conditions.",
      source: { href: FDA_RIGHT_TO_TRY_SUMMARY, label: "FDA summary, via FactCheck.org (2026)" },
    },
    {
      title: "A state that went further",
      text: "In 2025, Montana licensed experimental treatment centers with SB 535. Its first clinics are expected around the end of 2026.",
      source: { href: "/montana", label: "The Montana precedent" },
    },
  ]

  return (
    <AcceleratedMedicinePage>
      <section className="mx-auto max-w-4xl pb-12 text-center md:py-8 md:pb-16">
        <p className="inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">{name}</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">{campaign.headline}</h1>
        <p className="mx-auto mt-4 max-w-3xl text-muted-foreground md:text-xl">
          About {rarePatients} of {name}&apos;s {population} people live with a rare disease, and{" "}
          {UNTREATED_RARE_DISEASE_SHARE_PCT}% of the roughly {RARE_DISEASES_COUNT.toLocaleString("en-US")} rare
          diseases have no approved treatment. The Care-Integrated Clinical Trials Act would let any patient get a
          screened, promising treatment through their own doctor, let clinics charge enough to offer it, and publish
          every result.
        </p>
        <Button asChild size="lg" className="mt-8">
          <Link href="/act">Read the act <ArrowRight aria-hidden="true" className="ml-1 h-4 w-4" /></Link>
        </Button>
      </section>

      <section aria-labelledby="conditions-heading" className="band-muted py-12 md:py-20">
        <SectionHeading id="conditions-heading" title={`People in ${name} living with these conditions`} />
        <ul className="mx-auto mt-8 max-w-3xl space-y-4 rounded-lg border bg-card p-6 shadow-sm">
          {conditions.map(condition => (
            <li key={condition.label}>
              <div className="flex items-baseline justify-between gap-4">
                <a href={condition.sourceUrl} rel="noreferrer" target="_blank" className="font-medium hover:text-primary hover:underline">
                  {condition.label}
                </a>
                <span className="shrink-0 font-semibold tabular-nums">~{formatPeopleApprox(condition.stateCount)}</span>
              </div>
              <div aria-hidden="true" className="mt-2 h-2 rounded-full bg-muted">
                <div className="h-2 rounded-full bg-primary" style={{ width: `${(condition.stateCount / largestCount) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
        <p className="mx-auto mt-4 max-w-3xl text-sm text-muted-foreground">
          Estimates: national counts scaled to {name}&apos;s share of the US population (
          <a href={STATE_FACT_SOURCES.statePopulations} rel="noreferrer" target="_blank" className={sourceLink}>Census, 2025</a>
          ). Each condition links to its national source.
        </p>
      </section>

      <section aria-labelledby="today-heading" className="py-12 md:py-20">
        <SectionHeading id="today-heading" title={`What ${name} has today`} />
        <ul className="mx-auto mt-8 grid max-w-5xl gap-6 md:grid-cols-3">
          {today.map(item => (
            <li key={item.title} className={card}>
              <h3 className="font-semibold">{item.title}</h3>
              <p className="mt-2 text-muted-foreground">{item.text}</p>
              <p className="mt-3 text-sm">
                {item.source.href.startsWith("/")
                  ? <Link href={item.source.href} className={sourceLink}>{item.source.label}</Link>
                  : <a href={item.source.href} rel="noreferrer" target="_blank" className={sourceLink}>{item.source.label}</a>}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="partner-heading" className="border-t py-12 md:py-16">
        <SectionHeading id="partner-heading" title={`Organizations in ${name}`}>
          Patient groups, clinics, hospitals and researchers in {name} can partner with the Care-Integrated
          Clinical Trials Initiative.
        </SectionHeading>
        <div className="mt-8 text-center">
          <Button asChild size="lg" variant="outline">
            <Link href="/contact">Partner with us</Link>
          </Button>
        </div>
      </section>
    </AcceleratedMedicinePage>
  )
}
