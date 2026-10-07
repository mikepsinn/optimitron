"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { approveOrganization, confirmSupporter } from "@/lib/support"

const linkQuery = (id: string, token: string) => new URLSearchParams({ s: id, t: token }).toString()

/** The Confirm button. The link only opens the page, because email scanners open links on their own. */
export async function confirmSupporterAction(id: string, token: string) {
  await confirmSupporter(id, token)
  revalidatePath("/supporters")
  redirect(`/support/confirm?${linkQuery(id, token)}`)
}

/** The Approve listing button. The organization then appears on /supporters and its state page. */
export async function approveOrganizationAction(id: string, token: string) {
  await approveOrganization(id, token)
  revalidatePath("/supporters")
  revalidatePath("/states/[state]", "page")
  redirect(`/support/approve?${linkQuery(id, token)}`)
}
