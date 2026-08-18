export interface GeneralResearchCitation {
  id: string
  title: string
  quotes: string[]
  sources: { text: string; url: string }[]
  notes?: string
}
