import type {
  OutcomeMegaStudyRankingRow,
  PairStudyResult,
  PairStudyQualityFlag,
} from "@optimitron/optimizer";
import { collectPairStudyQualityFlags } from "@optimitron/optimizer";

import type {
  EvidenceCertainty,
  EvidenceDirection,
  ExplorerOutcomeQualityBadge,
  ExplorerPairQualityBadge,
} from "./analysis-explorer-types";

function countFlagsBySeverity(flags: PairStudyQualityFlag[]): {
  warningCount: number;
  errorCount: number;
} {
  let warningCount = 0;
  let errorCount = 0;

  for (const flag of flags) {
    if (flag.severity === "warning") warningCount += 1;
    if (flag.severity === "error") errorCount += 1;
  }

  return { warningCount, errorCount };
}

export function classifyEvidenceDirection(value: number | null | undefined): EvidenceDirection {
  if (value == null || !Number.isFinite(value)) return "mixed";
  if (value >= 0.02) return "positive";
  if (value <= -0.02) return "negative";
  return "neutral";
}

export function classifyEvidenceCertainty(confidence: number): EvidenceCertainty {
  if (confidence >= 0.75) return "high";
  if (confidence >= 0.5) return "moderate";
  return "low";
}

export function buildOutcomeQualityBadges(
  row: OutcomeMegaStudyRankingRow,
): ExplorerOutcomeQualityBadge[] {
  const certainty = classifyEvidenceCertainty(row.confidence);
  const direction = classifyEvidenceDirection(row.aggregatePredictivePearson);

  return [
    {
      key: "significance",
      label: row.significant ? "FDR Significant" : "Not Significant",
      tone: row.significant ? "info" : "warning",
    },
    {
      key: "certainty",
      label: `Certainty ${certainty}`,
      tone: certainty === "high" ? "info" : certainty === "moderate" ? "neutral" : "warning",
    },
    {
      key: "direction",
      label: `Direction ${direction}`,
      tone: direction === "mixed" ? "neutral" : "info",
    },
  ];
}

export function buildPairStudyQualityBadges(
  study: PairStudyResult,
): ExplorerPairQualityBadge[] {
  const flags = collectPairStudyQualityFlags(study);
  const { warningCount, errorCount } = countFlagsBySeverity(flags);
  const coverageSparse = study.coverage.includedSubjects < 20;
  const direction = classifyEvidenceDirection(study.evidence.predictivePearson);

  const badges: ExplorerPairQualityBadge[] = [
    {
      key: "evidence_grade",
      label: `Grade ${study.evidence.evidenceGrade}`,
      tone: study.evidence.evidenceGrade === "A" || study.evidence.evidenceGrade === "B" ? "info" : "neutral",
    },
    {
      key: "direction",
      label: `Direction ${direction}`,
      tone: direction === "mixed" ? "neutral" : "info",
    },
  ];

  if (errorCount > 0) {
    badges.push({
      key: "quality_errors",
      label: `${errorCount} quality error${errorCount > 1 ? "s" : ""}`,
      tone: "danger",
    });
  } else if (warningCount > 0) {
    badges.push({
      key: "quality_warnings",
      label: `${warningCount} quality warning${warningCount > 1 ? "s" : ""}`,
      tone: "warning",
    });
  } else {
    badges.push({
      key: "quality_clean",
      label: "No quality warnings",
      tone: "neutral",
    });
  }

  if (coverageSparse) {
    badges.push({
      key: "coverage",
      label: "Sparse subject coverage",
      tone: "warning",
    });
  }

  return badges;
}
