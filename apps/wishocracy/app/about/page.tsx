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
            Choose the programs you want to fund. Then divide a hypothetical $100 between two programs at a time.
            Your choices become a percentage allocation you can see and change on the results page.
          </p>
        </section>
        <section className="space-y-4">
          <h2 className="text-2xl font-black uppercase">How to read the results</h2>
          <p className="leading-relaxed">
            Each answer splits $100 between two programs. We pool everyone&apos;s latest answer for each pair and find the one set of shares that fits them all best, using the method in the Wishocracy paper.
            Answering &quot;fund neither&quot;, or skipping a program when you pick what to fund, counts as giving it nothing.
            Your own result uses only your answers and covers only the programs you compared.
          </p>
          <p className="leading-relaxed">
            The government bars show annual federal spending scaled across the same programs.
            Both sets of percentages describe the programs shown, not the entire federal budget.
          </p>
          <Link href={ROUTES.wishocracyResults} className="inline-block font-bold underline">Explore the results</Link>
        </section>
        <section className="space-y-4">
          <h2 className="text-2xl font-black uppercase">The research</h2>
          <p className="leading-relaxed">
            The Wishocracy paper explores how pairwise preferences could guide public budgets and measure how closely governments follow citizens' priorities.
            It describes the broader research framework, including the calculation explained above.
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
