import type { SiteConfig } from "@/lib/site";
import {
  CAMPAIGN_FAQ_ITEMS,
  absoluteCampaignUrl,
} from "@/lib/agent-readable/campaign-canon";
import {
  HUMANITY_V_GOVERNMENT_CASE_NAME,
  ROUTES,
} from "@/lib/routes";

type JsonLdNode = Record<string, unknown>;

export interface CampaignStructuredData {
  "@context": "https://schema.org";
  "@graph": JsonLdNode[];
}

function nodeId(site: SiteConfig, path: string, fragment: string) {
  return `${absoluteCampaignUrl(site, path)}#${fragment}`;
}

function webPage(site: SiteConfig, path: string, name: string): JsonLdNode {
  return {
    "@type": "WebPage",
    "@id": nodeId(site, path, "webpage"),
    url: absoluteCampaignUrl(site, path),
    name,
    isPartOf: {
      "@id": `${absoluteCampaignUrl(site, "/")}#website`,
    },
  };
}

function graph(nodes: JsonLdNode[]): CampaignStructuredData {
  return {
    "@context": "https://schema.org",
    "@graph": nodes,
  };
}

function voteAction(site: SiteConfig, path: string = ROUTES.vote): JsonLdNode {
  return {
    "@type": "VoteAction",
    "@id": nodeId(site, path, "vote-action"),
    name: "Vote yes on the 1% Treaty",
    target: absoluteCampaignUrl(site, ROUTES.vote),
    object: {
      "@id": nodeId(site, ROUTES.treaty, "legislation"),
    },
    actionStatus: "PotentialActionStatus",
  };
}

function treatyLegislation(site: SiteConfig): JsonLdNode {
  return {
    "@type": "Legislation",
    "@id": nodeId(site, ROUTES.treaty, "legislation"),
    name: "1% Treaty",
    url: absoluteCampaignUrl(site, ROUTES.treaty),
    legislationType: "Treaty",
    description:
      "Redirect 1% of military spending to clinical trials and align political incentives around ending war and disease.",
  };
}

function claim(site: SiteConfig, path: string, name: string, text: string) {
  return {
    "@type": "Claim",
    "@id": nodeId(site, path, name.toLowerCase().replace(/[^a-z0-9]+/g, "-")),
    name,
    text,
    appearance: {
      "@id": nodeId(site, path, "webpage"),
    },
  };
}

export function buildTreatyStructuredData(site: SiteConfig) {
  return graph([
    webPage(site, ROUTES.treaty, "1% Treaty"),
    treatyLegislation(site),
    voteAction(site, ROUTES.treaty),
  ]);
}

export function buildVoteStructuredData(site: SiteConfig) {
  return graph([
    webPage(site, ROUTES.vote, "Vote on the 1% Treaty"),
    treatyLegislation(site),
    voteAction(site, ROUTES.vote),
  ]);
}

export function buildCourtStructuredData(site: SiteConfig) {
  return graph([
    webPage(site, ROUTES.court, "Court of Humanity"),
    claim(
      site,
      ROUTES.court,
      "Human consent claim",
      "Humans can join a public jury and hold governments accountable for killing, injuring, or ruining families.",
    ),
    claim(
      site,
      ROUTES.court,
      "Settlement claim",
      "The 1% Treaty is the proposed settlement mechanism for the Court of Humanity campaign.",
    ),
  ]);
}

export function buildHumanityVGovernmentStructuredData(site: SiteConfig) {
  return graph([
    webPage(site, ROUTES.humanityVGovernment, HUMANITY_V_GOVERNMENT_CASE_NAME),
    claim(
      site,
      ROUTES.humanityVGovernment,
      "Humanity v Government indictment",
      "Governments accepted compulsory payment to promote public welfare, then spent public money on war and delayed medicine.",
    ),
    claim(
      site,
      ROUTES.humanityVGovernment,
      "Humanity v Government damages",
      "Humanity v Government asks whether governments owe damages for war deaths, regulatory delay, and misallocation of public money.",
    ),
    claim(
      site,
      ROUTES.humanityVGovernment,
      "Humanity v Government settlement",
      "The 1% Treaty is the settlement: redirect 1% of military spending to clinical trials.",
    ),
  ]);
}

export function buildCampaignFaqStructuredData(site: SiteConfig) {
  return graph([
    webPage(site, ROUTES.faq, "Campaign FAQ"),
    {
      "@type": "FAQPage",
      "@id": nodeId(site, ROUTES.faq, "faq"),
      url: absoluteCampaignUrl(site, ROUTES.faq),
      name: "Campaign FAQ",
      mainEntity: CAMPAIGN_FAQ_ITEMS.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    },
  ]);
}

export function getStructuredDataTypes(payload: CampaignStructuredData) {
  const types = new Set<string>();

  function visit(value: unknown) {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      for (const entry of value) visit(entry);
      return;
    }

    const record = value as Record<string, unknown>;
    if (typeof record["@type"] === "string") {
      types.add(record["@type"]);
    }
    for (const entry of Object.values(record)) {
      visit(entry);
    }
  }

  visit(payload);
  return [...types];
}
