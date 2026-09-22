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

const buttonShadow =
  "rounded-none border-4 border-primary px-7 py-6 text-base font-black uppercase shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]"

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
            Who we are
          </h2>
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <Card className="rounded-none border-4 border-primary bg-background p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:p-8">
              <p className="text-lg font-bold leading-relaxed">
                {NONPROFIT.legalName} is the legal home of the Right to Trial
                Initiative. The {NONPROFIT.registeredDba} is our registered DBA.
                We also operate as the {NONPROFIT.publicBrand}.
              </p>
              <p className="mt-5 text-lg font-bold leading-relaxed">
                Right to Trial means patients can reach treatments, providers can
                deliver them in ordinary care, and the public can see which
                treatments work. Montana licensed experimental treatment centers.
                We help other states copy that path and publish comparable
                results.
              </p>
            </Card>
            <Card className="rounded-none border-4 border-primary bg-brutal-yellow p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:p-8">
              <p className="font-black uppercase">Legal facts</p>
              <dl className="mt-4 space-y-3 text-base font-bold">
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
                    <dd>{address}</dd>
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
          </div>
        </Container>
      </SectionContainer>

      <SectionContainer bgColor="background" borderPosition="bottom" padding="lg">
        <Container>
          <h2 className="text-3xl font-black uppercase tracking-tighter sm:text-5xl">
            Board
          </h2>
          <p className="mt-4 max-w-3xl text-lg font-bold">
            These three directors steward the Institute as a public charity.
            They set strategy, keep the books, and publish the work.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {BOARD_MEMBERS.map((member) => (
              <Card
                key={member.name}
                className="overflow-hidden rounded-none border-4 border-primary bg-background py-0 gap-0 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
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
                <div className="p-5">
                  <p className="text-xs font-black uppercase">{member.role}</p>
                  <h3 className="mt-2 text-2xl font-black uppercase leading-none tracking-tighter">
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
            Help bring Right to Trial to your state
          </h2>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Button asChild className={`${buttonShadow} bg-brutal-pink`} size="lg">
              <Link href="/#state-support">Take the survey</Link>
            </Button>
            <Button
              asChild
              className={`${buttonShadow} bg-background text-foreground`}
              size="lg"
            >
              <Link href="/model-act">Read the proposed law</Link>
            </Button>
          </div>
        </Container>
      </SectionContainer>
    </Layout>
  )
}
