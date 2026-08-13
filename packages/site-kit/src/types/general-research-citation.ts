/**
 * General Research Citation Type Definitions
 *
 * Types for general research citations (economic, policy, statistical sources)
 * used to back claims throughout the application.
 *
 * Note: This is distinct from ClinicalStudyCitation which is used for
 * clinical trial meta-analyses with full academic metadata.
 *
 * See: data/references.json for the data structure
 */

export interface GeneralResearchCitationSource {
  text: string;
  url: string;
}

export interface GeneralResearchCitation {
  id: string;
  title: string;
  quotes: string[];
  sources: GeneralResearchCitationSource[];
  notes?: string;
}

export interface GeneralResearchCitationsData {
  metadata: {
    title: string;
    description: string;
  };
  references: GeneralResearchCitation[];
}
