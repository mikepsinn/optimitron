import Link from "next/link"
import Layout from "@/components/layout"
import { Button } from "@/components/ui/button"
import { getPageMetadata } from "@optimitron/site-kit/lib/nav-items"
import { ROUTES } from "@optimitron/site-kit/lib/routes"

export function generateMetadata() {
  return getPageMetadata("wishocracyAbout")
}

export default function AboutPage() {
  return (
    <Layout>
      <main className="mx-auto max-w-3xl space-y-10 px-4 py-12">
        <section>
          <h1 className="mb-4 text-4xl font-black uppercase sm:text-5xl">About Wishocracy</h1>
          <p className="text-xl leading-relaxed">
            What should public money pay for? Wishocracy lets you set your priorities and compare them with government spending.
          </p>
        </section>
        <section>
          <h2 className="mb-4 text-2xl font-black uppercase">Two priorities at a time</h2>
          <p className="leading-relaxed">
            Choose the spending areas you want to fund. Then divide a hypothetical $100 between two areas at a time.
            Your choices become a percentage allocation you can inspect and revise on your dashboard.
          </p>
        </section>
        <section className="space-y-4">
          <h2 className="text-2xl font-black uppercase">How to read the results</h2>
          <p className="leading-relaxed">
            For each participant, we add the amounts assigned to each area across their saved comparisons and scale the total to 100%.
            The public results average these individual allocations, giving each participant equal weight and using their latest answer to each pair.
            Areas without an assigned amount contribute zero to that participant's allocation.
          </p>
          <p className="leading-relaxed">
            The government bars show published US annual budgets scaled across the same spending areas.
            Both sets of percentages describe the areas shown, not the entire federal budget.
          </p>
          <Link href={ROUTES.wishocracyResults} className="inline-block font-bold underline">Explore the results</Link>
        </section>
        <section className="space-y-4">
          <h2 className="text-2xl font-black uppercase">The research</h2>
          <p className="leading-relaxed">
            The Wishocracy paper explores how pairwise preferences could guide public budgets and measure how closely governments follow citizens' priorities.
            It describes the broader research framework; this site's results use the calculation explained above.
          </p>
          <a href="https://wishocracy.warondisease.org" className="inline-block font-bold underline">
            Read the Wishocracy paper
          </a>
        </section>
        <Button asChild><Link href={ROUTES.home}>Set your priorities</Link></Button>
      </main>
    </Layout>
  )
}
