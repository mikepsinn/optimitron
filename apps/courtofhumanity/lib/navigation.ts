import type { AppNavigation } from "@optimitron/site-kit/lib/app-navigation";

/** Navigation owned by this app. Cross-app destinations are explicit URLs. */
export const appNavigation: AppNavigation = {
  "topLevelItems": [
    {
      "id": "humanityVGovernment",
      "label": "Humanity v. Government",
      "path": "/",
      "description": "The damages case against the governments of Earth: war deaths, regulatory delay, and misallocation of public money. Read the case and render your verdict.",
      "emoji": "⚖️"
    },
    {
      "id": "courtPlaintiffs",
      "label": "Register a Plaintiff",
      "path": "/plaintiffs",
      "description": "Put your name on the record in Humanity v. Government.",
      "emoji": "⚖️"
    },
    {
      "id": "joinCourt",
      "label": "Join the Court",
      "path": "/court",
      "description": "Should humans be able to sue a government that kills, injures, or ruins their family? Read the case for the Court of Humanity and join as a member.",
      "emoji": "⚖️"
    },
    {
      "id": "contact",
      "label": "Contact",
      "path": "/contact",
      "description": "Get in touch with the DIH team. Questions about partnerships, volunteering, donations, or joining the war on disease"
    }
  ],
  "sidebarSections": [],
  "footerSections": [
    {
      "id": "case",
      "label": "THE CASE",
      "resolvedItems": [
        {
          "id": "humanityVGovernment",
          "label": "Humanity v. Government",
          "path": "/",
          "description": "The damages case against the governments of Earth: war deaths, regulatory delay, and misallocation of public money. Read the case and render your verdict.",
          "emoji": "⚖️"
        },
        {
          "id": "courtPlaintiffs",
          "label": "Register a Plaintiff",
          "path": "/plaintiffs",
          "description": "Put your name on the record in Humanity v. Government.",
          "emoji": "⚖️"
        },
        {
          "id": "joinCourt",
          "label": "Join the Court",
          "path": "/court",
          "description": "Should humans be able to sue a government that kills, injures, or ruins their family? Read the case for the Court of Humanity and join as a member.",
          "emoji": "⚖️"
        }
      ]
    },
    {
      "id": "ai-agents",
      "label": "FOR AI AGENTS",
      "resolvedItems": [
        {
          "id": "courtMcp",
          "label": "Connect an AI Agent",
          "path": "/mcp"
        },
        {
          "id": "courtMcpTools",
          "label": "Court Tool Reference",
          "path": "/developers/tools"
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
