"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { approveOrganization, confirmSupporter } from "@/lib/support"

const linkQuery = (id: string, token: string) => new URLSearchParams({ s: id, t: token }).toString()

// A failure (usually an email that did not send) returns to the same page, which says to try again.
async function attempt(step: () => Promise<unknown>): Promise<string> {
  try {
    await step()
    return ""
  } catch (error) {
    console.error("Support link step failed", error)
    return "&failed=1"
  }
}

/** The Confirm button. The link only opens the page, because email scanners open links on their own. */
export async function confirmSupporterAction(id: string, token: string) {
  const failed = await attempt(() => confirmSupporter(id, token))
  revalidatePath("/supporters")
  redirect(`/support/confirm?${linkQuery(id, token)}${failed}`)
}

/** The Approve listing button. The organization then appears on /supporters and its state's page. */
export async function approveOrganizationAction(id: string, token: string) {
  const failed = await attempt(() => approveOrganization(id, token))
  revalidatePath("/supporters")
  revalidatePath("/states/[state]", "page")
  revalidatePath("/montana")
  redirect(`/support/approve?${linkQuery(id, token)}${failed}`)
}
