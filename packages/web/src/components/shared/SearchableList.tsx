"use client"

import { Input } from "@/components/retroui/Input"
import { Skeleton } from "@/components/ui/skeleton"
import { Search } from "lucide-react"
import { ReactNode } from "react"

interface SearchableListProps<T> {
  /** All items (unfiltered) */
  items: T[]
  /** Filtered items to display */
  filteredItems: T[]
  /** Current search query */
  searchQuery: string
  /** Callback when search changes */
  onSearchChange: (query: string) => void
  /** Placeholder text for search input */
  searchPlaceholder?: string
  /** Loading state */
  isLoading?: boolean
  /** Error message */
  error?: string | null
  /** Maximum items to display before showing truncation message */
  maxDisplayed?: number
  /** Label for items (e.g., "studies", "variables") */
  itemLabel?: string
  /** Render function for each item */
  renderItem: (item: T, index: number) => ReactNode
  /** Custom empty state message */
  emptyMessage?: string
  /** Custom empty state suggestions */
  emptySuggestions?: string
}

export function SearchableListSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="space-y-6">
      <Skeleton className="h-12 w-full border-4 border-primary" />
      <div className="space-y-3">
        {[...Array(rows)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full border-4 border-primary" />
        ))}
      </div>
    </div>
  )
}

export function SearchableList<T>({
  items,
  filteredItems,
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search...",
  isLoading = false,
  error = null,
  maxDisplayed = 100,
  itemLabel = "items",
  renderItem,
  emptyMessage,
  emptySuggestions,
}: SearchableListProps<T>) {
  if (isLoading) {
    return <SearchableListSkeleton />
  }

  if (error) {
    return (
      <div className="text-center py-8 border-4 border-red-500 bg-red-100 p-4">
        <p className="font-bold text-red-700">{error}</p>
      </div>
    )
  }

  const displayedItems = filteredItems.slice(0, maxDisplayed)
  const hasMore = filteredItems.length > maxDisplayed

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="search"
          placeholder={searchPlaceholder}
          className="pl-12 h-12 w-full border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold text-lg"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label={`Search ${itemLabel}`}
        />
      </div>

      {/* Results count */}
      <div className="text-sm font-bold text-muted-foreground">
        {filteredItems.length.toLocaleString()} {itemLabel} found
        {searchQuery && ` for "${searchQuery}"`}
      </div>

      {/* Results List */}
      {filteredItems.length === 0 ? (
        <div className="text-center text-muted-foreground py-8 border-4 border-dashed border-primary p-8">
          <p className="font-bold">
            {emptyMessage || `No ${itemLabel} found matching your search.`}
          </p>
          {emptySuggestions && (
            <p className="text-sm mt-2">{emptySuggestions}</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayedItems.map((item, index) => renderItem(item, index))}

          {hasMore && (
            <div className="text-center py-4 border-4 border-dashed border-primary bg-muted">
              <p className="font-bold">
                Showing first {maxDisplayed} results of{" "}
                {filteredItems.length.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">
                Refine your search to see more specific results.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
