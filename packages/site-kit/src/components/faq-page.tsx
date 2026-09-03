import { Card } from "@optimitron/neobrutalist-ui/ui/card";
import { Container } from "@optimitron/neobrutalist-ui/ui/container";
import { SectionContainer } from "@optimitron/neobrutalist-ui/ui/section-container";

import {
  getResolvedNavItem,
  getSiteConfig,
  SHOW_DONATE_LINKS,
} from "../lib/site-config";
import { ROUTES } from "../lib/routes";
import { Layout } from "./layout";

export function FaqPage() {
  const faq = getSiteConfig().faq;
  const researchHref = getResolvedNavItem("research").path;

  if (!faq) {
    return null;
  }

  return (
    <Layout>
      <main className="min-h-screen bg-background">
        <SectionContainer bgColor="pink" borderPosition="bottom" padding="lg">
          <Container size="md">
            <h1 className="mb-6 text-center text-4xl font-black uppercase sm:text-5xl md:text-6xl lg:text-7xl">
              {faq.title}
            </h1>
            <p className="text-center text-xl font-bold md:text-2xl">
              {faq.subtitle}
            </p>
          </Container>
        </SectionContainer>

        <SectionContainer
          bgColor="background"
          borderPosition="none"
          padding="lg"
        >
          <Container size="md" className="space-y-16">
            {faq.sections.map((section) => (
              <section key={section.category}>
                <h2 className="mb-8 border-b-4 border-primary pb-4 text-3xl font-black uppercase text-brutal-pink md:text-4xl">
                  {section.category}
                </h2>
                <div className="space-y-8">
                  {section.questions.map((item) => (
                    <Card
                      key={item.q}
                      className="border-4 border-primary p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
                    >
                      <h3 className="mb-4 text-xl font-black uppercase text-brutal-pink md:text-2xl">
                        {item.q}
                      </h3>
                      <p className="text-lg leading-relaxed">{item.a}</p>
                    </Card>
                  ))}
                </div>
              </section>
            ))}
          </Container>
        </SectionContainer>

        {faq.ctaSection ? (
          <SectionContainer bgColor="yellow" borderPosition="top" padding="lg">
            <Container size="md" className="text-center">
              <h2 className="mb-6 text-3xl font-black uppercase md:text-4xl">
                {faq.ctaSection.title}
              </h2>
              <p className="mb-8 text-xl font-bold">
                {faq.ctaSection.subtitle}
              </p>
              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                {faq.ctaSection.buttons
                  .filter(
                    (button) =>
                      SHOW_DONATE_LINKS || button.href !== ROUTES.donate,
                  )
                  .map((button) => (
                  <a
                    key={`${button.href}:${button.label}`}
                    href={
                      button.href === ROUTES.research
                        ? researchHref
                        : button.href
                    }
                    className={
                      button.variant === "secondary"
                        ? "border-4 border-primary bg-background px-8 py-4 text-lg font-black uppercase shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                        : "border-4 border-primary bg-brutal-pink px-8 py-4 text-lg font-black uppercase text-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                    }
                  >
                    {button.label}
                  </a>
                ))}
              </div>
            </Container>
          </SectionContainer>
        ) : null}
      </main>
    </Layout>
  );
}

export default FaqPage;
