export type ReferendumSiteContentKey = "onePercentTreaty";

export type ReferendumSitePageKey =
  | "home"
  | "treaty"
  | "tasks"
  | "endorse"
  | "supporters"
  | "why"
  | "legal"
  | "impact";

export interface ReferendumSitePageMetadata {
  description: string;
  title: string;
}

export interface ReferendumSiteNavItem {
  href: string;
  label: string;
}

export interface ReferendumSiteHomeContent {
  closingBody: string;
  closingCtaLabel: string;
  closingLead: string;
  eyebrow: string;
  intro: string;
  organizationCountLabel: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  titleLines: string[];
  individualCountLabel: string;
}

export interface ReferendumSiteSupportersContent {
  ctaLabel: string;
  description: string;
  emptyBody: string;
  emptyTitle: string;
  eyebrow: string;
  title: string;
}

export interface ReferendumSiteEndorseContent {
  description: string;
  eyebrow: string;
  existingSupportersLabel: string;
  signInDescription: string;
  signInLabel: string;
  signInTitle: string;
  title: string;
}

export interface ReferendumSiteWhyFact {
  body: string;
  label: string;
  number: string;
}

export interface ReferendumSiteWhyContent {
  closingBody: string;
  closingLead: string;
  ctaLabel: string;
  eyebrow: string;
  facts: ReferendumSiteWhyFact[];
  intro: string;
  title: string;
}

export interface ReferendumSiteLegalSection {
  bullets?: string[];
  heading: string;
  paragraphs: string[];
}

export interface ReferendumSiteLegalContent {
  eyebrow: string;
  sections: ReferendumSiteLegalSection[];
  title: string;
}

export interface ReferendumSiteNotFoundContent {
  ctaLabel: string;
  description: string;
  title: string;
}

export interface ReferendumSiteFooterContent {
  builtByLabel: string;
}

export interface ReferendumSiteContent {
  endorse: ReferendumSiteEndorseContent;
  footer: ReferendumSiteFooterContent;
  home: ReferendumSiteHomeContent;
  impactUrl: string;
  key: ReferendumSiteContentKey;
  legal: ReferendumSiteLegalContent;
  metadata: Record<ReferendumSitePageKey, ReferendumSitePageMetadata>;
  navItems: ReferendumSiteNavItem[];
  notFound: ReferendumSiteNotFoundContent;
  supporters: ReferendumSiteSupportersContent;
  why: ReferendumSiteWhyContent;
}
