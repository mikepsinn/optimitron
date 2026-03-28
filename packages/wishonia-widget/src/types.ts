export type Expression =
  | "neutral"
  | "happy"
  | "excited"
  | "sad"
  | "annoyed"
  | "skeptical"
  | "surprised"
  | "eyeroll"
  | "smirk"
  | "thinking"
  | "sideeye"
  | "lookright"
  | "blink";

export type MouthShape =
  | "smile"
  | "open"
  | "oh"
  | "ee"
  | "closed"
  | "small"
  | "frown";

export type BodyPose =
  | "idle"
  | "listening"
  | "presenting"
  | "thinking"
  | "arms-crossed"
  | "counting"
  | "excited"
  | "fist"
  | "hand-chest"
  | "hands-hips"
  | "open-palms"
  | "palms-down"
  | "point-right"
  | "shrug"
  | "wide-gesture";

/** All available expressions as a runtime array (for building UIs) */
export const EXPRESSIONS: Expression[] = [
  "neutral", "happy", "excited", "sad", "annoyed", "skeptical",
  "surprised", "eyeroll", "smirk", "thinking", "sideeye", "lookright", "blink",
];

/** All available body poses as a runtime array (for building UIs) */
export const BODY_POSES: BodyPose[] = [
  "idle", "listening", "presenting", "thinking", "arms-crossed", "counting",
  "excited", "fist", "hand-chest", "hands-hips", "open-palms", "palms-down",
  "point-right", "shrug", "wide-gesture",
];

export interface AnimatorState {
  headSprite: string;
  bodySprite: string;
  expression: Expression;
  isSpeaking: boolean;
  isBlinking: boolean;
}
