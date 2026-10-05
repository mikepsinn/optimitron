import Link from "next/link"
import { Building2, Database, HeartHandshake, Stethoscope } from "lucide-react"

import { Button } from "@optimitron/neobrutalist-ui/ui/button"
import { SHOW_DONATE_LINKS } from "@optimitron/site-kit/lib/navigation-features"

const email = "hello@acceleratedmedicine.org"
const protocolUrl = "https://papers.acceleratedmedicine.org/dfda-protocol"
const codeUrl = "https://github.com/mikepsinn/dfda"

// Each card's "Talk to us" opens an email to the Institute, with the partner type in the subject.
const mailto = (address: string, subject: string) => `mailto:${address}?subject=${encodeURIComponent(subject)}`

const partners = [
  {
    icon: HeartHandshake,
    title: "Donors and funders",
    text: "Your donation pays for public education, pragmatic-trial research and the open software behind the rankings and labels.",
    // The shared donate switch hides donation links on every site; a major gift is still a conversation.
    links: SHOW_DONATE_LINKS ? [{ href: "/donate", label: "Donate" }] : [],
    talk: { label: "Discuss a major gift", href: mailto("donations@acceleratedmedicine.org", "Major gift") },
  },
  {
    icon: Stethoscope,
    title: "Clinics and doctors",
    text: "Run a pilot site, serve on an independent review board, or advise us on the protocol.",
    links: [],
    talk: { label: "Talk to us", href: mailto(email, "Partnership: clinic or doctor") },
  },
  {
    icon: Building2,
    title: "Organizations building their own",
    text: "The protocol and code are open source, so you can build your own version and publish results in the same open format.",
    links: [
      { href: protocolUrl, label: "Read the protocol" },
      { href: codeUrl, label: "See the code" },
    ],
    talk: { label: "Talk to us", href: mailto(email, "Partnership: organization building its own version") },
  },
  {
    icon: Database,
    title: "Data partners",
    text: "Apps, health record systems, registries and wearable makers would share outcome data through an open API, so their users' results count toward the rankings and labels.",
    links: [],
    talk: { label: "Talk to us", href: mailto(email, "Partnership: data partner") },
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
            <div key={partner.title} className="flex flex-col rounded-lg border bg-background p-6 shadow-sm">
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
                  <a href={partner.talk.href}>{partner.talk.label}</a>
                </Button>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-muted-foreground">
          Or email <a href={`mailto:${email}`} className="text-primary hover:underline">{email}</a>
        </p>
      </div>
    </section>
  )
}
