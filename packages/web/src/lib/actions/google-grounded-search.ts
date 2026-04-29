export interface GroundedSearchResult {
  answer: string;
  citations?: Array<{ title?: string; url: string }>;
  renderedContent?: string;
}

export async function getGroundedAnswerAction(
  _query: string,
): Promise<GroundedSearchResult | null> {
  return null;
}
