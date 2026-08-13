/**
 * Slug generation utilities for organization URLs
 * Generates URL-safe slugs from organization names
 */

/**
 * Generates a URL-safe slug from a string
 * Example: "American Cancer Society" -> "american-cancer-society"
 *
 * @param text - The text to convert to a slug
 * @returns URL-safe slug string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Replace spaces and underscores with hyphens
    .replace(/[\s_]+/g, '-')
    // Remove non-alphanumeric characters except hyphens
    .replace(/[^\w-]+/g, '')
    // Replace multiple hyphens with single hyphen
    .replace(/--+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
}

/**
 * Generates a unique slug by appending a number if needed
 *
 * @param baseSlug - The base slug to make unique
 * @param existingSlugs - Array of existing slugs to check against
 * @returns Unique slug (e.g., "cancer-society-2" if "cancer-society" exists)
 */
export function makeSlugUnique(baseSlug: string, existingSlugs: string[]): string {
  let slug = baseSlug
  let counter = 2

  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`
    counter++
  }

  return slug
}

/**
 * Validates a slug meets requirements
 * - Between 3-60 characters
 * - Only lowercase letters, numbers, and hyphens
 * - Doesn't start or end with hyphen
 * - No consecutive hyphens
 *
 * @param slug - The slug to validate
 * @returns true if valid, false otherwise
 */
export function isValidSlug(slug: string): boolean {
  // Check length
  if (slug.length < 3 || slug.length > 60) {
    return false
  }

  // Check format: lowercase alphanumeric and hyphens only
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return false
  }

  // Check doesn't start or end with hyphen
  if (slug.startsWith('-') || slug.endsWith('-')) {
    return false
  }

  // Check no consecutive hyphens
  if (slug.includes('--')) {
    return false
  }

  return true
}

/**
 * Sanitizes and validates a custom slug from user input
 * Returns null if invalid
 *
 * @param customSlug - User-provided slug
 * @returns Sanitized slug or null if invalid
 */
export function sanitizeCustomSlug(customSlug: string): string | null {
  const slug = generateSlug(customSlug)
  return isValidSlug(slug) ? slug : null
}
