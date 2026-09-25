/**
 * Efficiency Attribution — which budget line a cross-country benchmark describes
 *
 * Cross-country spending panels report broad fields: total health spending
 * (public and private), government education spending at all levels,
 * military spending. Several budget lines are often benchmarked against the
 * same field. The field's overspend ratio and savings describe the field,
 * not each line that borrows it.
 *
 * A field describes a line only when the line is most of what the field
 * measures (military spending ↔ the defense budget). Every other line is a
 * proxy: the field is context for it, not an estimate of it.
 */

import type { EfficiencyAnalysis } from './efficiency-analysis.js';

/**
 * - `category_specific`: the field measures this line, so the field's figures are the line's.
 * - `national_field_proxy`: the field measures a broader national aggregate; its figures are not the line's.
 */
export type EfficiencyEvidenceScope = 'category_specific' | 'national_field_proxy';

/** A line must be at least this share of the field's spending before the field's figures describe the line. */
export const CATEGORY_SPECIFIC_MIN_FIELD_SHARE = 0.5;

export interface FieldBenchmarkedLine {
  /** Budget line id */
  id: string;
  /** Cross-country spending field the line is benchmarked against */
  spendingField: string;
  /** The line's spending per capita, in the same units as `efficiency.spendingPerCapita` */
  lineSpendingPerCapita: number;
  /** Efficiency analysis of the field against the line's mapped outcome */
  efficiency: EfficiencyAnalysis;
}

export interface LineAttribution {
  id: string;
  spendingField: string;
  scope: EfficiencyEvidenceScope;
  /** Line spending per capita ÷ the field's spending per capita for the target jurisdiction */
  shareOfField: number;
}

export interface FieldEfficiencyFinding {
  spendingField: string;
  /**
   * The one analysis reported for the field. The category-specific line's
   * analysis wins. Without one, the smallest savings claim wins, so a field
   * benchmarked against several outcomes never reports the largest.
   */
  efficiency: EfficiencyAnalysis;
  /** The line the field measures, or null when every line is a proxy */
  categorySpecificLineId: string | null;
  /** Every line benchmarked against the field, in input order */
  lineIds: string[];
}

function shareOfField(line: FieldBenchmarkedLine): number {
  const fieldPerCapita = line.efficiency.spendingPerCapita;
  return fieldPerCapita > 0 ? line.lineSpendingPerCapita / fieldPerCapita : 0;
}

/**
 * Classify each line as category-specific or a proxy for its field.
 * At most one line per field is category-specific: the line with the
 * largest share, and only when that share reaches
 * CATEGORY_SPECIFIC_MIN_FIELD_SHARE.
 */
export function attributeFieldsToLines(lines: readonly FieldBenchmarkedLine[]): LineAttribution[] {
  const largestShareByField = new Map<string, { id: string; share: number }>();
  for (const line of lines) {
    const share = shareOfField(line);
    const current = largestShareByField.get(line.spendingField);
    if (!current || share > current.share) {
      largestShareByField.set(line.spendingField, { id: line.id, share });
    }
  }

  return lines.map((line) => {
    const share = shareOfField(line);
    const largest = largestShareByField.get(line.spendingField);
    const isCategorySpecific =
      largest?.id === line.id && share >= CATEGORY_SPECIFIC_MIN_FIELD_SHARE;
    return {
      id: line.id,
      spendingField: line.spendingField,
      scope: isCategorySpecific ? 'category_specific' : 'national_field_proxy',
      shareOfField: Math.round(share * 1000) / 1000,
    };
  });
}

function smallerSavingsClaim(a: EfficiencyAnalysis, b: EfficiencyAnalysis): EfficiencyAnalysis {
  if (a.potentialSavingsTotal !== b.potentialSavingsTotal) {
    return a.potentialSavingsTotal < b.potentialSavingsTotal ? a : b;
  }
  return a.outcomeName <= b.outcomeName ? a : b;
}

/** Collapse lines to one finding per spending field, in order of first appearance. */
export function summarizeEfficiencyByField(lines: readonly FieldBenchmarkedLine[]): FieldEfficiencyFinding[] {
  const attributions = attributeFieldsToLines(lines);
  const findings = new Map<string, FieldEfficiencyFinding>();

  lines.forEach((line, index) => {
    const isCategorySpecific = attributions[index]?.scope === 'category_specific';
    const finding = findings.get(line.spendingField);

    if (!finding) {
      findings.set(line.spendingField, {
        spendingField: line.spendingField,
        efficiency: line.efficiency,
        categorySpecificLineId: isCategorySpecific ? line.id : null,
        lineIds: [line.id],
      });
      return;
    }

    finding.lineIds.push(line.id);
    if (isCategorySpecific) {
      finding.categorySpecificLineId = line.id;
      finding.efficiency = line.efficiency;
    } else if (finding.categorySpecificLineId === null) {
      finding.efficiency = smallerSavingsClaim(finding.efficiency, line.efficiency);
    }
  });

  return [...findings.values()];
}
