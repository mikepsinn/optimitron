"use client"

import { useState, useEffect, useMemo } from "react"
import { Users, ArrowRight, TrendingUp, TrendingDown, ExternalLink } from "lucide-react"
import { logger } from "@/lib/logger"
import { formatNumberShort } from "@/lib/formatters"
import { SearchableList, SearchableListSkeleton } from "@/components/shared/SearchableList"

interface ObservationalStudy {
  u: string // URL path
  t: string // Title
  d?: string // Description
  cv: string // Cause variable
  ev: string // Effect variable
  ccat: string // Cause category
  ecat: string // Effect category
  np: number // Number of participants
  rel: string // Relationship direction ("+" or "-")
  str: string // Strength ("V", "L", "M", "S")
  conf?: string // Confidence level
  pis?: number // Predictive index score
  r?: number // Correlation coefficient
  es?: number // Effect size (percentage)
  sig?: number // Significance (p-value)
  pairs?: number // Number of data pairs
  yr?: string // Year
  kw?: string // Keywords
  pctrl?: number // Present when controlled
}

const STUDIES_BASE_URL = "https://studies.dfda.earth"
const SEARCH_INDEX_URL = `${STUDIES_BASE_URL}/search-index-studies.json`

const STRENGTH_LABELS: Record<string, string> = {
  V: "Very Slight",
  L: "Slight",
  M: "Moderate",
  S: "Strong",
}

const STRENGTH_COLORS: Record<string, string> = {
  V: "bg-gray-200 text-gray-700",
  L: "bg-blue-100 text-blue-700",
  M: "bg-yellow-100 text-yellow-700",
  S: "bg-green-100 text-green-700",
}

export function ObservationalStudiesListSkeleton() {
  return <SearchableListSkeleton rows={8} />
}

export function ObservationalStudiesList() {
  const [studies, setStudies] = useState<ObservationalStudy[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStudies() {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch(SEARCH_INDEX_URL)
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`)
        }
        const data: ObservationalStudy[] = await response.json()
        // Sort by number of participants descending by default
        const sorted = data.sort((a, b) => (b.np || 0) - (a.np || 0))
        setStudies(sorted)
      } catch (err) {
        logger.error("Failed to fetch observational studies:", err)
        setError("Failed to load observational studies. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }
    fetchStudies()
  }, [])

  const filteredStudies = useMemo(() => {
    if (!searchQuery.trim()) {
      return studies
    }

    const lowerQuery = searchQuery.toLowerCase()

    // Filter by searching keywords, title, cause variable, effect variable, and categories
    return studies.filter((study) => {
      const keywords = study.kw?.toLowerCase() || ""
      const title = study.t?.toLowerCase() || ""
      const causeVar = study.cv?.toLowerCase() || ""
      const effectVar = study.ev?.toLowerCase() || ""
      const causeCat = study.ccat?.toLowerCase() || ""
      const effectCat = study.ecat?.toLowerCase() || ""

      return (
        keywords.includes(lowerQuery) ||
        title.includes(lowerQuery) ||
        causeVar.includes(lowerQuery) ||
        effectVar.includes(lowerQuery) ||
        causeCat.includes(lowerQuery) ||
        effectCat.includes(lowerQuery)
      )
    })
  }, [studies, searchQuery])

  const renderItem = (study: ObservationalStudy, index: number) => (
    <a
      key={`${study.u}-${index}`}
      href={`${STUDIES_BASE_URL}${study.u}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block border-4 border-primary p-4 bg-background hover:bg-brutal-yellow hover:translate-x-1 hover:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all"
    >
      <div className="space-y-3">
        {/* Title with external link icon */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-black text-base sm:text-lg leading-tight">{study.t}</h3>
          <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
        </div>

        {/* Cause → Effect visualization */}
        <div className="flex items-center gap-2 flex-wrap text-sm">
          <span className="bg-brutal-cyan px-2 py-1 border-2 border-primary font-bold">
            {study.cv}
          </span>
          <ArrowRight className="w-4 h-4" />
          {study.rel === "+" ? (
            <TrendingUp className="w-4 h-4 text-green-600" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-600" />
          )}
          <span className="bg-brutal-pink text-white px-2 py-1 border-2 border-primary font-bold">
            {study.ev}
          </span>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-3 text-xs font-bold">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {formatNumberShort(study.np)} participants
          </span>
          <span
            className={`px-2 py-0.5 border border-primary ${
              STRENGTH_COLORS[study.str] || "bg-gray-100 text-gray-600"
            }`}
          >
            {STRENGTH_LABELS[study.str] || study.str}
          </span>
          {study.es !== undefined && (
            <span className={study.es >= 0 ? "text-green-600" : "text-red-600"}>
              {study.es >= 0 ? "+" : ""}
              {study.es.toFixed(1)}% effect
            </span>
          )}
          <span className="bg-muted px-2 py-0.5 border border-primary">
            {study.ccat} → {study.ecat}
          </span>
        </div>
      </div>
    </a>
  )

  return (
    <SearchableList
      items={studies}
      filteredItems={filteredStudies}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search by keyword (sleep, mood, caffeine, exercise...)"
      isLoading={isLoading}
      error={error}
      maxDisplayed={100}
      itemLabel="studies"
      renderItem={renderItem}
      emptyMessage="No observational studies found matching your search."
      emptySuggestions='Try different keywords like "sleep", "coffee", or "exercise".'
    />
  )
}

ObservationalStudiesList.Skeleton = ObservationalStudiesListSkeleton
