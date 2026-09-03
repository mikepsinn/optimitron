/**
 * Manual / Book / Podcast Links - Single Source of Truth
 *
 * All URLs for the field manual, audiobook podcast, and purchase links.
 * Used by: nav-items, ManualPromoCard, /manual page, email templates.
 *
 * Change a URL here → it updates everywhere.
 */

// ─── Core URLs ───────────────────────────────────────────────────────────────

export const MANUAL_URLS = {
  /** Read the full manual online (free) */
  readOnline: 'https://manual.warondisease.org',

  /** Amazon Kindle */
  kindle: 'https://warondisease.org/amazon/ebook',

  /** Universal book link (Apple Books, Kobo, B&N, etc.) */
  allRetailers: 'https://books2read.com/u/baegEq',

  /** Goodreads listing */
  goodreads: 'https://www.goodreads.com/book/show/248248875-how-to-end-war-and-disease',
} as const

// ─── Podcast / Listen URLs ───────────────────────────────────────────────────

export const PODCAST_URLS = {
  spotify: 'https://open.spotify.com/show/1aX8mw9MmFzyiSBq2RNnu2',
  applePodcasts: 'https://podcasts.apple.com/us/podcast/how-to-end-war-and-disease/id1879755497',
  youtubeMusic: 'https://music.youtube.com/playlist?list=PLC81064vbLPFbngjHW2CRsvUtSUD2SERQ',
  amazonMusic: 'https://music.amazon.com/podcasts/e820cf41-590f-4171-be02-484e70b93d5e/how-to-end-war-and-disease',
  iheartradio: 'https://www.iheart.com/podcast/269-how-to-end-war-and-disease-325094373/',
  pocketCasts: 'https://pca.st/2a0yrrj1',
} as const

// ─── Social / Follow URLs ────────────────────────────────────────────────────

export const SOCIAL_URLS = {
  youtube: 'https://www.youtube.com/@WarOnDisease?sub_confirmation=1',
  twitter: 'https://x.com/warondisease',
  github: 'https://github.com/mikepsinn/disease-eradication-plan',
} as const

// ─── Styled link arrays (for UI components) ─────────────────────────────────

/** Podcast platform buttons with brand colors (for /manual page grid) */
export const LISTEN_LINKS = [
  { label: 'Spotify', href: PODCAST_URLS.spotify, color: 'bg-[#1DB954]', textColor: 'text-white' },
  { label: 'Apple Podcasts', href: PODCAST_URLS.applePodcasts, color: 'bg-[#9933CC]', textColor: 'text-white' },
  { label: 'YouTube Music', href: PODCAST_URLS.youtubeMusic, color: 'bg-[#FF0000]', textColor: 'text-white' },
  { label: 'Amazon Music', href: PODCAST_URLS.amazonMusic, color: 'bg-[#FF9900]', textColor: 'text-black' },
  { label: 'iHeartRadio', href: PODCAST_URLS.iheartradio, color: 'bg-[#C6002B]', textColor: 'text-white' },
  { label: 'Pocket Casts', href: PODCAST_URLS.pocketCasts, color: 'bg-[#F43E37]', textColor: 'text-white' },
] as const

/** Buy/read links with metadata (for /manual page list) */
export const BUY_LINKS = [
  { label: 'Amazon Kindle', href: MANUAL_URLS.kindle, subtitle: 'Instant download' },
  { label: 'All Retailers', href: MANUAL_URLS.allRetailers, subtitle: 'Apple Books, Kobo, B&N, and more' },
  { label: 'Goodreads', href: MANUAL_URLS.goodreads, subtitle: 'Rate & review' },
] as const

// ─── UTM helper ──────────────────────────────────────────────────────────────

/** Append UTM params to a URL */
export function withUtm(href: string, source: string, medium = 'web', campaign = 'cross_site') {
  const sep = href.includes('?') ? '&' : '?'
  return `${href}${sep}utm_source=${source}&utm_medium=${medium}&utm_campaign=${campaign}`
}
