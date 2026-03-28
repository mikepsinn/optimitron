/**
 * Mood presets — maps common narrative moods to Wishonia expressions and body poses.
 * Consumers can use these directly or build custom mappings on top.
 */

import type { Expression, BodyPose } from "../types";

export interface MoodPreset {
  expression: Expression;
  bodyPose: BodyPose;
}

/**
 * Built-in mood presets for common narrative contexts.
 * Use `getMoodPreset(mood)` or access `MOOD_PRESETS` directly.
 */
export const MOOD_PRESETS: Record<string, MoodPreset> = {
  // Negative / critical
  horror:       { expression: "annoyed",   bodyPose: "arms-crossed" },
  grief:        { expression: "sad",       bodyPose: "hand-chest" },
  frustration:  { expression: "eyeroll",   bodyPose: "shrug" },
  irony:        { expression: "smirk",     bodyPose: "presenting" },
  skepticism:   { expression: "skeptical", bodyPose: "arms-crossed" },
  disappointment: { expression: "sideeye", bodyPose: "hands-hips" },

  // Transition / surprise
  reveal:       { expression: "surprised", bodyPose: "wide-gesture" },
  realization:  { expression: "surprised", bodyPose: "open-palms" },

  // Positive / hopeful
  hopeful:      { expression: "happy",     bodyPose: "presenting" },
  explaining:   { expression: "thinking",  bodyPose: "point-right" },
  data:         { expression: "excited",   bodyPose: "counting" },
  victory:      { expression: "excited",   bodyPose: "wide-gesture" },
  callToAction: { expression: "happy",     bodyPose: "open-palms" },

  // Neutral
  neutral:      { expression: "neutral",   bodyPose: "idle" },
  listening:    { expression: "neutral",   bodyPose: "listening" },
  thinking:     { expression: "thinking",  bodyPose: "thinking" },
};

const NEUTRAL_FALLBACK: MoodPreset = { expression: "neutral", bodyPose: "idle" };

/** Get a mood preset by name. Falls back to "neutral" if not found. */
export function getMoodPreset(mood: string): MoodPreset {
  return MOOD_PRESETS[mood] ?? NEUTRAL_FALLBACK;
}
