/**
 * External Links Registry
 *
 * Centralized registry for external resources in the dFDA ecosystem.
 * Used by components that need link metadata without going through nav-items.
 */

export interface ExternalLink {
  url: string
  title: string
  description: string
  emoji: string
  category: 'dfda' | 'community' | 'research'
}

export const EXTERNAL_LINKS = {
  dfdaImpact: {
    url: 'https://impact.dfda.earth',
    title: 'Cost-Benefit Analysis',
    description: 'Interactive analysis showing how pragmatic trials could reduce drug development from $41K to $929 per patient and save 10.7 billion lives.',
    emoji: '📊',
    category: 'dfda',
  },
  dfdaSpec: {
    url: 'https://spec.dfda.earth',
    title: 'Protocol Specification',
    description: 'The two-stage methodology: observational signal detection from real-world patient data, then pragmatic trial confirmation at 44x lower cost.',
    emoji: '📖',
    category: 'dfda',
  },
  dfdaStudies: {
    url: 'https://studies.dfda.earth',
    title: 'Personal Health Studies',
    description: 'Track health outcomes and discover hidden patterns. 7,000+ crowdsourced studies on the causes and effects of foods, drugs, and supplements.',
    emoji: '🔬',
    category: 'dfda',
  },
} as const satisfies Record<string, ExternalLink>

export type ExternalLinkId = keyof typeof EXTERNAL_LINKS

export function getExternalLink(id: ExternalLinkId): ExternalLink {
  return EXTERNAL_LINKS[id]
}

export function getExternalLinksByCategory(category: ExternalLink['category']): ExternalLink[] {
  return Object.values(EXTERNAL_LINKS).filter(link => link.category === category)
}
