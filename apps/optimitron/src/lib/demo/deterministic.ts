export const DEMO_REFERENCE_YEAR = 2026;

export interface DemoMatrixColumn {
  durationSeconds: number;
  delaySeconds: number;
  glyphs: string[];
  leftPct: number;
}

export interface DemoEmojiPosition {
  delayMs: number;
  xPct: number;
  yPct: number;
}

export function deterministicUnit(seed: number): number {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
}

export function buildTerminalMatrixColumns(
  columnCount: number,
  rowCount: number,
): DemoMatrixColumn[] {
  return Array.from({ length: columnCount }, (_, columnIndex) => ({
    durationSeconds: roundTo(3 + deterministicUnit((columnIndex + 1) * 3) * 4),
    delaySeconds: roundTo(deterministicUnit((columnIndex + 1) * 7) * 2),
    glyphs: Array.from({ length: rowCount }, (_, rowIndex) =>
      String.fromCharCode(
        0x30a0 +
          Math.floor(deterministicUnit((columnIndex + 1) * 97 + rowIndex + 1) * 96),
      ),
    ),
    leftPct: roundTo((columnIndex / columnCount) * 100),
  }));
}

export function buildDrugPolicyEmojiPositions(
  count: number,
): DemoEmojiPosition[] {
  return Array.from({ length: count }, (_, index) => ({
    delayMs: index * 120,
    xPct: roundTo(8 + deterministicUnit((index + 1) * 11) * 84),
    yPct: roundTo(8 + deterministicUnit((index + 1) * 17) * 84),
  }));
}

export function getCollapseYearsLeft(
  collapseYear: number,
  referenceYear: number = DEMO_REFERENCE_YEAR,
): number {
  return collapseYear - referenceYear;
}

function roundTo(value: number): number {
  return Math.round(value * 100) / 100;
}
