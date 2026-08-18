/**
 * Clinical Study Citation Type Definitions
 *
 * Types for clinical trial meta-analyses with full academic metadata
 * (authors, DOI, PMID, journal details, etc.)
 *
 * Note: This is distinct from GeneralResearchCitation which is used for
 * general research sources (economic, policy, statistical) without
 * full academic metadata.
 */

export interface ClinicalStudyCitation {
  id?: string
  title?: string | null
  url?: string | null
  authors?: string[] | null
  journal_or_publisher?: string | null
  publication_year?: number | null
  volume?: string | null
  issue?: string | null
  pages?: string | null
  doi?: string | null
  pmid?: string | null
  type?: string | null
  created_at?: string
  updated_at?: string
}

export interface ClinicalStudyCitationInsertSchema {
  title?: string | null
  url: string
  authors?: string[] | null
  journal_or_publisher?: string | null
  publication_year?: number | null
  volume?: string | null
  issue?: string | null
  pages?: string | null
  doi?: string | null
  pmid?: string | null
  type?: string | null
}

// Footer data type for OutcomeLabel
export interface OutcomeFooterData {
  sourceCitation?: ClinicalStudyCitation | { citations: ClinicalStudyCitation[] } | null
  lastUpdated?: string
  nnhDescription?: string
}
