import Layout from "../../components/layout"
import { Card } from "@/components/ui/card"
import { Container } from "@/components/ui/container"
import { SectionContainer } from "@/components/ui/section-container"
import { getSiteConfig } from "@/lib/site-config"

export default function AboutPage() {
  const config = getSiteConfig()
  return (
    <Layout>
      <SectionContainer bgColor="foreground" borderPosition="none" padding="lg">
        <Container>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase leading-none mb-8">
            ABOUT <span className="text-brutal-yellow">{config.name}</span>
          </h1>
          <Card className="border-4 border-primary p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-lg font-bold">
              Clinical encyclopedia for conditions, treatments, and trial evidence.
              Campaign votes and fundraising live on warondisease.org.
            </p>
          </Card>
        </Container>
      </SectionContainer>
    </Layout>
  )
}
