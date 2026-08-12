'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, FlaskConical, Activity, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import {
  getUniversalSearchSuggestionsAction,
  type UniversalSearchResult,
} from '@/lib/actions/universal-search'
import { logger } from '@/lib/logger'

const log = logger.child({ component: 'UniversalSearchBox' })

export function UniversalSearchBox() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<UniversalSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length < 2) {
        setSuggestions([])
        setShowDropdown(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const results = await getUniversalSearchSuggestionsAction(query)
        setSuggestions(results)
        setShowDropdown(results.length > 0)
      } catch (err) {
        log.error('Failed to fetch suggestions', { error: err })
        setError('Failed to load suggestions')
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = useCallback(
    (result: UniversalSearchResult) => {
      setShowDropdown(false)
      setQuery('')

      // Route based on type
      switch (result.type) {
        case 'condition':
          router.push(`/conditions/${result.slug}`)
          break
        case 'treatment':
          router.push(`/treatments/${result.slug}`)
          break
      }
    },
    [router]
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelect(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        setShowDropdown(false)
        setSelectedIndex(-1)
        break
    }
  }

  const getTypeIcon = (type: UniversalSearchResult['type']) => {
    switch (type) {
      case 'condition':
        return <Activity className="h-4 w-4 flex-shrink-0" />
      case 'treatment':
        return <FlaskConical className="h-4 w-4 flex-shrink-0" />
    }
  }

  const getTypeLabel = (type: UniversalSearchResult['type']) => {
    switch (type) {
      case 'condition':
        return 'CONDITION'
      case 'treatment':
        return 'TREATMENT'
    }
  }

  const getTypeBgColor = (type: UniversalSearchResult['type']) => {
    switch (type) {
      case 'condition':
        return 'bg-brutal-pink'
      case 'treatment':
        return 'bg-brutal-cyan'
    }
  }

  // Group suggestions by type
  const groupedSuggestions = suggestions.reduce(
    (acc, result) => {
      if (!acc[result.type]) {
        acc[result.type] = []
      }
      acc[result.type].push(result)
      return acc
    },
    {} as Record<string, UniversalSearchResult[]>
  )

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground" />
        <Input
          ref={inputRef}
          type="search"
          placeholder="Search conditions or treatments..."
          className="pl-12 pr-12 h-14 text-lg border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold bg-white"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowDropdown(true)
            }
          }}
          aria-label="Universal search"
          aria-expanded={showDropdown}
          aria-controls="search-suggestions"
        />
        {isLoading && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-foreground" />
        )}
      </div>

      {error && (
        <Card className="mt-2 bg-red-100 border-2 border-primary p-4">
          <p className="text-sm font-bold text-red-900">{error}</p>
        </Card>
      )}

      {showDropdown && suggestions.length > 0 && (
        <Card
          ref={dropdownRef}
          id="search-suggestions"
          className="absolute z-50 w-full mt-2 bg-background border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-h-[500px] overflow-y-auto"
        >
          <div className="p-2">
            {Object.entries(groupedSuggestions).map(([type, results]) => (
              <div key={type} className="mb-4 last:mb-0">
                <div className="px-3 py-2 text-xs font-black uppercase text-muted-foreground border-b-2 border-primary">
                  {getTypeLabel(type as UniversalSearchResult['type'])}S
                </div>
                {results.map((result) => {
                  const globalIndex = suggestions.indexOf(result)
                  const isSelected = globalIndex === selectedIndex

                  return (
                    <button
                      key={result.id}
                      onClick={() => handleSelect(result)}
                      className={`w-full text-left p-3 flex items-start gap-3 transition-colors border-2 ${
                        isSelected
                          ? 'bg-brutal-cyan/30 border-primary'
                          : 'border-transparent hover:bg-brutal-cyan/10 hover:border-primary'
                      }`}
                    >
                      <div className="mt-1">{getTypeIcon(result.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-black text-sm">{result.name}</span>
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 border-2 border-primary ${getTypeBgColor(
                              result.type
                            )}`}
                          >
                            {getTypeLabel(result.type)}
                          </span>
                        </div>
                        {result.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {result.description}
                          </p>
                        )}
                        {result.trialCount !== undefined && result.trialCount > 0 && (
                          <p className="text-xs font-bold text-muted-foreground mt-1">
                            {result.trialCount.toLocaleString()} trial{result.trialCount !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </Card>
      )}

      {showDropdown && suggestions.length === 0 && !isLoading && query.trim().length >= 2 && (
        <Card className="absolute z-50 w-full mt-2 bg-background border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-4">
          <p className="text-sm text-muted-foreground text-center">No results found for "{query}"</p>
        </Card>
      )}
    </div>
  )
}
