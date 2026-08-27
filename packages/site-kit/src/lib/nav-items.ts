/**
 * Navigation Items Registry
 *
 * Centralized registry of all available navigation items.
 * Site variants can compose their navigation from these items.
 *
 * NOTE: All paths are imported from lib/routes.ts (single source of truth)
 *
 * Nav items also serve as the source of truth for page metadata.
 * Use getPageMetadata(id) to generate Next.js Metadata for pages.
 */

import { ROUTES, HASH_LINKS } from "./routes";
import { MANUAL_URLS, SOCIAL_URLS } from "./manual-links";
import type { Metadata } from "next";
import {
  type SiteVariant,
  VARIANTS,
  getVariantDomain,
} from "./site-variant-types";

export interface NavItem {
  id: string;
  label: string;
  path: string;
  description?: string;
  emoji?: string;
  isHashLink?: boolean;
  requiresScrollHandler?: boolean;
  /** Override page title if different from label (e.g., "Mega Studies - Treatment Rankings") */
  pageTitle?: string;
  /** The canonical variant for this route (used for redirects and canonical URLs) */
  canonicalVariant?: SiteVariant;
  /** Which variants are allowed to show this route. If not set, route is universal (all variants). */
  allowedVariants?: readonly SiteVariant[];
  /** Custom OG image path (relative to public/, e.g., "/assets/dfda/mega-studies-og.png") */
  ogImage?: string;
  /** Prompt for generating OG image (used by scripts/generate-nav-item-images.ts) */
  ogPrompt?: string;
  /** SEO keywords for search discovery */
  keywords?: readonly string[];
  /** If true, use the site variant's default OG image instead of a page-specific one */
  useSiteDefaultOg?: boolean;
  /** If true, this is an external link (opens in new tab with target="_blank") */
  isExternal?: boolean;
}

/**
 * All available navigation items
 *
 * These items can be used in any combination across different site variants.
 * Each variant decides which items to show and how to organize them.
 */
export const NAV_ITEMS_MAP = {
  // About section items
  home: {
    id: "home",
    label: "Home",
    path: ROUTES.home,
    description:
      "Help accelerate cures through pragmatic clinical trials delivering 82x more efficiency and $172B+ annual benefits",
    emoji: "🏠",
    keywords: [
      "clinical trials",
      "medical research",
      "pragmatic trials",
      "health innovation",
      "cure acceleration",
    ],
    useSiteDefaultOg: true, // Use site's main OG image
  },
  about: {
    id: "about",
    label: "About",
    path: ROUTES.about,
    description:
      "Discover how the Decentralized Institutes of Health accelerates medical breakthroughs with pragmatic trials, delivering 82x efficiency gains and making suffering optional",
    emoji: "ℹ️",
    keywords: [
      "decentralized health",
      "pragmatic trials",
      "medical innovation",
      "clinical research",
      "health economics",
    ],
  },
  // Take Action items (CTAs)
  vote: {
    id: "vote",
    label: "Answer the Question",
    path: HASH_LINKS.vote,
    description:
      "Cast your vote for the 1% Treaty: redirect 1% of military spending to accelerate medical research and end preventable disease deaths",
    emoji: "✅",
    isHashLink: true,
    requiresScrollHandler: true,
    canonicalVariant: VARIANTS.WAR_ON_DISEASE,
    allowedVariants: [
      VARIANTS.WAR_ON_DISEASE,
      VARIANTS.SURVEY,
      VARIANTS.ACCELERATED_MEDICINE,
      VARIANTS.DIH,
    ],
    keywords: [
      "1% treaty",
      "vote",
      "military spending",
      "medical research funding",
      "health policy",
    ],
  },
  wishocracy: {
    id: "wishocracy",
    label: "Quantifying Humanity's Values",
    path: ROUTES.wishocracy,
    description:
      "Discover your global priorities through interactive pairwise comparisons. Compare different areas of human concern and see what matters most to you",
    emoji: "🎯",
    canonicalVariant: VARIANTS.WISHOCRACY,
    allowedVariants: [VARIANTS.WISHOCRACY],
    keywords: [
      "values discovery",
      "priority comparison",
      "global priorities",
      "decision making",
      "personal values",
    ],
  },
  donate: {
    id: "donate",
    label: "Donate",
    path: ROUTES.donate,
    description:
      "Fund patient education, pragmatic-trial research, and public treatment evidence.",
    emoji: "💝",
    canonicalVariant: VARIANTS.ACCELERATED_MEDICINE,
    allowedVariants: [
      VARIANTS.ACCELERATED_MEDICINE,
      VARIANTS.DIH,
      VARIANTS.WAR_ON_DISEASE,
      VARIANTS.CUREDAO,
    ],
    keywords: [
      "donate",
      "medical research donation",
      "health charity",
      "clinical trial funding",
      "transparent giving",
    ],
  },
  rightToTryMontana: {
    id: "rightToTryMontana",
    label: "Montana Model",
    path: ROUTES.montana,
    description:
      "Read how Montana's Universal Right to Try law expands patient access while licensing experimental treatment centers.",
    emoji: "📍",
    canonicalVariant: VARIANTS.ACCELERATED_MEDICINE,
    allowedVariants: [VARIANTS.ACCELERATED_MEDICINE],
    keywords: [
      "Montana SB 535",
      "Universal Right to Try",
      "experimental treatment centers",
      "patient access",
    ],
  },
  rightToTryStates: {
    id: "rightToTryStates",
    label: "Your State",
    path: `${ROUTES.home}#state-support`,
    description: "Put your state on the Right to Trial map.",
    emoji: "🗺️",
    isHashLink: true,
    requiresScrollHandler: true,
    canonicalVariant: VARIANTS.ACCELERATED_MEDICINE,
    allowedVariants: [VARIANTS.ACCELERATED_MEDICINE],
    keywords: ["Right to Try by state", "patient access survey"],
  },
  rightToTryModelAct: {
    id: "rightToTryModelAct",
    label: "Model Act",
    path: ROUTES.modelAct,
    description:
      "See how every patient can join a pragmatic trial and providers can publish comparable results.",
    emoji: "📄",
    canonicalVariant: VARIANTS.ACCELERATED_MEDICINE,
    allowedVariants: [VARIANTS.ACCELERATED_MEDICINE],
    keywords: [
      "Right to Trial model act",
      "patient access legislation",
      "experimental treatment licensing",
    ],
  },
  rightToTrialImpact: {
    id: "rightToTrialImpact",
    label: "Impact",
    path: ROUTES.impact,
    description:
      "See how Right to Trial can help patients join low-cost trials and find effective treatments sooner.",
    emoji: "⚡",
    canonicalVariant: VARIANTS.ACCELERATED_MEDICINE,
    allowedVariants: [VARIANTS.ACCELERATED_MEDICINE],
    keywords: [
      "Right to Trial impact",
      "pragmatic clinical trials",
      "treatment discovery",
      "clinical trial cost",
    ],
  },
  volunteer: {
    id: "volunteer",
    label: "Volunteer",
    path: ROUTES.contact,
    description:
      "Volunteer your skills to help more humans vote, share, and accelerate cures",
    emoji: "🤝",
    keywords: [
      "volunteer",
      "health advocacy",
      "medical research volunteer",
      "community action",
    ],
  },
  campaigns: {
    id: "campaigns",
    label: "Campaigns",
    path: ROUTES.campaigns,
    description:
      "Browse and support crowdfunding campaigns for medical research, clinical trials, and patient advocacy. Back projects accelerating cure discovery",
    emoji: "🚀",
    canonicalVariant: VARIANTS.WAR_ON_DISEASE,
    allowedVariants: [VARIANTS.WAR_ON_DISEASE],
    keywords: [
      "crowdfunding",
      "medical research funding",
      "clinical trial campaigns",
      "patient advocacy",
      "health crowdfunding",
    ],
  },

  // Find Treatment items (dfda canonical)
  conditions: {
    id: "conditions",
    label: "Conditions",
    path: ROUTES.conditions,
    description:
      "Browse medical conditions and explore available clinical trials. View treatment rankings and real-world effectiveness data for hundreds of health conditions",
    emoji: "🏥",
    canonicalVariant: VARIANTS.DFDA,
    allowedVariants: [VARIANTS.DFDA, VARIANTS.DIH],
    keywords: [
      "medical conditions",
      "disease database",
      "clinical trials",
      "treatment options",
      "health conditions",
    ],
  },
  treatments: {
    id: "treatments",
    label: "Treatments",
    path: ROUTES.treatments,
    description:
      "Explore treatments and interventions with comprehensive clinical trial data. Compare effectiveness metrics and therapeutic options across multiple medical conditions",
    emoji: "💊",
    canonicalVariant: VARIANTS.DFDA,
    allowedVariants: [VARIANTS.DFDA, VARIANTS.DIH],
    keywords: [
      "treatments",
      "medical interventions",
      "drug effectiveness",
      "therapeutic options",
      "treatment comparison",
    ],
  },
  findTrials: {
    id: "findTrials",
    label: "Find Trials",
    path: ROUTES.findTrials,
    description:
      "Search for active trials matching your condition, intervention, location, age, and study type",
    emoji: "🔍",
    canonicalVariant: VARIANTS.DFDA,
    allowedVariants: [VARIANTS.DFDA, VARIANTS.DIH],
    keywords: [
      "clinical trial search",
      "find trials",
      "ClinicalTrials.gov",
      "trial enrollment",
      "medical studies",
    ],
  },
  megaStudies: {
    id: "megaStudies",
    label: "Mega Studies",
    path: ROUTES.megaStudies,
    description:
      "Outcome labels for 10,000+ foods, drugs, and supplements with treatment effectiveness rankings measured by change from baseline across 100+ conditions",
    emoji: "📊",
    pageTitle: "Mega Studies - Treatment Effectiveness Rankings",
    canonicalVariant: VARIANTS.DFDA,
    allowedVariants: [VARIANTS.DFDA],
    keywords: [
      "treatment rankings",
      "drug effectiveness",
      "supplement data",
      "outcome labels",
      "clinical effectiveness",
      "health data",
    ],
    ogImage: "/assets/dfda/mega-studies-og.png",
    ogPrompt: `Create a data visualization design for "Mega Studies" - treatment effectiveness rankings.
      Style: Bold neobrutalist with thick black borders (4-8px), high contrast
      Colors: Bright pink (#FF6B9D), cyan (#00D9FF), yellow (#FFE66D) with black and white
      Content:
      - Main title: "MEGA STUDIES" in large, bold uppercase typography
      - Subtitle: "TREATMENT EFFECTIVENESS RANKINGS"
      - Visual elements: Bar charts showing treatment rankings, outcome labels, effectiveness meters
      - Data visualization: Thousands of data points aggregated into clean rankings
      - Medical elements: Pills, supplements, food icons with effectiveness scores
      - Numbers: "10,000+ VARIABLES" "100+ CONDITIONS" prominently displayed
      Layout: Data-driven, chart-focused composition
      Mood: Scientific, comprehensive, authoritative, data-rich
      Size: 1200x630 OG image format`,
  },
  observationalStudies: {
    id: "observationalStudies",
    label: "Observational Studies",
    path: ROUTES.observationalStudies,
    description:
      "Explore causal relationships between treatments and conditions from thousands of aggregated n-of-1 studies. Discover correlations and treatment effects from real-world patient data",
    emoji: "🔬",
    pageTitle: "Observational Studies - Aggregated N-of-1 Research",
    canonicalVariant: VARIANTS.DFDA,
    allowedVariants: [VARIANTS.DFDA],
    keywords: [
      "n-of-1 studies",
      "observational research",
      "causal relationships",
      "treatment effects",
      "patient data",
      "correlations",
    ],
    ogImage: "/assets/dfda/observational-studies-og.png",
    ogPrompt: `Create a scientific visualization for "Observational Studies" - n-of-1 research aggregation.
      Style: Bold neobrutalist with thick black borders (4-8px), high contrast
      Colors: Bright pink (#FF6B9D), cyan (#00D9FF), yellow (#FFE66D) with black and white
      Content:
      - Main title: "OBSERVATIONAL STUDIES" in large, bold uppercase typography
      - Subtitle: "AGGREGATED N-OF-1 RESEARCH"
      - Visual elements: Cause-effect arrows, correlation diagrams, network graphs
      - Data visualization: Individual data points combining into statistical patterns
      - Scientific elements: Microscope, DNA strands, correlation coefficients
      - Numbers: "1000s OF STUDIES" "CAUSAL RELATIONSHIPS" prominently displayed
      - Arrow diagrams showing: Treatment → Effect relationships
      Layout: Network/graph-focused showing cause-effect relationships
      Mood: Scientific, rigorous, discovery-focused, evidence-based
      Size: 1200x630 OG image format`,
  },

  // Evidence items (default public canonical)
  research: {
    id: "research",
    label: "Research & Evidence",
    path: ROUTES.research,
    description:
      "Comprehensive economic analysis showing pragmatic trials deliver 637:1 ROI with $172B+ recurring annual benefits. Peer-reviewed methodology and sensitivity testing",
    emoji: "📚",
    canonicalVariant: VARIANTS.WAR_ON_DISEASE,
    allowedVariants: [VARIANTS.WAR_ON_DISEASE, VARIANTS.DFDA],
    keywords: [
      "health economics",
      "ROI analysis",
      "pragmatic trial research",
      "medical research funding",
      "evidence-based policy",
    ],
  },
  references: {
    id: "references",
    label: "References",
    path: ROUTES.references,
    description:
      "Complete collection of source citations, quotes, and academic references supporting all claims in the War on Disease documentation",
    emoji: "📖",
    canonicalVariant: VARIANTS.WAR_ON_DISEASE,
    allowedVariants: [VARIANTS.WAR_ON_DISEASE, VARIANTS.DFDA],
    keywords: [
      "citations",
      "references",
      "academic sources",
      "research documentation",
      "evidence",
    ],
  },
  faq: {
    id: "faq",
    label: "FAQ",
    path: ROUTES.faq,
    description:
      "Answers about the 1% Treaty, pragmatic clinical trials, peace dividend economics, implementation feasibility, and how to help",
    emoji: "❓",
    keywords: [
      "FAQ",
      "1% treaty questions",
      "pragmatic trials FAQ",
      "clinical trial questions",
      "health policy FAQ",
    ],
  },

  // Movement items (warondisease.org canonical, shared with campaign variants)
  thePlan: {
    id: "thePlan",
    label: "The Plan",
    path: ROUTES.thePlan,
    description:
      "The full plan to end war and disease, organized by how you want to help: vote, share, build a coalition, or fund the campaign.",
    emoji: "🎯",
    canonicalVariant: VARIANTS.WAR_ON_DISEASE,
    allowedVariants: [VARIANTS.WAR_ON_DISEASE, VARIANTS.ACCELERATED_MEDICINE],
    keywords: [
      "plan",
      "manual",
      "strategy",
      "call script",
      "coalition",
      "donate",
      "advocacy",
      "1% treaty",
    ],
  },
  divisions: {
    id: "divisions",
    label: "Divisions",
    path: ROUTES.divisions,
    description:
      "Join the global coalition of 10M+ members across 50+ countries. Partner organizations include DAOs, nonprofits, research institutions, and patient advocacy groups",
    emoji: "🏛️",
    canonicalVariant: VARIANTS.WAR_ON_DISEASE,
    allowedVariants: [VARIANTS.WAR_ON_DISEASE],
    keywords: [
      "health coalition",
      "partner organizations",
      "DAOs",
      "nonprofits",
      "research institutions",
      "patient advocacy",
    ],
  },
  institutes: {
    id: "institutes",
    label: "Institutes",
    path: ROUTES.institutes,
    description:
      "Become a Partner Institute: healthcare organizations and nonprofits conducting 1% Treaty surveys, accessing grants, sharing data, and accelerating medical research",
    emoji: "🔬",
    canonicalVariant: VARIANTS.WAR_ON_DISEASE,
    allowedVariants: [VARIANTS.WAR_ON_DISEASE],
    keywords: [
      "partner institutes",
      "healthcare partnerships",
      "research institutions",
      "grant access",
      "medical surveys",
    ],
  },
  soldiers: {
    id: "soldiers",
    label: "Soldiers",
    path: ROUTES.soldiers,
    description:
      "Meet the top contributors fighting the war on disease. View our leaderboard of referrers, donors, and advocates with badges and impact metrics",
    emoji: "⚔️",
    canonicalVariant: VARIANTS.WAR_ON_DISEASE,
    allowedVariants: [VARIANTS.WAR_ON_DISEASE],
    keywords: [
      "leaderboard",
      "top contributors",
      "health advocates",
      "referral program",
      "community members",
    ],
  },
  team: {
    id: "team",
    label: "Team",
    path: ROUTES.team,
    description:
      "Meet the leadership team building decentralized health research. Accelerating cure discovery 82x faster through transparent, community-driven innovation",
    emoji: "👥",
    canonicalVariant: VARIANTS.ACCELERATED_MEDICINE,
    allowedVariants: [
      VARIANTS.ACCELERATED_MEDICINE,
      VARIANTS.CUREDAO,
      VARIANTS.WAR_ON_DISEASE,
      VARIANTS.DIH,
    ],
    keywords: [
      "team",
      "leadership",
      "founders",
      "decentralized health",
      "medical innovation",
    ],
  },

  // Dashboard (not shown in menus, accessed via avatar button)
  dashboard: {
    id: "dashboard",
    label: "Dashboard",
    path: ROUTES.dashboard,
    description:
      "Track your impact in the war on disease. View referral counts, earned badges, donation history, and calculated lives saved through your contributions",
    emoji: "📊",
    keywords: [
      "dashboard",
      "impact tracking",
      "referrals",
      "badges",
      "user profile",
    ],
  },

  mcp: {
    id: "mcp",
    label: "AI Health Tracker",
    pageTitle: "dFDA MCP Server",
    path: ROUTES.mcp,
    description:
      "Connect an AI assistant to dFDA to record personal health measurements, review your history, and manage tracking reminders.",
    emoji: "🤖",
    canonicalVariant: VARIANTS.DFDA,
    allowedVariants: [VARIANTS.DFDA],
    keywords: [
      "dFDA MCP server",
      "AI health tracker",
      "personal health data",
      "health reminders",
      "MCP",
    ],
    useSiteDefaultOg: true,
  },

  // Legal items
  privacy: {
    id: "privacy",
    label: "Privacy Policy",
    path: ROUTES.privacy,
    description:
      "How we collect, use, and protect your personal data. Our commitment to transparency and data security in medical research",
    keywords: ["privacy policy", "data protection", "GDPR", "user privacy"],
  },
  terms: {
    id: "terms",
    label: "Terms of Service",
    path: ROUTES.terms,
    description: "Terms and conditions for using this website",
    keywords: ["terms of service", "user agreement", "legal terms"],
  },
  contact: {
    id: "contact",
    label: "Contact",
    path: ROUTES.contact,
    description:
      "Get in touch with the DIH team. Questions about partnerships, volunteering, donations, or joining the war on disease",
    keywords: ["contact", "support", "partnerships", "volunteering"],
  },

  // External links (dFDA ecosystem)
  dfdaImpact: {
    id: "dfdaImpact",
    label: "Cost-Benefit Analysis",
    path: "https://impact.dfda.earth",
    description:
      "Interactive analysis showing how pragmatic trials could reduce drug development from $41K to $929 per patient and save 10.7 billion lives",
    emoji: "📊",
    isExternal: true,
    keywords: [
      "cost-benefit analysis",
      "pragmatic trial ROI",
      "lives saved",
      "health economics",
      "drug development cost",
    ],
  },
  dfdaSpec: {
    id: "dfdaSpec",
    label: "Protocol Specification",
    path: "https://spec.dfda.earth",
    description:
      "The two-stage methodology: observational signal detection from real-world patient data, then pragmatic trial confirmation at 44x lower cost",
    emoji: "📖",
    isExternal: true,
    keywords: [
      "protocol specification",
      "dFDA methodology",
      "observational studies",
      "pragmatic trials",
      "treatment rankings",
    ],
  },
  dfdaStudies: {
    id: "dfdaStudies",
    label: "Personal Health Studies",
    path: "https://studies.dfda.earth",
    description:
      "Track health outcomes and discover hidden patterns. 7,000+ crowdsourced studies on the causes and effects of foods, drugs, and supplements",
    emoji: "🔬",
    isExternal: true,
    keywords: [
      "health tracking",
      "crowdsourced studies",
      "personal health",
      "outcome tracking",
      "supplement effects",
    ],
  },

  // Manual / Podcast / Media
  manual: {
    id: "manual",
    label: "The Field Manual",
    path: MANUAL_URLS.readOnline,
    description:
      "An alien wrote 300 pages on how to point everyone's greed at diseases instead of each other. Read, listen, or buy the complete idiot's guide to legally bribing your way to utopia",
    emoji: "📖",
    isExternal: true,
    keywords: [
      "manual",
      "field manual",
      "audiobook",
      "podcast",
      "how to end war and disease",
    ],
  },
  listenPodcast: {
    id: "listenPodcast",
    label: "Podcast",
    path: "https://manual.warondisease.org/listen",
    description:
      "Every chapter narrated by an alien who finds your species confusing. Free on Spotify, Apple Podcasts, and all major apps",
    emoji: "🎧",
    isExternal: true,
    keywords: [
      "audiobook",
      "podcast",
      "spotify",
      "apple podcasts",
      "listen free",
    ],
  },
  readOnline: {
    id: "readOnline",
    label: "Get the Manual",
    path: MANUAL_URLS.readOnline,
    description:
      "The full guide to not dying unnecessarily. Free, no account needed",
    emoji: "📚",
    isExternal: true,
    keywords: ["read online", "free", "manual", "web"],
  },
  youtubeChannel: {
    id: "youtubeChannel",
    label: "YouTube",
    path: SOCIAL_URLS.youtube,
    description: "Subscribe to the War on Disease YouTube channel",
    emoji: "▶️",
    isExternal: true,
    keywords: ["youtube", "video", "subscribe"],
  },
} as const;

export type NavItemId = keyof typeof NAV_ITEMS_MAP;

/**
 * Get a navigation item by its ID
 */
export function getNavItem(id: NavItemId): NavItem {
  return NAV_ITEMS_MAP[id];
}

/**
 * Get multiple navigation items by their IDs
 */
export function getNavItems(ids: NavItemId[]): NavItem[] {
  return ids.map((id) => NAV_ITEMS_MAP[id]);
}

/**
 * Generate Next.js Metadata from a nav item
 *
 * This allows pages to use nav items as the single source of truth for metadata.
 * Canonical URL is derived from canonicalVariant using getVariantDomain().
 * OG image is included if ogImage is defined on the nav item.
 *
 * @example
 * // app/mega-studies/page.tsx
 * import { getPageMetadata } from './nav-items'
 * export const metadata = getPageMetadata('megaStudies')
 */
export function getPageMetadata(id: NavItemId): Metadata {
  const item = NAV_ITEMS_MAP[id] as NavItem;
  const canonicalDomain = item.canonicalVariant
    ? getVariantDomain(item.canonicalVariant)
    : null;
  const title = item.pageTitle || item.label;

  return {
    title,
    description: item.description,
    ...(item.keywords && {
      keywords: item.keywords as string[],
    }),
    ...(canonicalDomain && {
      alternates: {
        canonical: `https://${canonicalDomain}${item.path}`,
      },
    }),
    ...(item.ogImage && {
      openGraph: {
        title,
        description: item.description,
        images: [{ url: item.ogImage }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description: item.description,
        images: [item.ogImage],
      },
    }),
  };
}
