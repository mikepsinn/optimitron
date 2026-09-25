import FaqPage from "@optimitron/site-kit/components/faq-page"
import { JsonLdScript } from "@optimitron/site-kit/components/site/JsonLdScript"
import { getSiteConfig } from "@optimitron/site-kit/lib/site-config"
import { buildFaqStructuredData } from "@/lib/structured-data"

export default function WarOnDiseaseFaqPage() {
  // FaqPage renders this same config, so the FAQPage entries match the page.
  const faq = getSiteConfig().faq

  return (
    <>
      {faq ? <JsonLdScript data={buildFaqStructuredData(faq)} /> : null}
      <FaqPage />
    </>
  )
}
