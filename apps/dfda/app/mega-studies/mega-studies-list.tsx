"use client"

import { useState, useEffect, useMemo } from "react"
import { Users, FileText, ExternalLink } from "lucide-react"
import { logger } from "@/lib/logger"
import { formatNumberShort } from "@/lib/formatters"
import { SearchableList, SearchableListSkeleton } from "@/components/shared/SearchableList"
import Image from "next/image"

interface StudyVariable {
  u: string // URL path
  t: string // Title
  d: string // Description
  cat: string // Category
  np: number // Number of people
  ns: number // Number of studies
  pop: number // Population count (for sorting)
  mc: number // Measurement count
  out?: number // Outlier indicator
  yr: string // Year
  kw: string // Keywords (comma-separated)
  i?: string // Image URL
}

const STUDIES_BASE_URL = "https://studies.dfda.earth"
const SEARCH_INDEX_URL = `${STUDIES_BASE_URL}/search-index-variables.json`

export function MegaStudiesListSkeleton() {
  return <SearchableListSkeleton rows={8} />
}

export function MegaStudiesList() {
  const [variables, setVariables] = useState<StudyVariable[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchVariables() {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch(SEARCH_INDEX_URL)
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`)
        }
        const data: StudyVariable[] = await response.json()
        // Sort by pop (population) descending by default
        const sorted = data.sort((a, b) => (b.pop || 0) - (a.pop || 0))
        setVariables(sorted)
      } catch (err) {
        logger.error("Failed to fetch mega study variables:", err)
        setError("Failed to load mega studies. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }
    fetchVariables()
  }, [])

  const filteredVariables = useMemo(() => {
    if (!searchQuery.trim()) {
      return variables
    }

    const lowerQuery = searchQuery.toLowerCase()

    // Filter by searching the kw (keywords) field, title, and description
    return variables.filter((variable) => {
      const keywords = variable.kw?.toLowerCase() || ""
      const title = variable.t?.toLowerCase() || ""
      const description = variable.d?.toLowerCase() || ""
      const category = variable.cat?.toLowerCase() || ""

      return (
        keywords.includes(lowerQuery) ||
        title.includes(lowerQuery) ||
        description.includes(lowerQuery) ||
        category.includes(lowerQuery)
      )
    })
  }, [variables, searchQuery])

  const renderItem = (variable: StudyVariable, index: number) => (
    <a
      key={`${variable.u}-${index}`}
      href={`${STUDIES_BASE_URL}${variable.u}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block border-4 border-primary p-4 bg-background hover:bg-brutal-yellow hover:translate-x-1 hover:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all"
    >
      <div className="flex gap-4">
        {/* Image/Icon */}
        <div className="flex-shrink-0 w-12 h-12 border-2 border-primary bg-muted flex items-center justify-center overflow-hidden">
          {variable.i ? (
            <Image
              src={variable.i}
              alt={variable.t}
              width={48}
              height={48}
              className="w-full h-full object-cover"
              unoptimized
            />
          ) : (
            <FileText className="w-6 h-6 text-muted-foreground" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-black text-lg truncate">{variable.t}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {variable.d}
              </p>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-4 mt-2 text-xs font-bold">
            <span className="flex items-center gap-1 text-brutal-pink">
              <Users className="w-3 h-3" />
              {formatNumberShort(variable.np)} participants
            </span>
            <span className="flex items-center gap-1 text-brutal-cyan">
              <FileText className="w-3 h-3" />
              {formatNumberShort(variable.ns)} studies
            </span>
            <span className="bg-muted px-2 py-0.5 border border-primary">
              {variable.cat}
            </span>
          </div>
        </div>
      </div>
    </a>
  )

  return (
    <SearchableList
      items={variables}
      filteredItems={filteredVariables}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search by keyword (mood, sleep, anxiety, pain...)"
      isLoading={isLoading}
      error={error}
      maxDisplayed={100}
      itemLabel="variables"
      renderItem={renderItem}
      emptyMessage="No mega studies found matching your search."
      emptySuggestions='Try different keywords like "mood", "sleep", or "energy".'
    />
  )
}

MegaStudiesList.Skeleton = MegaStudiesListSkeleton
