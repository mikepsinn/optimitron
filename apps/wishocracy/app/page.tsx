import Layout from "../components/layout"
import WishocracySection from "@/components/wishocracy/wishocracy-section"
import { WishocracyCompletionCard } from "@/components/wishocracy/WishocracyCompletionCard"
import { BudgetAllocationBars } from "@/components/wishocracy/BudgetAllocationBars"
import { getWishocracyVisualFixture } from "@/lib/wishocracy-visual"

export default async function HomePage({ searchParams }: {
  searchParams?: Promise<{ visual?: string }>
}) {
  const visual = (await searchParams)?.visual
  const fixture = visual === "complete" ? getWishocracyVisualFixture(visual) : undefined
  return (
    <Layout>
      {fixture ? (
        <main className="mx-auto max-w-3xl px-4 py-8">
          <WishocracyCompletionCard show comparisons={fixture.comparisons} isAuthenticated={false} shareUrl="https://wishocracy.org" />
          <div data-complete-list>
            <BudgetAllocationBars comparisons={fixture.comparisons} initialResults={fixture.results} />
          </div>
        </main>
      ) : <WishocracySection />}
    </Layout>
  )
}
