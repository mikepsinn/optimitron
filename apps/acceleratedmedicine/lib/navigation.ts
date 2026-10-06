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
          "id": "rightToTrial",
          "label": "Right to Trial",
          "path": "/right-to-trial",
          "description": "Let every patient join a pragmatic trial of a promising treatment at a licensed treatment center.",
          "emoji": "🩺"
        },
        {
          "id": "rightToTryMontana",
          "label": "Montana Model",
          "path": "/montana",
          "description": "Read how Montana's Universal Right to Try law expands patient access while licensing experimental treatment centers.",
          "emoji": "📍"
        },
        {
          "id": "rightToTryStates",
          "label": "Your State",
          "path": "/right-to-trial#state-support",
          "description": "Put your state on the Right to Trial map.",
          "emoji": "🗺️",
          "isHashLink": true,
          "requiresScrollHandler": true
        },
        {
          "id": "rightToTrySurvey",
          "label": "Right to Trial Survey",
          "path": "/survey",
          "description": "Record your answer and put your state on the map.",
          "emoji": "🗳️"
        },
        {
          "id": "rightToTryModelAct",
          "label": "Model Act",
          "path": "/model-act",
          "description": "See how every patient can join a pragmatic trial and providers can publish comparable results.",
          "emoji": "📄"
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
          "description": "See how Right to Trial can help patients join low-cost trials and find effective treatments sooner.",
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
          "id": "donate",
          "label": "Donate",
          "path": "/donate",
          "description": "Fund patient education, pragmatic-trial research, and public treatment evidence.",
          "emoji": "💝",
          "feature": "donate"
        },
        {
          "id": "shareIdea",
          "label": "Share an Idea",
          "path": "/#help",
          "description": "Tell us what would get more patients into trials or find cures sooner.",
          "emoji": "💡",
          "isHashLink": true,
          "requiresScrollHandler": true
        },
        {
          "id": "rightToTryEmailUpdates",
          "label": "Get Email Updates",
          "path": "/survey",
          "description": "Take the 30-second survey and check the updates box.",
          "emoji": "📬"
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
