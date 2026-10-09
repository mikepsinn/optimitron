import type { Metadata } from "next"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

import { AcceleratedMedicineTheme } from "@/components/accelerated-medicine-chrome"
import { actProvisions } from "@/components/present/patient-journey/closing"
import { millions, reasons, recovery } from "@/components/present/patient-journey/opening"
import { PrintOnRequest, SavePdfButton } from "@/components/print-pdf"
import { ACT_SUMMARY } from "@/lib/act-questions"
import { NONPROFIT } from "@/lib/nonprofit-identity"
import { loadScript } from "@/lib/present-script"
import { rightToTrialMetadata } from "@/lib/right-to-trial-metadata"
import { SITE } from "@/lib/site-settings"

export const metadata: Metadata = rightToTrialMetadata({
  // Also the saved PDF's file name.
  title: "The Care-Integrated Clinical Trials Act (One-Page Overview)",
  description:
    "The Care-Integrated Clinical Trials Act on one page: why promising treatments go untested, what the act does, and a trial that shows the idea works.",
  path: "/one-pager",
})

const heading = "text-[15px] font-bold tracking-tight"

// A handout for meetings with legislators, staff and partners, printed or saved as one letter-size page.
// Like the deck and the video, it names no state and makes no ask (content/patient-journey/script.md,
// "Brief"). Its headings, figures and sources come from the deck, so the three stay in step.
export default function OnePager() {
  const script = loadScript("patient-journey")
  const slide = (key: string) => {
    const found = script.find(s => s.key === key)
    if (!found?.title) throw new Error(`The patient journey script has no slide ${key} title`)
    return found
  }
  const sources = [...new Set(["3", "4", "5"].flatMap(key =>
    (slide(key).sourceLine ?? "").replace(/^Sources?:\s*/, "").replace(/\.$/, "").split("; ")))]

  return (
    <AcceleratedMedicineTheme className="min-h-screen bg-muted px-4 py-6 text-foreground print:bg-transparent print:p-0">
      <style>{"@media print { @page { size: letter; margin: 0.5in; } }"}</style>
      <PrintOnRequest />
      <nav className="mx-auto mb-4 flex max-w-[8.5in] items-center justify-between gap-4 print:hidden">
        <Link href="/resources" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Resources
        </Link>
        <SavePdfButton />
      </nav>

      <article className="mx-auto max-w-[8.5in] rounded-lg border bg-background p-6 text-[12.5px] leading-snug shadow-sm [print-color-adjust:exact] sm:p-[0.5in] print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none">
        <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b pb-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">
            The Care-Integrated Clinical Trials Initiative
          </p>
          <p className="text-[11px] text-muted-foreground">
            <a href={`${SITE.url}/act`} className="text-primary">acceleratedmedicine.org/act</a>
            <span aria-hidden="true"> · </span>
            <a href={`mailto:${SITE.email}`} className="text-primary">{SITE.email}</a>
          </p>
        </header>
        <h1 className="mt-3 text-[24px] font-bold leading-tight tracking-tight">The Care-Integrated Clinical Trials Act</h1>
        <p className="mt-1.5 text-[14px] text-muted-foreground">{ACT_SUMMARY}</p>

        <section className="mt-4">
          <h2 className={heading}>{slide("3").title}</h2>
          <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
            {millions.map(stat => (
              <li key={stat.value} className="border-t-2 border-amber-400 pt-1.5">
                <p className="text-[20px] font-bold leading-tight text-amber-500 tabular-nums">{stat.value}</p>
                <p className="text-[12px] text-muted-foreground">{stat.label}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-4">
          <h2 className={heading}>{slide("4").title}</h2>
          <ul className="mt-2 grid gap-3 sm:grid-cols-3">
            {reasons.map(reason => (
              <li key={reason.heading} className="rounded-md border px-3 py-2.5">
                <p className="font-semibold">{reason.heading}</p>
                <p className="text-[20px] font-bold leading-tight text-primary tabular-nums">{reason.value}</p>
                <p className="mt-1 text-muted-foreground">{reason.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-4">
          <h2 className={heading}>{slide("18").title}</h2>
          <ul className="mt-2 divide-y rounded-md border">
            {actProvisions.map(provision => (
              <li key={provision.lead} className="flex items-start gap-3 px-3 py-1.5">
                <span aria-hidden="true" className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <provision.icon className="h-3 w-3" />
                </span>
                <p className="pt-px"><strong className="font-semibold">{provision.lead}</strong> {provision.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-4">
          <h2 className={heading}>{slide("5").title}</h2>
          <p className="mt-0.5 text-muted-foreground">
            In 2020, any UK hospital could enroll patients in RECOVERY during normal care, and outcomes came from routine records.
          </p>
          <ul className="mt-2 grid gap-3 sm:grid-cols-3">
            {recovery.map(stat => (
              <li key={stat.value} className="rounded-md border px-3 py-2.5">
                <p className={`text-[20px] font-bold leading-tight tabular-nums ${stat.highlight ? "text-amber-500" : "text-primary"}`}>
                  {stat.value}
                </p>
                <p className="mt-1">{stat.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <footer className="mt-4 border-t pt-2.5 text-[10.5px] text-muted-foreground">
          <p>Sources: {sources.join("; ")}.</p>
          <p className="mt-1">
            {NONPROFIT.legalName}, dba {NONPROFIT.registeredDba}, a 501(c)(3) nonprofit. EIN {NONPROFIT.ein}.
          </p>
        </footer>
      </article>
    </AcceleratedMedicineTheme>
  )
}
