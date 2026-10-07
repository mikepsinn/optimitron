import type { AppNavigation } from "@optimitron/site-kit/lib/app-navigation";

/** Navigation owned by this app. Cross-app destinations are explicit URLs. */
export const appNavigation: AppNavigation = {
  "topLevelItems": [
    {
      "id": "homeHowItWorks",
      "label": "How it should work",
      "path": "/#how-it-works",
      "description": "How care-integrated clinical trials would work for patients, doctors and researchers.",
      "emoji": "🧭",
      "isHashLink": true,
      "requiresScrollHandler": true
    },
    {
      "id": "act",
      "label": "The act",
      "path": "/act",
      "description": "What the Care-Integrated Clinical Trials Act does, and answers to common questions.",
      "emoji": "📜"
    },
    {
      "id": "faq",
      "label": "FAQ",
      "path": "/faq",
      "description": "Questions about care-integrated clinical trials and the act.",
      "emoji": "❓"
    },
    {
      "id": "donate",
      "label": "Donate",
      "path": "/donate",
      "description": "Fund patient education, pragmatic-trial research, and public treatment evidence.",
      "emoji": "💝",
      "feature": "donate"
    },
    {
      "id": "aboutUs",
      "label": "About us",
      "path": "/about",
      "description": "About the Institute for Accelerated Medicine",
      "emoji": "ℹ️"
    }
  ],
  "sidebarSections": [],
  "footerSections": [
    {
      "id": "right-to-try",
      "label": "LEGISLATION",
      "resolvedItems": [
        {
          "id": "act",
          "label": "The act",
          "path": "/act",
          "description": "What the Care-Integrated Clinical Trials Act does, and answers to common questions.",
          "emoji": "📜"
        },
        {
          "id": "rightToTryStates",
          "label": "Your state",
          "path": "/states",
          "description": "The patients waiting in each state, and what the act would change there.",
          "emoji": "🗺️"
        },
        {
          "id": "rightToTryMontana",
          "label": "Montana precedent",
          "path": "/montana",
          "description": "How Montana's law already licenses experimental treatment centers.",
          "emoji": "📍"
        }
      ]
    },
    {
      "id": "evidence",
      "label": "EVIDENCE",
      "resolvedItems": [
        {
          "id": "rightToTrialImpact",
          "label": "Impact",
          "path": "/impact",
          "description": "A model of how much sooner treatments arrive if every state adopts the act.",
          "emoji": "⚡"
        },
        {
          "id": "faq",
          "label": "FAQ",
          "path": "/faq",
          "description": "Questions about care-integrated clinical trials and the act.",
          "emoji": "❓"
        },
        {
          "id": "aboutUs",
          "label": "About us",
          "path": "/about",
          "description": "About the Institute for Accelerated Medicine",
          "emoji": "ℹ️"
        }
      ]
    },
    {
      "id": "support",
      "label": "SUPPORT",
      "resolvedItems": [
        {
          "id": "support",
          "label": "Show your support",
          "path": "/support",
          "description": "Add your name, or endorse as an organization.",
          "emoji": "✋"
        },
        {
          "id": "supporters",
          "label": "Supporters",
          "path": "/supporters",
          "description": "The people and organizations who support the initiative.",
          "emoji": "🙌"
        },
        {
          "id": "donate",
          "label": "Donate",
          "path": "/donate",
          "description": "Fund patient education, pragmatic-trial research, and public treatment evidence.",
          "emoji": "💝",
          "feature": "donate"
        },
        {
          "id": "partner",
          "label": "Partner with us",
          "path": "/contact",
          "description": "Join as a partner organization or an advisory-board member.",
          "emoji": "🤝"
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
