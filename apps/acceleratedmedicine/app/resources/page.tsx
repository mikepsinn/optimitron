import type { Metadata } from "next"
import { FileDown, FileText, Presentation, Video, type LucideIcon } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

import { Button } from "@optimitron/neobrutalist-ui/ui/button"

import { AcceleratedMedicinePage } from "@/components/accelerated-medicine-chrome"
import { EXPLAINER_VIDEO } from "@/components/home/explainer-video"
import { loadScript } from "@/lib/present-script"
import { rightToTrialMetadata } from "@/lib/right-to-trial-metadata"

export const metadata: Metadata = rightToTrialMetadata({
  title: "Presentations and Handouts | Care-Integrated Clinical Trials Initiative",
  description: "A one-page overview, a presentation and a two-minute video about the Care-Integrated Clinical Trials Act, to present, print or save as PDF.",
  path: "/resources",
})

type Resource = { icon: LucideIcon; kind: string; title: string; text: ReactNode; actions: ReactNode }

// "Save as PDF" opens the page with ?print, which opens the print window there (components/print-pdf.tsx).
function SavePdfLink({ href }: { href: string }) {
  return (
    <Button asChild variant="outline">
      <Link href={`${href}?print`}><FileDown aria-hidden="true" className="mr-2 h-4 w-4" /> Save as PDF</Link>
    </Button>
  )
}

export default function ResourcesPage() {
  // Backup slides (B1, B2…) are for questions, so the count leaves them out.
  const slideCount = loadScript("patient-journey").filter(slide => !slide.key.startsWith("B")).length
  const resources: Resource[] = [
    {
      icon: FileText,
      kind: "Handout · 1 page",
      title: "One-page overview",
      text: "Why promising treatments go untested, what the act does, and a trial that shows the idea works. For a meeting, or to leave behind.",
      actions: (
        <>
          <Button asChild><Link href="/one-pager">Open</Link></Button>
          <SavePdfLink href="/one-pager" />
        </>
      ),
    },
    {
      icon: Presentation,
      kind: `Presentation · ${slideCount} slides`,
      title: "The patient journey",
      text: (
        <>
          Follows one patient from her first question to a published result, then shows what the act does. For
          legislators, their staff and patient advocates. Press <kbd>N</kbd> for speaker notes and <kbd>F</kbd> for
          full screen.
        </>
      ),
      actions: (
        <>
          <Button asChild><Link href="/present/patient-journey">Present</Link></Button>
          <SavePdfLink href="/present/patient-journey" />
        </>
      ),
    },
    {
      icon: Video,
      kind: "Video · 2 minutes",
      title: "Two-minute explainer",
      text: "The same story as the presentation, with captions, so it works with the sound off.",
      actions: (
        <Button asChild><a href={EXPLAINER_VIDEO} rel="noreferrer" target="_blank">Watch</a></Button>
      ),
    },
  ]

  return (
    <AcceleratedMedicinePage>
      <section className="mx-auto max-w-4xl pb-10 text-center md:py-8">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Presentations and handouts</h1>
        <p className="mx-auto mt-4 max-w-3xl text-muted-foreground md:text-xl">
          Explain the Care-Integrated Clinical Trials Act in a meeting, on paper or on screen.
        </p>
      </section>
      <ul className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
        {resources.map(resource => (
          <li key={resource.title} className="flex flex-col rounded-lg border bg-card p-6 shadow-sm">
            <p className="flex items-center gap-2 text-sm font-medium text-primary">
              <resource.icon aria-hidden="true" className="h-4 w-4" /> {resource.kind}
            </p>
            <h2 className="mt-2 text-xl font-semibold">{resource.title}</h2>
            <p className="mt-2 flex-1 text-muted-foreground">{resource.text}</p>
            <div className="mt-5 flex flex-wrap gap-3">{resource.actions}</div>
          </li>
        ))}
      </ul>
      <p className="mx-auto mt-8 max-w-5xl pb-8 text-center text-sm text-muted-foreground">
        Save as PDF opens your browser&apos;s print window. Choose Save as PDF as the destination.
      </p>
    </AcceleratedMedicinePage>
  )
}
