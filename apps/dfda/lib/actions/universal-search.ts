'use server'

import { searchConditions } from '@/lib/conditions'
import { getAllTreatments } from '@/lib/treatments'
import { logger } from '@/lib/logger'

export interface UniversalSearchResult {
  type: 'condition' | 'treatment'
  id: string
  name: string
  slug: string
  description?: string
  trialCount?: number
}

export async function getUniversalSearchSuggestionsAction(
  query: string
): Promise<UniversalSearchResult[]> {
  const log = logger.child({ action: 'getUniversalSearchSuggestions', query })

  if (!query || query.trim().length < 2) {
    return []
  }

  const searchTerm = query.trim().toLowerCase()

  try {
    // Search conditions and treatments in parallel
    const [conditionResults, treatmentResults] = await Promise.all([
      // Search conditions by name, description, and synonyms
      Promise.resolve(searchConditions(searchTerm).slice(0, 5)),

      // Search treatments by name
      Promise.resolve(
        getAllTreatments()
          .filter((t) => t.name.toLowerCase().includes(searchTerm))
          .slice(0, 5)
      ),
    ])

    const results: UniversalSearchResult[] = [
      ...conditionResults.map((c) => ({
        type: 'condition' as const,
        id: c.slug,
        name: c.name,
        slug: c.slug,
        description: c.description,
        trialCount: c.activeTrialCount,
      })),
      ...treatmentResults.map((t) => ({
        type: 'treatment' as const,
        id: t.slug,
        name: t.name,
        slug: t.slug,
        trialCount: t.totalTrials,
      })),
    ]

    log.info(`Found ${results.length} results`)
    return results
  } catch (error) {
    log.error('Failed to fetch universal search suggestions', { error })
    throw new Error('Failed to fetch search suggestions')
  }
}
