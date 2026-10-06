import { Inter } from "next/font/google"
import Link from "next/link"
import type { ReactNode } from "react"

import { Button } from "@optimitron/neobrutalist-ui/ui/button"
import { visibleNavigationItems } from "@optimitron/site-kit/lib/app-navigation"
import { SHOW_DONATE_LINKS } from "@optimitron/site-kit/lib/navigation-features"
import { getCopyrightText, getSiteConfig } from "@optimitron/site-kit/lib/site-config"

import { MobileMenu } from "@/components/accelerated-medicine-mobile-menu"
import {
  COURT_OF_HUMANITY_LINK,
  ONE_PERCENT_TREATY_LINK,
  RESEARCH_LINKS,
  WISHOCRACY_LINK,
} from "@/components/org-links"
import { appNavigation } from "@/lib/navigation"

// The Accelerated Medicine look: purple, light borders, rounded corners and Inter, adapted from the
// decentralized-fda prototype. Pages in this look (the home page and /contact) use this header and footer.
// The other pages keep the shared site-kit layout. The footer lists the same pages, legal notice and
// copyright as the shared footer, and both respect the shared donate switch.
const headerLinks = [
  { href: "/#how-it-works", label: "How it should work" },
  { href: "/right-to-trial", label: "Right to Trial" },
  // Every page with this header ends with the footer's Research column.
  { href: "#research", label: "Research" },
  { href: "/about", label: "About us" },
]

const inter = Inter({ subsets: ["latin"] })

const relatedProjects = [ONE_PERCENT_TREATY_LINK, WISHOCRACY_LINK, COURT_OF_HUMANITY_LINK]

function AcceleratedMedicineHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4 md:px-6">
        <Link href="/" className="max-w-[9.5rem] text-sm leading-tight font-bold sm:max-w-none sm:text-base 2xl:text-xl">
          Institute for Accelerated Medicine
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-6 text-sm font-medium lg:flex">
          {headerLinks.map(link => (
            <a key={link.href} href={link.href} className="hover:text-primary">{link.label}</a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {SHOW_DONATE_LINKS && (
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
              <Link href="/donate">Donate</Link>
            </Button>
          )}
          <Button asChild size="sm">
            <Link href="/contact">Partner with us</Link>
          </Button>
          <MobileMenu links={headerLinks} />
        </div>
      </div>
    </header>
  )
}

type FooterLink = { href: string; label: string; external?: boolean }

// The shared footer's section labels are in capitals.
const sectionTitles: Record<string, string> = { "right-to-try": "Right to Trial", evidence: "Evidence", support: "Support" }

function AcceleratedMedicineFooter() {
  const columns: { id?: string; title: string; links: FooterLink[] }[] = [
    ...appNavigation.footerSections.map(section => ({
      title: sectionTitles[section.id] ?? section.label,
      links: visibleNavigationItems(section.resolvedItems, false)
        .map(item => ({ href: item.path, label: item.label, external: item.isExternal })),
    })),
    {
      id: "research",
      title: "Research",
      links: RESEARCH_LINKS.map(link => ({ href: link.href, label: `${link.label}: ${link.title}`, external: true })),
    },
    {
      title: "Related projects",
      links: relatedProjects.map(link => ({ href: link.href, label: link.title, external: true })),
    },
  ]
  const complianceNotice = getSiteConfig().footerComplianceNotice

  return (
    <footer className="w-full border-t py-10">
      <div className="container mx-auto space-y-8 px-4 text-sm md:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {columns.map(column => (
            <div key={column.title} id={column.id} className="scroll-mt-20 space-y-2">
              <p className="font-semibold">{column.title}</p>
              <ul className="space-y-1">
                {column.links.map(link => (
                  <li key={`${link.href}-${link.label}`}>
                    <a href={link.href} className="text-muted-foreground hover:text-foreground hover:underline"
                      {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="space-y-3 border-t pt-6 text-muted-foreground">
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <p className="font-semibold text-foreground">Institute for Accelerated Medicine</p>
            <a href="mailto:hello@acceleratedmedicine.org" className="hover:text-foreground hover:underline">
              hello@acceleratedmedicine.org
            </a>
            {visibleNavigationItems(appNavigation.legalItems, false).map(item => (
              <a key={item.path} href={item.path} className="hover:text-foreground hover:underline">{item.label}</a>
            ))}
          </div>
          <p>{getCopyrightText()}</p>
          {complianceNotice && <p>{complianceNotice}</p>}
        </div>
      </div>
    </footer>
  )
}

/** The Accelerated Medicine colors and font, without the header and footer. `accelerated-medicine-theme` sets the colors (app/globals.css). */
export function AcceleratedMedicineTheme({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`accelerated-medicine-theme ${inter.className} ${className}`}>{children}</div>
}

/** A page in the Accelerated Medicine look, with its header and footer. */
export function AcceleratedMedicinePage({ children }: { children: ReactNode }) {
  return (
    <AcceleratedMedicineTheme className="flex min-h-screen flex-col bg-background text-foreground">
      <AcceleratedMedicineHeader />
      <main className="w-full flex-1 py-6 md:py-10">
        <div className="container mx-auto px-4 md:px-6">{children}</div>
      </main>
      <AcceleratedMedicineFooter />
    </AcceleratedMedicineTheme>
  )
}
