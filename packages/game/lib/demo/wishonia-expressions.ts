/**
 * Maps game slide config → Wishonia mood preset.
 * Uses keyword matching on narration text to pick the right mood,
 * then delegates to the widget's mood presets for expression/pose.
 */

import type { SlideConfig } from "./demo-config";
import { getMoodPreset, type MoodPreset } from "@optimitron/wishonia-widget";

// Keywords in narration/id that shift mood within an act
const DEATH_KEYWORDS = ["death", "kill", "die", "dead", "murder", "terminat", "holocaust", "9/11"];
const DYSFUNCTION_KEYWORDS = ["fda", "congress", "bureaucra", "wait", "lobby", "regulator"];
const IRONY_KEYWORDS = ["sandwich", "fire department", "mechanic", "ordering the food poisoning"];
const DATA_KEYWORDS = ["percent", "billion", "trillion", "million", "roi", "return", "savings"];
const EXPLAIN_KEYWORDS = ["how", "mechanism", "works", "system", "process", "algorithm"];

function textContains(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

export function getExpressionForSlide(slide: SlideConfig): MoodPreset {
  const searchText = `${slide.id} ${slide.narration} ${slide.stageDirection ?? ""}`;

  if (slide.stageDirection?.includes("black screen")) {
    return getMoodPreset("neutral");
  }

  switch (slide.act) {
    case "act1": {
      if (textContains(searchText, DEATH_KEYWORDS)) return getMoodPreset("grief");
      if (textContains(searchText, DYSFUNCTION_KEYWORDS)) return getMoodPreset("frustration");
      if (textContains(searchText, IRONY_KEYWORDS)) return getMoodPreset("irony");
      return getMoodPreset("horror");
    }
    case "turn":
      return getMoodPreset("reveal");
    case "act2": {
      if (textContains(searchText, DATA_KEYWORDS)) return getMoodPreset("data");
      if (textContains(searchText, EXPLAIN_KEYWORDS)) return getMoodPreset("explaining");
      return getMoodPreset("hopeful");
    }
    case "act3": {
      if (slide.ctaUrl) return getMoodPreset("callToAction");
      return getMoodPreset("victory");
    }
    default:
      return getMoodPreset("neutral");
  }
}
