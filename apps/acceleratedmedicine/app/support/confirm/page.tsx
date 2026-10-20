import type { Metadata } from "next"

import { confirmSupporterAction } from "@/app/support/actions"
import { invalidLinkText, SupportLinkPage } from "@/components/support-link-page"
import { checkSupporterLink } from "@/lib/support"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Confirm you're joining | Care-Integrated Clinical Trials Initiative",
  robots: { index: false, follow: false },
}

export default async function ConfirmSupportPage({ searchParams }: { searchParams: Promise<{ s?: string; t?: string; failed?: string }> }) {
  const { s = "", t = "", failed } = await searchParams
  const link = await checkSupporterLink(s, t)

  if (link.status === "invalid") {
    return <SupportLinkPage status="invalid" title="This confirmation link does not work"><p>{invalidLinkText}</p></SupportLinkPage>
  }
  if (link.status === "done") {
    return (
      <SupportLinkPage status="done" title={`Thank you, ${link.record.firstName}`}>
        <p>You&apos;re a member of the Care to Cures Alliance.</p>
        {link.record.updates && <p>We&apos;ll email {link.record.email} occasional updates. Every email has an unsubscribe link.</p>}
      </SupportLinkPage>
    )
  }
  return (
    <SupportLinkPage status="pending" title="Confirm you're joining" buttonLabel="Confirm"
      action={confirmSupporterAction.bind(null, s, t)} failed={failed === "1"}>
      <p>{link.record.firstName}, click Confirm to join the Care to Cures Alliance.</p>
    </SupportLinkPage>
  )
}
