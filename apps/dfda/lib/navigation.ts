import type { AppNavigation } from "@optimitron/site-kit/lib/app-navigation";

/** Navigation owned by this app. Cross-app destinations are explicit URLs. */
export const appNavigation: AppNavigation = {
  "topLevelItems": [
    {
      "id": "conditions",
      "label": "Conditions",
      "path": "/conditions",
      "description": "Browse medical conditions and explore available clinical trials. View treatment rankings and real-world effectiveness data for hundreds of health conditions",
      "emoji": "🏥"
    },
    {
      "id": "treatments",
      "label": "Treatments",
      "path": "/treatments",
      "description": "Explore treatments and interventions with comprehensive clinical trial data. Compare effectiveness metrics and therapeutic options across multiple medical conditions",
      "emoji": "💊"
    },
    {
      "id": "mcp",
      "label": "AI Health Tracker",
      "path": "/mcp",
      "description": "Connect an AI assistant to dFDA to record personal health measurements, review your history, and manage tracking reminders.",
      "emoji": "🤖"
    }
  ],
  "sidebarSections": [
    {
      "id": "find-treatment",
      "label": "FIND TREATMENT",
      "resolvedItems": [
        {
          "id": "conditions",
          "label": "Conditions",
          "path": "/conditions",
          "description": "Browse medical conditions and explore available clinical trials. View treatment rankings and real-world effectiveness data for hundreds of health conditions",
          "emoji": "🏥"
        },
        {
          "id": "treatments",
          "label": "Treatments",
          "path": "/treatments",
          "description": "Explore treatments and interventions with comprehensive clinical trial data. Compare effectiveness metrics and therapeutic options across multiple medical conditions",
          "emoji": "💊"
        },
        {
          "id": "findTrials",
          "label": "Find Trials",
          "path": "/find-trials",
          "description": "Search for active trials matching your condition, intervention, location, age, and study type",
          "emoji": "🔍"
        }
      ]
    },
    {
      "id": "studies",
      "label": "STUDIES",
      "resolvedItems": [
        {
          "id": "megaStudies",
          "label": "Mega Studies",
          "path": "https://studies.dfda.earth",
          "description": "Outcome labels for 10,000+ foods, drugs, and supplements with treatment effectiveness rankings measured by change from baseline across 100+ conditions",
          "emoji": "📊",
          "isExternal": true
        },
        {
          "id": "observationalStudies",
          "label": "Observational Studies",
          "path": "https://studies.dfda.earth",
          "description": "Explore causal relationships between treatments and conditions from thousands of aggregated n-of-1 studies. Discover correlations and treatment effects from real-world patient data",
          "emoji": "🔬",
          "isExternal": true
        }
      ]
    },
    {
      "id": "evidence",
      "label": "MEDICAL EVIDENCE",
      "resolvedItems": [
        {
          "id": "research",
          "label": "Research & Evidence",
          "path": "/research",
          "description": "Comprehensive economic analysis showing pragmatic trials deliver 637:1 ROI with $172B+ recurring annual benefits. Peer-reviewed methodology and sensitivity testing",
          "emoji": "📚"
        },
        {
          "id": "references",
          "label": "References",
          "path": "/references",
          "description": "Complete collection of source citations, quotes, and academic references supporting all claims in the War on Disease documentation",
          "emoji": "📖"
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
      "id": "studies-tools",
      "label": "STUDIES & TOOLS",
      "resolvedItems": [
        {
          "id": "dfdaStudies",
          "label": "Personal Health Studies",
          "path": "https://studies.dfda.earth",
          "description": "Track health outcomes and discover hidden patterns. 7,000+ crowdsourced studies on the causes and effects of foods, drugs, and supplements",
          "emoji": "🔬",
          "isExternal": true
        },
        {
          "id": "dfdaImpact",
          "label": "Cost-Benefit Analysis",
          "path": "https://impact.dfda.earth",
          "description": "Interactive analysis showing how pragmatic trials could reduce drug development from $41K to $929 per patient and save 10.7 billion lives",
          "emoji": "📊",
          "isExternal": true
        },
        {
          "id": "dfdaSpec",
          "label": "Protocol Specification",
          "path": "https://spec.dfda.earth",
          "description": "The two-stage methodology: observational signal detection from real-world patient data, then pragmatic trial confirmation at 44x lower cost",
          "emoji": "📖",
          "isExternal": true
        }
      ]
    }
  ],
  "footerSections": [
    {
      "id": "treatments",
      "label": "TREATMENTS",
      "resolvedItems": [
        {
          "id": "conditions",
          "label": "Conditions",
          "path": "/conditions",
          "description": "Browse medical conditions and explore available clinical trials. View treatment rankings and real-world effectiveness data for hundreds of health conditions",
          "emoji": "🏥"
        },
        {
          "id": "treatments",
          "label": "Treatments",
          "path": "/treatments",
          "description": "Explore treatments and interventions with comprehensive clinical trial data. Compare effectiveness metrics and therapeutic options across multiple medical conditions",
          "emoji": "💊"
        },
        {
          "id": "findTrials",
          "label": "Find Trials",
          "path": "/find-trials",
          "description": "Search for active trials matching your condition, intervention, location, age, and study type",
          "emoji": "🔍"
        }
      ]
    },
    {
      "id": "resources",
      "label": "RESOURCES",
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
          "id": "faq",
          "label": "FAQ",
          "path": "/faq",
          "description": "Answers about the 1% Treaty, pragmatic clinical trials, peace dividend economics, implementation feasibility, and how to help",
          "emoji": "❓"
        },
        {
          "id": "dfdaImpact",
          "label": "Cost-Benefit Analysis",
          "path": "https://impact.dfda.earth",
          "description": "Interactive analysis showing how pragmatic trials could reduce drug development from $41K to $929 per patient and save 10.7 billion lives",
          "emoji": "📊",
          "isExternal": true
        },
        {
          "id": "dfdaSpec",
          "label": "Protocol Specification",
          "path": "https://spec.dfda.earth",
          "description": "The two-stage methodology: observational signal detection from real-world patient data, then pragmatic trial confirmation at 44x lower cost",
          "emoji": "📖",
          "isExternal": true
        },
        {
          "id": "dfdaStudies",
          "label": "Personal Health Studies",
          "path": "https://studies.dfda.earth",
          "description": "Track health outcomes and discover hidden patterns. 7,000+ crowdsourced studies on the causes and effects of foods, drugs, and supplements",
          "emoji": "🔬",
          "isExternal": true
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
