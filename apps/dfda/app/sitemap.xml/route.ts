/**
 * Sitemap Route Handler
 *
 * Serves the pre-generated static sitemap XML file for the current variant
 * when one has been committed (`pnpm generate:sitemaps`). No such file or
 * script exists yet for @apps/dfda, so this falls back to building the
 * sitemap at request time from the route registry plus every condition and
 * treatment page, instead of returning a 404 that hides the whole site from
 * crawlers.
 */

import { NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { getSiteVariantForHost, getBaseUrl } from '@/lib/site-config'
import { getSitemapRoutesForVariant } from '@/lib/sitemap-routes'
import type { SiteVariant } from '@/lib/site-variant-types'
import { ROUTES } from '@/lib/routes'
import { getAllConditions } from '@/lib/conditions'
import { getAllTreatments } from '@/lib/treatments'

function buildFallbackSitemap(variant: SiteVariant): string {
  const baseUrl = getBaseUrl()
  const staticEntries = getSitemapRoutesForVariant(variant)
  const conditionEntries = getAllConditions().map((c) => ({
    path: `${ROUTES.conditions}/${c.slug}`,
    priority: 0.6,
    changeFrequency: 'monthly' as const,
  }))
  const treatmentEntries = getAllTreatments().map((t) => ({
    path: `${ROUTES.treatments}/${t.slug}`,
    priority: 0.6,
    changeFrequency: 'monthly' as const,
  }))

  const urls = [...staticEntries, ...conditionEntries, ...treatmentEntries]
    .map(
      (entry) =>
        `  <url>\n    <loc>${baseUrl}${entry.path}</loc>\n    <changefreq>${entry.changeFrequency}</changefreq>\n    <priority>${entry.priority}</priority>\n  </url>`
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

export async function GET(request: Request): Promise<NextResponse> {
  const hostname = request.headers.get('host')
  const variant: SiteVariant =
    process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_SITE_VARIANT
      ? (process.env.NEXT_PUBLIC_SITE_VARIANT as SiteVariant)
      : getSiteVariantForHost(hostname)

  // Path to the pre-generated sitemap for this variant, if one was committed
  const sitemapPath = join(process.cwd(), 'public', 'sitemaps', `${variant}.xml`)

  const sitemapContent = existsSync(sitemapPath)
    ? readFileSync(sitemapPath, 'utf-8')
    : buildFallbackSitemap(variant)

  return new NextResponse(sitemapContent, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400', // Cache for 1 hour client, 1 day CDN
    },
  })
}
