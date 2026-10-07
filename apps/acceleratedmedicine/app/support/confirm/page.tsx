import type { Metadata } from "next"

import { confirmSupporterAction } from "@/app/support/actions"
import { invalidLinkText, SupportLinkPage } from "@/components/support-link-page"
import { checkSupporterLink } from "@/lib/support"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Confirm your support | Care-Integrated Clinical Trials Initiative",
  robots: { index: false, follow: false },
}

export default async function ConfirmSupportPage({ searchParams }: { searchParams: Promise<{ s?: string; t?: string }> }) {
  const { s = "", t = "" } = await searchParams
  const link = await checkSupporterLink(s, t)

  if (link.status === "invalid") {
    return <SupportLinkPage status="invalid" title="This confirmation link does not work"><p>{invalidLinkText}</p></SupportLinkPage>
  }
  if (link.status === "done") {
    return (
      <SupportLinkPage status="done" title={`Thank you, ${link.record.name}`}>
        <p>Your support for the Care-Integrated Clinical Trials Initiative is confirmed.</p>
        {link.record.updates && <p>We&apos;ll email {link.record.email} occasional updates. Every email has an unsubscribe link.</p>}
      </SupportLinkPage>
    )
  }
  return (
    <SupportLinkPage status="pending" title="Confirm your support" buttonLabel="Confirm"
      action={confirmSupporterAction.bind(null, s, t)}>
      <p>{link.record.name}, click Confirm to add your support for the Care-Integrated Clinical Trials Initiative.</p>
    </SupportLinkPage>
  )
}
