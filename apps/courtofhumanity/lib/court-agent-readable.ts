import { COURT_OF_HUMANITY_QUESTION } from "@optimitron/data/referendums";
import { courtUrl } from "@optimitron/site-kit/lib/court-links";
import { ROUTES } from "./routes";
function canonicalLine(path: string) {
  return `Canonical HTML: ${courtUrl(path)}`;
}
function apiLine(path: string) {
  return `Machine-readable JSON: ${courtUrl(path)}`;
}
function section(title: string, body: string) {
  return [`## ${title}`, "", body.trim(), ""].join("\n");
}

function buildCourtMirror(input: { courtMarkdown?: string | null }) {
  return [
    "# Court of Humanity",
    "",
    canonicalLine(ROUTES.court),
    "",
    section("Question", COURT_OF_HUMANITY_QUESTION),
    section(
      "Body",
      input.courtMarkdown ||
        "The Court of Humanity is the campaign's public venue for asking whether humans can hold governments accountable when those governments kill, injure, or ruin their families.",
    ),
  ].join("\n");
}

function buildHumanityVGovernmentMirror() {
  return [
    "# Humanity v Government",
    "",
    canonicalLine(ROUTES.humanityVGovernment),
    apiLine("/api/agent/plaintiffs"),
    "",
    section(
      "Caption",
      "Humanity v Government names humanity as the plaintiff and the governments of Earth as the collective defendants.",
    ),
    section(
      "Claim",
      "The case says governments accepted compulsory payment to promote public welfare, then spent public money on war, delayed medicine, and misallocated the cure budget.",
    ),
    section(
      "Settlement",
      "The 1% Treaty is the settlement: redirect 1% of military spending to clinical trials and make compliance more profitable than evasion.",
    ),
  ].join("\n");
}

function buildPlaintiffsMirror() {
  return [
    "# Register a Plaintiff",
    "",
    canonicalLine(ROUTES.plaintiffs),
    apiLine("/api/agent/plaintiffs"),
    "",
    section(
      "Who Belongs Here",
      "Register a person who was harmed by war, state violence, regulatory delay, or preventable disease and should be counted in Humanity v Government.",
    ),
    section(
      "Public Data",
      "Public plaintiff entries show only the details intentionally published for the case. The agent API reports aggregate campaign state, not private account data.",
    ),
    section("Action", `Use ${courtUrl(ROUTES.plaintiffs)} to add a plaintiff.`),
  ].join("\n");
}

export function buildCourtMarkdownMirror(
  key: "court" | "humanity-v-government" | "plaintiffs",
  input: { courtMarkdown?: string | null } = {},
) {
  switch (key) {
    case "court":
      return buildCourtMirror(input);
    case "humanity-v-government":
      return buildHumanityVGovernmentMirror();
    case "plaintiffs":
      return buildPlaintiffsMirror();
  }
}

export const AGENT_CACHE_CONTROL =
  "public, s-maxage=3600, stale-while-revalidate=86400";
export function buildCourtAgentManifest() {
  return {
    name: "Court of Humanity",
    canonicalOrigin: courtUrl("/").replace(/\/$/, ""),
    mcpEndpoint: courtUrl("/api/mcp"),
    mcpCatalog: courtUrl("/api/mcp/tools"),
    mcpInstructions: courtUrl("/mcp"),
    toolReference: courtUrl("/developers/tools"),
    authorizationServer: "https://optimitron.com",
    pages: [ROUTES.court, ROUTES.humanityVGovernment, ROUTES.plaintiffs].map((path) =>
      courtUrl(path),
    ),
    markdownMirrors: [
      "/court.md",
      "/humanity-v-government.md",
      "/plaintiffs.md",
    ].map((path) => courtUrl(path)),
    agentEndpoints: ["/api/agent/manifest", "/api/agent/plaintiffs"].map(
      (path) => courtUrl(path),
    ),
  };
}

export function buildCourtLlmsTxt() {
  const manifest = buildCourtAgentManifest();
  return [
    "# Court of Humanity",
    "",
    `Canonical site: ${manifest.canonicalOrigin}`,
    "",
    "## Public pages",
    ...manifest.pages.map((url) => `- ${url}`),
    "",
    "## Markdown mirrors",
    ...manifest.markdownMirrors.map((url) => `- ${url}`),
    "",
    "## Public agent APIs",
    ...manifest.agentEndpoints.map((url) => `- ${url}`),
    "",
    "## Court MCP",
    `- Endpoint: ${manifest.mcpEndpoint}`,
    `- Catalog: ${manifest.mcpCatalog}`,
    `- Connect: ${manifest.mcpInstructions}`,
    `- Tool reference: ${manifest.toolReference}`,
    "",
    "Authorize a new Court connection through Optimitron. Existing Optimitron and dFDA tokens do not authorize this resource.",
    "",
    "Public agent surfaces exclude private plaintiff details and account data.",
    "",
  ].join("\n");
}
