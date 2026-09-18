import type { AppNavigation } from "@optimitron/site-kit/lib/app-navigation";

/** Navigation owned by this app. Cross-app destinations are explicit URLs. */
export const appNavigation: AppNavigation = {
  "topLevelItems": [
    {
      "id": "vote",
      "label": "Answer the Question",
      "path": "https://warondisease.org/#vote",
      "description": "Cast your vote for the 1% Treaty: redirect 1% of military spending to accelerate medical research and end preventable disease deaths",
      "emoji": "✅",
      "isHashLink": true,
      "requiresScrollHandler": true,
      "isExternal": true
    }
  ],
  "sidebarSections": [
    {
      "id": "join",
      "label": "VOTE ON THE TREATY",
      "resolvedItems": [
        {
          "id": "vote",
          "label": "Answer the Question",
          "path": "https://warondisease.org/#vote",
          "description": "Cast your vote for the 1% Treaty: redirect 1% of military spending to accelerate medical research and end preventable disease deaths",
          "emoji": "✅",
          "isHashLink": true,
          "requiresScrollHandler": true,
          "isExternal": true
        },
        {
          "id": "thePlan",
          "label": "The Plan",
          "path": "https://warondisease.org/the-plan",
          "description": "The full plan to end war and disease, organized by how you want to help: vote, share, build a coalition, or fund the campaign.",
          "emoji": "🎯",
          "isExternal": true
        },
        {
          "id": "volunteer",
          "label": "Volunteer",
          "path": "/contact",
          "description": "Volunteer your skills to help more humans vote, share, and accelerate cures",
          "emoji": "🤝"
        }
      ]
    },
    {
      "id": "learn",
      "label": "LEARN MORE",
      "resolvedItems": [
        {
          "id": "about",
          "label": "About",
          "path": "/about",
          "description": "Discover how the Decentralized Institutes of Health accelerates medical breakthroughs with pragmatic trials, delivering 82x efficiency gains and making suffering optional",
          "emoji": "ℹ️"
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
      "label": "SUPPORT THE MISSION",
      "resolvedItems": [
        {
          "id": "institutes",
          "label": "Institutes",
          "path": "https://warondisease.org/institutes",
          "description": "Become a Partner Institute: healthcare organizations and nonprofits conducting 1% Treaty surveys, accessing grants, sharing data, and accelerating medical research",
          "emoji": "🔬",
          "isExternal": true
        }
      ]
    }
  ],
  "footerSections": [
    {
      "id": "join",
      "label": "VOTE ON THE TREATY",
      "resolvedItems": [
        {
          "id": "vote",
          "label": "Answer the Question",
          "path": "https://warondisease.org/#vote",
          "description": "Cast your vote for the 1% Treaty: redirect 1% of military spending to accelerate medical research and end preventable disease deaths",
          "emoji": "✅",
          "isHashLink": true,
          "requiresScrollHandler": true,
          "isExternal": true
        },
        {
          "id": "thePlan",
          "label": "The Plan",
          "path": "https://warondisease.org/the-plan",
          "description": "The full plan to end war and disease, organized by how you want to help: vote, share, build a coalition, or fund the campaign.",
          "emoji": "🎯",
          "isExternal": true
        },
        {
          "id": "volunteer",
          "label": "Volunteer",
          "path": "/contact",
          "description": "Volunteer your skills to help more humans vote, share, and accelerate cures",
          "emoji": "🤝"
        }
      ]
    },
    {
      "id": "manual",
      "label": "GET THE MANUAL",
      "resolvedItems": [
        {
          "id": "manual",
          "label": "How to End War and Disease",
          "path": "https://manual.warondisease.org",
          "description": "An alien wrote 300 pages on how to point everyone's greed at diseases instead of each other. Read, listen, or buy the step-by-step guide to optimizing your terrible civilization",
          "emoji": "📖",
          "isExternal": true
        },
        {
          "id": "listenPodcast",
          "label": "Podcast",
          "path": "https://manual.warondisease.org/listen",
          "description": "Every chapter narrated by an alien who finds your species confusing. Free on Spotify, Apple Podcasts, and all major apps",
          "emoji": "🎧",
          "isExternal": true
        },
        {
          "id": "readOnline",
          "label": "Get the Manual",
          "path": "https://manual.warondisease.org",
          "description": "The full guide to not dying unnecessarily. Free, no account needed",
          "emoji": "📚",
          "isExternal": true
        }
      ]
    },
    {
      "id": "learn",
      "label": "LEARN MORE",
      "resolvedItems": [
        {
          "id": "about",
          "label": "About",
          "path": "/about",
          "description": "Discover how the Decentralized Institutes of Health accelerates medical breakthroughs with pragmatic trials, delivering 82x efficiency gains and making suffering optional",
          "emoji": "ℹ️"
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
