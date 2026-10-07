import type { Metadata } from "next"

import { LegalContact, LegalList, LegalPage, LegalSection } from "@/components/legal-page"
import { SITE } from "@/lib/site-settings"

export const metadata: Metadata = {
  alternates: { canonical: "https://acceleratedmedicine.org/privacy" },
}

// The text this site showed when it used the shared site-kit privacy page: a site without accounts that takes
// donations.
export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated="August 2026">
      <LegalSection title="1. Introduction">
        <p>
          {SITE.legalEntityName} operates {SITE.websiteLabel}. This policy explains what information the website
          collects, why it uses that information, and the choices available to you.
        </p>
      </LegalSection>

      <LegalSection title="2. Information we collect">
        <LegalList>
          <li>Contact details you provide, such as your name and email address.</li>
          <li>Messages, forms, and other content you choose to submit.</li>
          <li>Basic technical data, such as browser type, device information, IP address, and request logs.</li>
          <li>Usage and analytics events when analytics are enabled.</li>
          <li>Donation status and transaction identifiers. The payment processor receives payment-card details.</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="3. How we use information">
        <LegalList>
          <li>Provide, secure, maintain, and improve the website.</li>
          <li>Save your choices and perform actions you request.</li>
          <li>Communicate with you about your submissions and optional updates.</li>
          <li>Measure aggregate usage and research results.</li>
          <li>Prevent fraud, abuse, and security incidents.</li>
          <li>Comply with legal obligations.</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="4. When we share information">
        <p>We may share information:</p>
        <LegalList>
          <li>When you make information public or ask us to share it.</li>
          <li>With service providers that host, secure, analyze, email, or process payments for the website.</li>
          <li>In aggregated or de-identified form that does not reasonably identify you.</li>
          <li>When law requires it or when necessary to protect rights, safety, and security.</li>
        </LegalList>
        <p>We do not sell your personal information.</p>
      </LegalSection>

      <LegalSection title="5. Cookies and analytics">
        <p>
          The website may use cookies or similar storage for authentication, preferences, security, and analytics.
          Browser settings can limit cookies, but some features may stop working.
        </p>
      </LegalSection>

      <LegalSection title="6. Retention and security">
        <p>
          We retain information while it serves the purposes described here, supports legitimate records, or satisfies
          legal requirements. We use reasonable technical and organizational safeguards, but no internet service can
          guarantee absolute security.
        </p>
      </LegalSection>

      <LegalSection title="7. Your choices and rights">
        <p>
          Depending on your location, you may ask to access, correct, delete, restrict, or export personal information.
          You may also unsubscribe from optional email. Contact us to make a request. We may need to verify your
          identity before completing it.
        </p>
      </LegalSection>

      <LegalSection title="8. Children">
        <p>
          The website is not directed to children under 13, and we do not knowingly collect their personal information.
          Contact us if you believe a child submitted personal information.
        </p>
      </LegalSection>

      <LegalSection title="9. International processing">
        <p>
          Information may be processed in countries with different data-protection laws. Where required, we use
          appropriate safeguards for international transfers.
        </p>
      </LegalSection>

      <LegalSection title="10. Policy changes">
        <p>
          We may update this policy. We will publish the current version here and change the date above when we make a
          material revision.
        </p>
      </LegalSection>

      <LegalSection title="11. Contact">
        <LegalContact />
      </LegalSection>
    </LegalPage>
  )
}
