import type { AppNavigation } from "@optimitron/site-kit/lib/app-navigation";

/** Navigation owned by this app. Cross-app destinations are explicit URLs. */
export const appNavigation: AppNavigation = {
  "topLevelItems": [
    {
      "id": "homeInitiatives",
      "label": "Initiatives",
      "path": "/#initiatives",
      "description": "Evidence, access, and funding: the three parts of our plan.",
      "emoji": "🧭",
      "isHashLink": true,
      "requiresScrollHandler": true
    },
    {
      "id": "rightToTrial",
      "label": "Right to Trial",
      "path": "/right-to-trial",
      "description": "Let every patient join a pragmatic trial of a promising treatment at a licensed treatment center.",
      "emoji": "🩺"
    },
    {
      "id": "homeResearch",
      "label": "Research",
      "path": "/#research",
      "description": "Our book, podcast, and papers.",
      "emoji": "📚",
      "isHashLink": true,
      "requiresScrollHandler": true
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
      "label": "RIGHT TO TRIAL",
      "resolvedItems": [
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
          "id": "research",
          "label": "1% Treaty Research",
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
          "id": "globalSurvey",
          "label": "Take the Global Survey",
          "path": "https://warondisease.org",
          "description": "Show how you would split public money between weapons and clinical trials.",
          "emoji": "🗳️",
          "isExternal": true
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
