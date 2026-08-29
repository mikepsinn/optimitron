import { Card } from "@optimitron/neobrutalist-ui/ui/card"
import { Container } from "@optimitron/neobrutalist-ui/ui/container"
import { SectionContainer } from "@optimitron/neobrutalist-ui/ui/section-container"
import Link from "next/link"

import { getSiteConfig, getSiteVariant, type SiteVariant } from "../lib/site-config"
import { Layout } from "./layout"

const ABOUT_CONTENT: Partial<Record<SiteVariant, {
  outcome: string
  action: string
  href: string
}>> = {
  "courtofhumanity.org": {
    outcome:
      "Read Humanity v. Government — the public case for redirecting 1% of military spending from weapons to cures — and put your name on the record as a plaintiff.",
    action: "Read the case",
    href: "/humanity-v-government",
  },
  "wishocracy.org": {
    outcome: "Compare public priorities two at a time. Wishocracy turns your choices into a budget allocation you can inspect and revise.",
    action: "Start allocating",
    href: "/",
  },
  "trialabundancesurvey.org": {
    outcome: "Tell researchers how much more clinical-trial capacity humanity needs. Your answer contributes to aggregate public-interest research.",
    action: "Take the survey",
    href: "/",
  },
  dfda: {
    outcome: "Compare conditions, treatments, and clinical-trial evidence. Campaign voting and fundraising remain on War on Disease.",
    action: "Find clinical trials",
    href: "/find-trials",
  },
  "curedao.org": {
    outcome: "Explore the projects that coordinate research, evidence, public priorities, and funding toward faster disease eradication.",
    action: "Explore the projects",
    href: "/",
  },
  "acceleratedmedicine.org": {
    outcome: "Support pragmatic clinical trials that test treatments during normal care and deliver reliable answers faster and at lower cost.",
    action: "Fund the work",
    href: "/donate",
  },
}

export function BrandAboutPage() {
  const config = getSiteConfig()
  const content = ABOUT_CONTENT[getSiteVariant()] ?? {
    outcome: config.description,
    action: "Return home",
    href: "/",
  }

  return (
    <Layout>
      <main>
        <SectionContainer bgColor="foreground" borderPosition="none" padding="lg">
          <Container>
            <h1 className="mb-8 text-4xl font-black uppercase leading-none sm:text-5xl md:text-6xl">
              About <span className="text-brutal-yellow">{config.name}</span>
            </h1>
            <Card className="border-4 border-primary p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-xl font-bold leading-relaxed">{content.outcome}</p>
            </Card>
          </Container>
        </SectionContainer>

        <SectionContainer bgColor="yellow" borderPosition="top" padding="lg">
          <Container size="md" className="text-center">
            <h2 className="mb-4 text-3xl font-black uppercase">What should you do next?</h2>
            <p className="mb-8 text-lg font-bold">{config.description}</p>
            <Link
              href={content.href}
              className="inline-block border-4 border-primary bg-brutal-pink px-8 py-4 text-xl font-black uppercase text-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
            >
              {content.action}
            </Link>
          </Container>
        </SectionContainer>
      </main>
    </Layout>
  )
}

export default BrandAboutPage
