import { describe, expect, it } from "vitest";

import {
  getOutcomeMegaStudy,
  getPairStudy,
  getPairSubject,
} from "../analysis-explorer-data";
import {
  getJurisdictionRouteParams,
  getJurisdictionStudyPath,
  getOutcomeHubPath,
  getOutcomeRouteParams,
  getPairRouteParams,
  getPairStudyPath,
} from "../analysis-explorer-routes";

describe("analysis explorer routes", () => {
  it("builds non-empty static params for all route levels", () => {
    const outcomeParams = getOutcomeRouteParams();
    const pairParams = getPairRouteParams();
    const jurisdictionParams = getJurisdictionRouteParams();

    expect(outcomeParams.length).toBeGreaterThan(0);
    expect(pairParams.length).toBeGreaterThan(0);
    expect(jurisdictionParams.length).toBeGreaterThan(0);
  });

  it("maps outcome and pair params to existing payloads", () => {
    for (const param of getOutcomeRouteParams()) {
      const ranking = getOutcomeMegaStudy(param.outcomeId);
      expect(ranking).not.toBeNull();
      expect(getOutcomeHubPath(param.outcomeId)).toContain(param.outcomeId);
    }

    for (const param of getPairRouteParams()) {
      const study = getPairStudy(param.outcomeId, param.predictorId);
      expect(study).not.toBeNull();
      expect(getPairStudyPath(param.outcomeId, param.predictorId)).toContain(param.outcomeId);
    }
  });

  it("maps jurisdiction params to existing subject summaries", () => {
    const subset = getJurisdictionRouteParams().slice(0, 200);

    for (const param of subset) {
      const subject = getPairSubject(param.outcomeId, param.predictorId, param.jurisdictionId);
      expect(subject).not.toBeNull();
      expect(
        getJurisdictionStudyPath(param.outcomeId, param.predictorId, param.jurisdictionId),
      ).toContain(param.jurisdictionId);
    }
  });
});
