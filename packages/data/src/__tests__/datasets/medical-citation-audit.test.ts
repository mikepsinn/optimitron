import { describe, expect, it } from "vitest";

import {
  auditTreatment,
  classifyCitationUrl,
  outcomeProvenance,
} from "../../datasets/medical-citation-audit";
import type { TreatmentForCondition } from "../../datasets/medical";

describe("classifyCitationUrl", () => {
  it.each([
    ["https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQEkq_fI", "vertex-grounding-redirect", null],
    ["https://clinicaltrials.gov/search?cond=Alzheimer's%20Disease&intr=Lecanemab", "clinicaltrials-search", null],
    ["https://clinicaltrials.gov/study/NCT03887455", "clinicaltrials-study", "nct:NCT03887455"],
    ["https://classic.clinicaltrials.gov/ct2/show/nct04437511?term=x", "clinicaltrials-study", "nct:NCT04437511"],
    ["https://doi.org/10.1056/NEJMoa2212948", "doi", "doi:10.1056/nejmoa2212948"],
    ["https://www.nejm.org/doi/full/10.1056/NEJMoa2212948", "doi", "doi:10.1056/nejmoa2212948"],
    ["https://pubmed.ncbi.nlm.nih.gov/36449413/", "pubmed", "pmid:36449413"],
    ["https://pmc.ncbi.nlm.nih.gov/articles/PMC10450571/", "pmc", "pmc:PMC10450571"],
    ["https://www.accessdata.fda.gov/drugsatfda_docs/label/2023/761269Orig1s001lbl.pdf", "regulatory-label", "label:accessdata.fda.gov/drugsatfda_docs/label/2023/761269Orig1s001lbl.pdf"],
    ["https://www.google.com/search?q=time+in+Ribeir%C3%A3o+Preto,+BR", "search-engine", null],
    ["https://www.researchgate.net/publication/123", "other-web", null],
    ["not a url", "invalid", null],
  ])("%s -> %s", (url, kind, sourceId) => {
    expect(classifyCitationUrl(url)).toEqual({ kind, sourceId });
  });
});

describe("outcomeProvenance", () => {
  it("separates name-only rows from rows that carry unlabeled values", () => {
    expect(outcomeProvenance({ name: "ADAS-Cog" })).toBe("name-only");
    expect(outcomeProvenance({ name: "ADAS-Cog", absoluteChange: "-2 points" })).toBe("unlabeled-values");
    expect(outcomeProvenance({ name: "ADAS-Cog", dataSource: "ai-estimated" })).toBe("ai-estimated");
  });
});

describe("auditTreatment", () => {
  const base: TreatmentForCondition = {
    name: "Lecanemab",
    effectiveness: 55,
    confidenceScore: 80,
    safetyScore: 50,
    trials: 26,
    participants: 3000,
    sideEffects: [{ name: "Headache", percentage: 13 }],
  };

  it("does not treat redirect or search links as primary sources", () => {
    const audit = auditTreatment("alzheimers-disease", "Alzheimer's Disease", {
      ...base,
      citations: [
        { title: "nih.gov", url: "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZ" },
        { url: "https://clinicaltrials.gov/search?cond=Alzheimer's%20Disease&intr=Lecanemab" },
      ],
    });
    expect(audit.hasResolvablePrimarySource).toBe(false);
    expect(audit.redirectTitles).toEqual(["nih.gov"]);
  });

  it("accepts a stored pubmedId when the URL itself is opaque", () => {
    const audit = auditTreatment("alzheimers-disease", "Alzheimer's Disease", {
      ...base,
      citations: [
        { url: "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZ", pubmedId: "36449413" },
      ],
    });
    expect(audit.primarySourceIds).toEqual(["pmid:36449413"]);
    expect(audit.citationKinds.pubmed).toBe(1);
  });
});
