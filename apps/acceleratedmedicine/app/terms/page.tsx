import type { Metadata } from "next"

import { LegalContact, LegalList, LegalPage, LegalSection } from "@/components/legal-page"
import { SITE } from "@/lib/site-settings"

export const metadata: Metadata = {
  alternates: { canonical: "https://acceleratedmedicine.org/terms" },
}

// The text this site showed when it used the shared site-kit terms page. Only "The service" changed: it now
// names the Institute, which runs the initiative.
export default function TermsPage() {
  const entity = SITE.legalEntityName

  return (
    <LegalPage title="Terms of Service" lastUpdated="August 2026">
      <LegalSection title="1. Acceptance of terms">
        <p>
          By using {SITE.websiteLabel}, you agree to these terms. If you do not agree, do not use the website. {entity}{" "}
          may update these terms by publishing a revised version here.
        </p>
      </LegalSection>

      <LegalSection title="2. The service">
        <p>
          The {entity} runs the {SITE.title} and provides the information and interactive features described on this
          website. Features may change as the service develops.
        </p>
        <LegalList>
          <li>Make voluntary donations through a payment processor.</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="3. Acceptable use">
        <p>Do not use the website to:</p>
        <LegalList>
          <li>Break the law or violate another person&apos;s rights.</li>
          <li>Submit false, deceptive, abusive, or malicious content.</li>
          <li>Interfere with the website, its security, or another person&apos;s access.</li>
          <li>Collect personal information without permission.</li>
          <li>Use automated access that overloads or damages the service.</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="4. Your content">
        <p>
          You keep ownership of content you submit. You give {entity} permission to store, process, display, and share
          that content only as needed to operate the service and honor the visibility choices you make. You must have
          the right to submit your content.
        </p>
      </LegalSection>

      <LegalSection title="5. Donations">
        <p>
          Donations are voluntary and generally nonrefundable. Any tax treatment depends on the receiving organization,
          applicable law, and your circumstances. A payment processor handles payment details under its own terms.
        </p>
      </LegalSection>

      <LegalSection title="Intellectual property">
        <p>
          The website&apos;s software, design, trademarks, and original content belong to their respective owners.
          These terms do not transfer those rights to you. Links and quotations may have separate licenses or source
          terms.
        </p>
      </LegalSection>

      <LegalSection title="No professional advice">
        <p>
          Website content is for information, research, and public participation. It is not medical, legal, financial,
          or other professional advice. Consult a qualified professional before making decisions that require
          professional judgment.
        </p>
      </LegalSection>

      <LegalSection title="Disclaimers and liability">
        <p>
          The service is provided on an &quot;as is&quot; and &quot;as available&quot; basis to the extent permitted by
          law. We do not promise uninterrupted access or error-free content. To the extent permitted by law, {entity} is
          not liable for indirect, incidental, special, consequential, or punitive damages arising from your use of the
          service.
        </p>
      </LegalSection>

      <LegalSection title="Governing law and severability">
        <p>
          Applicable law governs these terms. If one provision is unenforceable, the remaining provisions continue to
          apply.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <LegalContact />
      </LegalSection>
    </LegalPage>
  )
}
