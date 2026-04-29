export interface GroundedSearchResult {
  answer: string;
  citations?: Array<{ title?: string; url: string }>;
  renderedContent?: string;
}
