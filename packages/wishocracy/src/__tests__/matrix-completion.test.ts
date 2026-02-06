import { describe, it, expect } from 'vitest';
import { completeMatrix, inferMissingRatios } from '../matrix-completion.js';
import type { MatrixEntry } from '../types.js';

// ─── Helper ──────────────────────────────────────────────────────────
function entry(
  itemAId: string,
  itemBId: string,
  ratio: number,
  count: number = 10,
): MatrixEntry {
  return { itemAId, itemBId, ratio, count };
}

// =====================================================================
// completeMatrix
// =====================================================================
describe('completeMatrix', () => {
  it('returns empty result for no entries', () => {
    const result = completeMatrix([]);
    expect(result.items).toEqual([]);
    expect(result.entries).toEqual([]);
    expect(result.observedPairs).toBe(0);
    expect(result.inferredPairs).toBe(0);
    expect(result.missingPairs).toBe(0);
  });

  it('single observed pair is preserved', () => {
    const result = completeMatrix([entry('A', 'B', 3)]);
    expect(result.observedPairs).toBe(1);
    expect(result.inferredPairs).toBe(0);
    expect(result.missingPairs).toBe(0);
    expect(result.items).toEqual(['A', 'B']);

    // Check ratio
    const ab = result.entries.find(e => e.itemAId === 'A' && e.itemBId === 'B');
    expect(ab).toBeDefined();
    expect(ab!.ratio).toBeCloseTo(3, 4);

    // Matrix should have correct values
    expect(result.matrix[0]![1]).toBeCloseTo(3, 4);     // A:B
    expect(result.matrix[1]![0]).toBeCloseTo(1 / 3, 4); // B:A (reciprocal)
    expect(result.matrix[0]![0]).toBeCloseTo(1, 4);      // diagonal
    expect(result.matrix[1]![1]).toBeCloseTo(1, 4);      // diagonal
  });

  it('infers missing pair via transitivity: A:B=3, B:C=2 → A:C≈6', () => {
    const result = completeMatrix([
      entry('A', 'B', 3),
      entry('B', 'C', 2),
    ]);

    expect(result.observedPairs).toBe(2);
    expect(result.inferredPairs).toBe(1);
    expect(result.missingPairs).toBe(0);

    // A:C should be inferred as 3 * 2 = 6
    const ac = result.entries.find(e => e.itemAId === 'A' && e.itemBId === 'C');
    expect(ac).toBeDefined();
    expect(ac!.ratio).toBeCloseTo(6, 4);
    expect(ac!.count).toBe(0); // inferred entries have count 0
  });

  it('log-space additivity: ln(A:C) = ln(A:B) + ln(B:C)', () => {
    const ratioAB = 5;
    const ratioBC = 0.4;
    const expectedAC = ratioAB * ratioBC; // 2.0

    const result = completeMatrix([
      entry('A', 'B', ratioAB),
      entry('B', 'C', ratioBC),
    ]);

    const ac = result.entries.find(e => e.itemAId === 'A' && e.itemBId === 'C');
    expect(ac!.ratio).toBeCloseTo(expectedAC, 4);

    // Verify in log-space
    expect(Math.log(ac!.ratio)).toBeCloseTo(
      Math.log(ratioAB) + Math.log(ratioBC),
      6,
    );
  });

  it('reciprocal property holds for inferred pairs', () => {
    const result = completeMatrix([
      entry('A', 'B', 4),
      entry('B', 'C', 3),
    ]);

    const m = result.matrix;
    const n = m.length;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        expect(m[i]![j]! * m[j]![i]!).toBeCloseTo(1, 4);
      }
    }
  });

  it('handles a chain: A→B→C→D', () => {
    const result = completeMatrix([
      entry('A', 'B', 2),
      entry('B', 'C', 3),
      entry('C', 'D', 4),
    ]);

    expect(result.observedPairs).toBe(3);
    expect(result.inferredPairs).toBe(3); // A:C, A:D, B:D

    // A:C = 2*3 = 6
    const idxA = result.items.indexOf('A');
    const idxC = result.items.indexOf('C');
    expect(result.matrix[idxA]![idxC]).toBeCloseTo(6, 4);

    // A:D = 2*3*4 = 24
    const idxD = result.items.indexOf('D');
    expect(result.matrix[idxA]![idxD]).toBeCloseTo(24, 4);

    // B:D = 3*4 = 12
    const idxB = result.items.indexOf('B');
    expect(result.matrix[idxB]![idxD]).toBeCloseTo(12, 4);
  });

  it('prefers direct observation over transitive inference', () => {
    // A:B = 3 (direct), B:C = 2 (direct), A:C = 5 (direct — should beat 3*2=6)
    const result = completeMatrix([
      entry('A', 'B', 3),
      entry('B', 'C', 2),
      entry('A', 'C', 5), // direct observation
    ]);

    expect(result.observedPairs).toBe(3);
    expect(result.inferredPairs).toBe(0);

    const ac = result.entries.find(e => e.itemAId === 'A' && e.itemBId === 'C');
    expect(ac!.ratio).toBeCloseTo(5, 4); // direct, not 6
    expect(result.hopCounts['A:C']).toBe(0);
  });

  it('hopCounts track inference depth', () => {
    const result = completeMatrix([
      entry('A', 'B', 2),
      entry('B', 'C', 3),
      entry('C', 'D', 4),
    ]);

    expect(result.hopCounts['A:B']).toBe(0); // direct
    expect(result.hopCounts['B:C']).toBe(0); // direct
    expect(result.hopCounts['C:D']).toBe(0); // direct
    expect(result.hopCounts['A:C']).toBe(1); // via B
    expect(result.hopCounts['B:D']).toBe(1); // via C
    expect(result.hopCounts['A:D']).toBeGreaterThanOrEqual(1); // via B→C or B,C
  });

  it('maxHops limits inference depth', () => {
    const result = completeMatrix(
      [
        entry('A', 'B', 2),
        entry('B', 'C', 3),
        entry('C', 'D', 4),
      ],
      { maxHops: 1 },
    );

    // With maxHops=1: can infer A:C (via B) and B:D (via C)
    // But A:D requires 2 hops (A→B→C→D), so it should be missing
    expect(result.hopCounts['A:C']).toBe(1);
    expect(result.hopCounts['B:D']).toBe(1);
    expect(result.hopCounts['A:D']).toBe(-1); // unreachable
    expect(result.missingPairs).toBe(1);
  });

  it('handles disconnected components', () => {
    // {A, B} and {C, D} are separate components
    const result = completeMatrix([
      entry('A', 'B', 3),
      entry('C', 'D', 5),
    ]);

    expect(result.observedPairs).toBe(2);
    expect(result.inferredPairs).toBe(0);
    // A:C, A:D, B:C, B:D are all missing
    expect(result.missingPairs).toBe(4);
  });

  it('fully observed matrix produces zero inferred pairs', () => {
    const result = completeMatrix([
      entry('A', 'B', 3),
      entry('A', 'C', 5),
      entry('B', 'C', 5 / 3),
    ]);

    expect(result.observedPairs).toBe(3);
    expect(result.inferredPairs).toBe(0);
    expect(result.missingPairs).toBe(0);
  });

  it('handles ratio < 1 correctly (B preferred over A)', () => {
    const result = completeMatrix([
      entry('A', 'B', 0.25), // B is 4x preferred over A
      entry('B', 'C', 2),
    ]);

    // A:C = 0.25 * 2 = 0.5
    const idxA = result.items.indexOf('A');
    const idxC = result.items.indexOf('C');
    expect(result.matrix[idxA]![idxC]).toBeCloseTo(0.5, 4);
    // C:A = 2
    expect(result.matrix[idxC]![idxA]).toBeCloseTo(2, 4);
  });

  // ── Alice scenario ──
  it('Alice scenario: infer Medical:DEA from Medical:Military and Military:DEA', () => {
    // From the paper: Medical vs Military = 85/15 → ratio = 85/15 ≈ 5.667
    // Military vs DEA = 60/40 → ratio = 60/40 = 1.5
    // Transitive: Medical vs DEA ≈ 5.667 * 1.5 = 8.5
    const medMil = 85 / 15;
    const milDea = 60 / 40;

    const result = completeMatrix([
      entry('medical_research', 'military', medMil),
      entry('military', 'drug_enforcement', milDea),
    ]);

    expect(result.inferredPairs).toBe(1);

    const medDea = result.entries.find(
      e =>
        e.itemAId === 'drug_enforcement' && e.itemBId === 'medical_research',
    );
    expect(medDea).toBeDefined();
    expect(medDea!.ratio).toBeCloseTo(1 / (medMil * milDea), 4);

    // Also check the matrix directly
    const idxMed = result.items.indexOf('medical_research');
    const idxDea = result.items.indexOf('drug_enforcement');
    expect(result.matrix[idxMed]![idxDea]).toBeCloseTo(medMil * milDea, 2);
  });
});

// =====================================================================
// inferMissingRatios
// =====================================================================
describe('inferMissingRatios', () => {
  it('accepts key:value format and completes matrix', () => {
    const result = inferMissingRatios({
      'A:B': 3,
      'B:C': 2,
    });

    expect(result.observedPairs).toBe(2);
    expect(result.inferredPairs).toBe(1);

    const ac = result.entries.find(e => e.itemAId === 'A' && e.itemBId === 'C');
    expect(ac).toBeDefined();
    expect(ac!.ratio).toBeCloseTo(6, 4);
  });

  it('respects maxHops option', () => {
    const result = inferMissingRatios(
      { 'A:B': 2, 'B:C': 3, 'C:D': 4 },
      { maxHops: 1 },
    );
    expect(result.missingPairs).toBe(1); // A:D unreachable
  });

  it('ignores malformed keys', () => {
    const result = inferMissingRatios({
      'A:B': 3,
      'invalid': 5,
      'A:B:C': 2,
    });
    expect(result.observedPairs).toBe(1);
  });

  it('handles empty input', () => {
    const result = inferMissingRatios({});
    expect(result.items).toEqual([]);
    expect(result.entries).toEqual([]);
  });

  it('Alice scenario: quick transitivity check', () => {
    const result = inferMissingRatios({
      'medical:military': 85 / 15,
      'military:dea': 60 / 40,
    });

    // medical:dea should be inferred
    expect(result.inferredPairs).toBe(1);
    const md = result.entries.find(
      e => e.itemAId === 'dea' && e.itemBId === 'medical',
    );
    expect(md).toBeDefined();
    // dea:medical ratio = 1/(85/15 * 60/40)
    expect(md!.ratio).toBeCloseTo(1 / ((85 / 15) * (60 / 40)), 3);
  });
});
