/**
 * Site Configuration System
 *
 * This file is the SINGLE SOURCE OF TRUTH for the multi-site strategy.
 * One codebase powers multiple domains, each with distinct positioning and audience.
 *
 * ============================================================================
 * MULTI-SITE STRATEGY OVERVIEW
 * ============================================================================
 *
 * We operate a spectrum of sites from emotionally gripping to ultra-neutral:
 *
 * 1. warondisease.org (501c4) - EMOTIONAL CAMPAIGN WRAPPER
 *    - Audience: General public, activists, social media sharers
 *    - Tone: Urgent, moral, cinematic, military metaphors welcome
 *    - Goal: Convert visitors to votes + referrals (viral growth)
 *    - Navigation: Ruthlessly simple (vote, plan, faq, about)
 *    - Content: Default public canonical surface for campaign, evidence, and movement pages
 *    - "War on Disease" = the STORY, CAMPAIGN, and primary public site
 *
 * 2. dih.earth (501c3) - INSTITUTIONAL HOME
 *    - Audience: Donors, economists, policy people, foundation staff
 *    - Tone: Calm, analytical, professional, evidence-based
 *    - Goal: Trust-building, partnerships, funding, legitimacy
 *    - Navigation: Landing-page focused; non-home public pages redirect to warondisease.org
 *    - Content: Institutional entry point for the underlying nonprofit and governance layer
 *    - "Decentralized Institutes of Health" = INFRASTRUCTURE and GOVERNANCE
 *
 * 3. trialabundancesurvey.org (survey) - ULTRA-NEUTRAL PORTAL
 *    - Audience: Super-nervous nonprofits who see DIH as competitor
 *    - Tone: Academic, neutral, non-threatening, apolitical
 *    - Goal: Just collect survey data without scaring partners
 *    - Navigation: Minimal (vote, faq only)
 *    - Content: No military language, no movement rhetoric
 *    - "Global Clinical Trial Abundance Survey" = RESEARCH INSTRUMENT
 *
 * 4. dfda.earth (dfda) - CLINICAL ENCYCLOPEDIA
 *    - Audience: Patients, clinicians, health nerds seeking treatment info
 *    - Tone: Medical, evidence-based, utilitarian, helpful
 *    - Goal: Treatment rankings, outcome labels, trial referrals
 *    - Navigation: Treatment-focused (conditions, treatments, trials)
 *    - Content: Medical evidence (NOT macro-economic policy)
 *    - "Decentralized FDA" = TREATMENT INFORMATION PRODUCT
 *
 * 5. manual.warondisease.org - LONG-FORM HANDBOOK
 *    - Audience: Deep readers, researchers, activists wanting full context
 *    - Tone: Narrative, comprehensive, book-length
 *    - Goal: Complete field manual for the movement
 *    - Content: "How to End War and Disease" whitepaper/book
 *    - Note: Separate deployment, not in this codebase
 *
 * 6. mikepsinn.com (director) - PERSONAL SITE
 *    - Audience: People interested in the director personally
 *    - Tone: Personal, professional
 *    - Goal: Personal brand, bio, contact
 *
 * 7. warondisease.org/u/[username] (user) - INDIVIDUAL PROFILES
 *    - Audience: Supporters sharing their impact
 *    - Tone: Personal achievement, gamification
 *    - Goal: Social proof, referral motivation
 *
 * ============================================================================
 * NAVIGATION PHILOSOPHY
 * ============================================================================
 *
 * Each variant has distinct navigation to serve its audience:
 *
 * - warondisease.org: Simple, action-centric (don't dilute the ask)
 * - dih.earth: Institutional landing page (route deeper public content to War on Disease)
 * - trialabundancesurvey.org: Minimal (reduce intimidation factor)
 * - dfda.earth: Treatment-first (clinical decision support)
 *
 * The navigation system uses:
 * - topLevelNavItems: Outside accordion, always visible
 * - sidebarSections: Accordion sections with grouped items
 * - footerSections: Footer column organization
 *
 * ============================================================================
 * MESSAGING & TONE DIFFERENTIATION
 * ============================================================================
 *
 * Language varies by variant:
 *
 * Military metaphors:
 * - ✅ warondisease.org: "Soldiers", "Enlist", "Divisions", "The Plan"
 * - ⚠️ dih.earth: Soften to "Contributors", "Partners" (professional)
 * - ❌ trialabundancesurvey.org: None (neutral language only)
 * - ❌ dfda.earth: None (medical language only)
 *
 * Emotional intensity:
 * - 🔥 warondisease.org: High (suffering, urgency, moral imperative)
 * - 📊 dih.earth: Medium (impact numbers, credibility signals)
 * - 📋 trialabundancesurvey.org: Low (academic, neutral)
 * - 🏥 dfda.earth: Medium (evidence-based, medical)
 *
 * ============================================================================
 * CROSS-SITE NAVIGATION PATTERNS
 * ============================================================================
 *
 * Sites link to each other strategically:
 *
 * From warondisease.org:
 * - "See the math" → warondisease.org/research
 * - "Read the manual" → manual.warondisease.org
 * - "Find treatments" → dfda.earth
 *
 * From dih.earth:
 * - "Vote on the treaty" → warondisease.org
 * - "For patients" → dfda.earth
 * - "Partner survey" → trialabundancesurvey.org
 *
 * ============================================================================
 *
 * Supported site variants (using domain names for clarity):
 * - dih.earth: DIH institutional landing page
 * - warondisease.org: Default public/canonical site - emotional/campaign
 * - trialabundancesurvey.org: Ultra-neutral survey portal
 * - dfda: Decentralized FDA (dfda.earth) - clinical encyclopedia
 * - director: Executive Director's personal website (mikepsinn.com)
 * - user: Individual user profile pages on warondisease.org
 */

import { env } from "./env";
import type { Metadata } from "next";
import type { NavItemId, NavItem } from "./nav-items";
import { getNavItems } from "./nav-items";
import {
  WAR_ON_DISEASE_FAQ,
  DIH_FAQ,
  WISHOCRACY_FAQ,
  DFDA_FAQ,
  SURVEY_FAQ,
} from "./faq";
import { createLogger } from "./logger";
import { MESSAGING } from "./messaging";

// Re-export variant types and constants (defined in site-variant-types.ts to avoid circular dependencies)
export type { SiteVariant } from "./site-variant-types";
export { VARIANTS, SITE_VARIANTS, DEFAULT_VARIANT } from "./site-variant-types";

import type { SiteVariant } from "./site-variant-types";
import {
  DEFAULT_VARIANT,
  VARIANTS,
  getVariantDomain,
} from "./site-variant-types";

// Create logger for this module
const logger = createLogger("site-config");
const INSTITUTE_FOR_ACCELERATED_MEDICINE = "Institute for Accelerated Medicine";
const IAM_501C3_FOOTER_NOTICE = `${INSTITUTE_FOR_ACCELERATED_MEDICINE} is a 501(c)(3) nonprofit. EIN: 41-2555651. Donations are tax-deductible.`;

// ===== INTERFACES =====

export const SITE_FEATURES = {
  VOTING: "voting",
  SURVEY: "survey",
  FAQ: "faq",
  ADVOCACY: "advocacy",
  MOVEMENT: "movement",
  TEAM: "team",
  RESEARCH: "research",
  TRIALS: "trials",
  EDUCATION: "education",
  CONDITIONS: "conditions",
  TREATMENTS: "treatments",
  DONATE: "donate",
  WISHOCRACY: "wishocracy",
  PROFILE: "profile",
  REFERRALS: "referrals",
  IMPACT: "impact",
} as const;

export type SiteFeature = (typeof SITE_FEATURES)[keyof typeof SITE_FEATURES];

export const ALL_SITE_FEATURES = Object.freeze(
  Object.values(SITE_FEATURES) as SiteFeature[],
);

const NON_PUBLIC_SITE_FEATURES = new Set<SiteFeature>([
  SITE_FEATURES.PROFILE,
  SITE_FEATURES.REFERRALS,
  SITE_FEATURES.IMPACT,
]);

export const ALL_PUBLIC_SITE_FEATURES = Object.freeze(
  ALL_SITE_FEATURES.filter((feature) => !NON_PUBLIC_SITE_FEATURES.has(feature)),
);

export type SitemapDynamicRouteGroup =
  | "conditions"
  | "treatments"
  | "conditionTreatments";

export interface SiteRoutingConfig {
  /** Send non-home page requests for this variant to another public variant. */
  nonLandingPageRedirectTarget?: SiteVariant;
  /** Disable canonical-route redirects for variants that intentionally expose all pages. */
  skipCanonicalRedirects?: boolean;
}

export interface SiteSitemapConfig {
  /** Only include the homepage in this variant's sitemap. */
  landingPageOnly?: boolean;
  /** Add every known public static page, even when not present in nav. */
  includePublicPageRoutes?: boolean;
  /** Dynamic route groups this variant should expose in its sitemap. */
  dynamicRouteGroups?: readonly SitemapDynamicRouteGroup[];
}

/**
 * Navigation section for sidebar (accordion structure)
 */
export interface NavSection {
  id: string;
  label: string; // e.g., "FIND TREATMENT", "THE EVIDENCE"
  items: NavItemId[];
}

/**
 * Footer column section
 */
export interface FooterSection {
  id: string;
  label: string; // e.g., "TAKE ACTION", "RESOURCES"
  items: NavItemId[];
}

/**
 * Footer branding (first column)
 */
export interface FooterBranding {
  title: string; // e.g., "THE DECENTRALIZED INSTITUTES OF HEALTH"
  tagline: string; // e.g., "MAKING SUFFERING OPTIONAL THROUGH MATH"
}

/**
 * Contact information (footer contact column)
 */
export interface ContactInfo {
  email: string;
  website: string;
  websiteLabel: string; // e.g., "DIH.earth"
}

/**
 * Impact analysis link for pages/components that point to the detailed economic model
 */
export interface ImpactAnalysisInfo {
  url: string;
  label: string;
}

/**
 * Default icon configuration for favicons and app icons
 * Used by all variants unless overridden
 */
export const DEFAULT_ICONS: Metadata["icons"] = {
  icon: [
    {
      url: "/assets/dih/dih-icon-32x32.png",
      sizes: "32x32",
      type: "image/png",
    },
    {
      url: "/assets/dih/android-chrome-192x192.png",
      sizes: "192x192",
      type: "image/png",
    },
  ],
  apple: {
    url: "/assets/dih/apple-touch-icon.png",
    sizes: "180x180",
    type: "image/png",
  },
  other: [
    {
      rel: "icon",
      url: "/assets/dih/android-chrome-512x512.png",
      sizes: "512x512",
      type: "image/png",
    },
  ],
};

/**
 * Email branding configuration
 */
export interface EmailBranding {
  fromName: string; // e.g. "DIH Team" or "Trial Abundance Survey"
  primaryColor: string; // e.g. "#FF6B9D" or "#000000"
  secondaryColor: string; // e.g. "#00D4FF" or "#FFFFFF"
  orgName: string; // e.g. "The Decentralized Institutes of Health"
  footerText?: string; // Optional override for footer text
}

/**
 * Open Graph metadata configuration
 */
export interface OgMetadata {
  /** OG image URL (relative to public/) - used for OpenGraph, Facebook, LinkedIn */
  image: string;
  /** Image width in pixels */
  width: number;
  /** Image height in pixels */
  height: number;
  /** Image alt text */
  alt?: string;
  /** Optional override title (defaults to site title) */
  title?: string;
  /** Optional override description (defaults to site description) */
  description?: string;
  /** Optional Twitter-specific image (1200x675 recommended for summary_large_image) */
  twitterImage?: {
    url: string;
    width: number;
    height: number;
  };
}

/**
 * FAQ configuration
 */
export interface FaqConfig {
  /** Page title (e.g., "Frequently Asked Questions") */
  title: string;

  /** Page subtitle/description */
  subtitle: string;

  /** FAQ sections grouped by category */
  sections: Array<{
    category: string;
    questions: Array<{
      q: string;
      a: string;
    }>;
  }>;

  /** CTA section at bottom of FAQ page */
  ctaSection?: {
    title: string;
    subtitle: string;
    buttons: Array<{
      label: string;
      href: string;
      variant?: "primary" | "secondary";
    }>;
  };
}

export interface SiteConfig {
  /** Short name (e.g., "DIH", "dFDA") - used in compact UI */
  name: string;

  /** Full title/organization name (e.g., "Decentralized Institutes of Health") - used in headers, emails, metadata */
  title: string;

  /** Site description - used for both human-readable taglines AND SEO meta descriptions */
  description: string;

  /**
   * Favicon and Apple Touch Icons
   * Required for all site variants - use DEFAULT_ICONS as a starting point
   */
  icons: Metadata["icons"];

  /**
   * All domains that should route to this variant
   * Used to auto-generate DOMAIN_TO_VARIANT mapping
   * Example: ['dih.earth', 'www.dih.earth', 'cure.vote']
   */
  domains?: string[];

  /** Base URL for the site (e.g., "https://dih.earth") - used as fallback when NEXT_PUBLIC_BASE_URL is not set */
  baseUrl: string;

  /** Domain name (e.g., "dih.earth") - used in UI text */
  domain: string;

  /** Canonical URL for SEO (e.g., "https://dih.earth") - each variant should canonicalize to itself since content is distinct */
  canonicalUrl?: string;

  /** Contact email (e.g., "hello@dih.earth") */
  email: string;

  /** Default route when user visits / */
  defaultRoute: string;

  /** Features enabled for this variant */
  enabledFeatures: readonly SiteFeature[];

  /** Whether to show political advocacy content */
  showPoliticalContent: boolean;

  /** Whether to load the manual's floating promotion bar. */
  promotionBarEnabled?: boolean;

  /** Whether this app exposes NextAuth API routes. Defaults to true. */
  authEnabled?: boolean;

  /** Whether this app exposes a local dashboard route. Defaults to true. */
  dashboardEnabled?: boolean;

  /** Routing behavior that applies before page rendering. */
  routing?: SiteRoutingConfig;

  /** Sitemap behavior for generated static sitemap XML. */
  sitemap?: SiteSitemapConfig;

  // ===== NAVIGATION SYSTEM =====

  /** Top-level navigation items (shown outside accordion in sidebar) */
  topLevelNavItems?: NavItemId[];

  /** Sidebar accordion sections */
  sidebarSections?: NavSection[];

  /** Footer branding (first column) */
  footerBranding?: FooterBranding;

  /** Footer column sections */
  footerSections?: FooterSection[];

  /** Contact information (footer contact column) */
  contactInfo?: ContactInfo;

  /** Link to the full impact/economic analysis */
  impactAnalysis?: ImpactAnalysisInfo;

  /** Legal entity name used on privacy policy, terms, and other formal/legal surfaces */
  legalEntityName?: string;

  /** Legal links (bottom of footer) */
  legalItems?: NavItemId[];

  /** Copyright text (bottom of footer) */
  copyrightText?: string;

  /** Optional footer compliance / nonprofit notice shown below copyright */
  footerComplianceNotice?: string;

  /** Email branding configuration */
  emailBranding: EmailBranding;

  /** Open Graph metadata (fallback when pages don't specify their own) */
  ogMetadata: OgMetadata;

  /** FAQ configuration for this variant */
  faq?: FaqConfig;

  /**
   * AI prompt for generating favicon/app icon (REQUIRED)
   * Keep concise: simple symbol/letters, bold, transparent background
   */
  faviconPrompt: string;

  /**
   * AI prompt for generating OG/social media images (REQUIRED)
   * Keep concise: 1200x630 landscape, neobrutalist style
   */
  ogPrompt: string;
}

const siteConfigs: Record<SiteVariant, SiteConfig> = {
  // ============================================================================
  // dih.earth - INSTITUTIONAL HOME (Professional/Credible)
  // ============================================================================
  // Audience: Donors, economists, policy people, foundation staff, nonprofits
  // Tone: Calm, analytical, professional, evidence-based
  // Goal: Trust-building, partnerships, funding, legitimacy
  // Navigation: landing focused; non-home public routes redirect to War on Disease.
  // Messaging: Economic model prominence, rigorous methodology, soften military language
  "dih.earth": {
    name: "DIH",
    title: "Decentralized Institutes of Health",
    description:
      "A global research initiative to accelerate medical progress through pragmatic clinical trials.",
    domains: [
      "dih.earth",
      "www.dih.earth",
      "cure.vote",
      "www.cure.vote",
      "localhost",
      "localhost:3000",
    ],
    baseUrl: "https://dih.earth",
    domain: "dih.earth",
    email: "hello@dih.earth",
    defaultRoute: "/",
    enabledFeatures: [
      SITE_FEATURES.SURVEY,
      SITE_FEATURES.RESEARCH,
      SITE_FEATURES.TRIALS,
      SITE_FEATURES.EDUCATION,
      SITE_FEATURES.CONDITIONS,
      SITE_FEATURES.TREATMENTS,
      SITE_FEATURES.MOVEMENT,
    ],
    showPoliticalContent: false,
    routing: {
      nonLandingPageRedirectTarget: VARIANTS.WAR_ON_DISEASE,
    },
    sitemap: {
      landingPageOnly: true,
    },
    icons: {
      icon: [
        { url: "/assets/dih/favicon.ico", sizes: "any" },
        {
          url: "/assets/dih/dih-icon-32x32.png",
          sizes: "32x32",
          type: "image/png",
        },
        {
          url: "/assets/dih/android-chrome-192x192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          url: "/assets/dih/android-chrome-512x512.png",
          sizes: "512x512",
          type: "image/png",
        },
      ],
      apple: {
        url: "/assets/dih/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
      other: [
        {
          rel: "icon",
          url: "/assets/dih/dih-icon-transparent-1024.png",
          sizes: "1024x1024",
          type: "image/png",
        },
      ],
    },

    // Navigation system - Optimized for conversion: vote (survey), the plan, and institutes are top-level
    topLevelNavItems: ["vote", "thePlan", "institutes"],
    sidebarSections: [
      {
        id: "find-treatment",
        label: "FIND TREATMENT",
        items: ["conditions", "treatments", "findTrials"],
      },
      {
        id: "evidence",
        label: "THE EVIDENCE",
        items: ["research", "references", "faq"],
      },
      {
        id: "support",
        label: "SUPPORT THE MISSION",
        items: [
          "thePlan",
          "donate",
          "volunteer",
          /* 'campaigns', */ "divisions",
          "soldiers",
        ],
      },
    ],
    footerBranding: {
      title: "THE DECENTRALIZED INSTITUTES OF HEALTH",
      tagline: "MAKING SUFFERING OPTIONAL THROUGH MATH",
    },
    footerSections: [
      {
        id: "join",
        label: "VOTE ON THE TREATY",
        items: ["vote", "thePlan", "institutes", "donate", "volunteer"],
      },
      {
        id: "manual",
        label: "GET THE MANUAL",
        items: [
          "manual",
          "listenPodcast",
          "buyPaperback",
          "readOnline",
          "youtubeChannel",
        ],
      },
      {
        id: "resources",
        label: "RESOURCES",
        items: [
          "conditions",
          "treatments",
          "research",
          "references",
          "about",
          "dfdaStudies",
        ],
      },
    ],
    contactInfo: {
      email: "hello@dih.earth",
      website: "https://dih.earth",
      websiteLabel: "DIH.earth",
    },
    impactAnalysis: {
      url: "https://impact.warondisease.org",
      label: "impact.warondisease.org",
    },
    legalEntityName: INSTITUTE_FOR_ACCELERATED_MEDICINE,
    emailBranding: {
      fromName: "DIH Team",
      primaryColor: "#FF6B9D",
      secondaryColor: "#00D4FF",
      orgName: "The Decentralized Institutes of Health",
    },
    ogMetadata: {
      image: "/assets/dih/dih-og-social-70s-utopian-1280x640.png",
      width: 1280,
      height: 640,
      alt: "Decentralized Institutes of Health - Making Suffering Optional Through Math",
    },
    legalItems: ["privacy", "terms"],
    copyrightText: "© 2025 Institute for Accelerated Medicine | CC BY-NC 4.0",
    footerComplianceNotice: IAM_501C3_FOOTER_NOTICE,
    faq: DIH_FAQ,

    // Image generation prompts
    faviconPrompt: `Cyan DNA double helix, thick black outline, magenta (#FF00FF) background.`,

    ogPrompt: `"DECENTRALIZED INSTITUTES OF HEALTH" neobrutalist. Pink/cyan/black. Network nodes, DNA helix, globe. Global research initiative. ${MESSAGING.mechanism.pragmaticTrials}. "ACCELERATE MEDICAL PROGRESS • ${MESSAGING.impact.vision.makeSufferingOptional.toUpperCase()}".`,
  },

  // ============================================================================
  // warondisease.org - EMOTIONAL CAMPAIGN WRAPPER (Activist/Movement)
  // ============================================================================
  // Audience: General public, activists, social media sharers, patients
  // Tone: Urgent, moral, cinematic, military metaphors welcome
  // Goal: Convert visitors to votes + referrals (viral growth)
  // Navigation: Ruthlessly simple (don't dilute the ask)
  // Messaging: Emotion-first, evidence links to dih.earth
  "warondisease.org": {
    name: "IC2EWD",
    title: "The International Campaign to End War and Disease",
    domains: [
      "warondisease.org",
      "www.warondisease.org",
      "act.warondisease.org",
      "www.act.warondisease.org",
    ],
    description: `Click a glowing rectangle. 15 seconds. ${MESSAGING.impact.perVote.combined}.`,
    baseUrl: "https://warondisease.org",
    domain: "warondisease.org",
    email: "hello@warondisease.org",
    defaultRoute: "/",
    enabledFeatures: ALL_PUBLIC_SITE_FEATURES,
    showPoliticalContent: true,
    promotionBarEnabled: true,
    routing: {
      skipCanonicalRedirects: true,
    },
    sitemap: {
      includePublicPageRoutes: true,
      dynamicRouteGroups: ["conditions", "treatments", "conditionTreatments"],
    },
    icons: {
      icon: [
        { url: "/assets/warondisease/warondisease-favicon.png", sizes: "any" },
        {
          url: "/assets/warondisease/warondisease-favicon-32x32.png",
          sizes: "32x32",
          type: "image/png",
        },
        {
          url: "/assets/warondisease/warondisease-android-chrome-192x192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          url: "/assets/warondisease/warondisease-android-chrome-512x512.png",
          sizes: "512x512",
          type: "image/png",
        },
      ],
      apple: {
        url: "/assets/warondisease/warondisease-apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
      other: [
        {
          rel: "icon",
          url: "/assets/warondisease/warondisease-favicon-master.png",
          sizes: "1024x1024",
          type: "image/png",
        },
      ],
    },

    // Navigation: flat, action-first. No sidebar accordion — every extra label dilutes the CTA.
    // Primary: Vote (core action). Soldiers (viral leaderboard). Campaigns (expected-value crowdfunding).
    // Manual (long-form conversion). Secondary links live in the footer.
    topLevelNavItems: ["vote", "soldiers", "manual"],
    sidebarSections: [],
    footerBranding: {
      title: "THE WAR ON DISEASE",
      tagline: "MAKING SUFFERING OPTIONAL",
    },
    footerSections: [
      {
        id: "act",
        label: "ACT",
        items: ["vote", "campaigns", "soldiers"],
      },
      {
        id: "learn",
        label: "LEARN",
        items: [
          "about",
          "faq",
          "thePlan",
          "manual",
          "readOnline",
          "listenPodcast",
        ],
      },
      {
        id: "connect",
        label: "CONNECT",
        items: ["institutes", "volunteer"],
      },
    ],
    contactInfo: {
      email: "hello@warondisease.org",
      website: "https://warondisease.org",
      websiteLabel: "WarOnDisease.org",
    },
    impactAnalysis: {
      url: "https://impact.warondisease.org",
      label: "impact.warondisease.org",
    },
    legalEntityName: INSTITUTE_FOR_ACCELERATED_MEDICINE,
    emailBranding: {
      fromName: "DIH Advocacy",
      primaryColor: "#FF6B9D",
      secondaryColor: "#00D4FF",
      orgName: "The War on Disease",
    },
    ogMetadata: {
      image: "/assets/warondisease/war-on-disease-og-1200x630.png",
      width: 1200,
      height: 630,
      alt: "War on Disease - Making Suffering Optional",
      twitterImage: {
        url: "/assets/warondisease/war-on-disease-og-1200x630.png",
        width: 1200,
        height: 630,
      },
    },
    legalItems: ["privacy", "terms"],
    copyrightText: "© 2025 Institute for Accelerated Medicine | CC BY-NC 4.0",
    footerComplianceNotice: IAM_501C3_FOOTER_NOTICE,
    faq: WAR_ON_DISEASE_FAQ,

    // Image generation prompts
    faviconPrompt: `White skull inside red circle with diagonal red slash (prohibited sign), thick black outline, magenta (#FF00FF) background.`,

    ogPrompt: `"WAR ON DISEASE" 1950s propaganda poster. Pink/cyan/yellow/black. Heroic medical workers, globe, clock. Global campaign. ${MESSAGING.mechanism.pragmaticTrials}. "${MESSAGING.impact.curesArriveXYearsSooner.years} YEARS FASTER • ${MESSAGING.impact.globalImpactAtTippingPoint.totalLivesSaved.toUpperCase()} SAVED • ${MESSAGING.impact.vision.makeSufferingOptional.toUpperCase()}".`,
  },

  // ============================================================================
  // dfda: dfda.earth - CLINICAL ENCYCLOPEDIA (Medical/Evidence-Based)
  // ============================================================================
  // Audience: Patients, clinicians, health nerds seeking treatment information
  // Tone: Medical, evidence-based, utilitarian, helpful
  // Goal: Treatment rankings, outcome labels, trial referrals
  // Navigation: Treatment-focused (conditions → treatments → trials)
  // Messaging: Medical evidence only (NOT macro-economic policy), no military language
  dfda: {
    name: "dFDA",
    title: "dFDA",
    description:
      "A decentralized framework for drug assessment for ranking treatments by real-world effectiveness and outcome labels showing the positive and negative effects of every food and drug in the world.",
    domains: ["dfda.earth", "www.dfda.earth", "dfda.dih.earth"],
    baseUrl: "https://dfda.earth",
    domain: "dfda.earth",
    email: "hello@dfda.earth",
    defaultRoute: "/",
    enabledFeatures: [
      SITE_FEATURES.CONDITIONS,
      SITE_FEATURES.TREATMENTS,
      SITE_FEATURES.TRIALS,
      SITE_FEATURES.RESEARCH,
      SITE_FEATURES.EDUCATION,
    ],
    showPoliticalContent: false,
    dashboardEnabled: false,
    sitemap: {
      dynamicRouteGroups: ["conditions", "treatments", "conditionTreatments"],
    },
    icons: {
      icon: [
        { url: "/assets/dfda/favicon.ico", sizes: "any" },
        {
          url: "/assets/dfda/favicon-32x32.png",
          sizes: "32x32",
          type: "image/png",
        },
        {
          url: "/assets/dfda/android-chrome-192x192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          url: "/assets/dfda/android-chrome-512x512.png",
          sizes: "512x512",
          type: "image/png",
        },
      ],
      apple: {
        url: "/assets/dfda/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
      other: [
        {
          rel: "icon",
          url: "/assets/dfda/android-chrome-512x512.png",
          sizes: "512x512",
          type: "image/png",
        },
      ],
    },

    // Navigation system - TREATMENT-FOCUSED for clinical encyclopedia
    // Priority: Conditions → Treatments → Trials → Studies
    // Research scoped to MEDICAL EVIDENCE (not macro-economic policy)
    topLevelNavItems: ["conditions", "treatments"],
    sidebarSections: [
      {
        id: "find-treatment",
        label: "FIND TREATMENT",
        items: ["conditions", "treatments", "findTrials"],
      },
      {
        id: "studies",
        label: "STUDIES",
        items: ["megaStudies", "observationalStudies"],
      },
      {
        id: "evidence",
        label: "MEDICAL EVIDENCE",
        items: ["research", "references", "faq"],
      },
      {
        id: "studies-tools",
        label: "STUDIES & TOOLS",
        items: ["dfdaStudies", "dfdaImpact", "dfdaSpec"],
      },
    ],
    footerBranding: {
      title: "DECENTRALIZED FRAMEWORK FOR DRUG ASSESSMENT",
      tagline: "EVIDENCE-BASED TREATMENT INFORMATION",
    },
    footerSections: [
      {
        id: "treatments",
        label: "TREATMENTS",
        items: ["conditions", "treatments", "findTrials"],
      },
      {
        id: "resources",
        label: "RESOURCES",
        items: [
          "about",
          "research",
          "faq",
          "dfdaImpact",
          "dfdaSpec",
          "dfdaStudies",
        ],
      },
    ],
    contactInfo: {
      email: "hello@dfda.earth",
      website: "https://dfda.earth",
      websiteLabel: "dFDA.earth",
    },
    impactAnalysis: {
      url: "https://impact.warondisease.org",
      label: "impact.warondisease.org",
    },
    legalEntityName: INSTITUTE_FOR_ACCELERATED_MEDICINE,
    emailBranding: {
      fromName: "dFDA Team",
      primaryColor: "#2563eb", // Blue for medical credibility
      secondaryColor: "#ffffff",
      orgName: "Decentralized Framework for Drug Assessment",
    },
    ogMetadata: {
      image: "/assets/dfda/dfda-og-1200x630.png",
      width: 1200,
      height: 630,
      alt: "Decentralized Framework for Drug Assessment - Evidence-Based Treatment Information",
    },
    legalItems: ["privacy", "terms"],
    copyrightText: "© 2025 Institute for Accelerated Medicine | CC BY-NC 4.0",
    faq: DFDA_FAQ,

    // Image generation prompts
    faviconPrompt: `Blue pill capsule with white checkmark, thick black outline, magenta (#FF00FF) background.`,

    ogPrompt: `"${MESSAGING.dfda.abbreviation}" scientific neobrutalist. Blue/white/black. Data charts, pills, ranking bars, nutrition labels. ${MESSAGING.dfda.purpose}. Outcome labels for every food and drug. "${MESSAGING.dfda.fullTerm.toUpperCase()}".`,
  },

  user: {
    name: "Hero",
    title: "Hero in the War on Disease",
    description: "View this soldier's impact in the war on disease.",
    baseUrl: "https://warondisease.org",
    domain: "warondisease.org",
    email: "hello@warondisease.org",
    defaultRoute: "/user-profile", // Special route that redirects to user's profile
    enabledFeatures: [
      SITE_FEATURES.PROFILE,
      SITE_FEATURES.REFERRALS,
      SITE_FEATURES.IMPACT,
    ],
    showPoliticalContent: false,
    icons: {
      icon: [
        { url: "/assets/dih/favicon.ico", sizes: "any" },
        {
          url: "/assets/dih/dih-icon-32x32.png",
          sizes: "32x32",
          type: "image/png",
        },
        {
          url: "/assets/dih/android-chrome-192x192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          url: "/assets/dih/android-chrome-512x512.png",
          sizes: "512x512",
          type: "image/png",
        },
      ],
      apple: {
        url: "/assets/dih/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
      other: [
        {
          rel: "icon",
          url: "/assets/dih/dih-icon-transparent-1024.png",
          sizes: "1024x1024",
          type: "image/png",
        },
      ],
    },
    emailBranding: {
      fromName: "DIH Team",
      primaryColor: "#FF6B9D",
      secondaryColor: "#00D4FF",
      orgName: "The Decentralized Institutes of Health",
    },
    impactAnalysis: {
      url: "https://impact.warondisease.org",
      label: "impact.warondisease.org",
    },
    legalEntityName: INSTITUTE_FOR_ACCELERATED_MEDICINE,
    ogMetadata: {
      image: "/assets/dih/dih-og-social-1280x640.png",
      width: 1280,
      height: 640,
      alt: "Hero in the War on Disease",
    },

    // Image generation prompts (uses DIH branding)
    faviconPrompt: `Pink shield with white heart inside, thick black outline, magenta (#FF00FF) background.`,

    ogPrompt: `"HERO IN THE WAR ON DISEASE" neobrutalist profile card. Pink/cyan/black. Soldier avatar, achievement badges, impact stats. "VIEW THIS SOLDIER'S IMPACT • VOTE ON THE TREATY".`,
  },

  // ============================================================================
  // wishocracy.org - PRIORITIES SURVEY PORTAL (Values Research)
  // ============================================================================
  // Audience: Nonprofits, researchers, general public interested in priorities
  // Tone: Neutral, values-focused, research-oriented
  // Goal: Collect priority allocation data through pairwise comparisons
  // Navigation: Minimal (wishocracy survey, faq, about)
  // Messaging: No political advocacy, pure values research framing
  "wishocracy.org": {
    name: "Wishocracy",
    title: "Wishocracy",
    description:
      "Compare different areas of human concern and discover what matters most to you through pairwise comparisons.",
    domains: [
      "wishocracy.org",
      "www.wishocracy.org",
      "wishocracy.com",
      "www.wishocracy.com",
    ],
    baseUrl: "https://wishocracy.org",
    domain: "wishocracy.org",
    email: "hello@wishocracy.org",
    defaultRoute: "/",
    enabledFeatures: [
      SITE_FEATURES.WISHOCRACY,
      SITE_FEATURES.SURVEY,
      SITE_FEATURES.RESEARCH,
    ],
    showPoliticalContent: false,
    icons: {
      icon: [
        {
          url: "/assets/wishocracy/wishocracy-icon-square.png",
          sizes: "32x32",
          type: "image/png",
        },
        {
          url: "/assets/wishocracy/wishocracy-icon-square.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          url: "/assets/wishocracy/wishocracy-icon-square.png",
          sizes: "512x512",
          type: "image/png",
        },
      ],
      apple: {
        url: "/assets/wishocracy/wishocracy-icon-square.png",
        sizes: "180x180",
        type: "image/png",
      },
      other: [
        {
          rel: "icon",
          url: "/assets/wishocracy/wishocracy-icon-square.png",
          sizes: "1024x1024",
          type: "image/png",
        },
      ],
    },

    // Navigation - Minimal for values research focus
    topLevelNavItems: ["wishocracy", "faq"],
    sidebarSections: [], // No sidebar sections - keep it simple

    footerBranding: {
      title: "WISHOCRACY",
      tagline: "DISCOVER YOUR GLOBAL PRIORITIES",
    },
    footerSections: [
      {
        id: "about",
        label: "ABOUT",
        items: ["about", "faq"],
      },
    ],
    contactInfo: {
      email: "hello@wishocracy.org",
      website: "https://wishocracy.org",
      websiteLabel: "Wishocracy.org",
    },
    impactAnalysis: {
      url: "https://impact.warondisease.org",
      label: "impact.warondisease.org",
    },
    legalEntityName: INSTITUTE_FOR_ACCELERATED_MEDICINE,
    emailBranding: {
      fromName: "Wishonia",
      primaryColor: "#FFE66D", // brutal-yellow for wishocracy brand
      secondaryColor: "#00D9FF", // brutal-cyan
      orgName: "Wishocracy",
    },
    ogMetadata: {
      image: "/assets/wishocracy/wishocracy-og-1200x630.png",
      width: 1200,
      height: 630,
      alt: "Wishocracy - Discover Your Global Priorities",
    },
    legalItems: ["privacy", "terms"],
    copyrightText: "© 2025 Institute for Accelerated Medicine | CC BY-NC 4.0",
    faq: WISHOCRACY_FAQ,

    // Image generation prompts
    faviconPrompt: `Yellow star with white checkmark inside, thick black outline, magenta (#FF00FF) background.`,

    ogPrompt: `"WISHOCRACY" playful neobrutalist. Yellow/cyan/black. Ballot box, voting hands, comparison scales, priority sliders. Pairwise comparisons. Discover what matters most. "COMPARE HUMAN CONCERNS • QUANTIFY YOUR VALUES".`,
  },

  // ============================================================================
  // trialabundancesurvey.org - ULTRA-NEUTRAL PORTAL (Academic/Research)
  // ============================================================================
  // Audience: Super-nervous nonprofits who see DIH as competitor, academic partners
  // Tone: Academic, neutral, non-threatening, apolitical
  // Goal: Just collect survey data without scaring partners
  // Navigation: Ultra-minimal (vote, faq only - no sidebar clutter)
  // Messaging: No military language, no movement rhetoric, pure research framing
  "trialabundancesurvey.org": {
    name: "Trial Abundance Survey",
    title: "Global Clinical Trial Abundance Survey",
    description:
      "A global research initiative to measure public support for accelerating medical progress through pragmatic clinical trials.",
    domains: ["trialabundancesurvey.org", "www.trialabundancesurvey.org"],
    baseUrl: "https://trialabundancesurvey.org",
    domain: "trialabundancesurvey.org",
    email: "hello@trialabundancesurvey.org",
    defaultRoute: "/",
    enabledFeatures: [
      SITE_FEATURES.SURVEY,
      SITE_FEATURES.FAQ,
      SITE_FEATURES.RESEARCH,
    ],
    showPoliticalContent: false,
    icons: {
      icon: [
        { url: "/assets/survey/favicon.ico", sizes: "any" },
        {
          url: "/assets/survey/favicon-32x32.png",
          sizes: "32x32",
          type: "image/png",
        },
        {
          url: "/assets/survey/android-chrome-192x192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          url: "/assets/survey/android-chrome-512x512.png",
          sizes: "512x512",
          type: "image/png",
        },
      ],
      apple: {
        url: "/assets/survey/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
      other: [
        {
          rel: "icon",
          url: "/assets/survey/survey-icon-square.png",
          sizes: "1024x1024",
          type: "image/png",
        },
      ],
    },

    // Navigation - Ultra-minimal for nervous nonprofits
    topLevelNavItems: ["vote", "faq"],
    sidebarSections: [], // No sidebar sections - keep it simple

    footerBranding: {
      title: "GLOBAL CLINICAL TRIAL ABUNDANCE SURVEY",
      tagline: "AN INDEPENDENT RESEARCH INITIATIVE",
    },
    footerSections: [
      {
        id: "about",
        label: "ABOUT",
        items: ["about", "research", "faq"],
      },
    ],
    contactInfo: {
      email: "hello@trialabundancesurvey.org",
      website: "https://trialabundancesurvey.org",
      websiteLabel: "TrialAbundanceSurvey.org",
    },
    impactAnalysis: {
      url: "https://impact.warondisease.org",
      label: "impact.warondisease.org",
    },
    legalEntityName: INSTITUTE_FOR_ACCELERATED_MEDICINE,
    emailBranding: {
      fromName: "Survey Team",
      primaryColor: "#000000", // Black/White neutral
      secondaryColor: "#ffffff",
      orgName: "Global Clinical Trial Abundance Survey",
    },
    ogMetadata: {
      image: "/assets/survey/survey-og-1200x630.png",
      width: 1200,
      height: 630,
      alt: "Global Clinical Trial Abundance Survey - An Independent Research Initiative",
    },
    legalItems: ["privacy", "terms"],
    copyrightText: "© 2025 Institute for Accelerated Medicine | CC BY-NC 4.0",
    faq: SURVEY_FAQ,

    // Image generation prompts
    faviconPrompt: `White clipboard with black checkmark, thick black outline, magenta (#FF00FF) background.`,

    ogPrompt: `"${MESSAGING.survey.officialName.toUpperCase()}" neutral neobrutalist. Black/white only. Clipboard, checkboxes, globe, research data. Independent research initiative. Measure public support for ${MESSAGING.mechanism.pragmaticTrials}. Academic.`,
  },

  // ============================================================================
  // curedao.org - DAO FOR INCENTIVE ALIGNMENT & RESOURCE OPTIMIZATION
  // ============================================================================
  // Purpose: Decentralized Autonomous Organization that aligns incentives and enables
  //          mass-scale coordination to persuade humanity to optimally allocate resources
  //          toward disease eradication
  // Audience: DAO participants, crypto community, governance enthusiasts, health advocates
  // Tone: Collaborative, innovative, governance-focused, mission-driven
  // Goal: Optimal resource allocation through decentralized coordination and incentive mechanisms
  // Navigation: Simple and action-focused (governance + advocacy)
  // Messaging: Incentive alignment, decentralized coordination, resource optimization
  "curedao.org": {
    name: "CureDAO",
    title: "CureDAO",
    description: `A decentralized autonomous organization that aligns incentives and enables mass-scale coordination to optimally allocate resources toward disease eradication. Save ${MESSAGING.impact.timelineShift.livesSaved} lives through collective action.`,
    domains: ["curedao.org", "www.curedao.org"],
    baseUrl: "https://curedao.org",
    domain: "curedao.org",
    email: "hello@curedao.org",
    defaultRoute: "/",
    enabledFeatures: [
      SITE_FEATURES.ADVOCACY,
      SITE_FEATURES.MOVEMENT,
      SITE_FEATURES.RESEARCH,
      SITE_FEATURES.TRIALS,
      SITE_FEATURES.CONDITIONS,
      SITE_FEATURES.TREATMENTS,
    ],
    showPoliticalContent: true,
    authEnabled: false,
    dashboardEnabled: false,

    icons: {
      icon: [
        {
          url: "/assets/curedao/curedao-icon-square.png",
          sizes: "32x32",
          type: "image/png",
        },
        {
          url: "/assets/curedao/curedao-icon-square.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          url: "/assets/curedao/curedao-icon-square.png",
          sizes: "512x512",
          type: "image/png",
        },
      ],
      apple: {
        url: "/assets/curedao/curedao-icon-square.png",
        sizes: "180x180",
        type: "image/png",
      },
      other: [
        {
          rel: "icon",
          url: "/assets/curedao/curedao-icon-square.png",
          sizes: "1024x1024",
          type: "image/png",
        },
      ],
    },

    // Navigation - SIMPLIFIED for campaign focus (same as War on Disease)
    topLevelNavItems: ["vote"],
    sidebarSections: [
      {
        id: "join",
        label: "VOTE ON THE TREATY",
        items: ["vote", "thePlan", "volunteer" /* 'campaigns' */],
      },
      {
        id: "learn",
        label: "LEARN MORE",
        items: ["about", "faq"],
      },
      {
        id: "support",
        label: "SUPPORT THE MISSION",
        items: ["institutes", "soldiers"],
      },
    ],

    footerBranding: {
      title: "CUREDAO",
      tagline: "MAKING SUFFERING OPTIONAL",
    },

    footerSections: [
      {
        id: "join",
        label: "VOTE ON THE TREATY",
        items: ["vote", "thePlan", "volunteer"],
      },
      {
        id: "manual",
        label: "GET THE MANUAL",
        items: ["manual", "listenPodcast", "buyPaperback", "readOnline"],
      },
      {
        id: "learn",
        label: "LEARN MORE",
        items: ["about", "faq"],
      },
    ],

    contactInfo: {
      email: "hello@curedao.org",
      website: "https://curedao.org",
      websiteLabel: "CureDAO.org",
    },
    impactAnalysis: {
      url: "https://impact.warondisease.org",
      label: "impact.warondisease.org",
    },
    legalEntityName: "CureDAO",

    emailBranding: {
      fromName: "CureDAO",
      primaryColor: "#7289da", // Discord blue from their site
      secondaryColor: "#ffffff",
      orgName: "CureDAO",
    },
    ogMetadata: {
      image: "/assets/curedao/curedao-og-1200x630.png",
      width: 1200,
      height: 630,
      alt: "CureDAO - Making Suffering Optional",
    },

    legalItems: ["privacy", "terms"],
    copyrightText: "© 2025 CureDAO | CC BY-NC 4.0",
    faq: WAR_ON_DISEASE_FAQ,

    // Image generation prompts
    faviconPrompt: `Purple hexagon with white heart inside, thick black outline, magenta (#FF00FF) background.`,

    ogPrompt: `"CUREDAO" neobrutalist. Purple/white/black. Medical cross, network nodes, connected people, globe. Decentralized autonomous organization. Mass-scale coordination for disease eradication. "ALIGN INCENTIVES • ${MESSAGING.impact.globalImpactAtTippingPoint.totalLivesSaved.toUpperCase()} • COLLECTIVE ACTION".`,
  },

  // ============================================================================
  // acceleratedmedicine.org - INSTITUTE FOR ACCELERATED MEDICINE (Umbrella/Donation Site)
  // ============================================================================
  // Purpose: Central fundraising hub and umbrella organization that funds/supports other projects
  // Audience: Donors, philanthropists, foundations, grant makers
  // Tone: Professional, trustworthy, impact-focused
  // Goal: Donations, partnerships, trust-building - links to specialized sites for clinical content
  // Navigation: Donation-focused with cross-links to supported projects (dFDA, War on Disease, etc.)
  // Messaging: Bold but professional - "Cures move at the speed of data"
  // CANONICAL FOR: /donate (all other variants redirect here for donations)
  "acceleratedmedicine.org": {
    name: "IAM",
    title: "Institute for Accelerated Medicine",
    description: `${MESSAGING.impact.diseasesCured.percentWithNoTreatment} of diseases have no cure. We fix that. Pragmatic trials that move cures from lab to patient ${MESSAGING.impact.curesArriveXYearsSooner.years} years faster, ${MESSAGING.impact.costReduction.multiplier} cheaper.`,
    domains: ["acceleratedmedicine.org", "www.acceleratedmedicine.org"],
    baseUrl: "https://acceleratedmedicine.org",
    domain: "acceleratedmedicine.org",
    email: "hello@acceleratedmedicine.org",
    defaultRoute: "/",
    // Umbrella site: research, education, movement, donate - NO clinical content (redirects to dfda.earth)
    enabledFeatures: [
      SITE_FEATURES.SURVEY,
      SITE_FEATURES.RESEARCH,
      SITE_FEATURES.EDUCATION,
      SITE_FEATURES.MOVEMENT,
      SITE_FEATURES.DONATE,
    ],
    showPoliticalContent: false,
    authEnabled: false,
    dashboardEnabled: false,
    icons: {
      icon: [
        { url: "/assets/acceleratedmedicine/favicon.ico", sizes: "any" },
        {
          url: "/assets/acceleratedmedicine/favicon-32x32.png",
          sizes: "32x32",
          type: "image/png",
        },
        {
          url: "/assets/acceleratedmedicine/android-chrome-192x192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          url: "/assets/acceleratedmedicine/android-chrome-512x512.png",
          sizes: "512x512",
          type: "image/png",
        },
      ],
      apple: {
        url: "/assets/acceleratedmedicine/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
      other: [
        {
          rel: "icon",
          url: "/assets/acceleratedmedicine/iam-icon-master.png",
          sizes: "1024x1024",
          type: "image/png",
        },
      ],
    },

    // Navigation system - Umbrella/donation focused
    // Donate is prominent, cross-links to other projects
    topLevelNavItems: ["donate", "vote", "about"],
    sidebarSections: [
      {
        id: "support",
        label: "SUPPORT THE MISSION",
        items: ["donate", "thePlan", "volunteer"],
      },
      {
        id: "evidence",
        label: "THE EVIDENCE",
        items: ["research", "faq"],
      },
      {
        id: "about-us",
        label: "ABOUT US",
        items: ["about"],
      },
    ],
    footerBranding: {
      title: "THE INSTITUTE FOR ACCELERATED MEDICINE",
      tagline: "MISSION: TOTAL DISEASE ERADICATION",
    },
    footerSections: [
      {
        id: "support",
        label: "SUPPORT",
        items: ["donate", "thePlan", "volunteer"],
      },
      {
        id: "manual",
        label: "GET THE MANUAL",
        items: ["manual", "listenPodcast", "buyPaperback", "readOnline"],
      },
      {
        id: "about",
        label: "ABOUT",
        items: ["about", "research", "faq"],
      },
    ],
    contactInfo: {
      email: "hello@acceleratedmedicine.org",
      website: "https://acceleratedmedicine.org",
      websiteLabel: "AcceleratedMedicine.org",
    },
    impactAnalysis: {
      url: "https://impact.warondisease.org",
      label: "impact.warondisease.org",
    },
    legalEntityName: INSTITUTE_FOR_ACCELERATED_MEDICINE,
    emailBranding: {
      fromName: "Institute for Accelerated Medicine",
      primaryColor: "#FF6B9D", // Neobrutalist pink
      secondaryColor: "#00D4FF", // Neobrutalist cyan
      orgName: "Institute for Accelerated Medicine",
    },
    ogMetadata: {
      image: "/assets/acceleratedmedicine/iam-og-1200x630.png",
      width: 1200,
      height: 630,
      alt: `Institute for Accelerated Medicine - ${MESSAGING.impact.curesArriveXYearsSooner.years} Years Faster. ${MESSAGING.impact.timelineShift.livesSaved} Lives.`,
    },
    legalItems: ["privacy", "terms"],
    copyrightText: "© 2025 Institute for Accelerated Medicine | CC BY-NC 4.0",
    footerComplianceNotice: IAM_501C3_FOOTER_NOTICE,
    faq: DIH_FAQ, // Reuse DIH FAQ initially, can customize later

    // Image generation prompts
    faviconPrompt: `Bold pink fast-forward symbol (two solid triangles >>), thick black outline, magenta (#FF00FF) background.`,

    ogPrompt: `"INSTITUTE FOR ACCELERATED MEDICINE" neobrutalist. Pink/cyan/black. Fast-forward arrows, DNA, lab beaker, patient. ${MESSAGING.impact.diseasesCured.percentWithNoTreatmentPhrase}. ${MESSAGING.mechanism.pragmaticTrials} from lab to patient. "${MESSAGING.impact.curesArriveXYearsSooner.years} YEARS FASTER • ${MESSAGING.impact.costReduction.multiplier} CHEAPER • ${MESSAGING.impact.timelineShift.livesSaved} LIVES".`,
  },
};

/**
 * Maps old variant names to new domain-based names for backward compatibility
 */
function normalizeVariantName(variant: string): SiteVariant {
  const legacyMap: Record<string, SiteVariant> = {
    "501c3": "dih.earth",
    "501c4": "warondisease.org",
    survey: "trialabundancesurvey.org",
  };
  return (legacyMap[variant] as SiteVariant) || (variant as SiteVariant);
}

/**
 * Get the current site variant
 *
 * Determines the site variant from multiple sources in order of priority:
 * - In development: env var first (for dev:variant scripts), then cookie, then default
 * - In production: cookie first (set by middleware from domain), then env var, then default
 *
 * @returns Current site variant identifier
 */
export function getSiteVariant(): SiteVariant {
  const configuredVariant = process.env.NEXT_PUBLIC_SITE_VARIANT;
  if (configuredVariant) {
    const normalizedVariant = normalizeVariantName(configuredVariant);
    if (normalizedVariant in siteConfigs) {
      return normalizedVariant;
    }
  }

  return DEFAULT_VARIANT;
}

/**
 * Get the current site configuration
 *
 * @returns Current site configuration object
 */
export function getSiteConfig(): SiteConfig {
  const variant = getSiteVariant();
  return siteConfigs[variant] || siteConfigs[DEFAULT_VARIANT];
}

/**
 * Get site configuration for a specific variant
 *
 * Use this when you need config for a variant other than the current one,
 * or in scripts where the env var approach doesn't work (e.g., build scripts).
 *
 * @param variant - The site variant to get config for
 * @returns Site configuration object for the specified variant
 */
export function getSiteConfigForVariant(variant: SiteVariant): SiteConfig {
  return siteConfigs[variant] || siteConfigs[DEFAULT_VARIANT];
}

/**
 * Get an email address for the current variant's domain
 *
 * @param prefix - Email prefix (default: 'hello'). Examples: 'hello', 'institutes', 'donations', 'feedback'
 * @returns Email address like "hello@warondisease.org" or "institutes@dih.earth"
 */
export function getEmail(prefix: string = "hello"): string {
  return `${prefix}@${getSiteConfig().domain}`;
}

/**
 * Check if a specific feature is enabled for the current site
 *
 * @param feature Feature name to check
 * @returns Whether the feature is enabled
 */
export function isFeatureEnabled(feature: SiteFeature): boolean {
  const config = getSiteConfig();
  return config.enabledFeatures.includes(feature);
}

/**
 * Get the username for the user variant homepage
 *
 * @returns Username from env or undefined
 */
export function getProfileUsername(): string | undefined {
  return env.NEXT_PUBLIC_USERNAME;
}

/**
 * Get the actual default route, resolving dynamic routes like user profiles
 *
 * @returns The resolved default route path
 * @throws Error if user variant is set but NEXT_PUBLIC_USERNAME is missing
 */
export function getResolvedDefaultRoute(): string {
  const config = getSiteConfig();

  // For user variant, construct the user profile URL
  if (isUserVariant()) {
    const username = getProfileUsername();
    if (!username) {
      throw new Error(
        'NEXT_PUBLIC_SITE_VARIANT is set to "user" but NEXT_PUBLIC_USERNAME is not configured. ' +
          "Please set NEXT_PUBLIC_USERNAME to the username of the profile to display.",
      );
    }
    return `/u/${username}`;
  }

  return config.defaultRoute;
}

/**
 * Get the base URL for the current site
 *
 * This is a re-export of the comprehensive getBaseUrl from lib/url.ts
 * which handles browser + server environments with multiple fallbacks.
 *
 * If you need just the site variant's configured baseUrl, use getSiteConfig().baseUrl directly.
 *
 * @returns The base URL (e.g., "https://warondisease.org")
 */
export { getBaseUrl } from "./url";

/**
 * Get the primary domain for SEO canonical URLs
 *
 * Returns the current variant's baseUrl for page-level canonical helpers.
 * Cross-variant ownership is handled by nav metadata and canonical routing.
 *
 * @returns The variant's base URL (e.g., "https://warondisease.org", "https://dih.earth")
 */
export function getPrimaryDomain(): string {
  return getSiteConfig().baseUrl;
}

// ===== NAVIGATION HELPER FUNCTIONS =====

function resolveNavItems(ids: NavItemId[]): NavItem[] {
  const currentVariant = getSiteVariant();
  return getNavItems(ids).map((item) => {
    if (
      item.canonicalVariant &&
      item.allowedVariants &&
      !item.allowedVariants.includes(currentVariant)
    ) {
      return {
        ...item,
        path: `https://${getVariantDomain(item.canonicalVariant)}${item.path}`,
        isExternal: true,
      };
    }
    return item;
  });
}

export function getResolvedNavItem(id: NavItemId): NavItem {
  return resolveNavItems([id])[0];
}

/**
 * Get top-level navigation items (shown outside accordion)
 *
 * @returns Array of resolved navigation items
 */
export function getTopLevelNavItems(): NavItem[] {
  const config = getSiteConfig();
  return config.topLevelNavItems
    ? resolveNavItems(config.topLevelNavItems)
    : [];
}

/**
 * Get sidebar sections with resolved navigation items
 *
 * @returns Array of sections with their resolved nav items
 */
export function getSidebarSections(): Array<
  NavSection & { resolvedItems: NavItem[] }
> {
  const config = getSiteConfig();
  if (!config.sidebarSections) return [];

  return config.sidebarSections.map((section) => ({
    ...section,
    resolvedItems: resolveNavItems(section.items),
  }));
}

/**
 * Get footer sections with resolved navigation items
 *
 * @returns Array of footer sections with their resolved nav items
 */
export function getFooterSections(): Array<
  FooterSection & { resolvedItems: NavItem[] }
> {
  const config = getSiteConfig();
  if (!config.footerSections) return [];

  return config.footerSections.map((section) => ({
    ...section,
    resolvedItems: resolveNavItems(section.items),
  }));
}

/**
 * Get footer branding
 *
 * @returns Footer branding or default
 */
export function getFooterBranding(): FooterBranding {
  const config = getSiteConfig();
  return (
    config.footerBranding || {
      title: config.title.toUpperCase(),
      tagline: config.description,
    }
  );
}

/**
 * Get contact information
 *
 * @returns Contact info or default
 */
export function getContactInfo(): ContactInfo {
  const config = getSiteConfig();
  return (
    config.contactInfo || {
      email: config.email,
      website: config.baseUrl,
      websiteLabel: config.domain,
    }
  );
}

/**
 * Get impact analysis info.
 *
 * @returns Impact analysis link info or a sensible fallback
 */
export function getImpactAnalysisInfo(): ImpactAnalysisInfo {
  const config = getSiteConfig();
  return (
    config.impactAnalysis || {
      url: `${config.baseUrl}/research`,
      label: `${config.domain}/research`,
    }
  );
}

/**
 * Get legal entity name for formal/legal pages.
 *
 * @returns Legal entity name or a sensible fallback
 */
export function getLegalEntityName(): string {
  const config = getSiteConfig();
  return config.legalEntityName || config.emailBranding.orgName || config.title;
}

/**
 * Get legal navigation items (for footer)
 *
 * @returns Array of resolved legal items
 */
export function getLegalItems(): NavItem[] {
  const config = getSiteConfig();
  return config.legalItems ? getNavItems(config.legalItems) : [];
}

/**
 * Get copyright text
 *
 * @returns Copyright text or default
 */
export function getCopyrightText(): string {
  const config = getSiteConfig();
  return (
    config.copyrightText ||
    `© ${new Date().getFullYear()} ${config.title.toUpperCase()}`
  );
}

// ===== VARIANT HELPER FUNCTIONS (ZERO-PARAMETER) =====

/**
 * Check if current site is the survey variant (trialabundancesurvey.org)
 * @returns true if current variant is survey
 */
export function isSurveyVariant(): boolean {
  return getSiteVariant() === "trialabundancesurvey.org";
}

/**
 * Check if current site is the DIH variant (dih.earth)
 * @returns true if current variant is DIH
 */
export function isDihVariant(): boolean {
  return getSiteVariant() === "dih.earth";
}

/**
 * Check if current site is the War on Disease variant (warondisease.org)
 * @returns true if current variant is War on Disease
 */
export function isWarOnDiseaseVariant(): boolean {
  return getSiteVariant() === "warondisease.org";
}

/**
 * Check if current site is the dFDA variant
 * @returns true if current variant is dFDA
 */
export function isDfdaVariant(): boolean {
  return getSiteVariant() === "dfda";
}

/**
 * Check if current site is the user profile variant
 * @returns true if current variant is user
 */
export function isUserVariant(): boolean {
  return getSiteVariant() === "user";
}

/**
 * Check if current site is the CureDAO variant
 * @returns true if current variant is CureDAO
 */
export function isCureDAOVariant(): boolean {
  return getSiteVariant() === "curedao.org";
}

/**
 * Check if current site is the Wishocracy variant
 * @returns true if current variant is Wishocracy
 */
export function isWishocracyVariant(): boolean {
  return getSiteVariant() === "wishocracy.org";
}

/**
 * Check if current site is the Accelerated Medicine variant
 * @returns true if current variant is Accelerated Medicine
 */
export function isAcceleratedMedicineVariant(): boolean {
  return getSiteVariant() === "acceleratedmedicine.org";
}

/**
 * Check if current site allows political content
 * @returns true if political content is allowed
 */
export function allowsPoliticalContent(): boolean {
  return getSiteConfig().showPoliticalContent;
}

/**
 * Check if current site is a neutral/non-political variant
 * @returns true if variant should avoid political content
 */
export function isNeutralVariant(): boolean {
  return isSurveyVariant() || isDihVariant();
}

// ===== DOMAIN MAPPING =====

/**
 * Build a domain-to-variant map from site configurations
 *
 * This auto-generates the domain mapping from the domains arrays in each config,
 * ensuring a single source of truth and eliminating redundancy.
 *
 * @returns Record mapping each domain to its site variant
 */
function buildDomainMap(): Record<string, SiteVariant> {
  const map: Record<string, SiteVariant> = {};

  for (const [variant, config] of Object.entries(siteConfigs)) {
    if (config.domains) {
      for (const domain of config.domains) {
        map[domain] = variant as SiteVariant;
      }
    }
  }

  return map;
}

// ===== DOMAIN MAPPING =====

/**
 * Domain to Site Variant Mapping
 *
 * Auto-generated from the domains arrays in each site config.
 * Maps each domain to its corresponding site variant.
 */
export const DOMAIN_TO_VARIANT: Record<string, SiteVariant> = buildDomainMap();

/**
 * Resolve a site variant from a request host header.
 *
 * Accepts both bare domains and host:port values so local and preview
 * environments can share the same mapping.
 */
export function getSiteVariantForHost(
  host: string | null | undefined,
): SiteVariant {
  const normalizedHost = (host || "").toLowerCase();
  const hostWithoutPort = normalizedHost.startsWith("[")
    ? normalizedHost
    : normalizedHost.split(":")[0];

  return (DOMAIN_TO_VARIANT[normalizedHost] ||
    DOMAIN_TO_VARIANT[hostWithoutPort] ||
    DEFAULT_VARIANT) as SiteVariant;
}
