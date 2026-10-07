import type { Metadata } from "next"

import { approveOrganizationAction } from "@/app/support/actions"
import { invalidLinkText, SupportLinkPage } from "@/components/support-link-page"
import { checkOrganizationLink } from "@/lib/support"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Approve listing | Care-Integrated Clinical Trials Initiative",
  robots: { index: false, follow: false },
}

/** Opened from the endorsement alert in the Institute's inbox. Approving lists the organization publicly. */
export default async function ApproveListingPage({ searchParams }: { searchParams: Promise<{ s?: string; t?: string }> }) {
  const { s = "", t = "" } = await searchParams
  const link = await checkOrganizationLink(s, t)

  if (link.status === "invalid") {
    return <SupportLinkPage status="invalid" title="This approval link does not work"><p>{invalidLinkText}</p></SupportLinkPage>
  }
  const { organization, website, logoUrl, state, contactName, contactEmail } = link.record
  const details = (
    <dl className="mx-auto grid max-w-sm gap-2 text-left text-sm">
      {logoUrl && (
        // A plain img: the logo lives on whatever host the organization gave.
        <img src={logoUrl} alt={`${organization} logo`} referrerPolicy="no-referrer" className="mx-auto mb-2 h-16 w-auto object-contain" />
      )}
      <div><dt className="inline font-medium text-foreground">Website: </dt><dd className="inline break-all"><a href={website} rel="noreferrer nofollow" target="_blank" className="text-primary hover:underline">{website}</a></dd></div>
      <div><dt className="inline font-medium text-foreground">Where it works: </dt><dd className="inline">{state}</dd></div>
      <div><dt className="inline font-medium text-foreground">Contact: </dt><dd className="inline break-all">{contactName}, {contactEmail}</dd></div>
    </dl>
  )
  if (link.status === "done") {
    return (
      <SupportLinkPage status="done" title={`${organization} is listed`}>
        <p>It appears on the supporters page and, if it works in one state, that state&apos;s page. We emailed {contactEmail}.</p>
      </SupportLinkPage>
    )
  }
  return (
    <SupportLinkPage status="pending" title={`List ${organization}?`} buttonLabel="Approve listing"
      action={approveOrganizationAction.bind(null, s, t)}>
      <p>Check that the organization is real and that the contact can speak for it. Approving lists its name, website,
        logo and state in public, and emails the contact.</p>
      {details}
    </SupportLinkPage>
  )
}
