import type { Expression, MouthShape } from "../types";

/** Map characters to viseme (mouth shape) for text-driven lip-sync */
export const CHAR_TO_VISEME: Record<string, MouthShape> = {
  a: "open",
  e: "ee",
  i: "ee",
  o: "oh",
  u: "oh",
  b: "closed",
  m: "closed",
  p: "closed",
  f: "closed",
  v: "closed",
  s: "ee",
  z: "ee",
  c: "ee",
  t: "small",
  d: "small",
  n: "small",
  l: "small",
  r: "small",
  g: "small",
  k: "small",
  j: "small",
  w: "oh",
  y: "ee",
  h: "small",
  q: "oh",
  x: "ee",
  " ": "closed",
  ",": "closed",
  ".": "closed",
  "!": "closed",
  "?": "closed",
};

/** Which mouth shapes exist per expression (for fallback) */
export const EXPRESSION_MOUTHS: Record<Expression, MouthShape[]> = {
  neutral: ["smile", "open", "oh", "ee", "closed", "small", "frown"],
  happy: ["smile", "open", "oh", "ee", "closed", "small"],
  excited: ["open", "ee", "oh", "closed"],
  sad: ["closed", "frown", "oh", "small"],
  annoyed: ["closed", "frown", "small"],
  skeptical: ["smile", "closed"],
  surprised: ["open", "oh", "ee"],
  eyeroll: ["closed", "frown", "smile"],
  smirk: ["smile", "ee", "closed"],
  thinking: ["oh", "closed", "small"],
  sideeye: ["closed"],
  lookright: ["smile", "closed", "open", "oh"],
  blink: ["smile"],
};

/** Get the sprite name for a given expression + viseme, with fallback */
export function getHeadName(expression: Expression, viseme: MouthShape): string {
  const available = EXPRESSION_MOUTHS[expression] ?? EXPRESSION_MOUTHS.neutral;
  let mouth: MouthShape = available.includes(viseme) ? viseme : "closed";
  if (!available.includes(mouth)) mouth = available[0] ?? "closed";
  return `${expression}-${mouth}`;
}

/** Get the idle (resting) sprite name for a given expression */
export function getIdleHead(expression: Expression): string {
  const available = EXPRESSION_MOUTHS[expression] ?? ["smile"];
  if (available.includes("smile")) return `${expression}-smile`;
  if (available.includes("closed")) return `${expression}-closed`;
  return `${expression}-${available[0]}`;
}

/** Convert audio amplitude (0-1) to a viseme */
export function amplitudeToViseme(amplitude: number): MouthShape {
  if (amplitude < 0.02) return "closed";
  if (amplitude < 0.08) return "small";
  if (amplitude < 0.15) return "oh";
  if (amplitude < 0.25) return "open";
  return "ee";
}
