export type ReferendumSiteContentKey = "onePercentTreaty";

export type ReferendumSitePageKey =
  | "home"
  | "treaty"
  | "dashboard"
  | "tasks"
  | "endorse"
  | "signatories"
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
  eyebrow: string;
  heroTitle: string;
  intro: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  treatyEyebrow: string;
  signTitle: string;
  signBody: string;
  signBoxTitle: string;
  lateEmployeesEyebrow: string;
  lateEmployeesTitle: string;
  lateEmployeesBody: string;
  lateEmployeesCtaLabel: string;
  titleLines: string[];
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
  links?: ReferendumSiteNavItem[];
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

export interface ReferendumSiteDashboardContent {
  fullDashboardLabel: string;
  shareBody: string;
  shareCtaLabel: string;
  shareEmailSubject: string;
  shareText: string;
  shareTitle: string;
  statsDeathsLabel: string;
  statsLeadersLabel: string;
  statsMoneyLabel: string;
  tasksBody: string;
  tasksTitle: string;
  urgencyBody: string;
  urgencyTitle: string;
  welcomeBody: string;
  welcomeTitle: string;
}

export interface ReferendumSiteContent {
  dashboard: ReferendumSiteDashboardContent;
  endorse: ReferendumSiteEndorseContent;
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
