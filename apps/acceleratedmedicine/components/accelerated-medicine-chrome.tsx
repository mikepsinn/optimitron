import Link from "next/link"
import type { ReactNode } from "react"

import { Button } from "@optimitron/neobrutalist-ui/ui/button"

import { MobileMenu } from "@/components/accelerated-medicine-mobile-menu"
import { RESEARCH_LINKS } from "@/components/research-links"
import { SHOW_DONATE_LINKS, appNavigation, visibleNavigationItems } from "@/lib/navigation"
import { NONPROFIT, formatNonprofitAddress } from "@/lib/nonprofit-identity"
import { SITE } from "@/lib/site-settings"

// The Accelerated Medicine look: purple, light borders, rounded corners and Inter (set on <body> by
// app/layout.tsx), adapted from the decentralized-fda prototype. Every page uses this header and footer.
// The header shows the donate link as a button, so its menu leaves it out.
const headerLinks = appNavigation.topLevelItems
  .filter(item => item.feature !== "donate")
  .map(item => ({ href: item.path, label: item.label }))

function AcceleratedMedicineHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4 md:px-6">
        <Link href="/" className="max-w-[9.5rem] text-sm leading-tight font-bold sm:max-w-none sm:text-base 2xl:text-xl">
          {SITE.title}
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
            <Link href="/support">Show your support</Link>
          </Button>
          <MobileMenu links={headerLinks} />
        </div>
      </div>
    </header>
  )
}

type FooterLink = { href: string; label: string; external?: boolean }

function AcceleratedMedicineFooter() {
  const columns: { id?: string; title: string; links: FooterLink[] }[] = [
    ...appNavigation.footerSections.map(section => ({
      title: section.label,
      links: visibleNavigationItems(section.resolvedItems)
        .map(item => ({ href: item.path, label: item.label, external: item.isExternal })),
    })),
    {
      id: "research",
      title: "Research",
      links: RESEARCH_LINKS.map(link => ({ href: link.href, label: `${link.label}: ${link.title}`, external: true })),
    }
  ]

  return (
    <footer className="w-full border-t py-10">
      <div className="container mx-auto space-y-8 px-4 text-sm md:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
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
            <p className="font-semibold text-foreground">{SITE.title}</p>
            <a href={`mailto:${SITE.email}`} className="hover:text-foreground hover:underline">
              {SITE.email}
            </a>
            {visibleNavigationItems(appNavigation.legalItems).map(item => (
              <a key={item.path} href={item.path} className="hover:text-foreground hover:underline">{item.label}</a>
            ))}
          </div>
          {/* The legal facts that grant and verification programs (for example Google for Nonprofits) look for.
              Non-breaking spaces keep short items whole when the lines wrap. */}
          <p>© 2025 {NONPROFIT.legalName}, dba {NONPROFIT.registeredDba} | CC&nbsp;BY-NC&nbsp;4.0</p>
          <p>501(c)(3)&nbsp;nonprofit | EIN&nbsp;{NONPROFIT.ein} | {formatNonprofitAddress()}</p>
        </div>
      </div>
    </footer>
  )
}

/** The Accelerated Medicine colors, without the header and footer. `accelerated-medicine-theme` sets them (app/globals.css). */
export function AcceleratedMedicineTheme({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`accelerated-medicine-theme ${className}`}>{children}</div>
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
