import type { AppNavigation } from "@optimitron/site-kit/lib/app-navigation";

/** Navigation owned by this app. Cross-app destinations are explicit URLs. */
export const appNavigation: AppNavigation = {
  "topLevelItems": [
    {
      "id": "wishocracy",
      "label": "Quantifying Humanity's Values",
      "path": "/wishocracy",
      "description": "Discover your global priorities through interactive pairwise comparisons. Compare different areas of human concern and see what matters most to you",
      "emoji": "🎯"
    },
    {
      "id": "faq",
      "label": "FAQ",
      "path": "/faq",
      "description": "Answers about the 1% Treaty, pragmatic clinical trials, peace dividend economics, implementation feasibility, and how to help",
      "emoji": "❓"
    }
  ],
  "sidebarSections": [],
  "footerSections": [
    {
      "id": "about",
      "label": "ABOUT",
      "resolvedItems": [
        {
          "id": "wishocracyAbout",
          "label": "About",
          "path": "/about",
          "description": "How Wishocracy turns pairwise choices into budget priorities, how the results are calculated, and the research behind it."
        },
        {
          "id": "wishocracyResults",
          "label": "Results",
          "path": "/results",
          "description": "Compare average preferred budget allocations with current US government allocations across the same spending areas."
        },
        {
          "id": "faq",
          "label": "FAQ",
          "path": "/faq",
          "description": "Answers about the 1% Treaty, pragmatic clinical trials, peace dividend economics, implementation feasibility, and how to help",
          "emoji": "❓"
        }
      ]
    }
  ],
  "legalItems": [
    {
      "id": "privacy",
      "label": "Privacy Policy",
      "path": "/privacy",
      "description": "How we collect, use, and protect your personal data. Our commitment to transparency and data security in medical research"
    },
    {
      "id": "terms",
      "label": "Terms of Service",
      "path": "/terms",
      "description": "Terms and conditions for using this website"
    }
  ]
};
