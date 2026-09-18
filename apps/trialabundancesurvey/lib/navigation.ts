import type { AppNavigation } from "@optimitron/site-kit/lib/app-navigation";

/** Navigation owned by this app. Cross-app destinations are explicit URLs. */
export const appNavigation: AppNavigation = {
  "topLevelItems": [
    {
      "id": "vote",
      "label": "Answer the Question",
      "path": "/#vote",
      "description": "Cast your vote for the 1% Treaty: redirect 1% of military spending to accelerate medical research and end preventable disease deaths",
      "emoji": "✅",
      "isHashLink": true,
      "requiresScrollHandler": true
    },
    {
      "id": "surveyResults",
      "label": "Survey results",
      "path": "/results",
      "description": "Current survey results on patient access, patient-funded clinical trials, and research funding priorities."
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
          "id": "about",
          "label": "About",
          "path": "/about",
          "description": "Discover how the Decentralized Institutes of Health accelerates medical breakthroughs with pragmatic trials, delivering 82x efficiency gains and making suffering optional",
          "emoji": "ℹ️"
        },
        {
          "id": "research",
          "label": "Research & Evidence",
          "path": "/research",
          "description": "Comprehensive economic analysis showing pragmatic trials deliver 637:1 ROI with $172B+ recurring annual benefits. Peer-reviewed methodology and sensitivity testing",
          "emoji": "📚"
        },
        {
          "id": "surveyResults",
          "label": "Survey results",
          "path": "/results",
          "description": "Current survey results on patient access, patient-funded clinical trials, and research funding priorities."
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
