import type { Metadata } from "next"
import Layout from "@/components/layout"
import { TreatyReminderComposer } from "@/components/landing/treaty-reminder-composer"
import { OverdueSignerList } from "@/components/tasks/overdue-signer-list"
import { getTreatySignerTasks } from "@/lib/tasks/treaty-signers.server"

export const dynamic = "force-dynamic"

const HEADLINE = "President Management System"

const MISSION_STATEMENT =
  "You give these people $37 trillion a year. Their job is to promote the general welfare which means increasing median health and wealth. Your job is to remind them that this is their job. Please do your job by clicking the remind button."

export const metadata: Metadata = {
  title: "Remind Presidents",
  description:
    "You pay these people $36.5 trillion a year to promote the general welfare — i.e. maximize median healthy life years and median after-tax inflation-adjusted income. Track who signed the 1% Treaty and remind the overdue ones.",
}

/**
 * `/employees` — the president management system.
 *
 * Optimitron builds this page out of `getTasksPageData`, which loads the whole
 * task tree so the generic task table can rank, filter, fund, and claim. None
 * of that is reachable from the campaign site, so this reads the two rows it
 * actually shows through `getTreatySignerTasks` instead: one indexed range
 * scan over the signer task-key prefix.
 *
 * The render instant is passed down so the server markup and the client's first
 * render agree; the list swaps in the visitor's own clock after hydration,
 * because the server's date and theirs can straddle a due date.
 */
export default async function PresidentManagementPage() {
  const signerTasks = await getTreatySignerTasks()

  return (
    <Layout>
      <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-10">
        <header className="space-y-4 text-center">
          <h1 className="text-4xl font-black uppercase leading-none sm:text-5xl md:text-6xl">
            {HEADLINE}
          </h1>
          <p className="mx-auto max-w-3xl text-base font-bold sm:text-lg">
            {MISSION_STATEMENT}
          </p>
        </header>

        <div className="mx-auto w-full max-w-2xl text-left">
          <TreatyReminderComposer surface="employees_page" />
        </div>

        <OverdueSignerList serverNowMs={Date.now()} signerTasks={signerTasks} />
      </div>
    </Layout>
  )
}
