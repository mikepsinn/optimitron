/**
 * Strips HTML tags from text, preserving the text content.
 * This is useful for cleaning up text from APIs that return HTML markup
 * (e.g., ClinicalTrials.gov highlighting markup).
 * 
 * @param text - The text that may contain HTML tags
 * @returns Clean text without HTML tags, or undefined if input was undefined
 */
export function stripHtmlTags(text?: string): string | undefined {
  if (!text) return undefined;
  
  // Remove all HTML tags (including attributes)
  // This handles cases like:
  // - <mark class="hl-term">text</mark>
  // - <mark class="hl-synonym" title="...">text</mark>
  // - Any other HTML tags
  return text
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .trim();
}
