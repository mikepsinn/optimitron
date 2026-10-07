import Link from "next/link"

import { Button } from "@optimitron/neobrutalist-ui/ui/button"

import { SectionHeading } from "@/components/section-heading"
import { SupportingOrganizations } from "@/components/supporting-organizations"
import type { ListedOrganization } from "@/lib/support-store"

/** A state's approved organizations, or an invitation to endorse while it has none. Montana's own page uses it too. */
export function StateOrganizations({ name, organizations }: { name: string; organizations: ListedOrganization[] }) {
  return (
    <section aria-labelledby="partner-heading" className="border-t py-12 md:py-16">
      <SectionHeading id="partner-heading"
        title={organizations.length > 0 ? `Organizations in ${name} that support the initiative` : `Organizations in ${name}`}>
        {organizations.length > 0
          ? `These ${name} organizations endorse the Care-Integrated Clinical Trials Initiative.`
          : `Patient groups, clinics, hospitals and researchers in ${name} can endorse the Care-Integrated Clinical Trials Initiative, or partner with us.`}
      </SectionHeading>
      {organizations.length > 0 && (
        <div className="mt-8"><SupportingOrganizations organizations={organizations} showState={false} /></div>
      )}
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/support#organization">Endorse as an organization</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/contact">Partner with us</Link>
        </Button>
      </div>
    </section>
  )
}
