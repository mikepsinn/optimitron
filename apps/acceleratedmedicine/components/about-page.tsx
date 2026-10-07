import Link from "next/link"

import { Button } from "@optimitron/neobrutalist-ui/ui/button"
import { Card } from "@optimitron/neobrutalist-ui/ui/card"
import { Container } from "@optimitron/neobrutalist-ui/ui/container"
import { SectionContainer } from "@optimitron/neobrutalist-ui/ui/section-container"
import {
  NONPROFIT,
  formatNonprofitAddress,
} from "@optimitron/site-kit/lib/nonprofit-identity"

import { BOARD_MEMBERS } from "@/lib/board-members"
import Layout from "@/components/layout"
import { MailingAddress } from "@/components/mailing-address"
import {
  COURT_OF_HUMANITY_LINK,
  DECENTRALIZED_FDA_LINK,
  ONE_PERCENT_TREATY_LINK,
  OrgLinkCard,
  RESEARCH_LINKS,
  RIGHT_TO_TRIAL_LINK,
  TRIAL_ABUNDANCE_SURVEY_LINK,
  WISHOCRACY_LINK,
  buttonShadow,
} from "@/components/org-links"

const INITIATIVES = [
  RIGHT_TO_TRIAL_LINK,
  ONE_PERCENT_TREATY_LINK,
  DECENTRALIZED_FDA_LINK,
  WISHOCRACY_LINK,
  COURT_OF_HUMANITY_LINK,
  TRIAL_ABUNDANCE_SURVEY_LINK,
]

export function AboutPage() {
  const address = formatNonprofitAddress()

  return (
    <Layout>
      <SectionContainer bgColor="background" borderPosition="bottom" padding="lg">
        <Container>
          <p className="mb-5 inline-block rotate-[-1deg] border-4 border-primary bg-brutal-yellow px-4 py-2 text-sm font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            About us
          </p>
          <h1 className="text-4xl font-black uppercase leading-[0.9] tracking-tighter sm:text-6xl md:text-7xl">
            Institute for Accelerated Medicine
          </h1>
          <p className="mt-7 max-w-4xl text-lg font-bold sm:text-xl md:text-2xl">
            We are a {NONPROFIT.incorporatedIn} 501(c)(3) nonprofit. We work so
            every patient can join a pragmatic clinical trial for a promising
            treatment, with a clinician, at a licensed center, and so every
            result is published.
          </p>
        </Container>
      </SectionContainer>

      <SectionContainer bgColor="cyan" borderPosition="bottom" padding="lg">
        <Container>
          <h2 className="text-3xl font-black uppercase tracking-tighter sm:text-5xl">
            Our initiatives
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {INITIATIVES.map((item) => (
              <OrgLinkCard item={item} key={item.title} size="large" />
            ))}
          </div>
        </Container>
      </SectionContainer>

      <SectionContainer bgColor="background" borderPosition="bottom" padding="lg">
        <Container>
          <h2 className="text-3xl font-black uppercase tracking-tighter sm:text-5xl">
            Our research
          </h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {RESEARCH_LINKS.map((item) => (
              <OrgLinkCard item={item} key={item.href} size="small" />
            ))}
          </div>
        </Container>
      </SectionContainer>

      <SectionContainer bgColor="yellow" borderPosition="bottom" padding="lg">
        <Container>
          <h2 className="text-3xl font-black uppercase tracking-tighter sm:text-5xl">
            Legal facts
          </h2>
          <Card className="mt-8 rounded-none border-4 border-primary bg-background p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:p-8">
            <dl className="grid gap-5 text-base font-bold sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="uppercase">Legal name</dt>
                <dd>{NONPROFIT.legalName}</dd>
              </div>
              <div>
                <dt className="uppercase">EIN</dt>
                <dd>{NONPROFIT.ein}</dd>
              </div>
              <div>
                <dt className="uppercase">Status</dt>
                <dd>501(c)(3) public charity, incorporated in {NONPROFIT.incorporatedIn}</dd>
              </div>
              {address ? (
                <div>
                  <dt className="uppercase">Mailing address</dt>
                  <dd><MailingAddress showRecipient={false} /></dd>
                </div>
              ) : null}
              <div>
                <dt className="uppercase">Contact</dt>
                <dd>
                  <a
                    className="underline decoration-2 underline-offset-4"
                    href="mailto:hello@acceleratedmedicine.org"
                  >
                    hello@acceleratedmedicine.org
                  </a>
                </dd>
              </div>
            </dl>
          </Card>
        </Container>
      </SectionContainer>

      <SectionContainer bgColor="background" borderPosition="bottom" padding="lg">
        <Container>
          <h2 className="text-3xl font-black uppercase tracking-tighter sm:text-5xl">
            Board of directors
          </h2>
          <div className="mt-8 grid max-w-3xl grid-cols-3 gap-3 sm:gap-5">
            {BOARD_MEMBERS.map((member) => (
              <Card
                key={member.name}
                className="overflow-hidden rounded-none border-4 border-primary bg-background py-0 gap-0 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
              >
                <div
                  className={`relative aspect-square w-full overflow-hidden border-b-4 border-primary ${member.photoClassName}`}
                >
                  <img
                    alt={member.photoAlt}
                    className="h-full w-full object-cover"
                    src={member.photoSrc}
                  />
                </div>
                <div className="p-2 sm:p-4">
                  <p className="text-[10px] font-black uppercase sm:text-xs">{member.role}</p>
                  <h3 className="mt-1 text-sm font-black uppercase leading-tight tracking-tight sm:text-lg">
                    {member.name}
                  </h3>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </SectionContainer>

      <SectionContainer bgColor="yellow" borderPosition="none" padding="lg">
        <Container className="text-center">
          <h2 className="text-4xl font-black uppercase tracking-tighter sm:text-5xl">
            See what the act would change
          </h2>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Button asChild className={`${buttonShadow} bg-brutal-pink`} size="lg">
              <Link href="/act">Read the act</Link>
            </Button>
            <Button
              asChild
              className={`${buttonShadow} bg-background text-foreground`}
              size="lg"
            >
              <Link href="/states">Find your state</Link>
            </Button>
          </div>
        </Container>
      </SectionContainer>
    </Layout>
  )
}
