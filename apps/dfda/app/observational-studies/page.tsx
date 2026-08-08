import Layout from "@/components/layout"
import { ObservationalStudiesList } from "./observational-studies-list"
import { ObservationalStudiesListSkeleton } from "./observational-studies-list"
import { Suspense } from "react"
import { getPageMetadata, NAV_ITEMS_MAP } from "@/lib/nav-items"

export const metadata = getPageMetadata('observationalStudies')

export default function ObservationalStudiesPage() {
  const { description } = NAV_ITEMS_MAP.observationalStudies

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl sm:text-4xl font-black uppercase mb-2">
          OBSERVATIONAL <span className="text-brutal-pink">STUDIES</span>
        </h1>
        <p className="text-muted-foreground mb-6">{description}</p>
        <Suspense fallback={<ObservationalStudiesListSkeleton />}>
          <ObservationalStudiesList />
        </Suspense>
      </div>
    </Layout>
  )
}
