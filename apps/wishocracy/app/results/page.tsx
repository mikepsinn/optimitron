import Link from "next/link"
import Layout from "@/components/layout"
import { Button } from "@/components/ui/button"
import { BudgetAllocationBars } from "@/components/wishocracy/BudgetAllocationBars"
import { getWishocracyVisualFixture } from "@/lib/wishocracy-visual"
import { getPageMetadata } from "@optimitron/site-kit/lib/nav-items"
import { ROUTES } from "@optimitron/site-kit/lib/routes"

export function generateMetadata() {
  return getPageMetadata("wishocracyResults")
}

export default async function ResultsPage({ searchParams }: {
  searchParams?: Promise<{ visual?: string }>
}) {
  const fixture = getWishocracyVisualFixture((await searchParams)?.visual)
  return (
    <Layout>
      <main className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="mb-4 text-4xl font-black uppercase sm:text-5xl">Wishocracy results</h1>
        <p className="mb-6 max-w-3xl text-lg">
          See how people would allocate public money, alongside current US government allocations across the same spending areas.
        </p>
        <div className="mb-8 flex flex-wrap items-center gap-5">
          <Button asChild><Link href={ROUTES.home}>Add your priorities</Link></Button>
          <Link href={ROUTES.about} className="font-bold underline">How the results work</Link>
        </div>
        <BudgetAllocationBars initialResults={fixture?.results} />
      </main>
    </Layout>
  )
}
