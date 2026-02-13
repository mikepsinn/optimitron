import {
  listExplorerOutcomes,
  listExplorerPairSummaries,
  listPairSubjects,
} from "./analysis-explorer-data";

export interface OutcomeRouteParams {
  outcomeId: string;
}

export interface PairRouteParams {
  outcomeId: string;
  predictorId: string;
}

export interface JurisdictionRouteParams extends PairRouteParams {
  jurisdictionId: string;
}

export function getOutcomeHubPath(outcomeId: string): string {
  return `/outcomes/${encodeURIComponent(outcomeId)}`;
}

export function getPairStudyPath(outcomeId: string, predictorId: string): string {
  return `/studies/${encodeURIComponent(outcomeId)}/${encodeURIComponent(predictorId)}`;
}

export function getJurisdictionsPath(outcomeId: string, predictorId: string): string {
  return `${getPairStudyPath(outcomeId, predictorId)}/jurisdictions`;
}

export function getJurisdictionStudyPath(
  outcomeId: string,
  predictorId: string,
  jurisdictionId: string,
): string {
  return `${getJurisdictionsPath(outcomeId, predictorId)}/${encodeURIComponent(jurisdictionId)}`;
}

export function getOutcomeRouteParams(): OutcomeRouteParams[] {
  return listExplorerOutcomes().map(outcome => ({ outcomeId: outcome.id }));
}

export function getPairRouteParams(): PairRouteParams[] {
  return listExplorerPairSummaries().map(pair => ({
    outcomeId: pair.outcomeId,
    predictorId: pair.predictorId,
  }));
}

export function getJurisdictionRouteParams(): JurisdictionRouteParams[] {
  const params: JurisdictionRouteParams[] = [];

  for (const pair of listExplorerPairSummaries()) {
    const subjects = listPairSubjects(pair.outcomeId, pair.predictorId);
    for (const subject of subjects) {
      params.push({
        outcomeId: pair.outcomeId,
        predictorId: pair.predictorId,
        jurisdictionId: subject.subjectId,
      });
    }
  }

  return params;
}
