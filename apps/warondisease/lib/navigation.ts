import type { AppNavigation } from "@optimitron/site-kit/lib/app-navigation";

/** Navigation owned by this app. Cross-app destinations are explicit URLs. */
export const appNavigation: AppNavigation = {
  "topLevelItems": [
    {
      "id": "treaty",
      "label": "Sign the Treaty",
      "path": "/treaty",
      "description": "Read the 1% Treaty and add your signature at the bottom",
      "emoji": "📜"
    },
    {
      "id": "send",
      "label": "Tell Two People",
      "path": "/send",
      "description": "Send a 1% Treaty invitation to someone who has not voted",
      "emoji": "📨"
    },
    {
      "id": "plaintiffs",
      "label": "Register a Plaintiff",
      "path": "https://courtofhumanity.org/plaintiffs",
      "description": "Put your name on the record in Humanity v. Government.",
      "emoji": "⚖️",
      "isExternal": true
    },
    {
      "id": "employees",
      "label": "President Management System",
      "path": "/employees",
      "description": "See which presidents are late and remind them to sign the 1% Treaty",
      "emoji": "🏛️"
    },
    {
      "id": "manageHumanity",
      "label": "Manage Humanity",
      "path": "/dashboard",
      "description": "Your campaign dashboard: share your voting link and see who you brought in.",
      "emoji": "🌍"
    }
  ],
  "sidebarSections": [],
  "footerSections": [
    {
      "id": "do-something",
      "label": "DO SOMETHING",
      "resolvedItems": [
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
          "id": "plaintiffs",
          "label": "Register a Plaintiff",
          "path": "https://courtofhumanity.org/plaintiffs",
          "description": "Put your name on the record in Humanity v. Government.",
          "emoji": "⚖️",
          "isExternal": true
        },
        {
          "id": "employees",
          "label": "President Management System",
          "path": "/employees",
          "description": "See which presidents are late and remind them to sign the 1% Treaty",
          "emoji": "🏛️"
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
          "id": "feedback",
          "label": "Feedback",
          "path": "/feedback",
          "description": "Tell us what is confusing, irritating, broken, or missing.",
          "emoji": "❗"
        }
      ]
    },
    {
      "id": "tell-someone-else",
      "label": "TELL SOMEONE ELSE",
      "resolvedItems": [
        {
          "id": "send",
          "label": "Tell Two People",
          "path": "/send",
          "description": "Send a 1% Treaty invitation to someone who has not voted",
          "emoji": "📨"
        },
        {
          "id": "shirt",
          "label": "Get the Shirt",
          "path": "/shirt",
          "description": "Wear the treaty. Every shirt is a walking ballot.",
          "emoji": "👕"
        },
        {
          "id": "poster",
          "label": "Hang Up Flyers",
          "path": "/poster",
          "description": "Print flyers with your referral code and hang them where people walk",
          "emoji": "📄"
        },
        {
          "id": "doorToDoor",
          "label": "Go Door to Door",
          "path": "/door-to-door",
          "description": "Print the YES sheet and register the neighbors the internet missed",
          "emoji": "🚪"
        },
        {
          "id": "signatories",
          "label": "Treaty Signatories",
          "path": "/signatories",
          "description": "See the humans and organizations that signed the 1% Treaty",
          "emoji": "🏆"
        }
      ]
    },
    {
      "id": "learn-something",
      "label": "LEARN SOMETHING",
      "resolvedItems": [
        {
          "id": "humanityVGovernmentCase",
          "label": "Humanity v. Government",
          "path": "https://courtofhumanity.org/humanity-v-government",
          "description": "The public case for redirecting 1% of military spending from weapons to cures.",
          "emoji": "📜",
          "isExternal": true
        },
        {
          "id": "treatyImpact",
          "label": "Impact Analysis",
          "path": "https://impact.warondisease.org",
          "description": "The 1% Treaty impact analysis: lives, years, and dollars.",
          "emoji": "📊",
          "isExternal": true
        },
        {
          "id": "manual",
          "label": "How to End War and Disease",
          "path": "https://manual.warondisease.org",
          "description": "An alien wrote 300 pages on how to point everyone's greed at diseases instead of each other. Read, listen, or buy the step-by-step guide to optimizing your terrible civilization",
          "emoji": "📖",
          "isExternal": true
        },
        {
          "id": "thePlan",
          "label": "The Plan",
          "path": "/the-plan",
          "description": "The full plan to end war and disease, organized by how you want to help: vote, share, build a coalition, or fund the campaign.",
          "emoji": "🎯"
        },
        {
          "id": "faq",
          "label": "FAQ",
          "path": "/faq",
          "description": "Answers about the 1% Treaty, pragmatic clinical trials, peace dividend economics, implementation feasibility, and how to help",
          "emoji": "❓"
        },
        {
          "id": "about",
          "label": "About",
          "path": "/about",
          "description": "Who runs the International Campaign to End War and Disease, and what it is trying to do.",
          "emoji": "ℹ️"
        }
      ]
    },
    {
      "id": "your-organization",
      "label": "YOUR ORGANIZATION",
      "resolvedItems": [
        {
          "id": "join",
          "label": "Join as an Organization",
          "path": "/join",
          "description": "Endorse the 1% Treaty on behalf of an organization",
          "emoji": "🤝"
        },
        {
          "id": "institutes",
          "label": "Institutes",
          "path": "/institutes",
          "description": "Become a Partner Institute: healthcare organizations and nonprofits conducting 1% Treaty surveys, accessing grants, sharing data, and accelerating medical research",
          "emoji": "🔬"
        },
        {
          "id": "volunteer",
          "label": "Volunteer",
          "path": "/contact",
          "description": "Volunteer your skills to help more humans vote, share, and accelerate cures",
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
