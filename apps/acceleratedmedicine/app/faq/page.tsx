import type { Metadata } from "next"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

import { Button } from "@optimitron/neobrutalist-ui/ui/button"

import { AcceleratedMedicinePage } from "@/components/accelerated-medicine-chrome"
import { SectionHeading } from "@/components/section-heading"
import { FAQ_SECTIONS } from "@/lib/faq"
import { rightToTrialMetadata } from "@/lib/right-to-trial-metadata"

export const metadata: Metadata = rightToTrialMetadata({
  title: "Frequently Asked Questions | Institute for Accelerated Medicine",
  description:
    "How care-integrated clinical trials work, how patients are kept safe, what happens to their data, and what the Care-Integrated Clinical Trials Act does.",
  path: "/faq",
})

const textLink = "font-medium text-primary hover:underline"

export default function FaqPage() {
  return (
    <AcceleratedMedicinePage>
      <section className="mx-auto max-w-4xl pb-8 text-center md:py-8">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Frequently asked questions</h1>
        <p className="mx-auto mt-4 max-w-3xl text-muted-foreground md:text-xl">
          About care-integrated clinical trials, patient safety, the act, and the Institute.
        </p>
        <nav aria-label="FAQ sections" className="mt-6 flex flex-wrap justify-center gap-2">
          {FAQ_SECTIONS.map(section => (
            <a key={section.id} href={`#${section.id}`}
              className="rounded-full border bg-card px-3 py-1 text-sm font-medium hover:border-primary hover:text-primary">
              {section.title}
            </a>
          ))}
        </nav>
      </section>

      {FAQ_SECTIONS.map((section, index) => (
        <section key={section.id} id={section.id} aria-labelledby={`${section.id}-heading`}
          className={`scroll-mt-20 py-12 md:py-16 ${index % 2 === 0 ? "band-muted" : ""}`}>
          <SectionHeading id={`${section.id}-heading`} title={section.title} />
          <div className="mx-auto mt-8 max-w-3xl space-y-8">
            {section.questions.map(item => (
              <div key={item.id} id={`${section.id}-${item.id}`}>
                <h3 className="text-xl font-semibold">{item.question}</h3>
                {item.answer.map(paragraph => (
                  <p key={paragraph.slice(0, 40)} className="mt-3 text-muted-foreground">{paragraph}</p>
                ))}
                {item.link && (
                  <p className="mt-3">
                    <Link href={item.link.href} className={textLink}>
                      {item.link.label} <ArrowRight aria-hidden="true" className="inline h-4 w-4" />
                    </Link>
                  </p>
                )}
              </div>
            ))}
            {section.id === "act" && (
              <p>
                <Link href="/act" className={textLink}>
                  Read all five provisions of the act <ArrowRight aria-hidden="true" className="inline h-4 w-4" />
                </Link>
              </p>
            )}
            {section.source && (
              <p className="text-sm text-muted-foreground">
                {section.source.text}{" "}
                <a href={section.source.href} rel="noreferrer" target="_blank" className={textLink}>{section.source.label}</a>.
              </p>
            )}
          </div>
        </section>
      ))}

      <section aria-labelledby="contact-heading" className="border-t py-12 md:py-16">
        <SectionHeading id="contact-heading" title="Still have questions?">
          Email hello@acceleratedmedicine.org, or tell us how you would like to work with us.
        </SectionHeading>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/contact">Partner with us <ArrowRight aria-hidden="true" className="ml-1 h-4 w-4" /></Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="mailto:hello@acceleratedmedicine.org">Email us</a>
          </Button>
        </div>
      </section>
    </AcceleratedMedicinePage>
  )
}
