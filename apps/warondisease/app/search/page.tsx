import type { Metadata } from "next"
import Link from "next/link"
import Layout from "@/components/layout"
import { ROUTES } from "@/lib/routes"
import {
  searchCampaign,
  type CampaignSearchResult,
} from "./campaign-search.server"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Search",
  description:
    "Find a campaign page, a person who signed the 1% Treaty, or an organization that endorsed it.",
}

const SECTION_LABELS: Record<CampaignSearchResult["scope"], string> = {
  organizations: "Organizations",
  pages: "Pages",
  people: "People",
}

function readQuery(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? ""
  return value ?? ""
}

function ResultList({
  results,
  scope,
}: {
  results: CampaignSearchResult[]
  scope: CampaignSearchResult["scope"]
}) {
  if (results.length === 0) return null

  return (
    <section className="mt-10">
      <h2 className="text-2xl font-black uppercase">{SECTION_LABELS[scope]}</h2>
      <ul className="mt-4 space-y-3">
        {results.map((result) => (
          <li key={`${result.scope}:${result.href}`}>
            <Link
              className="flex gap-4 border-4 border-primary bg-background p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-x-1 hover:-translate-y-1"
              href={result.href}
            >
              <span aria-hidden="true" className="text-2xl leading-none">
                {result.emoji}
              </span>
              <span className="min-w-0">
                <span className="block font-black uppercase">
                  {result.title}
                </span>
                <span className="block font-bold">{result.description}</span>
                {result.meta ? (
                  <span className="mt-1 block text-sm font-bold uppercase opacity-70">
                    {result.meta}
                  </span>
                ) : null}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

/**
 * `/search` — campaign-scoped search.
 *
 * Deliberately not a port of Optimitron's /search, which searches tasks and the
 * encyclopedia through a route registry and task subsystem that do not exist on
 * this domain. See `campaign-search.server.ts` for what this does cover.
 */
export default async function SearchPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = (await searchParams) ?? {}
  const rawQuery = readQuery(params.q)
  const results = await searchCampaign(rawQuery)
  const hasQuery = rawQuery.trim().length > 0

  return (
    <Layout>
      <main className="bg-brutal-yellow py-16">
        <div className="mx-auto max-w-3xl px-4">
          <h1 className="text-4xl font-black uppercase leading-none tracking-tighter sm:text-5xl">
            Search
          </h1>
          <p className="mt-4 font-bold">
            Campaign pages, the humans who signed, and the organizations that
            endorsed.
          </p>

          <form action={ROUTES.search} className="mt-8 flex gap-3" role="search">
            <label className="sr-only" htmlFor="search-query">
              Search the campaign
            </label>
            <input
              autoFocus
              className="w-full border-4 border-primary bg-background px-4 py-3 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              defaultValue={rawQuery}
              id="search-query"
              name="q"
              placeholder="Try “treaty”, “flyers”, or a name"
              type="search"
            />
            <button
              className="border-4 border-primary bg-brutal-pink px-6 py-3 font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-x-1 hover:-translate-y-1"
              type="submit"
            >
              Search
            </button>
          </form>

          {hasQuery && results.totalResults === 0 ? (
            <p className="mt-10 border-4 border-primary bg-background p-6 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              Nothing matched “{rawQuery}”. The fastest thing on this site is
              the{" "}
              <Link className="font-black underline" href={ROUTES.vote}>
                vote
              </Link>
              , which takes thirty seconds.
            </p>
          ) : null}

          <ResultList results={results.pages} scope="pages" />
          <ResultList results={results.people} scope="people" />
          <ResultList results={results.organizations} scope="organizations" />
        </div>
      </main>
    </Layout>
  )
}
