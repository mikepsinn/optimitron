import { Container } from "@optimitron/neobrutalist-ui/ui/container"
import { SectionContainer } from "@optimitron/neobrutalist-ui/ui/section-container"

import { getContactInfo, getSiteConfig } from "../lib/site-config"
import { Layout } from "./layout"

export function ContactPage() {
  const config = getSiteConfig()
  const contact = getContactInfo()
  const subject = encodeURIComponent(`${config.title} question`)

  return (
    <Layout>
      <SectionContainer bgColor="background" borderPosition="none" padding="lg" className="min-h-screen">
        <Container size="md" className="text-center">
          <h1 className="mb-6 text-4xl font-black uppercase sm:text-5xl md:text-6xl">Contact {config.name}</h1>
          <p className="mx-auto mb-8 max-w-2xl text-xl font-bold">
            Send your question, correction, partnership idea, or media request. A human will read it.
          </p>
          <a
            href={`mailto:${contact.email}?subject=${subject}`}
            className="inline-block border-4 border-primary bg-brutal-pink px-8 py-4 text-xl font-black uppercase text-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
          >
            Email {contact.email}
          </a>
        </Container>
      </SectionContainer>
    </Layout>
  )
}

export default ContactPage
