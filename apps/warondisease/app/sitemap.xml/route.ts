/**
 * Sitemap Route Handler
 *
 * Generates the sitemap XML for the current variant from the shared
 * route registry. There is no `generate:sitemaps` script and no
 * `public/sitemaps/*.xml` file checked in, so this always builds the
 * XML on request instead of reading a static file that does not exist.
 */

import { NextResponse } from 'next/server'
import { getSiteVariant } from '@/lib/site-config'
import { getSitemapRoutesForVariant } from '@/lib/sitemap-routes'
import { getBaseUrl } from '@/lib/url'

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export async function GET(): Promise<NextResponse> {
  const variant = getSiteVariant()
  const baseUrl = getBaseUrl()
  const routes = getSitemapRoutesForVariant(variant)

  const urlEntries = routes
    .map((route) => {
      const loc = escapeXml(`${baseUrl}${route.path}`)
      const changefreq = route.changeFrequency ? `\n    <changefreq>${route.changeFrequency}</changefreq>` : ''
      const priority = route.priority != null ? `\n    <priority>${route.priority}</priority>` : ''
      return `  <url>\n    <loc>${loc}</loc>${changefreq}${priority}\n  </url>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlEntries}\n</urlset>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400', // Cache for 1 hour client, 1 day CDN
    },
  })
}
