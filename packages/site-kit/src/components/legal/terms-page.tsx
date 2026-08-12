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

export function TermsPage() {
  const config = getSiteConfig()
  const contactInfo = getContactInfo()
  const legalEntityName = getLegalEntityName()
  const features = new Set(config.enabledFeatures)
  const hasAccounts = [SITE_FEATURES.PROFILE, SITE_FEATURES.REFERRALS, SITE_FEATURES.WISHOCRACY]
    .some((feature) => features.has(feature))

  return (
    <Layout>
      <SectionContainer bgColor="background" borderPosition="none" padding="lg" className="min-h-screen">
        <Container size="md">
          <h1 className="mb-8 text-center text-4xl font-black uppercase sm:text-5xl md:text-6xl lg:text-7xl">
            Terms of Service
          </h1>
          <p className="mx-auto mb-12 max-w-2xl text-center text-lg">Last updated: August 2026</p>

          <Card className="border-4 border-primary p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="space-y-8 text-foreground">
              <section>
                <h2 className={headingClass}>1. Acceptance of terms</h2>
                <p className={paragraphClass}>
                  By using {contactInfo.websiteLabel}, you agree to these terms. If you do not agree, do not use the
                  website. {legalEntityName} may update these terms by publishing a revised version here.
                </p>
              </section>

              <section>
                <h2 className={headingClass}>2. The service</h2>
                <p className={paragraphClass}>
                  {config.title} provides the information and interactive features described on this website.
                  Features may change as the service develops.
                </p>
                <ul className="ml-4 mt-4 list-inside list-disc space-y-2">
                  {features.has(SITE_FEATURES.WISHOCRACY) ? <li>Compare priorities and save budget allocations.</li> : null}
                  {features.has(SITE_FEATURES.SURVEY) ? <li>Answer surveys and review aggregate results.</li> : null}
                  {features.has(SITE_FEATURES.VOTING) ? <li>Record and share your answer to a public policy question.</li> : null}
                  {features.has(SITE_FEATURES.CONDITIONS) || features.has(SITE_FEATURES.TREATMENTS) ? (
                    <li>Read information about health conditions, treatments, and clinical research.</li>
                  ) : null}
                  {features.has(SITE_FEATURES.DONATE) ? <li>Make voluntary donations through a payment processor.</li> : null}
                </ul>
              </section>

              {hasAccounts ? (
                <section>
                  <h2 className={headingClass}>3. Accounts</h2>
                  <p className={paragraphClass}>
                    You must provide accurate account information and protect access to your account. Tell us promptly
                    if you believe someone used your account without permission. You are responsible for activity under
                    your account unless applicable law says otherwise.
                  </p>
                </section>
              ) : null}

              <section>
                <h2 className={headingClass}>{hasAccounts ? "4" : "3"}. Acceptable use</h2>
                <p className={paragraphClass}>Do not use the website to:</p>
                <ul className="ml-4 mt-4 list-inside list-disc space-y-2">
                  <li>Break the law or violate another person&apos;s rights.</li>
                  <li>Submit false, deceptive, abusive, or malicious content.</li>
                  <li>Interfere with the website, its security, or another person&apos;s access.</li>
                  <li>Collect personal information without permission.</li>
                  <li>Use automated access that overloads or damages the service.</li>
                </ul>
              </section>

              <section>
                <h2 className={headingClass}>{hasAccounts ? "5" : "4"}. Your content</h2>
                <p className={paragraphClass}>
                  You keep ownership of content you submit. You give {legalEntityName} permission to store, process,
                  display, and share that content only as needed to operate the service and honor the visibility choices
                  you make. You must have the right to submit your content.
                </p>
              </section>

              {features.has(SITE_FEATURES.DONATE) ? (
                <section>
                  <h2 className={headingClass}>{hasAccounts ? "6" : "5"}. Donations</h2>
                  <p className={paragraphClass}>
                    Donations are voluntary and generally nonrefundable. Any tax treatment depends on the receiving
                    organization, applicable law, and your circumstances. A payment processor handles payment details
                    under its own terms.
                  </p>
                </section>
              ) : null}

              <section>
                <h2 className={headingClass}>Intellectual property</h2>
                <p className={paragraphClass}>
                  The website&apos;s software, design, trademarks, and original content belong to their respective owners.
                  These terms do not transfer those rights to you. Links and quotations may have separate licenses or
                  source terms.
                </p>
              </section>

              <section>
                <h2 className={headingClass}>No professional advice</h2>
                <p className={paragraphClass}>
                  Website content is for information, research, and public participation. It is not medical, legal,
                  financial, or other professional advice. Consult a qualified professional before making decisions
                  that require professional judgment.
                </p>
              </section>

              <section>
                <h2 className={headingClass}>Disclaimers and liability</h2>
                <p className={paragraphClass}>
                  The service is provided on an &quot;as is&quot; and &quot;as available&quot; basis to the extent permitted by law.
                  We do not promise uninterrupted access or error-free content. To the extent permitted by law,
                  {legalEntityName} is not liable for indirect, incidental, special, consequential, or punitive damages
                  arising from your use of the service.
                </p>
              </section>

              <section>
                <h2 className={headingClass}>Governing law and severability</h2>
                <p className={paragraphClass}>
                  Applicable law governs these terms. If one provision is unenforceable, the remaining provisions
                  continue to apply.
                </p>
              </section>

              <section>
                <h2 className={headingClass}>Contact</h2>
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

export default TermsPage
