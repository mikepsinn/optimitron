import type { AppNavigation } from "@optimitron/site-kit/lib/app-navigation";

/** Navigation owned by this app. Cross-app destinations are explicit URLs. */
export const appNavigation: AppNavigation = {
  "topLevelItems": [
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
      "path": "/#state-support",
      "description": "Put your state on the Right to Trial map.",
      "emoji": "🗺️",
      "isHashLink": true,
      "requiresScrollHandler": true
    },
    {
      "id": "rightToTryModelAct",
      "label": "Model Act",
      "path": "/model-act",
      "description": "See how every patient can join a pragmatic trial and providers can publish comparable results.",
      "emoji": "📄"
    },
    {
      "id": "rightToTrialImpact",
      "label": "Impact",
      "path": "/impact",
      "description": "See how Right to Trial can help patients join low-cost trials and find effective treatments sooner.",
      "emoji": "⚡"
    },
    {
      "id": "donate",
      "label": "Donate",
      "path": "/donate",
      "description": "Fund patient education, pragmatic-trial research, and public treatment evidence.",
      "emoji": "💝",
      "feature": "donate"
    }
  ],
  "sidebarSections": [],
  "footerSections": [
    {
      "id": "right-to-try",
      "label": "RIGHT TO TRIAL",
      "resolvedItems": [
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
          "path": "/#state-support",
          "description": "Put your state on the Right to Trial map.",
          "emoji": "🗺️",
          "isHashLink": true,
          "requiresScrollHandler": true
        },
        {
          "id": "rightToTrySurvey",
          "label": "Survey",
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
          "id": "research",
          "label": "Research & Evidence",
          "path": "https://warondisease.org/research",
          "description": "Comprehensive economic analysis showing pragmatic trials deliver 637:1 ROI with $172B+ recurring annual benefits. Peer-reviewed methodology and sensitivity testing",
          "emoji": "📚",
          "isExternal": true
        },
        {
          "id": "faq",
          "label": "FAQ",
          "path": "/faq",
          "description": "Answers about the 1% Treaty, pragmatic clinical trials, peace dividend economics, implementation feasibility, and how to help",
          "emoji": "❓"
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
          "id": "volunteer",
          "label": "Volunteer",
          "path": "/contact",
          "description": "Volunteer your skills to help more humans vote, share, and accelerate cures",
          "emoji": "🤝"
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
