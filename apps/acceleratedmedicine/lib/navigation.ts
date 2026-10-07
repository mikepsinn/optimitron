/** The donation pages stay reachable at /donate, but no menu links to them. Set this to true to show the links. */
export const SHOW_DONATE_LINKS = false

export interface NavigationItem {
  id: string
  label: string
  path: string
  isExternal?: boolean
  /** A donate link appears only when SHOW_DONATE_LINKS is true. */
  feature?: "donate"
}

export interface NavigationSection {
  id: string
  label: string
  resolvedItems: NavigationItem[]
}

/** The links each menu shows now. */
export function visibleNavigationItems(items: NavigationItem[], showDonateLinks = SHOW_DONATE_LINKS) {
  return items.filter(item => item.feature !== "donate" || showDonateLinks)
}

const donate: NavigationItem = { id: "donate", label: "Donate", path: "/donate", feature: "donate" }

/**
 * The header, footer and legal links (components/accelerated-medicine-chrome.tsx). The repository's route
 * inventory (scripts/site-app-navigation.ts) reads the same object, so it keeps this shape.
 */
export const appNavigation: {
  topLevelItems: NavigationItem[]
  sidebarSections: NavigationSection[]
  footerSections: NavigationSection[]
  legalItems: NavigationItem[]
} = {
  topLevelItems: [
    { id: "homeHowItWorks", label: "How it should work", path: "/#how-it-works" },
    { id: "act", label: "The act", path: "/act" },
    { id: "faq", label: "FAQ", path: "/faq" },
    // The header shows this one as a button.
    donate,
  ],
  sidebarSections: [],
  footerSections: [
    {
      id: "right-to-try",
      label: "Legislation",
      resolvedItems: [
        { id: "act", label: "The act", path: "/act" },
        { id: "rightToTryStates", label: "Your state", path: "/states" },
        { id: "rightToTryMontana", label: "Montana precedent", path: "/montana" },
      ],
    },
    {
      id: "evidence",
      label: "Evidence",
      resolvedItems: [
        { id: "rightToTrialImpact", label: "Impact", path: "/impact" },
        { id: "faq", label: "FAQ", path: "/faq" },
        { id: "aboutUs", label: "About us", path: "/about" },
      ],
    },
    {
      id: "support",
      label: "Support",
      resolvedItems: [
        { id: "support", label: "Show your support", path: "/support" },
        { id: "supporters", label: "Supporters", path: "/supporters" },
        donate,
        { id: "partner", label: "Partner with us", path: "/contact" },
      ],
    },
  ],
  legalItems: [
    { id: "privacy", label: "Privacy Policy", path: "/privacy" },
    { id: "terms", label: "Terms of Service", path: "/terms" },
  ],
}
