import { Card } from "@optimitron/neobrutalist-ui/ui/card"
import { Container } from "@optimitron/neobrutalist-ui/ui/container"
import { SectionContainer } from "@optimitron/neobrutalist-ui/ui/section-container"

import {
  getContactInfo,
  getLegalEntityName,
  getSiteConfig,
  SITE_FEATURES,
} from "../../lib/site-config"
import { Layout } from "../layout"

const headingClass = "mb-4 text-2xl font-black uppercase text-brutal-pink"
const paragraphClass = "leading-relaxed"

export function PrivacyPage() {
  const config = getSiteConfig()
  const contactInfo = getContactInfo()
  const legalEntityName = getLegalEntityName()
  const features = new Set(config.enabledFeatures)

  return (
    <Layout>
      <SectionContainer bgColor="background" borderPosition="none" padding="lg" className="min-h-screen">
        <Container size="md">
          <h1 className="mb-8 text-center text-4xl font-black uppercase sm:text-5xl md:text-6xl lg:text-7xl">
            Privacy Policy
          </h1>
          <p className="mx-auto mb-12 max-w-2xl text-center text-lg">Last updated: August 2026</p>

          <Card className="border-4 border-primary p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="space-y-8 text-foreground">
              <section>
                <h2 className={headingClass}>1. Introduction</h2>
                <p className={paragraphClass}>
                  {legalEntityName} operates {contactInfo.websiteLabel}. This policy explains what information the
                  website collects, why it uses that information, and the choices available to you.
                </p>
              </section>

              <section>
                <h2 className={headingClass}>2. Information we collect</h2>
                <ul className="ml-4 list-inside list-disc space-y-2">
                  <li>Account details you provide, such as your name and email address.</li>
                  {features.has(SITE_FEATURES.WISHOCRACY) ? (
                    <li>Your priority comparisons, category choices, and saved allocations.</li>
                  ) : null}
                  {features.has(SITE_FEATURES.SURVEY) ? <li>Your survey responses and optional profile details.</li> : null}
                  {features.has(SITE_FEATURES.VOTING) ? (
                    <li>Your answer, referral information, and the visibility choices attached to your answer.</li>
                  ) : null}
                  <li>Messages, forms, and other content you choose to submit.</li>
                  <li>Basic technical data, such as browser type, device information, IP address, and request logs.</li>
                  <li>Usage and analytics events when analytics are enabled.</li>
                  {features.has(SITE_FEATURES.DONATE) ? (
                    <li>Donation status and transaction identifiers. The payment processor receives payment-card details.</li>
                  ) : null}
                </ul>
              </section>

              <section>
                <h2 className={headingClass}>3. How we use information</h2>
                <ul className="ml-4 list-inside list-disc space-y-2">
                  <li>Provide, secure, maintain, and improve the website.</li>
                  <li>Save your choices and perform actions you request.</li>
                  <li>Communicate with you about your account, submissions, and optional updates.</li>
                  <li>Measure aggregate usage and research results.</li>
                  <li>Prevent fraud, abuse, and security incidents.</li>
                  <li>Comply with legal obligations.</li>
                </ul>
              </section>

              <section>
                <h2 className={headingClass}>4. When we share information</h2>
                <p className={paragraphClass}>We may share information:</p>
                <ul className="ml-4 mt-4 list-inside list-disc space-y-2">
                  <li>When you make information public or ask us to share it.</li>
                  <li>With service providers that host, secure, analyze, email, or process payments for the website.</li>
                  <li>In aggregated or de-identified form that does not reasonably identify you.</li>
                  <li>When law requires it or when necessary to protect rights, safety, and security.</li>
                </ul>
                <p className="mt-4 leading-relaxed">We do not sell your personal information.</p>
              </section>

              <section>
                <h2 className={headingClass}>5. Cookies and analytics</h2>
                <p className={paragraphClass}>
                  The website may use cookies or similar storage for authentication, preferences, security, and
                  analytics. Browser settings can limit cookies, but some features may stop working.
                </p>
              </section>

              <section>
                <h2 className={headingClass}>6. Retention and security</h2>
                <p className={paragraphClass}>
                  We retain information while it serves the purposes described here, supports legitimate records, or
                  satisfies legal requirements. We use reasonable technical and organizational safeguards, but no
                  internet service can guarantee absolute security.
                </p>
              </section>

              <section>
                <h2 className={headingClass}>7. Your choices and rights</h2>
                <p className={paragraphClass}>
                  Depending on your location, you may ask to access, correct, delete, restrict, or export personal
                  information. You may also unsubscribe from optional email. Contact us to make a request. We may need
                  to verify your identity before completing it.
                </p>
              </section>

              <section>
                <h2 className={headingClass}>8. Children</h2>
                <p className={paragraphClass}>
                  The website is not directed to children under 13, and we do not knowingly collect their personal
                  information. Contact us if you believe a child submitted personal information.
                </p>
              </section>

              <section>
                <h2 className={headingClass}>9. International processing</h2>
                <p className={paragraphClass}>
                  Information may be processed in countries with different data-protection laws. Where required, we use
                  appropriate safeguards for international transfers.
                </p>
              </section>

              <section>
                <h2 className={headingClass}>10. Policy changes</h2>
                <p className={paragraphClass}>
                  We may update this policy. We will publish the current version here and change the date above when we
                  make a material revision.
                </p>
              </section>

              <section>
                <h2 className={headingClass}>11. Contact</h2>
                <div className="mt-4 border-4 border-primary bg-brutal-yellow p-4">
                  <p className="font-bold">{legalEntityName}</p>
                  <p>Email: {contactInfo.email}</p>
                  <p>Website: {contactInfo.websiteLabel}</p>
                </div>
              </section>
            </div>
          </Card>
        </Container>
      </SectionContainer>
    </Layout>
  )
}

export default PrivacyPage
