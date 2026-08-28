import { Resend } from "resend"
import { EMAIL_CONFIG } from "./constants"
import { env } from "./env"
import { getSiteConfig } from "./site-config"

/**
 * Get or create Resend client instance
 * Returns null if RESEND_API_KEY is not configured
 */
export function getResendClient(): Resend | null {
  if (!env.RESEND_API_KEY) {
    return null
  }
  return new Resend(env.RESEND_API_KEY)
}

/**
 * Get the email "from" address with optional display name
 * Returns format: "Display Name <email@domain.com>" or just "email@domain.com"
 */
export function getEmailFrom(): string {
  const address = env.EMAIL_FROM_ADDRESS || EMAIL_CONFIG.DEFAULT_FROM_ADDRESS
  const name = env.EMAIL_FROM_NAME || EMAIL_CONFIG.DEFAULT_FROM_NAME

  // If name is provided, use "Name <email>" format, otherwise just email
  return name ? `${name} <${address}>` : address
}

/**
 * Get the email "from" using the current site variant's brand identity.
 *
 * This is the one place a site's sender name comes from: the variant's
 * `emailBranding.fromName` in site-config. Prefer this over `getEmailFrom`
 * for user-facing mail so every email from a site carries the same sender.
 */
export function getBrandedEmailFrom(): string {
  const address = env.EMAIL_FROM_ADDRESS || EMAIL_CONFIG.DEFAULT_FROM_ADDRESS
  return `${getSiteConfig().emailBranding.fromName} <${address}>`
}

/**
 * Format a date for display in emails
 * Returns a human-readable date string like "January 15, 2024"
 */
export function formatEmailDate(date: Date = new Date()): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

