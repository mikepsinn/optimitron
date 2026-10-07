import Link from "next/link"
import { Building2, Database, Stethoscope, Users } from "lucide-react"

import { Button } from "@optimitron/neobrutalist-ui/ui/button"

import type { PartnerType } from "@/lib/partner-signup-options"

const protocolUrl = "https://papers.acceleratedmedicine.org/dfda-protocol"
const codeUrl = "https://github.com/mikepsinn/dfda"

// Each card's main button opens the sign-up form with the card's type already chosen.
const signUp = (type: PartnerType) => `/contact?type=${type}`

const partners = [
  {
    icon: Stethoscope,
    title: "Clinics and doctors",
    text: "Run a pilot site or advise us on the protocol.",
    links: [],
    talk: { label: "Talk to us", href: signUp("clinic") },
  },
  {
    icon: Building2,
    title: "Organizations building their own",
    text: "The protocol and code are open source, so you can build your own version and publish results in the same open format.",
    links: [
      { href: protocolUrl, label: "Read the protocol" },
      { href: codeUrl, label: "See the code" },
    ],
    talk: { label: "Talk to us", href: signUp("builder") },
  },
  {
    icon: Database,
    title: "Data partners",
    text: "Apps, health record systems, registries and wearable makers would share outcome data through an open API, so their users' results count toward the rankings and labels.",
    links: [],
    talk: { label: "Talk to us", href: signUp("data-partner") },
  },
  {
    icon: Users,
    title: "Advisory board",
    text: "We are recruiting clinicians, researchers, ethicists, lawyers and patient advocates to advise the Institute on the protocol, patient safety and the law.",
    links: [],
    talk: { label: "Apply to the board", href: signUp("advisory-board") },
  },
]

export function PartnersSection() {
  return (
    // `help` keeps the shared footer's "Share an Idea" link (/#help) on the home page.
    <section id="help" aria-labelledby="partners-heading" className="w-full scroll-mt-16 py-12 md:py-24">
      <div className="container px-4 md:px-6">
        <h2 id="partners-heading" className="text-center text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
          Partner with us
        </h2>
        <div className="mx-auto mt-10 grid max-w-5xl gap-6 md:grid-cols-2">
          {partners.map(partner => (
            // A lone last card sits centered under the two columns.
            <div key={partner.title}
              className="flex flex-col rounded-lg border bg-background p-6 shadow-sm md:last:odd:col-span-2 md:last:odd:mx-auto md:last:odd:w-[calc(50%-0.75rem)]">
              <div className="flex items-center gap-3">
                <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <partner.icon className="h-5 w-5" />
                </span>
                <h3 className="text-xl font-bold">{partner.title}</h3>
              </div>
              <p className="mt-3 flex-grow text-muted-foreground">{partner.text}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                {partner.links.map(link => (
                  <Button key={link.href} asChild variant="outline" size="sm">
                    <Link href={link.href}>{link.label}</Link>
                  </Button>
                ))}
                <Button asChild size="sm">
                  <Link href={partner.talk.href}>{partner.talk.label}</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
