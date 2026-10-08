import { ArrowRight } from "lucide-react"
import Link from "next/link"

import { Button } from "@optimitron/neobrutalist-ui/ui/button"

import { AcceleratedMedicinePage } from "@/components/accelerated-medicine-chrome"
import { RESEARCH_LINKS } from "@/components/research-links"
import { SectionHeading } from "@/components/section-heading"
import { NONPROFIT } from "@/lib/nonprofit-identity"

const card = "rounded-lg border bg-card p-6 shadow-sm"

export function AboutPage() {
  return (
    <AcceleratedMedicinePage>
      <section className="mx-auto max-w-4xl pb-12 text-center md:py-8 md:pb-16">
        <p className="inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">About us</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">The Care-Integrated Clinical Trials Initiative</h1>
        <p className="mx-auto mt-4 max-w-3xl text-muted-foreground md:text-xl">
          We work so every patient can join a pragmatic clinical trial of a promising treatment, through their own
          doctor, at a clinic an independent board has approved, and so every result is published. The Institute for
          Accelerated Medicine, a {NONPROFIT.incorporatedIn} 501(c)(3) nonprofit, runs the initiative.
        </p>
      </section>

      <section aria-labelledby="research-heading" className="band-muted py-12 md:py-20">
        <SectionHeading id="research-heading" title="Our research" />
        <ul className="mx-auto mt-8 grid max-w-4xl gap-6 md:grid-cols-2">
          {RESEARCH_LINKS.map(item => (
            <li key={item.href} className={`${card} flex flex-col`}>
              <p className="flex items-center gap-2 text-sm font-medium text-primary">
                <item.icon aria-hidden="true" className="h-4 w-4" /> {item.label}
              </p>
              <h3 className="mt-2 font-semibold">{item.title}</h3>
              <p className="mt-2 flex-1 text-muted-foreground">{item.text}</p>
              <a href={item.href} rel="noreferrer" target="_blank"
                className="mt-4 inline-flex items-center gap-1 font-medium text-primary hover:underline">
                {item.action} <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="advisors-heading" className="py-12 md:py-20">
        <SectionHeading id="advisors-heading" title="Advisory board">
          We are recruiting clinicians, researchers, ethicists, lawyers and patient advocates to advise the Institute on
          the protocol, patient safety and the law. Members will be listed here once they join.
        </SectionHeading>
        <div className="mt-8 text-center">
          <Button asChild size="lg">
            <Link href="/contact?type=advisory-board">
              Apply to the advisory board <ArrowRight aria-hidden="true" className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section aria-labelledby="who-heading" className="band-muted py-12 md:py-20">
        <SectionHeading id="who-heading" title="Who we are">
          We&apos;re basically just concerned citizens trying to coordinate humanity to make it possible for anyone to
          participate in clinical trials for the most promising treatment, considering everyone we&apos;ve ever loved
          is being slowly tortured and will be eventually murdered by horrible diseases. The Institute&apos;s board of
          directors is Mike Sinn, Ian Whitmore and Kathryn Bortko.
        </SectionHeading>
      </section>

      <section aria-labelledby="work-heading" className="py-12 md:py-16">
        <SectionHeading id="work-heading" title="Work with us">
          Clinics, patient groups, data partners and funders can partner with the Care-Integrated Clinical Trials
          Initiative.
        </SectionHeading>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/contact">Partner with us <ArrowRight aria-hidden="true" className="ml-1 h-4 w-4" /></Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/act">Read the act</Link>
          </Button>
        </div>
      </section>
    </AcceleratedMedicinePage>
  )
}
