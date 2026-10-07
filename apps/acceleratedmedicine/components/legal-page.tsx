import type { ReactNode } from "react"

import { AcceleratedMedicinePage } from "@/components/accelerated-medicine-chrome"
import { SITE } from "@/lib/site-settings"

/** The Terms of Service and Privacy Policy layout: a title, the revision date, then numbered sections. */
export function LegalPage({ title, lastUpdated, children }: { title: string; lastUpdated: string; children: ReactNode }) {
  return (
    <AcceleratedMedicinePage>
      <article className="mx-auto max-w-3xl pb-12 md:py-4">
        <header className="text-center">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">{title}</h1>
          <p className="mt-3 text-muted-foreground">Last updated: {lastUpdated}</p>
        </header>
        <div className="mt-10 space-y-8 rounded-lg border bg-card p-6 leading-relaxed shadow-sm sm:p-10">{children}</div>
      </article>
    </AcceleratedMedicinePage>
  )
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </section>
  )
}

export function LegalList({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-2 pl-6">{children}</ul>
}

/** Who to contact about the terms or the policy. */
export function LegalContact() {
  return (
    <div className="rounded-md bg-muted p-4">
      <p className="font-semibold">{SITE.legalEntityName}</p>
      <p>
        Email: <a className="text-primary hover:underline" href={`mailto:${SITE.email}`}>{SITE.email}</a>
      </p>
      <p>Website: {SITE.websiteLabel}</p>
    </div>
  )
}
