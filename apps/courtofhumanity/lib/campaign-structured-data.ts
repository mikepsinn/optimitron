import { HUMANITY_V_GOVERNMENT_CASE_NAME } from "@optimitron/db/task-keys";
import { getSiteConfig } from "@/lib/site-config";
import { ROUTES } from "@/lib/routes";

/**
 * JSON-LD builders for the Court of Humanity surfaces, ported from the
 * monolith's `lib/campaign-structured-data.ts`. This app serves exactly one
 * site (courtofhumanity.org), so the builders read the fixed site config
 * instead of taking a per-request `site` argument.
 */

type JsonLdNode = Record<string, unknown>;

export interface CampaignStructuredData {
  "@context": "https://schema.org";
  "@graph": JsonLdNode[];
}

function absoluteUrl(path: string) {
  return `${getSiteConfig().baseUrl}${path === "/" ? "" : path}` || "/";
}

function nodeId(path: string, fragment: string) {
  return `${absoluteUrl(path)}#${fragment}`;
}

function webPage(path: string, name: string): JsonLdNode {
  return {
    "@type": "WebPage",
    "@id": nodeId(path, "webpage"),
    url: absoluteUrl(path),
    name,
    isPartOf: {
      "@id": `${getSiteConfig().baseUrl}/#website`,
    },
  };
}

function graph(nodes: JsonLdNode[]): CampaignStructuredData {
  return {
    "@context": "https://schema.org",
    "@graph": nodes,
  };
}

function claim(path: string, name: string, text: string) {
  return {
    "@type": "Claim",
    "@id": nodeId(path, name.toLowerCase().replace(/[^a-z0-9]+/g, "-")),
    name,
    text,
    appearance: {
      "@id": nodeId(path, "webpage"),
    },
  };
}

export function buildCourtStructuredData() {
  return graph([
    webPage(ROUTES.court, "Court of Humanity"),
    claim(
      ROUTES.court,
      "Public membership claim",
      "Verified humans can join the Court of Humanity, inspect case evidence, and cast one verdict per case.",
    ),
  ]);
}

export function buildHumanityVGovernmentStructuredData() {
  return graph([
    webPage(ROUTES.humanityVGovernment, HUMANITY_V_GOVERNMENT_CASE_NAME),
    claim(
      ROUTES.humanityVGovernment,
      "Humanity v Government indictment",
      "Governments accepted compulsory payment to promote public welfare, then spent public money on war and delayed medicine.",
    ),
    claim(
      ROUTES.humanityVGovernment,
      "Humanity v Government damages",
      "Humanity v Government asks whether governments owe damages for war deaths, regulatory delay, and misallocation of public money.",
    ),
    claim(
      ROUTES.humanityVGovernment,
      "Humanity v Government settlement",
      "The 1% Treaty is the settlement: redirect 1% of military spending to clinical trials.",
    ),
  ]);
}
