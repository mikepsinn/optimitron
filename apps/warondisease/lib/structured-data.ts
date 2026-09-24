import {
  CAMPAIGN_NAME,
  CAMPAIGN_OPERATOR_BUSINESS_DESCRIPTION,
  WAR_ON_DISEASE_LEGACY_NAME,
} from "@optimitron/data/campaign"
import { WAR_ON_DISEASE_CANONICAL_ORIGIN } from "@optimitron/site-kit/lib/domains"
import { NONPROFIT } from "@optimitron/site-kit/lib/nonprofit-identity"
import { OPTIMITRON_REPOSITORY_URL } from "@optimitron/site-kit/lib/optimitron-links"
import { ROUTES } from "@optimitron/site-kit/lib/routes"
import {
  getSiteConfigForVariant,
  VARIANTS,
  WAR_ON_DISEASE_LOGO_PATH,
  type FaqConfig,
} from "@optimitron/site-kit/lib/site-config"

/**
 * JSON-LD for warondisease.org, ported from the Optimitron host's
 * `site-structured-data.ts` and `campaign-structured-data.ts`, which served
 * this domain before this app did. This app serves one site, so the builders
 * read its fixed identity instead of a per-request site. URLs always use the
 * canonical origin, including on preview deployments.
 */

type JsonLdNode = Record<string, unknown>

export interface StructuredDataGraph {
  "@context": "https://schema.org"
  "@graph": JsonLdNode[]
}

function absoluteUrl(path: string) {
  return `${WAR_ON_DISEASE_CANONICAL_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`
}

function nodeId(path: string, fragment: string) {
  return `${absoluteUrl(path)}#${fragment}`
}

const ORGANIZATION_ID = nodeId(ROUTES.home, "organization")
const WEBSITE_ID = nodeId(ROUTES.home, "website")

function graph(nodes: JsonLdNode[]): StructuredDataGraph {
  return {
    "@context": "https://schema.org",
    "@graph": nodes,
  }
}

function webPage(path: string, name: string): JsonLdNode {
  return {
    "@type": "WebPage",
    "@id": nodeId(path, "webpage"),
    url: absoluteUrl(path),
    name,
    isPartOf: { "@id": WEBSITE_ID },
  }
}

function treatyLegislation(): JsonLdNode {
  return {
    "@type": "Legislation",
    "@id": nodeId(ROUTES.treaty, "legislation"),
    name: "1% Treaty",
    url: absoluteUrl(ROUTES.treaty),
    legislationType: "Treaty",
    description:
      "Redirect 1% of military spending to clinical trials and align political incentives around ending war and disease.",
  }
}

function voteAction(path: string): JsonLdNode {
  return {
    "@type": "VoteAction",
    "@id": nodeId(path, "vote-action"),
    name: "Vote yes on the 1% Treaty",
    target: absoluteUrl(ROUTES.vote),
    object: { "@id": nodeId(ROUTES.treaty, "legislation") },
    actionStatus: "https://schema.org/PotentialActionStatus",
  }
}

/** Organization and WebSite nodes that every warondisease.org page carries. */
export function buildSiteStructuredData(): StructuredDataGraph {
  const address = NONPROFIT.mailingAddress

  return graph([
    {
      "@type": "Organization",
      "@id": ORGANIZATION_ID,
      name: CAMPAIGN_NAME,
      legalName: `${NONPROFIT.legalName}, dba ${CAMPAIGN_NAME}`,
      url: WAR_ON_DISEASE_CANONICAL_ORIGIN,
      logo: absoluteUrl(WAR_ON_DISEASE_LOGO_PATH),
      description: CAMPAIGN_OPERATOR_BUSINESS_DESCRIPTION,
      email: NONPROFIT.publicContactEmail,
      address: {
        "@type": "PostalAddress",
        streetAddress: [address.line1, address.line2].filter(Boolean).join(", "),
        addressLocality: address.city,
        addressRegion: address.state,
        postalCode: address.postalCode,
        addressCountry: address.country,
      },
      contactPoint: [
        {
          "@type": "ContactPoint",
          email: NONPROFIT.publicContactEmail,
          contactType: "public inquiries",
          url: WAR_ON_DISEASE_CANONICAL_ORIGIN,
        },
      ],
      sameAs: [OPTIMITRON_REPOSITORY_URL],
    },
    {
      "@type": "WebSite",
      "@id": WEBSITE_ID,
      url: WAR_ON_DISEASE_CANONICAL_ORIGIN,
      name: CAMPAIGN_NAME,
      alternateName: [WAR_ON_DISEASE_LEGACY_NAME, CAMPAIGN_NAME],
      description: getSiteConfigForVariant(VARIANTS.WAR_ON_DISEASE).description,
      publisher: { "@id": ORGANIZATION_ID },
    },
  ])
}

export function buildTreatyStructuredData(): StructuredDataGraph {
  return graph([
    webPage(ROUTES.treaty, "1% Treaty"),
    treatyLegislation(),
    voteAction(ROUTES.treaty),
  ])
}

export function buildVoteStructuredData(): StructuredDataGraph {
  return graph([
    webPage(ROUTES.vote, "Vote on the 1% Treaty"),
    treatyLegislation(),
    voteAction(ROUTES.vote),
  ])
}

/** FAQPage built from the same FAQ config the /faq page renders. */
export function buildFaqStructuredData(faq: FaqConfig): StructuredDataGraph {
  return graph([
    webPage(ROUTES.faq, faq.title),
    {
      "@type": "FAQPage",
      "@id": nodeId(ROUTES.faq, "faq"),
      url: absoluteUrl(ROUTES.faq),
      name: faq.title,
      mainEntity: faq.sections.flatMap((section) =>
        section.questions.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.a,
          },
        })),
      ),
    },
  ])
}
