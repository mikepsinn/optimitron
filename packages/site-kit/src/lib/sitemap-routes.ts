/**
 * Sitemap route generation (campaign app — static routes only).
 * Encyclopedia condition/treatment routes live on @apps/dfda.
 */

import type { SiteVariant } from './site-variant-types'
import { PUBLIC_PAGE_ROUTES } from './routes'

export interface SitemapRoute {
  path: string
  priority?: number
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
}

export function getStaticSitemapRoutes(): SitemapRoute[] {
  return PUBLIC_PAGE_ROUTES.map((path) => ({
    path,
    priority: path === '/' ? 1 : 0.7,
    changeFrequency: 'weekly' as const,
  }))
}

export function getSitemapRoutesForVariant(_variant: SiteVariant): SitemapRoute[] {
  return getStaticSitemapRoutes()
}
